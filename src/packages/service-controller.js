const packageName = 'Controller'

export const Controller = (app) => {
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
      'models',
      'express',
      'services.wrap'
    ]
  })

  const list = (Model) => (req, res) => {
    // no params or input objects
    return Promise.all([Model.findAll(), Model.count()])
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
    // validate that body have proper object without ID:
    const validations = app.exModular.services.validator.validatorFromModel(Model)

    // perform create instance:
    return app.exModular.services.validator.applyValidationsToReq(validations, req)
      .then(() => Model.create(req.matchedData))
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

    // console.log('body:')
    // console.log(req.body)
    // console.log('matchedData:')
    // console.log(req.matchedData)
    req.matchedData.id = req.params.id
    const validations = app.exModular.services.validator.validatorFromModel(Model)

    // perform create instance:
    return app.exModular.services.validator.applyValidationsToReq(validations, req)
      .then(() => Model.update(req.matchedData))
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
