const BaseImageType = require('./base.imagetype')

class RectangleType extends BaseImageType {
  calculateImageDimensions () {
    return this.imageDimensions
  }

  calculateDesiredAspectRatio () {
    return Promise.resolve(null)
  }

  appendToSvg (clipId) {
    this.imageHandle = this.d3Node.append('svg:rect')
      .classed('rect', true)
      .attr('x', (this.containerWidth * this.baseShapeHiding * (1 - this.ratio)) / 2)
      .attr('y', (this.containerHeight * this.baseShapeHiding * (1 - this.ratio)) / 2)
      .attr('width', this.containerWidth * this.ratio * this.baseShapeHiding)
      .attr('height', this.containerHeight * this.ratio * this.baseShapeHiding)
      .style('fill', this.color)
      .style('opacity', this.opacity)

    this.addClipId(clipId)

    return Promise.resolve()
  }
}

module.exports = RectangleType
