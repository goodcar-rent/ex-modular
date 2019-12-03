const packageName = 'Signup-open'

export const SignupOpen = (app) => {
  app.exModular.modulesAdd({
    moduleName: packageName,
    dependency: [
      'services.errors',
      'services.errors.ServerError',
      'services.errors.ServerInvalidUsernamePassword',
      'services.errors.ServerNotAllowed',
      'services.errors.ServerGenericError',
      'services.validator',
      'services.validator.validatorFromModel',
      'services.validator.paramId',
      'models',
      'models.User',
      'models.User.isPassword',
      'models.Session',
      'auth.getTokenFromSession'
    ]
  })

  const signup = (req, res) => {
    const Errors = app.exModular.services.errors
    const User = app.exModular.models.User
    const Session = app.exModular.models.Session

    if (!req.data) {
      throw new Errors.ServerGenericError(
        `${packageName}.signup: Invalid request handling: req.data not initialized, use middleware to parse body`)
    }

    return User.create(req.data)
      .then((user) => {
        if (!user) {
          return Promise.reject(new Errors.ServerInvalidUsernamePassword('Invalid username or password'))
        }

        if (user.disabled) {
          return Promise.reject(new Errors.ServerNotAllowed('User is disabled'))
        }

        // if (!user.emailVerified) {
        //  throw new ServerNotAllowed('Email should be verified')
        // }

        if (!User.isPassword(user.password, req.body.password)) {
          throw new Errors.ServerInvalidUsernamePassword('Invalid username or password') // password error
        }

        return Session.createOrUpdate({ userId: user.id, ip: req.ip })
      })
      .then((session) => {
        res.json({ token: app.exModular.auth.getTokenFromSession(session.id) })

        if (app.exModular.models.UserGroup) {
          return app.exModular.models.UserGroup.addUser(app.exModular.models.UserGroup.systemGroupLoggedIn(), session.userId)
        }
      })
      .catch((error) => {
        // console.log('login: error')
        // console.log(error)
        if (error instanceof Errors.ServerError) {
          throw error
        } else {
          throw new Errors.ServerGenericError(error)
        }
      })
  }

  const routes = [
    {
      method: 'POST',
      name: 'Auth.Signup',
      description: 'Open signup via username/password',
      path: '/auth/signup',
      handler: signup,
      /* TODO: validatorFromSchema
      validate: {
        body: app.validator.validatorFromModel(Model)
      }, */
      type: 'Auth',
      object: 'Signup'
    }
  ]

  app.meta.actions = app.meta.actions.concat(actions)
  return app
}
