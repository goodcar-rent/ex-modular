export const Errors = (app) => {
  const errors = {}

  errors.ServerError = class ServerError extends Error {
  }

  errors.ServerInvalidParameters = class ServerInvalidParameters extends errors.ServerError {
    constructor (paramName, paramType, message) {
      super(message)
      this.paramName = paramName
      this.paramType = paramType
    }
  }

  errors.ServerInvalidParams = class ServerInvalidParams extends errors.ServerError {
    constructor (errors) {
      super('Validation of params failed')
      this.errors = errors
    }
  }

  errors.ServerInvalidUsernamePassword = class ServerInvalidUsernamePassword extends errors.ServerError {}
  errors.ServerNotAllowed = class ServerNotAllowed extends errors.ServerError {}

  errors.ServerGenericError = class ServerGenericError extends errors.ServerError {
    constructor (error) {
      super(error.message)
      this.error = error
    }
  }

  errors.ServerNotFound = class ServerNotFound extends errors.ServerError {
    constructor (resource, id, message) {
      super(message)
      this.resource = resource
      this.id = id
    }
  }

  return errors
}
