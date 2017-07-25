import BaseImageType from './base.imagetype'

class CircleType extends BaseImageType {
  calculateImageDimensions () {
    const dim = this.imageDimensions
    dim.diameter = Math.min(this.containerWidth, this.containerHeight)
    dim.x = (this.containerWidth - dim.diameter) / 2
    dim.y = (this.containerHeight - dim.diameter) / 2
    dim.width = dim.diameter
    dim.height = dim.diameter

    return this.imageDimensions
  }

  appendToSvg () {
    this.imageHandle = this.d3Node.append('svg:circle')
      .classed('circle', true)
      .attr('cx', this.containerWidth / 2)
      .attr('cy', this.containerHeight / 2)
      .attr('r', ((this.ratio * this.imageDimensions.diameter) / 2) * this.baseShapeHiding)
      .style('fill', this.color)

    return this.imageHandle
  }
}

module.exports = CircleType
