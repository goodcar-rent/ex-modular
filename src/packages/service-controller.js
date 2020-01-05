const packageName = 'Controller'

export const Controller = (app) => {
  app.exModular.modules.Add({
    moduleName: packageName,
    dependency: [
      'services.errors',
      'services.errors.ServerError',
      'services.errors.ServerGenericError',
      'services.errors.ServerInvalidParameters',
      'services.errors.ServerNotFound',
      'models',
      'express',
      'services.wrap'
    ]
  })

  const processFilter = (filter) => {
    // console.log('processFilter')
    let f = {}
    const ret = {}
    if (!filter) {
      return ret
    }
    try {
      f = JSON.parse(filter)
      // console.log('parsed:')
      // console.log(f)
    } catch (e) {
      throw app.exModular.services.errors.ServerInvalidParameters('filter', 'object',
        'Request\'s filter property is invalid JSON object')
    }

    const keys = Object.keys(f)
    // console.log('keys')
    // console.log(keys)
    keys.map((key) => {
      const item = f[key]
      // console.log('item')
      // console.log(item)
      if (Array.isArray(item)) {
        // console.log('is array')
        if (item.length === 1) {
          // console.log('len === 1')
          if (!ret.where) {
            ret.where = {}
          }
          ret.where[key] = f[key][0]
        } else {
          if (!ret.whereIn) {
            ret.whereIn = []
          }
          ret.whereIn.push({ column: key, ids: item })
        }
      }
    })
    // console.log('ret')
    // console.log(ret)
    return ret
  }

  const list = (Model) => (req, res) => {
    // process list params: filter, etc
    const opt = processFilter(req.query.filter)

    // no params or input objects
    return Promise.all([Model.findAll(opt), Model.count()])
      .then((data) => {
        const foundData = data[0]
        const count = data[1]
        // if (!foundData) {
        //   console.log('Data not found')
        //   console.log(foundData)
        // }
        // if (!count) {
        //   console.log('Count failed:')
        //   console.log(count)
        // }
        // console.log('res:')
        // console.log(res)
        res.set('Content-Range', `${Model.name} 0-${count}/${count}`)
        res.status(200).json(foundData)
        return foundData
      })
      .catch((error) => {
        if (error instanceof app.exModular.services.errors.ServerError) {
          throw error
        } else {
          console.log(error)
          throw new app.exModular.services.errors.ServerGenericError(error)
        }
      })
  }

  const create = (Model) => (req, res) => {
    if (!req.data) {
      throw new app.exModular.services.errors.ServerInvalidParameters(
        'req.data', '', 'save: no req.data')
    }

    // perform create instance:
    return Model.create(req.data)
      .then((item) => {
        res.status(201).json(item)
        return item
      })
      .catch((error) => {
        if (error instanceof app.exModular.services.errors.ServerError) {
          throw error
        } else {
          throw new app.exModular.services.errors.ServerGenericError(error)
        }
      })
  }

  const item = (Model) => (req, res) => {
    // validate that req have id param
    if (!req.params.id) {
      throw new app.exModular.services.errors.ServerInvalidParameters(
        'req.params.id',
        '',
        'item: no req.params.id')
    }

    return Model.findById(req.params.id)
      .then((foundData) => {
        if (!foundData) {
          throw app.exModular.services.errors.ServerNotFound(Model.name, req.params.id, `${Model.name} with id ${req.params.id} not found`)
        }
        res.status(200).json(foundData)
        return foundData
      })
      .catch((error) => {
        if (error instanceof app.exModular.services.errors.ServerError) {
          throw error
        } else {
          throw new app.exModular.services.errors.ServerGenericError(error)
        }
      })
  }

  const save = (Model) => (req, res) => {
    // validate that body have properly shaped object:
    if (!req.data) {
      throw new app.exModular.services.errors.ServerInvalidParameters(
        'req.data',
        '',
        'save: no req.data')
    }
    // validate that req have id param
    if (!req.params.id) {
      throw new app.exModular.services.errors.ServerInvalidParameters(
        'req.params.id',
        '',
        'save: no req.params.id')
    }

    req.data.id = req.params.id

    // perform create instance:
    return Model.update(req.data)
      .then((foundData) => {
        res.status(200).json(foundData)
        return foundData
      })
      .catch((error) => {
        if (error instanceof app.exModular.services.errors.ServerError) {
          throw error
        } else {
          throw new app.exModular.services.errors.ServerGenericError(error)
        }
      })
  }

  const remove = (Model) => (req, res) => {
    // check for id:
    // validate that req have id param
    if (!req.params.id) {
      throw new app.exModular.services.errors.ServerInvalidParameters(
        'req.params.id',
        '',
        'remove: no req.params.id')
    }

    return Model.removeById(req.params.id)
      .then((foundData) => {
        if (foundData) {
          res.status(200).json(foundData)
          return foundData
        }
        throw new app.exModular.services.errors.ServerNotFound(Model.name, req.params.id, `${Model.name} with id ${req.params.id} not found`)
      })
  }

  const removeAll = (Model) => (req, res) => {
    // console.log('generic-controller.genericDeleteAll:')
    // console.log('query.filter')
    // console.log(req.query.filter)
    // console.log(req.query.filter.ids)

    req.qs = JSON.parse(req.query.filter)
    // console.log(req.qs)
    if (!(req.qs && req.qs.ids)) {
      throw new app.exModular.services.errors.ServerInvalidParameters(
        'filter', 'query parameter',
        'filter query parameter should exists and have ids property')
    }
    return Model.removeAll({ whereIn: { column: Model.key, ids: req.qs.ids } })
      .then((foundData) => {
        if (foundData) {
          res.status(200).json(foundData)
          return foundData
        }
        throw new app.exModular.services.errors.ServerError('Not found - ids')
      })
      .catch((error) => {
        if (error instanceof app.exModular.services.errors.ServerError) {
          throw error
        } else {
          throw new app.exModular.services.errors.ServerGenericError(error)
        }
      })
  }
  return {
    create,
    list,
    item,
    save,
    remove,
    removeAll
  }
}
