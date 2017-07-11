import _ from 'lodash'
import $ from 'jquery'
import BaseImageType from './base.imagetype'
import CacheService from '../CacheService'
import RecolorSvg from '../RecolorSvg'
import geometryUtils from '../utils/geometryUtils'

class RecoloredExternalSvg extends BaseImageType {
  calculateDesiredAspectRatio () {
    return new Promise((resolve, reject) => {
      const onDownloadSuccess = (xmlString) => {
        const data = $.parseXML(xmlString)
        this.svg = $(data).find('svg')

        let imageAspectRatio = this._extractAspectRatioFromSvg()
        if (!imageAspectRatio) {
          console.error(`WARN: recolor SVG from ${this.config.url} : Cannot compute aspect ratio : unexpected SVG format (no viewbox , no width & height).`)
          return resolve(null)
        }
        return resolve(imageAspectRatio)
      }

      const onDownloadFailure = () => reject(new Error(`Downloading svg failed: ${this.config.url}`))

      return this.getOrDownload(this.config.url)
        .done(onDownloadSuccess)
        .fail(onDownloadFailure)
    })
  }

  calculateImageDimensions () {
    return new Promise((resolve, reject) => {
      const onDownloadSuccess = (xmlString) => {
        const data = $.parseXML(xmlString)
        this.svg = $(data).find('svg')

        const containerAspectRatio = this.containerWidth / this.containerHeight
        let imageAspectRatio = this._extractAspectRatioFromSvg()
        if (!imageAspectRatio) {
          console.error(`WARN: recolor SVG from ${this.config.url} : Cannot compute aspect ratio : unexpected SVG format (no viewbox , no width & height).`)
          imageAspectRatio = containerAspectRatio
        }

        const imageDimensions = geometryUtils.computeImageDimensions(
          imageAspectRatio,
          this.containerWidth,
          this.containerHeight
        )
        _.merge(this.imageDimensions, imageDimensions)
        return resolve(this.imageDimensions)
      }

      const onDownloadFailure = () => reject(new Error(`Downloading svg failed: ${this.config.url}`))

      // TODO make this promise like (abstract out the jquery)
      return this.getOrDownload(this.config.url)
        .done(onDownloadSuccess)
        .fail(onDownloadFailure)
    })
  }

  // TODO test !!!
  _extractAspectRatioFromSvg () {
    let specifiedWidth = this.svg.attr('width')
    let specifiedHeight = this.svg.attr('height')
    const currentViewBox = this.svg.attr('viewBox')

    if (currentViewBox) {
      const parts = currentViewBox.split(' ')
      return parseFloat(parts[2]) / parseFloat(parts[3])
    } else if (specifiedWidth && specifiedHeight) {
      specifiedWidth = parseFloat(specifiedWidth.replace(/[^0-9.]*/g, ''))
      if (_.isNaN(specifiedWidth)) {
        return null
      }

      specifiedHeight = parseFloat(specifiedHeight.replace(/[^0-9.]*/g, ''))
      if (_.isNaN(specifiedHeight)) {
        return null
      }

      return specifiedWidth / specifiedHeight
    }

    return null
  }

  appendToSvg () {
    const recolorArgs = {
      svg: this.svg,
      x: (this.containerWidth * (1 - this.ratio)) / 2,
      y: (this.containerHeight * (1 - this.ratio)) / 2,
      width: this.containerWidth * this.ratio,
      height: this.containerHeight * this.ratio,
      color: this.color
    }

    if (_.has(this.config, 'preserveAspectRatio')) {
      recolorArgs.preserveAspectRatio = this.config.preserveAspectRatio
    }
    const cleanedSvgString = RecolorSvg.recolor(recolorArgs)

    this.imageHandle = this.d3Node.append('g').html(cleanedSvgString)
    return this.imageHandle
  }

  getOrDownload () {
    const cacheKey = `content-${this.config.url}`
    if (!CacheService.get(cacheKey)) {
      const contentDownloadJqueryPromise = $.ajax({ url: this.config.url, dataType: 'text' })
      CacheService.put(cacheKey, contentDownloadJqueryPromise, 10000)
    }
    return CacheService.get(cacheKey)
  }
}

module.exports = RecoloredExternalSvg
