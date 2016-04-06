'use strict';
HTMLWidgets.widget({
  name: 'rhtmlPictographs',
  type: 'output',
  resize: function(el, width, height, instance) {
    return console.log('resize not implemented');
  },
  initialize: function(el, width, height) {
    return {
      initialWidth: width,
      initialHeight: height,
      width: width,
      height: height
    };
  },
  renderValue: function(el, params, instance) {
    var anonSvg, cssAttribute, d3Data, displayText, enteringLeafNodes, graphicContainerVerticalOffset, graphicRatio, gridHeight, gridLayout, input, textOverlay, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _results;
    input = this._normalizeInput(params);
    input.bannerRatio = 0.1;
    instance.rootElement = _.has(el, 'length') ? el[0] : el;
    anonSvg = $("<svg class=\"rhtml-pictograph-outer-svg\">").attr('width', '100%').attr('height', '100%');
    $(instance.rootElement).append(anonSvg);
    instance.outerSvg = d3.select('.rhtml-pictograph-outer-svg');
    document.getElementsByClassName("rhtml-pictograph-outer-svg")[0].setAttribute('viewBox', "0 0 " + instance.initialWidth + " " + instance.initialHeight);
    graphicRatio = 1;
    if (input['text-header'] != null) {
      graphicRatio -= input.bannerRatio;
    }
    if (input['text-footer'] != null) {
      graphicRatio -= input.bannerRatio;
    }
    if (input['text-header'] != null) {
      instance.textHeader = instance.outerSvg.append('svg:text').attr('x', instance.initialWidth / 2).attr('y', function(d) {
        var alreadyDrawn;
        alreadyDrawn = 0;
        return alreadyDrawn + instance.initialHeight * input.bannerRatio / 2;
      }).style('text-anchor', 'middle').style('alignment-baseline', 'central').style('dominant-baseline', 'central').attr('class', 'text-header').text(function(d) {
        return input['text-header'];
      });
      if (_.has(input, 'font-color')) {
        instance.textHeader.attr('fill', input['font-color']);
      }
      _ref = ['font-family', 'font-size', 'font-weight'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cssAttribute = _ref[_i];
        if (_.has(input, cssAttribute)) {
          instance.textHeader.attr(cssAttribute, input[cssAttribute]);
        }
      }
    }
    graphicContainerVerticalOffset = 0;
    if (input['text-header'] != null) {
      graphicContainerVerticalOffset += input.bannerRatio * instance.initialHeight;
    }
    console.log("graphicContainerVerticalOffset");
    console.log(graphicContainerVerticalOffset);
    instance.graphicContainer = instance.outerSvg.append('g').attr('class', 'graphic-container').attr('transform', "translate(0," + graphicContainerVerticalOffset + ")");
    if (input['text-footer'] != null) {
      instance.textFooter = instance.outerSvg.append('svg:text').attr('x', instance.initialWidth / 2).attr('y', function(d) {
        var alreadyDrawn;
        alreadyDrawn = 0;
        if (input['text-header'] != null) {
          alreadyDrawn += input.bannerRatio * instance.initialHeight;
        }
        alreadyDrawn += graphicRatio * instance.initialHeight;
        return alreadyDrawn + instance.initialHeight * input.bannerRatio / 2;
      }).style('text-anchor', 'middle').style('alignment-baseline', 'central').style('dominant-baseline', 'central').attr('class', 'text-footer').text(function(d) {
        return input['text-footer'];
      });
      if (_.has(input, 'font-color')) {
        instance.textFooter.attr('fill', input['font-color']);
      }
      _ref1 = ['font-family', 'font-size', 'font-weight'];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        cssAttribute = _ref1[_j];
        if (_.has(input, cssAttribute)) {
          instance.textFooter.attr(cssAttribute, input[cssAttribute]);
        }
      }
    }
    d3Data = this._generateDataArray(input.percentage, input.numImages);
    gridHeight = instance.initialHeight;
    if (input['text-header'] != null) {
      gridHeight -= input.bannerRatio * instance.initialHeight;
    }
    if (input['text-footer'] != null) {
      gridHeight -= input.bannerRatio * instance.initialHeight;
    }
    console.log("initialHeight");
    console.log(instance.initialHeight);
    console.log("gridHeight");
    console.log(gridHeight);
    gridLayout = d3.layout.grid().bands().size([instance.initialWidth, gridHeight]).padding([0.1, 0.1]);
    if (input['numRows'] != null) {
      gridLayout.rows(input['numRows']);
    }
    if (input['numCols'] != null) {
      gridLayout.cols(input['numCols']);
    }
    enteringLeafNodes = instance.graphicContainer.selectAll(".node").data(gridLayout(d3Data)).enter().append("g").attr("class", "node").attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });
    enteringLeafNodes.append("svg:rect").attr('width', gridLayout.nodeSize()[0]).attr('height', gridLayout.nodeSize()[1]).attr('class', 'background-rect').attr('fill', input['background-color'] || 'none');
    if (input.baseImageUrl != null) {
      enteringLeafNodes.append("svg:image").attr('width', gridLayout.nodeSize()[0]).attr('height', gridLayout.nodeSize()[1]).attr('xlink:href', input.baseImageUrl).attr('class', 'base-image');
    }
    enteringLeafNodes.append('clipPath').attr('id', 'my-clip').append('rect').attr('x', 0).attr('y', function(d) {
      if (input.direction === 'horizontal') {
        return 0;
      }
      return gridLayout.nodeSize()[1] * (1 - d.percentage);
    }).attr('width', function(d) {
      if (input.direction === 'horizontal') {
        return gridLayout.nodeSize()[0] * d.percentage;
      }
      return gridLayout.nodeSize()[0];
    }).attr('height', function(d) {
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
      _ref2 = ['font-family', 'font-size', 'font-weight'];
      _results = [];
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        cssAttribute = _ref2[_k];
        if (_.has(input, cssAttribute)) {
          _results.push(textOverlay.attr(cssAttribute, input[cssAttribute]));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    }
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
  _generateDataArray: function(percentage, numImages) {
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
  }
});
