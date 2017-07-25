import BaseImageType from './base.imagetype'

class RectangleType extends BaseImageType {
  calculateImageDimensions () {
    return this.imageDimensions
  }

  appendToSvg () {
    this.imageHandle = this.d3Node.append('svg:rect')
      .classed('rect', true)
      .attr('x', (this.containerWidth * this.baseShapeHiding * (1 - this.ratio)) / 2)
      .attr('y', (this.containerHeight * this.baseShapeHiding * (1 - this.ratio)) / 2)
      .attr('width', this.containerWidth * this.ratio * this.baseShapeHiding)
      .attr('height', this.containerHeight * this.ratio * this.baseShapeHiding)
      .style('fill', this.color)

    return this.imageHandle
  }
}

module.exports = RectangleType
