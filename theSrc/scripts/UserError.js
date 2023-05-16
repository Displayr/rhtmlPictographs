class UserError extends Error {
  constructor (message) {
    super()
    this.message = message
    this.name = 'UserError'
    this.type = 'USER_ERROR'
  }
}
UserError.type = 'USER_ERROR'

module.exports = UserError
