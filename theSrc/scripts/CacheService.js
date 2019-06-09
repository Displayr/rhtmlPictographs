import _ from 'lodash'
import crypto from 'crypto'
import * as log from 'loglevel'
import lruCache from 'lru-cache'

/*
  Considerations:
  * what is cached by pictograph:
      * svg downloads - store string content of SVG
      * parsed svg downloads - store the parsed representation of the SVG
      * computed aspect ratios for downloaded svgs
      * recolored svg content for downloaded and recolored svgs
  * urls - and even data uri strings! - are is included in the inputKey, so this module
  generates a hash to avoid long string lookups
*/

const maxNumberOfCacheEntries = 100
const cacheReporting = false

class CacheService {
  constructor () {
    this.cache = lruCache(maxNumberOfCacheEntries)
    this.expiryHandles = {}
    this.hitRates = {}
    this.reportingSettings = {
      quitAfter: 60000,
      reportEvery: (cacheReporting) ? 20000 : -1 // -1 === disabled
    }

    this.initialiseReporting()
  }

  initialiseReporting () {
    if (this.reportingSettings.reportEvery > 0) {
      this.reportingIntervalHandle = setInterval(() => {
        log.debug('Cache report', this.hitRates)
      }, this.reportingSettings.reportEvery)
      setTimeout(() => {
        clearInterval(this.reportingIntervalHandle)
      }, this.reportingSettings.quitAfter)
    }
  }

  _genHash (input) {
    return crypto.createHash('md5').update(input).digest('hex')
  }

  _recordHit (key) {
    if (!_.has(this.hitRates, key)) { this.hitRates[key] = { hit: 0, miss: 0 } }
    this.hitRates[key]['hit']++
  }

  _recordMiss (key) {
    if (!_.has(this.hitRates, key)) { this.hitRates[key] = { hit: 0, miss: 0 } }
    this.hitRates[key]['miss']++
  }

  get (inputKey) {
    const key = this._genHash(inputKey)
    if (this.cache.has(key)) {
      this._recordHit(inputKey)
      return this.cache.get(key)
    }
    this._recordMiss(inputKey)
    return null
  }

  put (inputKey, value) {
    const key = this._genHash(inputKey)
    this.cache.set(key, value)

    if (_.has(this.expiryHandles, key)) {
      clearTimeout(this.expiryHandles[key])
      delete this.expiryHandles[key]
    }
  }
}

module.exports = new CacheService()
module.exports.classDefinition = CacheService
