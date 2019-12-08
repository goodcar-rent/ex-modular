const packageName = 'Signup-open'

export const SignupOpen = (app) => {
  app.exModular.modulesAdd({
    moduleName: packageName,
    dependency: [
      'services.errors',
      'services.errors.ServerError',
      'services.errors.ServerGenericError',
      'services.validator',
      'services.validator.validatorFromModel',
      'services.validator.paramId',
      'models',
      'models.User',
      'models.User.create',
      'models.User.count',
      'access.addAdmin'
    ]
  })

  const signup = (req, res) => {
    const Errors = app.exModular.services.errors
    const User = app.exModular.models.User

    if (!req.data) {
      throw new Errors.ServerGenericError(
        `${packageName}.signup: Invalid request handling: req.data not initialized, use middleware to parse body`)
    }

    /*

    Generic signup code for "open" policy:
    * everybody can signup
    * first user will be admin automatically

    */
    let addUserAsAdmin = false
    let user = null

    return User.count()
      .then((userCount) => {
        if (userCount === 0) {
          addUserAsAdmin = true
        }
        return User.create(req.data)
      })
      .then((aUser) => {
        user = aUser
        if (addUserAsAdmin) {
          return app.exModular.access.addAdmin(user)
        }
      })
      .then(() => {
        res.json(user)
      })
      .catch((error) => {
        if (error instanceof Errors.ServerError) {
          throw error
        } else {
          throw new Errors.ServerGenericError(error)
        }
      })
  }

  // define routes for this module
  app.exModular.routesAdd([
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
      /*
      beforeHandler: [ app.exModular.auth.optional ],
      */
      type: 'Auth',
      object: 'Signup'
    }
  ])

  return app
}
