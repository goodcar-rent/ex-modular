import _ from 'lodash'

export const exModular = (app) => {
  const ex = {}
  ex.modules = []
  ex.storages = []
  ex.models = []
  ex.schemas = []
  ex.services = {}
  ex.storages.default = null

  const modulesAdd = (module) => {
    // check storage signature
    ex.modules.push(module)
  }

  const storagesAdd = (storage) => {
    // check storage signature
    ex.storages.push(storage)
    if (ex.storages.length === 1) {
      ex.storages.default = storage
    }
  }

  const storagesInit = () => {
    if (!ex.storages || ex.storages.length < 1) {
      throw new Error('.storages should be initialized')
    }
    return Promise.all(ex.storages.map((storage) => storage.storageInit()))
  }

  const checkDeps = () => {
    ex.modules.map((item) => {
      if (!item.dependency) {
        throw new Error(`invalid module deps format: no .dependency property for ${item.toString()}`)
      }

      if (!item.moduleName) {
        throw new Error(`Module should have .moduleName in ${item.toString()}`)
      }

      if (!Array.isArray(item.dependency)) {
        item.dependency = [item.dependency]
      }

      item.dependency.map((dep) => {
        if (!_.has(ex, dep)) {
          throw new Error(`Module deps check error: ${item.moduleName} dep "${dep}" not found`)
        }
      })
    })
  }

  // init models
  const modelsInit = () => {
    if (!ex.storages || !ex.models) {
      throw new Error('.storages should be initialized before initializing model')
    }
    return Promise.all(ex.models.map((model) => {
      if (model.storage === 'default') {
        model.storage = ex.storages.default
      }
      // model.
      model.storageInit()
    }))
  }
  const modelAdd = (model) => {
    if (!model.storage) {
      model.storage = 'default'
    }
    ex.models[model.name] = model
  }

  ex.modulesAdd = modulesAdd
  ex.storagesAdd = storagesAdd
  ex.checkDeps = checkDeps
  ex.storagesInit = storagesInit
  ex.modelAdd = modelAdd
  ex.modelsInit = modelsInit

  return ex
}
