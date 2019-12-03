const packageName = 'route-builder package'

export const listRouteName = 'list'
export const createRouteName = 'create'
export const removeAllRouteName = 'removeAll'
export const itemRouteName = 'item'
export const saveRouteName = 'save'
export const removeRouteName = 'remove'

export const crudRoutes = [
  listRouteName,
  createRouteName,
  removeAllRouteName,
  itemRouteName,
  saveRouteName,
  removeRouteName
]

export const routeList = (app, Model) => {
  return {
    method: 'GET',
    name: `/${Model.name}.list`,
    description: `Get list of "${Model.name}"`,
    path: `/${Model.name.toLowerCase()}`,
    handler: app.exModular.services.controller.list(Model),
    type: 'Model',
    object: Model
  }
}

export const routeCreate = (app, Model) => {
  return {
    method: 'POST',
    name: `/${Model.name}.create`,
    description: `Create new "${Model.name}"`,
    path: `/${Model.name.toLowerCase()}`,
    handler: app.exModular.services.controller.create(Model),
    validate: {
      body: app.exModular.services.validator.validatorFromModel(Model)
    },
    type: 'Model',
    object: Model
  }
}

export const routeRemoveAll = (app, Model) => {
  return {
    method: 'DELETE',
    name: `/${Model.name}.removeAll`,
    description: `Delete all items from "${Model.name}"`,
    path: `/${Model.name.toLowerCase()}`,
    handler: app.exModular.services.controller.removeAll(Model),
    type: 'Model',
    object: Model
  }
}

export const routeItem = (app, Model) => {
  return {
    method: 'GET',
    name: `/${Model.name}.item`,
    description: `Get single item of "${Model.name}" by id`,
    path: `/${Model.name.toLowerCase()}/:id`,
    handler: app.exModular.services.controller.item(Model),
    validate: {
      params: app.exModular.services.validator.paramId
    },
    type: 'Model',
    object: Model
  }
}

export const routeSave = (app, Model) => {
  return {
    method: 'PUT',
    name: `/${Model.name}.item`,
    description: `Save (update) single item in "${Model.name}"`,
    path: `/${Model.name.toLowerCase()}/:id`,
    handler: app.exModular.services.controller.save(Model),
    validate: {
      params: app.exModular.services.validator.paramId,
      body: app.exModular.services.validator.validatorFromModel(Model)
    },
    type: 'Model',
    object: Model
  }
}

export const routeRemove = (app, Model) => {
  return {
    method: 'DELETE',
    name: `/${Model.name}.item`,
    description: `Delete single item in "${Model.name}" by id`,
    path: `/${Model.name.toLowerCase()}/:id`,
    handler: app.exModular.services.controller.remove(Model),
    validate: {
      params: app.exModular.services.validator.paramId
    },
    type: 'Model',
    object: Model
  }
}

export const generateRoute = (app, Model, routeName) => {
  switch (routeName) {
    case listRouteName: return routeList(app, Model)
    case createRouteName: return routeCreate(app, Model)
    case itemRouteName: return routeItem(app, Model)
    case saveRouteName: return routeSave(app, Model)
    case removeRouteName: return routeRemove(app, Model)
    case removeAllRouteName: return routeRemoveAll(app, Model)
  }
  throw new Error(`generateRoute: invalid routeName ${routeName}`)
}

export const generateRoutesForModel = (app, Model) => {
  if (!app || !Model || !Model.generateRoutes) {
    return []
  }
  return Model.generateRoutes.map((routeName) => {
    return generateRoute(app, Model, routeName)
  })
}

export const RouteBuilder = (app) => {
  app.exModular.modulesAdd({
    moduleName: packageName,
    dependency: [
      'services.errors',
      'services.errors.ServerError',
      'services.errors.ServerGenericError',
      'services.errors.ServerInvalidParameters',
      'services.errors.ServerNotFound',
      'services.validator',
      'services.validator.validatorFromModel',
      'services.validator.paramId',
      'services.controller',
      'services.controller.list',
      'services.controller.create',
      'services.controller.save',
      'services.controller.item',
      'services.controller.remove',
      'services.controller.removeAll',
      'models',
      'express',
      'services.wrap'
    ]
  })

  const routesForModel = (model) => {
    if (model && model.routes) {
      model.routes.map((route) => {
        switch (route.method) {
          case 'GET':
            app.get(route.path, app.wrap(route.handler))
            break
          case 'POST':
            app.post(route.path, app.wrap(route.handler))
            break
          case 'PUT':
            app.put(route.path, app.wrap(route.handler))
            break
          case 'DELETE':
            app.delete(route.path, app.wrap(route.handler))
            break
          case 'ALL':
            app.all(route.path, app.wrap(route.handler))
            break
        }
      })
    }
  }

  const routesForAllModels = () => {
    // if (!router) {
    //   router = app.express.Router()
    // }

    const keys = Object.keys(app.exModular.models)
    keys.map((modelName) => {
      const model = app.models[modelName]
      if (model && model.actions) {
        routesForModel(model)
      }
    })
  }

  return {
    routesForModel,
    routesForAllModels
  }
}
