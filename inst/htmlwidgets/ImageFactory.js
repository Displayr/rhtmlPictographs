// Generated by CoffeeScript 1.8.0
var ImageFactory;

ImageFactory = (function() {
  ImageFactory.addImageTo = function(config, width, height) {
    var d3Node, newImage, uniqueClipId;
    d3Node = d3.select(this);
    if (_.isString(config)) {
      config = ImageFactory.parseConfigString(config);
    } else {
      if (!(config.type in ImageFactory.types)) {
        throw new Error("Invalid image creation config : unknown image type " + config.type);
      }
    }
    newImage = ImageFactory.types[config.type](d3Node, config, width, height);
    uniqueClipId = null;
    if (config.verticalclip) {
      config.verticalclip = ImageFactory.addVerticalClip(d3Node, config, width, height);
      newImage.attr('clip-path', "url(#" + config.verticalclip + ")");
    }
    if (config.horizontalclip) {
      config.horizontalclip = ImageFactory.addHorizontalClip(d3Node, config, width, height);
      newImage.attr('clip-path', "url(#" + config.horizontalclip + ")");
    }
    if (config.radialclip) {
      config.radialclip = ImageFactory.addRadialClip(d3Node, config, width, height);
      newImage.attr('clip-path', "url(#" + config.radialclip + ")");
    }
    return null;
  };

  ImageFactory.parseConfigString = function(configString) {
    var config, configParts, handler, hasDot, matches, part, type, unknownParts;
    if (!(configString.length > 0)) {
      throw new Error("Invalid image creation configString '' : empty string");
    }
    config = {};
    configParts = [];
    if (matches = configString.match(ImageFactory.regexes.http)) {
      configParts = _.without(matches[1].split(':'), 'url');
      config.type = 'url';
      config.url = matches[2];
    } else {
      configParts = configString.split(':');
      type = configParts.shift();
      if (!(type in ImageFactory.types)) {
        throw new Error("Invalid image creation configString '" + configString + "' : unknown image type " + type);
      }
      config['type'] = type;
    }
    if (type === 'url' && (config.url == null)) {
      config.url = configParts.pop();
      hasDot = new RegExp(/\./);
      if (!(config.url && config.url.match(hasDot))) {
        throw new Error("Invalid image creation configString '" + configString + "' : url string must end with a url");
      }
    }
    unknownParts = [];
    while (part = configParts.shift()) {
      if (part in ImageFactory.keywordHandlers) {
        handler = ImageFactory.keywordHandlers[part];
        if (_.isString(handler)) {
          config[handler] = true;
        }
      } else {
        unknownParts.push(part);
      }
    }
    if (unknownParts.length > 1) {
      throw new Error("Invalid image creation configString '" + configString + "' : too many unknown parts: [" + (unknownParts.join(',')) + "]");
    }
    if (unknownParts.length === 1) {
      config['color'] = unknownParts[0];
    }
    return config;
  };

  ImageFactory.addCircleTo = function(d3Node, config, width, height) {
    var color, ratio;
    ratio = function(p) {
      if (config.scale) {
        return p;
      } else {
        return 1;
      }
    };
    color = ColorFactory.getColor(config.color);
    return d3Node.append("svg:circle").classed('circle', true).attr('cx', width / 2).attr('cy', height / 2).attr('r', function(d) {
      return ratio(d.percentage) * Math.min(width, height) / 2;
    }).style('fill', color);
  };

  ImageFactory.addEllipseTo = function(d3Node, config, width, height) {
    var color, ratio;
    ratio = function(p) {
      if (config.scale) {
        return p;
      } else {
        return 1;
      }
    };
    color = ColorFactory.getColor(config.color);
    return d3Node.append("svg:ellipse").classed('ellipse', true).attr('cx', width / 2).attr('cy', height / 2).attr('rx', function(d) {
      return width * ratio(d.percentage) / 2;
    }).attr('ry', function(d) {
      return height * ratio(d.percentage) / 2;
    }).style('fill', color);
  };

  ImageFactory.addRectTo = function(d3Node, config, width, height) {
    var color, ratio;
    ratio = function(p) {
      if (config.scale) {
        return p;
      } else {
        return 1;
      }
    };
    color = ColorFactory.getColor(config.color);
    return d3Node.append("svg:rect").classed('rect', true).attr('x', function(d) {
      return width * (1 - ratio(d.percentage)) / 2;
    }).attr('y', function(d) {
      return height * (1 - ratio(d.percentage)) / 2;
    }).attr('width', function(d) {
      return width * ratio(d.percentage);
    }).attr('height', function(d) {
      return height * ratio(d.percentage);
    }).style('fill', color);
  };

  ImageFactory._addImageTo = function(d3Node, config, width, height) {
    var ratio;
    ratio = function(p) {
      if (config.scale) {
        return p;
      } else {
        return 1;
      }
    };
    return d3Node.append("svg:image").attr('x', function(d) {
      return width * (1 - ratio(d.percentage)) / 2;
    }).attr('y', function(d) {
      return height * (1 - ratio(d.percentage)) / 2;
    }).attr('width', function(d) {
      return width * ratio(d.percentage);
    }).attr('height', function(d) {
      return height * ratio(d.percentage);
    }).attr('xlink:href', config.url).attr('class', 'variable-image');
  };

  ImageFactory.addVerticalClip = function(d3Node, config, width, height) {
    var uniqueId;
    uniqueId = ("clip-id-" + (Math.random())).replace(/\./g, '');
    d3Node.append('clipPath').attr('id', uniqueId).append('rect').attr('x', 0).attr('y', function(d) {
      return height * (1 - d.percentage);
    }).attr('width', width).attr('height', function(d) {
      return height * d.percentage;
    });
    return uniqueId;
  };

  ImageFactory.addRadialClip = function(d3Node, config, w, h) {
    var uniqueId;
    uniqueId = ("clip-id-" + (Math.random())).replace(/\./g, '');
    d3Node.append('clipPath').attr('id', uniqueId).style('stroke', 'red').style('stroke-width', '3').append('path').attr('d', function(d) {
      var degrees, h2, p, pathParts, w2;
      p = d.percentage;
      degrees = p * 360;
      w2 = w / 2;
      h2 = h / 2;
      pathParts = ["M" + w2 + "," + h2 + " l0,-" + h2];
      if (p > 1 / 8) {
        pathParts.push("l" + w2 + ",0");
      } else {
        pathParts.push("l" + (h2 * Math.tan(degrees * Math.PI / 180)) + ",0");
      }
      if (p > 2 / 8) {
        pathParts.push("l0," + h2);
      } else if (p > 1 / 8) {
        pathParts.push("l0," + (h2 - w2 * Math.tan((90 - degrees) * Math.PI / 180)));
      }
      if (p > 3 / 8) {
        pathParts.push("l0," + h2);
      } else if (p > 2 / 8) {
        pathParts.push("l0," + (w2 * Math.tan((degrees - 90) * Math.PI / 180)));
      }
      if (p > 4 / 8) {
        pathParts.push("l-" + w2 + ",0");
      } else if (p > 3 / 8) {
        pathParts.push("l-" + (w2 - h2 * Math.tan((180 - degrees) * Math.PI / 180)) + ",0");
      }
      if (p > 5 / 8) {
        pathParts.push("l-" + w2 + ",0");
      } else if (p > 4 / 8) {
        pathParts.push("l-" + (h2 * Math.tan((degrees - 180) * Math.PI / 180)) + ",0");
      }
      if (p > 6 / 8) {
        pathParts.push("l0,-" + h2);
      } else if (p > 5 / 8) {
        pathParts.push("l0,-" + (h2 - w2 * Math.tan((270 - degrees) * Math.PI / 180)));
      }
      if (p > 7 / 8) {
        pathParts.push("l0,-" + h2);
      } else if (p > 6 / 8) {
        pathParts.push("l0,-" + (w2 * Math.tan((degrees - 270) * Math.PI / 180)));
      }
      if (p >= 8 / 8) {
        pathParts.push("l" + w2 + ",0");
      } else if (p > 7 / 8) {
        pathParts.push("l" + (w2 - h2 * Math.tan((360 - degrees) * Math.PI / 180)) + ",0");
      }
      pathParts.push('z');
      return pathParts.join(' ');
    });
    return uniqueId;
  };

  ImageFactory.addHorizontalClip = function(d3Node, config, width, height) {
    var uniqueId;
    uniqueId = ("clip-id-" + (Math.random())).replace(/\./g, '');
    d3Node.append('clipPath').attr('id', uniqueId).append('rect').attr('x', 0).attr('y', 0).attr('width', function(d) {
      return width * d.percentage;
    }).attr('height', height);
    return uniqueId;
  };

  ImageFactory.types = {
    circle: ImageFactory.addCircleTo,
    ellipse: ImageFactory.addEllipseTo,
    square: ImageFactory.addRectTo,
    rect: ImageFactory.addRectTo,
    url: ImageFactory._addImageTo
  };

  ImageFactory.keywordHandlers = {
    scale: 'scale',
    verticalclip: 'verticalclip',
    vertical: 'verticalclip',
    radialclip: 'radialclip',
    radial: 'radialclip',
    pie: 'radialclip',
    horizontalclip: 'horizontalclip',
    horizontal: 'horizontalclip'
  };

  ImageFactory.regexes = {
    http: new RegExp('^(.*?):?(https?://.*)$')
  };

  function ImageFactory() {}

  return ImageFactory;

})();
