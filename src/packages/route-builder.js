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
    name: `/${Model.name}.${listRouteName}`,
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
    name: `/${Model.name}.${createRouteName}`,
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
    name: `/${Model.name}.${removeAllRouteName}`,
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
    name: `/${Model.name}.${itemRouteName}`,
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
    name: `/${Model.name}.${saveRouteName}`,
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
    name: `/${Model.name}.${removeRouteName}`,
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
    if (model && model.generateRoutes) {
      app.exModular.routes.Add(model.generateRoutes.map((routeName) => {
        switch (routeName) {
          case listRouteName: return routeList(app, model)
          case createRouteName: return routeCreate(app, model)
          case itemRouteName: return routeItem(app, model)
          case saveRouteName: return routeSave(app, model)
          case removeRouteName: return routeRemove(app, model)
          case removeAllRouteName: return routeRemoveAll(app, model)
        }
        throw new Error(`generateRoute: invalid routeName ${routeName}`)
      }))
    }
  }

  const routesForAllModels = () => {
    const keys = Object.keys(app.exModular.models)
    keys.map((modelName) => {
      const model = app.models[modelName]
      if (model && model.routes) {
        routesForModel(model)
      }
    })
  }

  const generateRoutes = () => {
    const Wrap = app.exModular.services.wrap

    return Promise.resolve()
      .then(() => {
        app.exModular.routes.map((route) => {
          switch (route.method) {
            case 'GET':
              app.get(route.path, Wrap(route.handler))
              break
            case 'POST':
              app.post(route.path, Wrap(route.handler))
              break
            case 'PUT':
              app.put(route.path, Wrap(route.handler))
              break
            case 'DELETE':
              app.delete(route.path, Wrap(route.handler))
              break
            case 'ALL':
              app.all(route.path, Wrap(route.handler))
              break
          }
        })
      })
      .catch((e) => { throw e })
  }

  return {
    forModel: routesForModel,
    forAllModels: routesForAllModels,
    generateRoutes
  }
}
