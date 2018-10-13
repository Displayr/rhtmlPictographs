import _ from 'lodash'
import crypto from 'crypto'

class SvgDefinitionManager {
  constructor ({ parentSvg }) {
    this.parentSvg = parentSvg
    this.definitionElement = this.parentSvg.append('svg:defs')
    this.definitionNamesToIdMap = {}
  }

  _genHash (input) {
    return crypto.createHash('md5').update(input).digest('hex')
  }

  addDefinition (name, contentString) {
    if (!_.has(this.definitionNamesToIdMap, name)) {
      const definitionId = this._genHash(name)
      this.definitionNamesToIdMap[name] = definitionId
      this.definitionElement.append('g')
        .attr('id', definitionId)
        .html(contentString)
    }

    return this.definitionNamesToIdMap[name]
  }
}

module.exports = SvgDefinitionManager
