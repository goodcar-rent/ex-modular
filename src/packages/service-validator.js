import { body, param, validationResult, matchedData } from 'express-validator'

const packageName = 'Service.Validator'
export default (app) => {
  app.exModular.modulesAdd({ moduleName: packageName, dependency: ['services.errors', 'services.errors.ServerInvalidParams']})

  const Validator = {
    validatorFromModel: (Model) => {
      const validations = []
      Model.props.map((prop) => {
        if (prop.type === 'text') {
          validations.push(body([prop.name]).isString().withMessage(`${Model.name}.${prop.name} should be string`))
        } else if (prop.type === 'id') {
          validations.push(body([prop.name]).optional().isString().withMessage(`${Model.name}.${prop.name} should be string UUID`))
        }
      })
      return validations
    },
    applyValidationsToReq: (validations, req) => {
      return Promise.all(validations.map((validation) => validation.run(req)))
        .then(() => {
          req.validationErrors = validationResult(req)
          if (!req.validationErrors.isEmpty()) {
            // TODO: add logging error
            throw new app.services.errors.ServerInvalidParams(req.validationErrors.mapped())
          }
          req.matchedData = matchedData(req)
          return req
        })
        .catch((err) => { throw err })
    },
    paramId: (Model) => {
      return param('id').isString().withMessage('Id should be specified in URL')
    }
  }

  return Validator
}
