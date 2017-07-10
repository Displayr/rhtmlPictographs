import ColorFactory from '../ColorFactory'

class BaseImageType {
  constructor (d3Node, config, containerWidth, containerHeight, dataAttributes) {
    this.d3Node = d3Node
    this.config = config
    this.containerWidth = containerWidth
    this.containerHeight = containerHeight
    this.dataAttributes = dataAttributes

    this.colorFactory = ColorFactory

    this.imageHandle = null
    this.imageDimensions = {
      width: this.containerWidth,
      height: this.containerHeight,
      x: 0,
      y: 0
    }
  }

  // return a Promise that resolves with an int or null if the image type has no applicalble aspect ratio (e.g., rectangle)
  calculateDesiredAspectRatio () {
    return Promise.resolve(1)
  }

  /*
     return value: Promise that resolves to
       imageDimensions object (plain JS object) containing keys:
         width: expected width of image in container,
         height: expected height of image in container,
         x: expected left most x coordinate where image should be placed in container,
         y: expected top most y coordinate where image should be placed in container,

     * the return value is used by ImageFactory to apply clippaths. The actual placement of the image is controlled by
     appendToSvg, and there are cases where the response from calculateImageDimensions does not match the behaviour
     of appendToSvg (i.e., url.imageType.js and recoloredExternalSvg.imagetype.js).
     The answer to whyis we let the browser do the placement in these cases because we are lazy

   */
  calculateImageDimensions () {
    throw new Error('calculateImageDimensions must be overridden in child')
  }

  appendToSvg () {
    throw new Error('appendToSvg must be overridden in child')
  }

  get ratio () {
    return this.config.scale ? this.dataAttributes.proportion : 1
  }

  get color () {
    return this.colorFactory.getColor(this.config.color)
  }

  get baseShapeHiding () {
    return (this.config.baseShapeScale != null) ? this.config.baseShapeScale : 1
  }
}

module.exports = BaseImageType
