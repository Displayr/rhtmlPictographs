import $ from 'jquery';
import ColorFactory from './ColorFactory';
import RecolorSvg from './RecolorSvg';

// I am a singleton, all my methods and variables are static

class ImageFactory {
  static initClass() {
    // NB there is a chance that setting timeouts in the browser will mess with automation scripts, so consider this timeout in that scenario
    // NB the timeout cn be set very low. Even at 0 all image requests for a Pictograph will share the same promise,
    // because all calls to getOrDownload take place before the JS "next tick"
    // NB Main benefit of setting higher is to aid during redraws etc.
    this.imageDownloadPromises = {};

  // TODO add delete cache timeout to prevent unbounded memory growth
  // TODO seperate out the aspect ratio calculations so that we can reuse the image download request regardless of container dimensions
    this.imageSvgDimensions = {};

    this.types = {
      circle: ImageFactory.addCircleTo,
      ellipse: ImageFactory.addEllipseTo,
      square: ImageFactory.addSquareTo,
      rect: ImageFactory.addRectTo,
      url: ImageFactory.addExternalImage,
      data: ImageFactory._addExternalImage,
    };

    this.basicShapes = ['circle', 'ellipse', 'square', 'rect'];

    this.scalingStrategies = {
      vertical: { clip: 'fromBottom' },
      horizontal: { clip: 'fromLeft' },
      fromleft: { clip: 'fromLeft' },
      fromright: { clip: 'fromRight' },
      frombottom: { clip: 'fromBottom' },
      fromtop: { clip: 'fromTop' },
      scale: 'scale',
      radialclip: 'radialclip',
      radial: 'radialclip',
      pie: 'radialclip',
    };

    this.validScalingStrategyStrings = _.keys(ImageFactory.scalingStrategies);
    this.validScalingStrategyKeys = ['clip', 'radialclip', 'scale'];
  }
  static getOrDownload(url) {
    if (!(url in ImageFactory.imageDownloadPromises)) {
      ImageFactory.imageDownloadPromises[url] = $.ajax({ url, dataType: 'text' });
      setTimeout(() => delete ImageFactory.imageDownloadPromises[url]
      , 10000);
    }
    return ImageFactory.imageDownloadPromises[url];
  }
  static getImageDimensions(url, imageBoxDim, containerWidth, containerHeight) {
    if (!url) { return new Promise((resolve, reject) => resolve(imageBoxDim)); }

    const cacheKey = `${url}-${containerWidth}-${containerHeight}`;
    if (!(cacheKey in ImageFactory.imageSvgDimensions)) {
      ImageFactory.imageSvgDimensions[cacheKey] = new Promise(function (resolve, reject) {
        const tmpImg = document.createElement('img');
        tmpImg.setAttribute('src', url);
        document.body.appendChild(tmpImg);
        tmpImg.onerror = function () {
          tmpImg.remove();
          return reject(new Error(`Image not found: ${url}`));
        };

        return tmpImg.onload = function () {
          // alg from http://stackoverflow.com/a/6565988/3344695
          const imageWidth = tmpImg.getBoundingClientRect().width;
          const imageHeight = tmpImg.getBoundingClientRect().height;
          const imageAspectRatio = imageWidth / imageHeight;
          const containerAspectRatio = containerWidth / containerHeight;

          if (containerAspectRatio > imageAspectRatio) {
            imageBoxDim.width = (imageWidth * containerHeight) / imageHeight;
            imageBoxDim.height = containerHeight;
          } else {
            imageBoxDim.width = containerWidth;
            imageBoxDim.height = (imageHeight * containerWidth) / imageWidth;
          }

          imageBoxDim.xFactory = (containerWidth - imageBoxDim.width) / 2;
          imageBoxDim.yFactory = (containerHeight - imageBoxDim.height) / 2;
          imageBoxDim.aspectRatio = imageAspectRatio;

          tmpImg.remove();
          return resolve(imageBoxDim);
        };
      });
    }

    return ImageFactory.imageSvgDimensions[cacheKey];
  }

