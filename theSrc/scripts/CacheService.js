import _ from 'lodash'
import crypto from 'crypto'
import * as log from 'loglevel'

/*
  Considerations:
  * when expiry is passed into put() we set a timeout to clear the cache. This prevents unbounded memory growth,
  but there is a chance that timeouts will mess with automation scripts, so consider this timeout in that scenario.
  * the timeouts can be set very low. Even at 0 all image requests for a Pictograph will share the same promise,
  because all calls to getOrDownload take place before the JS "next tick". The main benefit of setting
  higher is to aid during redraws etc.
  * url - and even data uri strings! - are is included in the inputKey, so this module
  generates a hash to avoid long string lookups
*/

class CacheService {
  constructor () {
    this.cache = {}
    this.expiryHandles = {}
    this.hitRates = {}
    this.reportingSettings = {
      quitAfter: 60000,
      reportEvery: -1 // -1 === disabled
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
    if (!_.has(this.hitRates, key)) { this.hitRates[key] = {hit: 0, miss: 0} }
    this.hitRates[key]['hit']++
  }

  _recordMiss (key) {
    if (!_.has(this.hitRates, key)) { this.hitRates[key] = {hit: 0, miss: 0} }
    this.hitRates[key]['miss']++
  }

  get (inputKey) {
    const key = this._genHash(inputKey)
    if (_.has(this.cache, key)) {
      this._recordHit(inputKey)
      return this.cache[key]
    }
    this._recordMiss(inputKey)
    return null
  }

  put (inputKey, value, expiry) {
    const key = this._genHash(inputKey)
    this.cache[key] = value

    if (_.has(this.expiryHandles, key)) {
      clearTimeout(this.expiryHandles[key])
      delete this.expiryHandles[key]
    }

    if (expiry) {
      this.expiryHandles[key] = setTimeout(() => {
        delete this.cache[key]
        delete this.expiryHandles[key]
      }, expiry)
    }
  }
}

module.exports = new CacheService()
module.exports.classDefinition = CacheService
