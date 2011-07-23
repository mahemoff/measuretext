/*
measuretext.js - any queries you'll find my details at
http://contact.mahemoff.com.

::::: IMPLEMENTATION :::::

It would be instructive to peruse http://b.wearehugh.com/dih5/baselines.png
from the canvas chapter of Mark Pilgrim's Dive Into HTML5:
http://diveintohtml5.org/canvas.html

The library relies on canvas.measureText to accurately determine width. For
height, it takes a stab at em box height by inspecting the current font,
then adds some margin for error to form an "upper bound" box. To reduce
this large "upper bound" box to an actual bounding box, every pixel in it
is scanned to determine the actual bounding dimensions.

::::: LICENSE :::::

Copyright (C) 2011 by Michael Mahemoff

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

(function() {

  var canvas;

  window.measureText = function(text, font, options) {

    var DEBUG = (options && options.debug) ?
      function(lifesaver) { lifesaver(); } : function() {};
    var boundingBoxRatio = options && options.boundingBoxRatio || 2;

    canvas = canvas || document.createElement("canvas"),
        context = canvas.getContext("2d");
    DEBUG(function() {
      canvas.className = "measureTextSpecimen";
      document.body.appendChild(canvas);
    });

    context.font = font;
    var estimatedWidth = originalMeasureText ?
          originalMeasureText.call(context,text).width :
          estimateFontPixels(font)*text.length,
        estimatedEmHeight = estimateFontPixels(font);

    var canvasWidth = boundingBoxRatio * estimatedWidth,
        canvasHeight = boundingBoxRatio * estimatedEmHeight,
        emSquareOffsetRatio = ((boundingBoxRatio-1)/2)/boundingBoxRatio,
        emSquareLeft = emSquareOffsetRatio * canvasWidth,
        emSquareTop = emSquareOffsetRatio * canvasHeight;

    canvas.width = canvasWidth,
    canvas.height = canvasHeight,
    DEBUG(function() {
      console.log("setting", canvasWidth, canvasHeight);
      canvas.style.width = canvasWidth;
      canvas.style.height = canvasHeight;
    });

    context.font = font,
    context.textBaseline = "top"
    context.fillStyle = "#666";
    context.fillText(text, emSquareLeft, emSquareTop);

    if (!text.length) return {
      width: estimatedWidth,
      height: estimatedEmHeight,
      topGap: estimatedEmHeight/2
    };

    var imageData = 
      context.getImageData(0,0,canvas.width,canvas.height).data;
    var actualTop, actualBottom;

    for (var y=0; y<canvasHeight; y++) {
      for (var x=0; x<canvasWidth; x++) {
        for (var component=0; component<3; component++) {
          if (imageData[4*y*canvas.width + 4*x + component] > 0) {
            if (!actualTop) actualTop = y;
            actualBottom = y
          }
        }
      }
    }

    // Now that we've scanned it, draw a 1em bounding rectangle for debug
    DEBUG(function() {
      context.fillStyle = options.emboxStyle || "rgba(80%,80%,100%,0.1)";
      context.fillRect(emSquareLeft, emSquareTop, estimatedWidth, estimatedEmHeight);
      console.log(font, estimateFontPixels(font),
        "est-wid", estimatedWidth, "est-height", estimatedEmHeight,
        "em-ratio", emSquareOffsetRatio,
        "can-wid", canvasWidth, "can-height", canvasHeight,
        "em-top", emSquareTop, "em-left", emSquareLeft,
        "bottom", actualBottom, "top", actualTop);
    });

    return {
      width: estimatedWidth,
      height: actualBottom - actualTop,
      topOffset: actualTop - emSquareTop
    };

  }

  function estimateFontPixels(font) {
    var matches;
    if (matches = font.match(/([0-9]+)px/)) return parseInt(matches[1]);
    if (matches = font.match(/ ([0-9]+) /)) return parseInt(matches[1]);
    if (matches = font.match(/([0-9]+)pt/)) return 1.25*matches[1];
    return 12; /* i give up */
  }

  var originalMeasureText = CanvasRenderingContext2D.prototype.measureText;
  CanvasRenderingContext2D.prototype.measureText=function(text) {
    var metrics = originalMeasureText.call(this,text);
    var extraMetrics = window.measureText(text, this.font);
    console.log("extraMetrics", extraMetrics);
    for (key in extraMetrics) {
      metrics[key] = extraMetrics[key];
    }
    return metrics;
  };

})();
