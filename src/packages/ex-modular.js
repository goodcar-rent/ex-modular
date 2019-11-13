import _ from 'lodash'

export const exModular = (app) => {
  const ex = {}
  ex.modules = []
  ex.storages = []
  ex.models = []
  ex.schemas = []
  ex.services = {}

  const storagesAdd = (storage) => {
    // check storage signature
    ex.storages.push(storage)
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
        throw new Error(`Module shoud have .moduleName in ${item.toString()}`)
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

  ex.storagesAdd = storagesAdd
  ex.checkDeps = checkDeps
  ex.storagesInit = storagesInit

  return ex
}
