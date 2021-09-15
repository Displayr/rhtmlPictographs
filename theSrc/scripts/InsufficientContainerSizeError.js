const INSUFFICIENT_CONTAINER_SIZE_ERROR = 'INSUFFICIENT_CONTAINER_SIZE_ERROR'

class InsufficientContainerSizeError extends Error {
  constructor () {
    super()
    this.type = INSUFFICIENT_CONTAINER_SIZE_ERROR
  }
}
InsufficientContainerSizeError.type = INSUFFICIENT_CONTAINER_SIZE_ERROR

module.exports = InsufficientContainerSizeError