  static addBaseImageTo(d3Node, config, width, height, dataAttributes) {
    config = ImageFactory.parseConfigString(config);

    // VIS-121 - Prevent base svgs from peeking out over the variable images (only for basic shapes)
    if (_.includes(ImageFactory.basicShapes, config.type) && this.isInternetExplorer()) { config.baseShapeScale = 0.98; }
    return ImageFactory.addImageTo(d3Node, config, width, height, dataAttributes);
  }

  static addVarImageTo(d3Node, config, width, height, dataAttributes) {
    config = ImageFactory.parseConfigString(config);
    return ImageFactory.addImageTo(d3Node, config, width, height, dataAttributes);
  }

  static addImageTo(d3Node, config, width, height, dataAttributes) {
    // we need to get the aspect ratio for the clip, this is an ugly but effective way
    // perhaps another way to figure out aspect ratio: http://stackoverflow.com/questions/38947966/how-to-get-a-svgs-aspect-ratio?noredirect=1#comment65284650_38947966
    const imageBoxDim = {
      height,
      width,
      x: 0,
      y: 0,
    };
    config.imageBoxDim = imageBoxDim;

    const getDimensionsPromise = ImageFactory.getImageDimensions(config.url, imageBoxDim, width, height);
    const getImageDataPromise = ImageFactory.types[config.type](d3Node, config, width, height, dataAttributes);
    return Promise.all([getDimensionsPromise, getImageDataPromise]).then(function (values) {
      config.imageBoxDim = values[0];
      const newImageData = values[1];

      // why unscaledBox? if we place a 100x100 circle in a 200x100 container, the circle goes in the middle.
      // when we create the clipPath, we need to know the circle doesn't start at 0,0 it starts at 50,0
      const imageBox = newImageData.unscaledBox || {
        x: config.imageBoxDim.xFactory,
        y: config.imageBoxDim.yFactory,
        width: config.imageBoxDim.width,
        height: config.imageBoxDim.height,
      };
      const { newImage } = newImageData;

      if (config.clip) {
        const clipMaker = (() => {
          switch (false) {
            case config.clip !== 'fromLeft': return ImageFactory.addClipFromLeft;
            case config.clip !== 'fromRight': return ImageFactory.addClipFromRight;
            case config.clip !== 'fromTop': return ImageFactory.addClipFromTop;
            case config.clip !== 'fromTop': return ImageFactory.addClipFromTop;
            case config.clip !== 'fromBottom': return ImageFactory.addClipFromBottom;
          }
        })();

        const clipId = clipMaker(d3Node, imageBox);
        newImage.attr('clip-path', `url(#${clipId})`);
      }

      if (config.radialclip) {
        config.radialclip = ImageFactory.addRadialClip(d3Node, imageBox);
        newImage.attr('clip-path', `url(#${config.radialclip})`);
      }

      return newImage;
    }).catch(function (err) {
      console.log(`image error: ${err.message}`);
      throw err;
    });
  }

