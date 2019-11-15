const packageName = 'Crud-actions package'

export const actionList = (app, Model) => {
  return {
    method: 'GET',
    name: `/${Model.name}.list`,
    description: `Get list of "${Model.name}"`,
    path: `/${Model.name.toLowerCase()}`,
    handler: app.controller.list(Model),
    type: 'Model',
    object: Model
  }
}

export const actionCreate = (app, Model) => {
  return {
    method: 'POST',
    name: `/${Model.name}.create`,
    description: `Create new "${Model.name}"`,
    path: `/${Model.name.toLowerCase()}`,
    handler: app.controller.create(Model),
    validate: {
      body: app.validator.validatorFromModel(Model)
    },
    type: 'Model',
    object: Model
  }
}

export const actionRemoveAll = (app, Model) => {
  return {
    method: 'DELETE',
    name: `/${Model.name}.removeAll`,
    description: `Delete all "${Model.name}"`,
    path: `/${Model.name.toLowerCase()}`,
    handler: app.controller.removeAll(Model),
    type: 'Model',
    object: Model
  }
}

export const actionItem = (app, Model) => {
  return {
    method: 'GET',
    name: `/${Model.name}.item`,
    description: `Get single "${Model.name}" by id`,
    path: `/${Model.name.toLowerCase()}/:id`,
    handler: app.controller.item(Model),
    validate: {
      params: app.validator.paramId
    },
    type: 'Model',
    object: Model
  }
}

export const actionSave = (app, Model) => {
  return {
    method: 'PUT',
    name: `/${Model.name}.item`,
    description: `Save (update) "${Model.name}"`,
    path: `/${Model.name.toLowerCase()}/:id`,
    handler: app.controller.save(Model),
    validate: {
      params: app.validator.paramId,
      body: app.validator.validatorFromModel(Model)
    },
    type: 'Model',
    object: Model
  }
}

export const actionRemove = (app, Model) => {
  return {
    method: 'DELETE',
    name: `/${Model.name}.item`,
    description: `Delete single "${Model.name}" by id`,
    path: `/${Model.name.toLowerCase()}/:id`,
    handler: app.controller.remove(Model),
    validate: {
      params: app.validator.paramId
    },
    type: 'Model',
    object: Model
  }
}

export const crudRouteBuilder = (app) => {
  if (!app) {
    throw Error(`${packageName}: expect app to be initialized`)
  }

  if (!app.validator) {
    throw Error(`${packageName}: expect app.validator to be mounted`)
  }
  if (!app.validator.validatorFromModel) {
    throw Error(`${packageName}:  expect app.validator.validatorFromModel`)
  }

  if (!app.controller) {
    throw Error(`${packageName}:  expect app.controller to be mounter`)
  }
  if (!app.controller.list || !app.controller.create || !app.controller.save || !app.controller.remove ||
    !app.controller.removeAll || !app.controller.item) {
    throw Error(`${packageName}: expect app.controller to have proper functions on it (list, create, ... etc)!`)
  }

  const actions = (Model) => {
    return [
      actionList(app, Model),
      actionCreate(app, Model),
      actionRemoveAll(app, Model),
      actionItem(app, Model),
      actionSave(app, Model),
      actionRemove(app, Model)
    ]
  }
  return actions
}

export const routeBuilder = (app) => {
  if (!app.errors) {
    throw Error(`${packageName}: expect app.errors to be mounted with proper error classes`)
  }

  if (!app.errors.ServerError || !app.errors.ServerGenericError ||
    !app.errors.ServerInvalidParameters || !app.errors.ServerNotFound) {
    throw Error(`${packageName}: can not find expected error classes at app.errors`)
  }

  if (!app.validator) {
    throw Error(`${packageName}: expect app.validator to be mounter`)
  }
  if (!app.validator.validatorFromModel) {
    throw Error(`${packageName}: expect app.validator.validatorFromModel`)
  }

  if (!app.models) {
    throw Error(`${packageName}: app.models should exist`)
  }

  if (!app.express) {
    throw Error(`${packageName}: app.express should exist and provide Express instance`)
  }

  if (!app.wrap) {
    throw Error(`${packageName}: app.wrap should exist`)
  }

  const routerForModel = (model) => {
    if (model && model.actions) {
      model.actions.map((action) => {
        switch (action.method) {
          case 'GET':
            app.get(action.path, app.wrap(action.handler))
            break
          case 'POST':
            app.post(action.path, app.wrap(action.handler))
            break
          case 'PUT':
            app.put(action.path, app.wrap(action.handler))
            break
          case 'DELETE':
            app.delete(action.path, app.wrap(action.handler))
            break
          case 'ALL':
            app.all(action.path, app.wrap(action.handler))
            break
        }
      })
    }
  }

  const routerForAllModels = () => {
    // if (!router) {
    //   router = app.express.Router()
    // }

    const keys = Object.keys(app.models)
    keys.map((modelName) => {
      const model = app.models[modelName]
      if (model && model.actions) {
        routerForModel(model)
      }
    })
  }

  return {
    routerForModel,
    routerForAllModels
  }
}
