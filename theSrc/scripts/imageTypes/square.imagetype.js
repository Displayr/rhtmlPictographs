import BaseImageType from './base.imagetype'

class SquareType extends BaseImageType {
  calculateImageDimensions () {
    const dim = this.imageDimensions
    dim.length = Math.min(this.containerWidth, this.containerHeight)
    dim.x = (this.containerWidth - dim.length) / 2
    dim.y = (this.containerHeight - dim.length) / 2
    dim.width = dim.length
    dim.height = dim.length

    return this.imageDimensions
  }

  appendToSvg () {
    const length = this.imageDimensions.length
    this.imageHandle = this.d3Node.append('svg:rect')
      .classed('square', true)
      .attr('x', ((this.containerWidth - (length * this.baseShapeHiding)) / 2) + ((length * (1 - this.ratio)) / 2))
      .attr('y', ((this.containerHeight - (length * this.baseShapeHiding)) / 2) + ((length * (1 - this.ratio)) / 2))
      .attr('width', this.ratio * length * this.baseShapeHiding)
      .attr('height', this.ratio * length * this.baseShapeHiding)
      .style('fill', this.color)

    return this.imageHandle
  }
}

module.exports = SquareType