  static parseConfigString(configString) {
    let matchesHttp;
    let part;
    if (!_.isString(configString)) {
      if (!(configString.type in ImageFactory.types)) {
        throw new Error(`Invalid image creation config : unknown image type ${config.type}`);
      }
      return configString;
    }

    if (configString.length <= 0) {
      throw new Error("Invalid image creation configString '' : empty string");
    }

    let config = {};
    let configParts = [];

    const httpRegex = new RegExp('^(.*?):?(https?://.*)$');
    if (matchesHttp = configString.match(httpRegex)) {
      configParts = _.without(matchesHttp[1].split(':'), 'url');
      config.type = 'url';
      config.url = matchesHttp[2];
    } else {
      configParts = configString.split(':');

      var type = configParts.shift();
      if (!(type in ImageFactory.types)) {
        throw new Error(`Invalid image creation configString '${configString}' : unknown image type ${type}`);
      }
      config.type = type;
    }

    if (['url'].includes(type) && (config.url == null)) {
      config.url = configParts.pop();
      const hasDot = new RegExp(/\./);
      if (!config.url || !config.url.match(hasDot)) {
        throw new Error(`Invalid image creation configString '${configString}' : url string must end with a url`);
      }
    }

    if (['data'].includes(type)) {
      config.url = `data:${configParts.pop()}`;
      // TODO this logic needs to check there is something after data:
      if (!config.url) {
        throw new Error(`Invalid image creation configString '${configString}' : data string must have a data url as last string part`);
      }
    }

    const unknownParts = [];
    while (part = configParts.shift()) {
      if (part in ImageFactory.scalingStrategies) {
        const handler = ImageFactory.scalingStrategies[part];
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
      throw new Error(`Invalid image creation configString '${configString}' : too many unknown parts: [${unknownParts.join(',')}]`);
    }
    if (unknownParts.length === 1) {
      config.color = unknownParts[0];
    }

    return config;
  }

  static addCircleTo(d3Node, config, width, height) {
    const ratio = function (p) { if (config.scale) { return p; } else { return 1; } };
    const diameter = Math.min(width, height);
    const color = ColorFactory.getColor(config.color);
    const baseShapeHiding = (config.baseShapeScale != null) ? config.baseShapeScale : 1;

    const newImage = d3Node.append('svg:circle')
      .classed('circle', true)
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', d => ((ratio(d.proportion) * diameter) / 2) * baseShapeHiding)
      .style('fill', color)
      .attr('shape-rendering', 'crispEdges');

    return Promise.resolve({
      newImage,
      unscaledBox: {
        x: (width - diameter) / 2,
        y: (height - diameter) / 2,
        width: diameter,
        height: diameter,
      },
    });
  }

  static addEllipseTo(d3Node, config, width, height) {
    const ratio = p => config.scale ? p : 1;

    const color = ColorFactory.getColor(config.color);
    const baseShapeHiding = (config.baseShapeScale != null) ? config.baseShapeScale : 1;

    const newImage = d3Node.append('svg:ellipse')
      .classed('ellipse', true)
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('rx', d => ((width * ratio(d.proportion)) / 2) * baseShapeHiding)
      .attr('ry', d => ((height * ratio(d.proportion)) / 2) * baseShapeHiding)
      .style('fill', color)
      .attr('shape-rendering', 'crispEdges');

    return Promise.resolve({ newImage });
  }

  static addSquareTo(d3Node, config, width, height) {
    const ratio = p => config.scale ? p : 1;
    const length = Math.min(width, height);

    const color = ColorFactory.getColor(config.color);
    const baseShapeHiding = (config.baseShapeScale != null) ? config.baseShapeScale : 1;

    const newImage = d3Node.append('svg:rect')
      .classed('square', true)
      .attr('x', d => ((width - (length * baseShapeHiding)) / 2) + ((width * (1 - ratio(d.proportion))) / 2))
      .attr('y', d => ((height - (length * baseShapeHiding)) / 2) + ((height * (1 - ratio(d.proportion))) / 2))
      .attr('width', d => ratio(d.proportion) * length * baseShapeHiding)
      .attr('height', d => ratio(d.proportion) * length * baseShapeHiding)
      .style('fill', color)
      .attr('shape-rendering', 'crispEdges');

    return Promise.resolve({
      newImage,
      unscaledBox: {
        x: (width - length) / 2,
        y: (height - length) / 2,
        width: length,
        height: length,
      },
    });
  }

  static addRectTo(d3Node, config, width, height) {
    const ratio = p => config.scale ? p : 1;

    const color = ColorFactory.getColor(config.color);
    const baseShapeHiding = (config.baseShapeScale != null) ? config.baseShapeScale : 1;

    const newImage = d3Node.append('svg:rect')
      .classed('rect', true)
      .attr('x', d => (width * baseShapeHiding * (1 - ratio(d.proportion))) / 2)
      .attr('y', d => (height * baseShapeHiding * (1 - ratio(d.proportion))) / 2)
      .attr('width', d => width * ratio(d.proportion) * baseShapeHiding)
      .attr('height', d => height * ratio(d.proportion) * baseShapeHiding)
      .style('fill', color)
      .attr('shape-rendering', 'crispEdges');

    return Promise.resolve({ newImage });
  }

  static addExternalImage(d3Node, config, width, height, dataAttributes) {
    if (config.color) {
      if (config.url.match(/\.svg$/)) {
        return ImageFactory.addRecoloredSvgTo(d3Node, config, width, height, dataAttributes);
      } else {
        throw new Error(`Cannot recolor ${config.url}: unsupported image type for recoloring`);
      }
    } else {
      return ImageFactory._addExternalImage(d3Node, config, width, height, dataAttributes);
    }
  }

  // TODO this is extremely inefficient for multiImage graphics - SO BAD !
  static addRecoloredSvgTo(d3Node, config, width, height, dataAttributes) {
    const newColor = ColorFactory.getColor(config.color);

    return new Promise(function (resolve, reject) {
      const onDownloadSuccess = function (xmlString) {
        const data = $.parseXML(xmlString);
        const svg = $(data).find('svg');

        const ratio = config.scale ? dataAttributes.proportion : 1;
        const x = (width * (1 - ratio)) / 2;
        const y = (height * (1 - ratio)) / 2;
        width *= ratio;
        height *= ratio;

        const cleanedSvgString = RecolorSvg.recolor(svg, newColor, x, y, width, height);

        return resolve({ newImage: d3Node.append('g').html(cleanedSvgString) });
      };

      const onDownloadFailure = () => reject(new Error(`Downloading svg failed: ${config.url}`));

      return ImageFactory.getOrDownload(config.url)
                         .done(onDownloadSuccess)
                         .fail(onDownloadFailure);
    });
  }

  static _addExternalImage(d3Node, config, width, height) {
    const ratio = p => config.scale ? p : 1;

    const newImage = d3Node.append('svg:image')
    .attr('x', d => (width * (1 - ratio(d.proportion))) / 2)
    .attr('y', d => (height * (1 - ratio(d.proportion))) / 2)
    .attr('width', d => width * ratio(d.proportion))
    .attr('height', d => height * ratio(d.proportion))
    .attr('xlink:href', config.url)
    .attr('class', 'variable-image');

    return Promise.resolve({ newImage });
  }

  static addClipFromBottom(d3Node, imageBox) {
    const uniqueId = `clip-id-${Math.random()}`.replace(/\./g, '');
    d3Node.append('clipPath')
      .attr('id', uniqueId)
      .append('rect')
        .attr('x', imageBox.xFactory)
        .attr('y', d => imageBox.yFactory + (imageBox.height * (1 - d.proportion)))
        .attr('width', imageBox.width)
        .attr('height', d => imageBox.height * d.proportion);
    return uniqueId;
  }

  static addClipFromTop(d3Node, imageBox) {
    const uniqueId = `clip-id-${Math.random()}`.replace(/\./g, '');
    d3Node.append('clipPath')
      .attr('id', uniqueId)
      .append('rect')
        .attr('x', imageBox.xFactory)
        .attr('y', d => imageBox.yFactory)
        .attr('width', imageBox.width)
        .attr('height', d => imageBox.height * d.proportion);
    return uniqueId;
  }

  static addClipFromLeft(d3Node, imageBox) {
    const uniqueId = `clip-id-${Math.random()}`.replace(/\./g, '');
    d3Node.append('clipPath')
      .attr('id', uniqueId)
      .append('rect')
        .attr('x', imageBox.xFactory)
        .attr('y', imageBox.yFactory)
        .attr('width', d => imageBox.width * d.proportion)
        .attr('height', imageBox.height);
    return uniqueId;
  }

  static addClipFromRight(d3Node, imageBox) {
    const uniqueId = `clip-id-${Math.random()}`.replace(/\./g, '');
    d3Node.append('clipPath')
      .attr('id', uniqueId)
      .append('rect')
        .attr('x', d => imageBox.xFactory + (imageBox.width * (1 - d.proportion)))
        .attr('y', imageBox.yFactory)
        .attr('width', d => imageBox.width * d.proportion)
        .attr('height', imageBox.height);
    return uniqueId;
  }

  static addRadialClip(d3Node, imageBox) {
    let { x, y, width, height } = imageBox;

    const uniqueId = `clip-id-${Math.random()}`.replace(/\./g, '');
    d3Node.append('clipPath')
    .attr('id', uniqueId)
    .append('path')
      .attr('d', function (d) {
        const p = d.proportion;
        const degrees = p * 360;
        const w2 = width / 2;
        const h2 = height / 2;

        // start in the centre, then go straight up, then ...
        const pathParts = [`M${x + w2},${y + h2} l0,-${h2}`];

        // trace the edges of the rectangle, returning to the centre once we have "used up" all the proportion
        // probably can be optimized or expressed better ...

        if (p >= 1 / 8) {
          pathParts.push(`l${w2},0`);
        } else {
          pathParts.push(`l${h2 * Math.tan((degrees * Math.PI) / 180)},0`);
        }

        if (p >= 2 / 8) {
          pathParts.push(`l0,${h2}`);
        } else if (p > 1 / 8) {
          pathParts.push(`l0,${h2 - (w2 * Math.tan(((90 - degrees) * Math.PI) / 180))}`);
        }

        if (p >= 3 / 8) {
          pathParts.push(`l0,${h2}`);
        } else if (p > 2 / 8) {
          pathParts.push(`l0,${w2 * Math.tan(((degrees - 90) * Math.PI) / 180)}`);
        }

        if (p >= 4 / 8) {
          pathParts.push(`l-${w2},0`);
        } else if (p > 3 / 8) {
          pathParts.push(`l-${w2 - (h2 * Math.tan(((180 - degrees) * Math.PI) / 180))},0`);
        }

        if (p >= 5 / 8) {
          pathParts.push(`l-${w2},0`);
        } else if (p > 4 / 8) {
          pathParts.push(`l-${h2 * Math.tan(((degrees - 180) * Math.PI) / 180)},0`);
        }

        if (p >= 6 / 8) {
          pathParts.push(`l0,-${h2}`);
        } else if (p > 5 / 8) {
          pathParts.push(`l0,-${h2 - (w2 * Math.tan(((270 - degrees) * Math.PI) / 180))}`);
        }

        if (p >= 7 / 8) {
          pathParts.push(`l0,-${h2}`);
        } else if (p > 6 / 8) {
          pathParts.push(`l0,-${w2 * Math.tan(((degrees - 270) * Math.PI) / 180)}`);
        }

        if (p >= 8 / 8) {
          pathParts.push(`l${w2},0`);
        } else if (p > 7 / 8) {
          pathParts.push(`l${w2 - (h2 * Math.tan(((360 - degrees) * Math.PI) / 180))},0`);
        }

        pathParts.push('z');
        return pathParts.join(' ');
      });

    return uniqueId;
  }

  static isInternetExplorer() {
    const userAgentString = window.navigator.userAgent;
    const old_ie = userAgentString.indexOf('MSIE ');
    const new_ie = userAgentString.indexOf('Trident/');

    if ((old_ie > -1) || (new_ie > -1)) {
      return true;
    }

    return false;
  }

  constructor() {}
}
ImageFactory.initClass();

module.exports = ImageFactory;
