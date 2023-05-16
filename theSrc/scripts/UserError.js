class UserError extends Error {
  constructor (message) {
    super()
    this.message = 'UserError: ' + message
    this.name = ''
    this.type = 'USER_ERROR'
  }
}
UserError.type = 'USER_ERROR'

module.exports = UserError
