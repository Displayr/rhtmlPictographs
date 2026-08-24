const _ = require('lodash')
// Pure JS md5 rather than node's crypto: esbuild does not shim node builtins, and aliasing
// crypto to crypto-browserify pulls asn1.js/elliptic/browserify-sign into the browser bundle
// (+160KB) for what is only a hash of a lookup key. Same md5 hex digest either way.
const md5 = require('blueimp-md5')

class SvgDefinitionManager {
  constructor ({ parentSvg }) {
    this.parentSvg = parentSvg
    this.definitionElement = this.parentSvg.append('svg:defs')
    this.definitionNamesToIdMap = {}
  }

  _genHash (input) {
    return md5(input)
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
