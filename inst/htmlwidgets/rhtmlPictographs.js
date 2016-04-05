'use strict';
HTMLWidgets.widget({
  name: 'rhtmlPictographs',
  type: 'output',
  resize: function(el, width, height, instance) {
    console.log('resizing rhtmlPictograph');
    console.log(instance.svg);
    instance.width = width;
    instance.height = height;
    $('.rhtml-pictograph-outer-svg').remove();
    return this._draw(el, instance);
  },
  initialize: function(el, width, height) {
    return {
      width: width,
      height: height
    };
  },
  _normalizeInput: function(params) {
    var err, input, msg;
    input = null;
    try {
      if (_.isString(params.settingsJsonString)) {
        input = JSON.parse(params.settingsJsonString);
      } else {
        input = params.settingsJsonString;
      }
      input.percentage = params.percentage;
    } catch (_error) {
      err = _error;
      msg = "rhtmlPictographs error : Cannot parse 'settingsJsonString'";
      console.error(msg);
      throw new Error(err);
    }
    if (input.variableImageUrl == null) {
      throw new Error("Must specify 'variableImageUrl'");
    }
    if (input.percentage == null) {
      throw new Error("Must specify 'percent'");
    }
    input.percentage = parseFloat(input.percentage);
    if (_.isNaN(input.percentage)) {
      throw new Error("percentage must be a number");
    }
    if (!(input.percentage >= 0)) {
      throw new Error("percentage must be >= 0");
    }
    if (!(input.percentage <= 1)) {
      throw new Error("percentage must be <= 1");
    }
    if (input['numImages'] == null) {
      input['numImages'] = 1;
    }
    if (input['direction'] == null) {
      input['direction'] = 'horizontal';
    }
    if (input['font-family'] == null) {
      input['font-family'] = 'Verdana,sans-serif';
    }
    if (input['font-weight'] == null) {
      input['font-weight'] = '900';
    }
    if (input['font-size'] == null) {
      input['font-size'] = '20px';
    }
    if (input['font-color'] == null) {
      input['font-color'] = 'white';
    }
    return input;
  },
  renderValue: function(el, params, instance) {
    instance.input = this._normalizeInput(params);
    return this._draw(el, instance);
  },
  _makeTextBanner: function(className, text, args) {
    var bannerContainer, cssAttribute, _i, _len, _ref;
    bannerContainer = $("<text class=\"" + className + "\">").css('text-align', 'center').attr('width', '100').attr('height', '100').text(text);
    if (_.has(args, 'font-color')) {
      bannerContainer.css('color', args['font-color']);
    }
    _ref = ['font-family', 'font-size', 'font-weight'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      cssAttribute = _ref[_i];
      if (_.has(args, cssAttribute)) {
        bannerContainer.css(cssAttribute, args[cssAttribute]);
      }
    }
    return bannerContainer;
  },
  _draw: function(el, instance) {
    var cssAttribute, d3Data, displayText, enteringLeafNodes, generateClip, generateDataArray, gridLayout, input, textOverlay, _i, _len, _ref, _results;
    generateClip = function(input) {
      var x;
      if (input.direction === 'horizontal') {
        x = input.percentage * instance.width;
        return "rect(auto, " + x + "px, auto, auto)";
      } else if (input.direction === 'vertical') {
        x = instance.height - input.percentage * instance.height;
        return "rect(" + x + "px, auto, auto, auto)";
      } else {
        throw new Error("Invalid direction: '" + input.direction + "'");
      }
    };
    generateDataArray = function(percentage, numImages) {
      var d3Data, num, totalArea, _i;
      d3Data = [];
      totalArea = percentage * numImages;
      for (num = _i = 1; 1 <= numImages ? _i <= numImages : _i >= numImages; num = 1 <= numImages ? ++_i : --_i) {
        percentage = Math.min(1, Math.max(0, 1 + totalArea - num));
        d3Data.push({
          percentage: percentage
        });
      }
      return d3Data;
    };
    input = instance.input;
    d3Data = generateDataArray(input.percentage, input.numImages);
    gridLayout = d3.layout.grid().bands().size([instance.width, instance.height]).padding([0.1, 0.1]);
    if (input['numRows'] != null) {
      gridLayout.rows(input['numRows']);
    }
    if (input['numCols'] != null) {
      gridLayout.cols(input['numCols']);
    }
    instance.rootElement = _.has(el, 'length') ? el[0] : el;
    instance.outerSvg = $("<svg class=\"rhtml-pictograph-outer-svg\">").attr({
      'width': instance.width
    }).attr({
      'height': instance.height
    });
    $(instance.rootElement).append(instance.outerSvg);
    $(instance.outerSvg).append(this._makeTextBanner('header-container', input['text-header'], input));
    enteringLeafNodes = d3.select('.rhtml-pictograph-outer-svg').selectAll(".node").data(gridLayout(d3Data)).enter().append("g").attr("class", "node").attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });
    enteringLeafNodes.append("svg:rect").attr('width', gridLayout.nodeSize()[0]).attr('height', gridLayout.nodeSize()[1]).attr('class', 'background-rect').attr('fill', input['background-color'] || 'none');
    if (input.baseImageUrl != null) {
      enteringLeafNodes.append("svg:image").attr('width', gridLayout.nodeSize()[0]).attr('height', gridLayout.nodeSize()[1]).attr('xlink:href', input.baseImageUrl).attr('class', 'base-image');
    }
    enteringLeafNodes.append("clipPath").attr("id", "my-clip").append("rect").attr("x", 0).attr("y", function(d) {
      if (input.direction === 'horizontal') {
        return 0;
      }
      return gridLayout.nodeSize()[1] * (1 - d.percentage);
    }).attr("width", function(d) {
      if (input.direction === 'horizontal') {
        return gridLayout.nodeSize()[0] * d.percentage;
      }
      return gridLayout.nodeSize()[0];
    }).attr("height", function(d) {
      if (input.direction === 'vertical') {
        return gridLayout.nodeSize()[1] * d.percentage;
      }
      return gridLayout.nodeSize()[1];
    });
    enteringLeafNodes.append("svg:image").attr('width', gridLayout.nodeSize()[0]).attr('height', gridLayout.nodeSize()[1]).attr('clip-path', 'url(#my-clip)').attr('xlink:href', input.variableImageUrl).attr('class', 'variable-image');
    if (input['tooltip']) {
      enteringLeafNodes.append("svg:title").text(input['tooltip']);
    }
    if (input['text-overlay']) {
      displayText = input['text-overlay'].match(/^percentage$/) ? "" + ((100 * input.percentage).toFixed(0)) + "%" : input['text-overlay'];
      textOverlay = enteringLeafNodes.append("svg:text").attr('x', function(d) {
        return gridLayout.nodeSize()[0] / 2;
      }).attr('y', function(d) {
        return gridLayout.nodeSize()[1] / 2;
      }).style('text-anchor', 'middle').style('alignment-baseline', 'central').style('dominant-baseline', 'central').attr('class', 'text-overlay').text(displayText);
      if (_.has(input, 'font-color')) {
        textOverlay.attr('fill', input['font-color']);
      }
      _ref = ['font-family', 'font-size', 'font-weight'];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cssAttribute = _ref[_i];
        if (_.has(input, cssAttribute)) {
          _results.push(textOverlay.attr(cssAttribute, input[cssAttribute]));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    }
  }
});
