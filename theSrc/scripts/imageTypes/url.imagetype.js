import _ from 'lodash'

import BaseImageType from './base.imagetype'
import CacheService from '../CacheService'
import geometryUtils from '../utils/geometryUtils'

class UrlType extends BaseImageType {
  calculateImageDimensions () {
    // NB if the config contains a preserveAspectRatio and that setting uses "slice" then the image
    // will fill the entire container so we can use the default image dimensions (which are == container dimensions)
    if (this.config.preserveAspectRatio && this.config.preserveAspectRatio.match(/slice/)) {
      return Promise.resolve(this.imageDimensions)
    }

    const cacheKey = `dimensions-${this.config.url}-${this.containerWidth}-${this.containerHeight}-${this.config.preserveAspectRatio}`
    if (!CacheService.get(cacheKey)) {
      const imageDimensionsPromise = new Promise((resolve, reject) => {
        const tmpImg = document.createElement('img')
        tmpImg.setAttribute('src', this.config.url)
        document.body.appendChild(tmpImg)

        tmpImg.onerror = () => {
          tmpImg.remove()
          return reject(new Error(`Image download fail: '${this.config.url}'`))
        }

        tmpImg.onload = () => {
          const imageWidth = tmpImg.getBoundingClientRect().width
          const imageHeight = tmpImg.getBoundingClientRect().height

          this.imageDimensions = geometryUtils.computeImageDimensions(
            imageWidth / imageHeight,
            this.containerWidth,
            this.containerHeight
          )

          if (this.config.preserveAspectRatio && this.config.preserveAspectRatio.match(/meet/)) {
            const par = this.config.preserveAspectRatio
            if (par.match(/xMin/)) {
              this.imageDimensions.x = 0
            }
            if (par.match(/xMax/)) {
              this.imageDimensions.x = this.imageDimensions.x * 2
            }
            // NB inconsistent capitalization is deliberate
            // TODO parse this up front !
            if (par.match(/YMin/)) {
              this.imageDimensions.y = 0
            }
            if (par.match(/YMax/)) {
              this.imageDimensions.y = this.imageDimensions.y * 2
            }
          }

          tmpImg.remove()
          return resolve(this.imageDimensions)
        }
      })
      CacheService.put(cacheKey, imageDimensionsPromise, 10000)
    }

    return CacheService.get(cacheKey).then((imageDimensions) => {
      this.imageDimensions = imageDimensions
      return this.imageDimensions
    })
  }

  appendToSvg () {
    this.imageHandle = this.d3Node.append('svg:image')
      .attr('x', (this.containerWidth * (1 - this.ratio)) / 2)
      .attr('y', (this.containerHeight * (1 - this.ratio)) / 2)
      .attr('width', this.containerWidth * this.ratio)
      .attr('height', this.containerHeight * this.ratio)
      .attr('xlink:href', this.config.url)

    if (_.has(this.config, 'preserveAspectRatio')) {
      this.imageHandle.attr('preserveAspectRatio', this.config.preserveAspectRatio)
    }
    return this.imageHandle
  }
}

module.exports = UrlType
