const INSUFFICIENT_CONTAINER_SIZE_ERROR = 'INSUFFICIENT_CONTAINER_SIZE_ERROR'

class InsufficientContainerSizeError extends Error {
  constructor (message) {
    super()
    this.message = message
    this.type = INSUFFICIENT_CONTAINER_SIZE_ERROR
  }
}
InsufficientContainerSizeError.type = INSUFFICIENT_CONTAINER_SIZE_ERROR

module.exports = InsufficientContainerSizeError
