// Generated by CoffeeScript 1.8.0
var ImageFactory;

ImageFactory = (function() {
  ImageFactory.imageDownloadPromises = {};

  ImageFactory.getOrDownload = function(url) {
    if (!(url in ImageFactory.imageDownloadPromises)) {
      ImageFactory.imageDownloadPromises[url] = jQuery.ajax({
        url: url,
        dataType: 'text'
      });
      setTimeout(function() {
        return delete ImageFactory.imageDownloadPromises[url];
      }, 10000);
    }
    return ImageFactory.imageDownloadPromises[url];
  };

  ImageFactory.addImageTo = function(d3Node, config, width, height, dataAttributes) {
    var newImagePromise, tmpImg;
    if (_.isString(config)) {
      config = ImageFactory.parseConfigString(config);
    } else {
      if (!(config.type in ImageFactory.types)) {
        throw new Error("Invalid image creation config : unknown image type " + config.type);
      }
    }
    config.imageBoxHeight = height;
    config.imageBoxWidth = width;
    config.imageBoxX = 0;
    config.imageBoxY = 0;
    if (config.type === 'url') {
      tmpImg = document.createElement('img');
      tmpImg.setAttribute('src', config.url);
      document.body.appendChild(tmpImg);
      tmpImg.onload = function() {
        var aspectRatio;
        aspectRatio = tmpImg.height / tmpImg.width;
        if (aspectRatio > 1) {
          config.imageBoxWidth = height / aspectRatio;
          config.imageBoxHeight = height;
          config.imageBoxX = (width - config.imageBoxWidth) / 2;
          config.imageBoxY = 0;
        } else {
          config.imageBoxWidth = width;
          config.imageBoxHeight = width * aspectRatio;
          config.imageBoxY = (height - config.imageBoxHeight) / 2;
          config.imageBoxX = 0;
        }
        return tmpImg.remove();
      };
    }
    newImagePromise = ImageFactory.types[config.type](d3Node, config, width, height, dataAttributes);
    return newImagePromise.then(function(newImageData) {
      var clipId, clipMaker, imageBox, newImage;
      imageBox = newImageData.unscaledBox || {
        x: config.imageBoxX,
        y: config.imageBoxY,
        width: config.imageBoxWidth,
        height: config.imageBoxHeight
      };
      newImage = newImageData.newImage;
      if (config.clip) {
        clipMaker = (function() {
          switch (false) {
            case config.clip !== 'fromLeft':
              return ImageFactory.addClipFromLeft;
            case config.clip !== 'fromRight':
              return ImageFactory.addClipFromRight;
            case config.clip !== 'fromTop':
              return ImageFactory.addClipFromTop;
            case config.clip !== 'fromTop':
              return ImageFactory.addClipFromTop;
            case config.clip !== 'fromBottom':
              return ImageFactory.addClipFromBottom;
          }
        })();
        clipId = clipMaker(d3Node, imageBox);
        newImage.attr('clip-path', "url(#" + clipId + ")");
      }
      if (config.radialclip) {
        config.radialclip = ImageFactory.addRadialClip(d3Node, imageBox);
        newImage.attr('clip-path', "url(#" + config.radialclip + ")");
      }
      return newImage;
    })["catch"](function(error) {
      return console.log("newImage fail : " + error);
    });
  };

  ImageFactory.parseConfigString = function(configString) {
    var config, configParts, handler, hasDot, httpRegex, matchesHttp, part, type, unknownParts;
    if (!(configString.length > 0)) {
      throw new Error("Invalid image creation configString '' : empty string");
    }
    config = {};
    configParts = [];
    httpRegex = new RegExp('^(.*?):?(https?://.*)$');
    if (matchesHttp = configString.match(httpRegex)) {
      configParts = _.without(matchesHttp[1].split(':'), 'url');
      config.type = 'url';
      config.url = matchesHttp[2];
    } else {
      configParts = configString.split(':');
      type = configParts.shift();
      if (!(type in ImageFactory.types)) {
        throw new Error("Invalid image creation configString '" + configString + "' : unknown image type " + type);
      }
      config['type'] = type;
    }
    if ((type === 'url') && (config.url == null)) {
      config.url = configParts.pop();
      hasDot = new RegExp(/\./);
      if (!(config.url && config.url.match(hasDot))) {
        throw new Error("Invalid image creation configString '" + configString + "' : url string must end with a url");
      }
    }
    if (type === 'data') {
      config.url = 'data:' + configParts.pop();
      if (!config.url) {
        throw new Error("Invalid image creation configString '" + configString + "' : data string must have a data url as last string part");
      }
    }
    unknownParts = [];
    while (part = configParts.shift()) {
      if (part in ImageFactory.keywordHandlers) {
        handler = ImageFactory.keywordHandlers[part];
        if (_.isString(handler)) {
          config[handler] = true;
        } else {
          _.extend(config, handler);
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
    var color, diameter, newImage, ratio;
    ratio = function(p) {
      if (config.scale) {
        return p;
      } else {
        return 1;
      }
    };
    diameter = Math.min(width, height);
    color = ColorFactory.getColor(config.color);
    newImage = d3Node.append("svg:circle").classed('circle', true).attr('cx', width / 2).attr('cy', height / 2).attr('r', function(d) {
      return ratio(d.proportion) * diameter / 2;
    }).style('fill', color);
    return Promise.resolve({
      newImage: newImage,
      unscaledBox: {
        x: (width - diameter) / 2,
        y: (height - diameter) / 2,
        width: diameter,
        height: diameter
      }
    });
  };

  ImageFactory.addEllipseTo = function(d3Node, config, width, height) {
    var color, newImage, ratio;
    ratio = function(p) {
      if (config.scale) {
        return p;
      } else {
        return 1;
      }
    };
    color = ColorFactory.getColor(config.color);
    newImage = d3Node.append("svg:ellipse").classed('ellipse', true).attr('cx', width / 2).attr('cy', height / 2).attr('rx', function(d) {
      return width * ratio(d.proportion) / 2;
    }).attr('ry', function(d) {
      return height * ratio(d.proportion) / 2;
    }).style('fill', color);
    return Promise.resolve({
      newImage: newImage
    });
  };

  ImageFactory.addSquareTo = function(d3Node, config, width, height) {
    var color, length, newImage, ratio;
    ratio = function(p) {
      if (config.scale) {
        return p;
      } else {
        return 1;
      }
    };
    length = Math.min(width, height);
    color = ColorFactory.getColor(config.color);
    newImage = d3Node.append("svg:rect").classed('square', true).attr('x', function(d) {
      return (width - length) / 2 + width * (1 - ratio(d.proportion)) / 2;
    }).attr('y', function(d) {
      return (height - length) / 2 + height * (1 - ratio(d.proportion)) / 2;
    }).attr('width', function(d) {
      return ratio(d.proportion) * length;
    }).attr('height', function(d) {
      return ratio(d.proportion) * length;
    }).style('fill', color);
    return Promise.resolve({
      newImage: newImage,
      unscaledBox: {
        x: (width - length) / 2,
        y: (height - length) / 2,
        width: length,
        height: length
      }
    });
  };

  ImageFactory.addRectTo = function(d3Node, config, width, height) {
    var color, newImage, ratio;
    ratio = function(p) {
      if (config.scale) {
        return p;
      } else {
        return 1;
      }
    };
    color = ColorFactory.getColor(config.color);
    newImage = d3Node.append("svg:rect").classed('rect', true).attr('x', function(d) {
      return width * (1 - ratio(d.proportion)) / 2;
    }).attr('y', function(d) {
      return height * (1 - ratio(d.proportion)) / 2;
    }).attr('width', function(d) {
      return width * ratio(d.proportion);
    }).attr('height', function(d) {
      return height * ratio(d.proportion);
    }).style('fill', color);
    return Promise.resolve({
      newImage: newImage
    });
  };

  ImageFactory.addExternalImage = function(d3Node, config, width, height, dataAttributes) {
    if (config.color) {
      if (config.url.match(/\.svg$/)) {
        return ImageFactory.addRecoloredSvgTo(d3Node, config, width, height, dataAttributes);
      } else {
        throw new Error("Cannot recolor " + config.url + ": unsupported image type for recoloring");
      }
    } else {
      return ImageFactory._addExternalImage(d3Node, config, width, height, dataAttributes);
    }
  };

  ImageFactory.addRecoloredSvgTo = function(d3Node, config, width, height, dataAttributes) {
    var newColor;
    newColor = ColorFactory.getColor(config.color);
    return new Promise(function(resolve, reject) {
      var onDownloadSuccess;
      onDownloadSuccess = function(xmlString) {
        var cleanedSvgString, data, ratio, svg, x, y;
        data = jQuery.parseXML(xmlString);
        svg = jQuery(data).find('svg');
        ratio = config.scale ? dataAttributes.proportion : 1;
        x = width * (1 - ratio) / 2;
        y = height * (1 - ratio) / 2;
        width = width * ratio;
        height = height * ratio;
        cleanedSvgString = RecolorSvg.recolor(svg, newColor, x, y, width, height);
        return resolve({
          newImage: d3Node.append('g').html(cleanedSvgString)
        });
      };
      return ImageFactory.getOrDownload(config.url).done(onDownloadSuccess).fail(reject);
    });
  };

  ImageFactory._addExternalImage = function(d3Node, config, width, height) {
    var newImage, ratio;
    ratio = function(p) {
      if (config.scale) {
        return p;
      } else {
        return 1;
      }
    };
    newImage = d3Node.append("svg:image").attr('x', function(d) {
      return width * (1 - ratio(d.proportion)) / 2;
    }).attr('y', function(d) {
      return height * (1 - ratio(d.proportion)) / 2;
    }).attr('xlink:href', config.url).attr('class', 'variable-image').attr('width', function(d) {
      return width * ratio(d.proportion);
    }).attr('height', function(d) {
      return height * ratio(d.proportion);
    }).attr('preserveAspectRatio', 'xMidYMid meet');
    return Promise.resolve({
      newImage: newImage
    });
  };

  ImageFactory.addClipFromBottom = function(d3Node, imageBox) {
    var uniqueId;
    uniqueId = ("clip-id-" + (Math.random())).replace(/\./g, '');
    d3Node.append('clipPath').attr('id', uniqueId).append('rect').attr('x', imageBox.x).attr('y', function(d) {
      return imageBox.y + imageBox.height * (1 - d.proportion);
    }).attr('width', imageBox.width).attr('height', function(d) {
      return imageBox.height * d.proportion;
    });
    return uniqueId;
  };

  ImageFactory.addClipFromTop = function(d3Node, imageBox) {
    var uniqueId;
    uniqueId = ("clip-id-" + (Math.random())).replace(/\./g, '');
    d3Node.append('clipPath').attr('id', uniqueId).append('rect').attr('x', imageBox.x).attr('y', function(d) {
      return imageBox.y;
    }).attr('width', imageBox.width).attr('height', function(d) {
      return imageBox.height * d.proportion;
    });
    return uniqueId;
  };

  ImageFactory.addClipFromLeft = function(d3Node, imageBox) {
    var uniqueId;
    uniqueId = ("clip-id-" + (Math.random())).replace(/\./g, '');
    d3Node.append('clipPath').attr('id', uniqueId).append('rect').attr('x', imageBox.x).attr('y', imageBox.y).attr('width', function(d) {
      return imageBox.width * d.proportion;
    }).attr('height', imageBox.height);
    return uniqueId;
  };

  ImageFactory.addClipFromRight = function(d3Node, imageBox) {
    var uniqueId;
    uniqueId = ("clip-id-" + (Math.random())).replace(/\./g, '');
    d3Node.append('clipPath').attr('id', uniqueId).append('rect').attr('x', function(d) {
      return imageBox.x + imageBox.width * (1 - d.proportion);
    }).attr('y', imageBox.y).attr('width', function(d) {
      return imageBox.width * d.proportion;
    }).attr('height', imageBox.height);
    return uniqueId;
  };

  ImageFactory.addRadialClip = function(d3Node, imageBox) {
    var height, uniqueId, width, x, y;
    x = imageBox.x, y = imageBox.y, width = imageBox.width, height = imageBox.height;
    uniqueId = ("clip-id-" + (Math.random())).replace(/\./g, '');
    d3Node.append('clipPath').attr('id', uniqueId).append('path').attr('d', function(d) {
      var degrees, h2, p, pathParts, w2;
      p = d.proportion;
      degrees = p * 360;
      w2 = width / 2;
      h2 = height / 2;
      pathParts = ["M" + (x + w2) + "," + (y + h2) + " l0,-" + h2];
      if (p >= 1 / 8) {
        pathParts.push("l" + w2 + ",0");
      } else {
        pathParts.push("l" + (h2 * Math.tan(degrees * Math.PI / 180)) + ",0");
      }
      if (p >= 2 / 8) {
        pathParts.push("l0," + h2);
      } else if (p > 1 / 8) {
        pathParts.push("l0," + (h2 - w2 * Math.tan((90 - degrees) * Math.PI / 180)));
      }
      if (p >= 3 / 8) {
        pathParts.push("l0," + h2);
      } else if (p > 2 / 8) {
        pathParts.push("l0," + (w2 * Math.tan((degrees - 90) * Math.PI / 180)));
      }
      if (p >= 4 / 8) {
        pathParts.push("l-" + w2 + ",0");
      } else if (p > 3 / 8) {
        pathParts.push("l-" + (w2 - h2 * Math.tan((180 - degrees) * Math.PI / 180)) + ",0");
      }
      if (p >= 5 / 8) {
        pathParts.push("l-" + w2 + ",0");
      } else if (p > 4 / 8) {
        pathParts.push("l-" + (h2 * Math.tan((degrees - 180) * Math.PI / 180)) + ",0");
      }
      if (p >= 6 / 8) {
        pathParts.push("l0,-" + h2);
      } else if (p > 5 / 8) {
        pathParts.push("l0,-" + (h2 - w2 * Math.tan((270 - degrees) * Math.PI / 180)));
      }
      if (p >= 7 / 8) {
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

  ImageFactory.types = {
    circle: ImageFactory.addCircleTo,
    ellipse: ImageFactory.addEllipseTo,
    square: ImageFactory.addSquareTo,
    rect: ImageFactory.addRectTo,
    url: ImageFactory.addExternalImage,
    data: ImageFactory._addExternalImage
  };

  ImageFactory.keywordHandlers = {
    vertical: {
      clip: 'fromBottom'
    },
    horizontal: {
      clip: 'fromLeft'
    },
    fromleft: {
      clip: 'fromLeft'
    },
    fromright: {
      clip: 'fromRight'
    },
    frombottom: {
      clip: 'fromBottom'
    },
    fromtop: {
      clip: 'fromTop'
    },
    scale: 'scale',
    radialclip: 'radialclip',
    radial: 'radialclip',
    pie: 'radialclip'
  };

  function ImageFactory() {}

  return ImageFactory;

})();
