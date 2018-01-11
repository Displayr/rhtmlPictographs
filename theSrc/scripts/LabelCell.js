import _ from 'lodash'
import BaseCell from './BaseCell'

import labelUtils from './utils/labelUtils'
import { ensureObjectHasValidFontSize } from './utils/fontSizeCleaner'

class LabelCell extends BaseCell {
  setConfig (config) {
    this.extractLabelsAndConfigFrom(config)
    this.validateConfig()
  }

  // handle string, array, and object config
  extractLabelsAndConfigFrom (config) {
    this.config = config
    this.labels = []
    if (_.isString(this.config)) {
      this.labels = [{ text: this.config }]
      this.config = {}
    } else if (_.isArray(this.config)) {
      this.labels = this.config.map(function (labelConfig) {
        if (_.isString(labelConfig)) {
          return { text: labelConfig }
        }
        return labelConfig
      })
      this.config = {}
    } else if (_.has(this.config, 'labels')) {
      this.labels = this.config.labels.map(function (labelConfig) {
        if (_.isString(labelConfig)) {
          return { text: labelConfig }
        }
        return labelConfig
      })
    } else {
      this.labels = [this.config]
    }
  }

  validateConfig () {
    this._verifyKeyIsInt(this.config, 'padding-top', 0)
    this._verifyKeyIsInt(this.config, 'padding-inner', 0)
    this._verifyKeyIsInt(this.config, 'padding-bottom', 0)
    this._verifyKeyIsInt(this.config, 'padding-right', 0)
    this._verifyKeyIsInt(this.config, 'padding-left', 0)

    if (this.config['vertical-align'] == null) { this.config['vertical-align'] = 'center' }
    if (['middle', 'centre'].includes(this.config['vertical-align'])) { this.config['vertical-align'] = 'center' }

    if (!['top', 'center', 'bottom'].includes(this.config['vertical-align'])) {
      throw new Error(`Invalid vertical align ${this.config['vertical-align']} : must be one of ['top', 'center', 'bottom']`)
    }

    _.forEach(this.labels, (labelConfig, index) => {
      if (labelConfig.class == null) { labelConfig.class = `label-${index}` }

      if (labelConfig['horizontal-align'] == null) { labelConfig['horizontal-align'] = 'middle' }
      if (['center', 'centre'].includes(labelConfig['horizontal-align'])) { labelConfig['horizontal-align'] = 'middle' }
      if (['left'].includes(labelConfig['horizontal-align'])) { labelConfig['horizontal-align'] = 'start' }
      if (['right'].includes(labelConfig['horizontal-align'])) { labelConfig['horizontal-align'] = 'end' }

      if (!['start', 'middle', 'end'].includes(labelConfig['horizontal-align'])) {
        throw new Error(`Invalid horizontal align ${labelConfig['horizontal-align']} : must be one of ['left', 'center', 'right']`)
      }

      // font-size must be present to compute dimensions
      ensureObjectHasValidFontSize(labelConfig, BaseCell.getDefault('font-size'))
      _.forEach(labelConfig, (labelValue, labelKey) => {
        // TODO does text belong here
        if (['class', 'text', 'horizontal-align'].includes(labelKey)) { return }
        this.setCss(labelConfig.class, labelKey, labelValue)
      })
    })
  }

  getDimensionConstraints () {
    const labelDimensions = labelUtils.calculateLabelDimensions(this.labels, {
      inner: this.config['padding-inner'],
      top: this.config['padding-top'],
      right: this.config['padding-right'],
      bottom: this.config['padding-bottom'],
      left: this.config['padding-left']
    })

    this.dimensionConstraints = {
      apectRatio: null,
      width: {
        min: labelDimensions.width,
        max: null,
        margins: {
          negative: [],
          positive: []
        }
      },
      height: {
        min: labelDimensions.height,
        max: null,
        margins: {
          negative: [],
          positive: []
        }
      }
    }

    return Promise.resolve(this.dimensionConstraints)
  }

  _draw () {
    if (this.config['background-color']) {
      this.parentSvg.append('svg:rect')
        .attr('class', 'background')
        .attr('width', this.width)
        .attr('height', this.height)
        .attr('fill', this.config['background-color'])
    }

    this.computeAllocatedVerticalSpace()
    let currentY = this.computeInitialVerticalOffset(this.config['vertical-align'])

    _.forEach(this.labels, (labelConfig) => {
      const xOffset = this.computeHorizontalOffset(labelConfig['horizontal-align'])

      this._addTextTo({
        parent: this.parentSvg,
        text: labelConfig.text,
        myClass: labelConfig.class,
        textAnchor: labelConfig['horizontal-align'],
        x: xOffset,
        y: currentY + (labelConfig['font-size'] / 2),
        fontSize: labelConfig['font-size']
      })

      currentY += labelConfig['font-size'] + this.config['padding-inner']
    })
  }

  computeAllocatedVerticalSpace () {
    let allocatedVerticalSpace = this.config['padding-inner'] * (this.labels.length - 1)
    _.forEach(this.labels, (labelConfig) => {
      const labelFontSize = labelConfig['font-size']
      allocatedVerticalSpace += labelFontSize
    })

    this.allocatedVerticalSpace = allocatedVerticalSpace
  }

  computeHorizontalOffset (horizontalAlign) {
    switch (true) {
      case horizontalAlign === 'start': return this.config['padding-left']
      case horizontalAlign === 'middle': return this.width / 2
      case horizontalAlign === 'end': return this.width - this.config['padding-right']
      default: throw new Error(`unexpected horizontal-align: ${horizontalAlign}`)
    }
  }

  computeInitialVerticalOffset (verticalAlign) {
    let freeVertSpace = this.height - this.config['padding-top'] - this.config['padding-bottom'] - this.allocatedVerticalSpace
    if (freeVertSpace < 0) {
      console.error('Label is using too much vertical space')
      freeVertSpace = 0
    }

    return (() => {
      switch (true) {
        case verticalAlign === 'top': return this.config['padding-top']
        case verticalAlign === 'center': return this.config['padding-top'] + (freeVertSpace / 2)
        case verticalAlign === 'bottom': return this.config['padding-top'] + freeVertSpace
        default: throw new Error(`unexpected vertical-align: ${verticalAlign}`)
      }
    })()
  }

  _addTextTo ({ parent, text, myClass, textAnchor, x, y, fontSize }) {
    return parent.append('svg:text')
      .attr('class', myClass)
      .attr('x', x)
      .attr('y', y)
      .attr('text-anchor', textAnchor)
      .style('font-size', fontSize)
      .style('dominant-baseline', 'central')
      .text(text)
  }
}

module.exports = LabelCell
