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

  const registerLoggedUser = (user) => {
    if (app.exModular.models.UserGroup) {
      return app.exModular.models.UserGroup.addUser(app.exModular.auth.systemGroups.loggedIn, user.Id)

    }
  }

  return {
    registerLoggedUser
  }
}
