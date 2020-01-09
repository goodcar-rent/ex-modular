import _ from 'lodash'

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
  const processFilter = (Model, filter) => {
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
      // console.log(`Processing key ${key}`)
      let propName = key
      let op = ''
      if (_.endsWith(key, '_gt')) {
        propName = key.substring(0, key.length - 3)
        op = '>'
      } else if (_.endsWith(key, '_gte')) {
        propName = key.substring(0, key.length - 4)
        op = '>='
      } else if (_.endsWith(key,'_lt')) {
        propName = key.substring(0, key.length - 3)
        op = '<'
      } else if (_.endsWith(key, '_lte')) {
        propName = key.substring(0, key.length - 4)
        op = '<='
      }
      const val = f[key]
      // console.log(`propName=${propName}, op=${op}, val=${val}`)
      // console.log('item')
      // console.log(item)

      // find prop name:
      const prop = _.find(Model.props, { name: propName })
      if (!prop) {
        throw app.exModular.services.errors.ServerInvalidParameters(`filter.${propName}`, 'object',
          `Request's filter param "${propName}" not found in model "${Model.name}"`)
      }
      if (!ret.where) {
        ret.where = {}
      }
      if (!ret.whereIn) {
        ret.whereIn = []
      }
      if (!ret.whereOp) {
        ret.whereOp = []
      }

      if (Array.isArray(val)) {
        if (op !== '') {
          throw app.exModular.services.errors.ServerInvalidParameters('filter', 'object',
            'Request\'s filter property have invalid syntax - operation combined with array of values')
        }
        // console.log('is array')
        if (val.length === 1) {
          // console.log('len === 1')
          ret.where[key] = f[key][0]
        } else {
          ret.whereIn.push({ column: key, ids: val })
        }
      } else if (op !== '') {
        // add operations:
        ret.whereOp.push({ column: propName, op, value: val })
      } else {
        // simple propName, add like op for text, exact match for other fields:
        if (prop.type === 'text') {
          ret.whereOp.push({ column: propName, op: 'like', value: `%${val}%` })
        } else {
          ret.where[propName] = val
        }
      }
    })
    // console.log('ret')
    // console.log(ret)
    return ret
  }

  const list = (Model) => (req, res) => {
    // process list params: filter, etc
    const opt = processFilter(Model, req.query.filter)

    // console.log('opt:')
    // console.log(opt)

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
        // console.log(foundData)
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
