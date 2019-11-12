import logger from 'morgan'
import path from 'path'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import Express from 'express'
import _ from 'lodash'

import sqliteStorage from './storage-knex-sqlite'

const exModular = (app) => {
  const ex = {}
  ex.modules = []
  ex.storages = []

  const addStorage = (storage) => {
    ex.storages.push(storage)
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

  ex.addStorage = addStorage
  ex.checkDeps = checkDeps

  return ex
}

export const appBuilder = (express, options) => {
  if (!express) {
    express = Express
  }

  // build express app
  const app = express()

  // enhance with exModular object
  app.exModular = exModular(app)

  // make default config
  options = options || {}
  options.viewEngine = options.viewEngine || 'pug'
  options.viewPath = options.viewPath || path.join(__dirname, 'views')
  options.staticPath = options.staticPath || path.join(__dirname, 'public')
  options.logger = options.logger || logger
  options.loggerOptions = options.loggerOptions || 'dev'
  options.urlencodedOptions = options.urlencodedOptions || { extended: false }
  options.cors = options.cors || cors
  options.corsOptions = options.corsOptions || {
    origin: '*',
    allowedHeaders: 'Content-Type,Authorization,Content-Range,Accept,Accept-Encoding,Accept-Language',
    exposedHeaders: 'Content-Type,Authorization,Content-Range,Accept,Accept-Encoding,Accept-Language'
  }

  // return promise that builds app:
  return Promise.resolve()
    .then(() => {
      app.exModular.express = express

      // configure view engine / static engine:
      app.set('views', options.viewPath)
      app.set('view engine', options.viewEngine)
      app.use(express.static(options.staticPath))

      // setup middlewares:
      app.use(options.logger(options.loggerOptions))
      app.use(express.json())
      app.use(express.urlencoded(options.urlencodedOptions))
      app.use(cookieParser())

      // init cors:
      app.use(options.cors(options.corsOptions))

      // init services
      // app.errors = Errors(app)
      // app.wrap = Wrap(app)
      // app.mail = Mail(app)

      // // init storage:
      app.exModular.addStorage(sqliteStorage(app))
      // app.exModular.services.validator = Validator(app)
      // app.controller = Controller(app)
      // app.controller.CrudActions = CrudActions(app)
      //
      // check dependings among installed modules (plugins):
      app.exModular.checkDeps()
      //
      // // init models:
      // app.models = {}
      // app.models.User = User(app)
      //
      // app.routeBuilder = RouteBuilder(app)
      // app.routeBuilder.routerForAllModels()
      //
      // // init routes:
      // app.use('/', indexRouter)
      //
      // // catch 404 and forward to error handler
      // app.use(function (req, res, next) {
      //   next(createError(404))
      // })
      //
      // // error handler
      // app.use(function (err, req, res, next) {
      //   // set locals, only providing error in development
      //   res.locals.message = err.message
      //   res.locals.error = req.app.get('env') === 'development' ? err : {}
      //
      //   // render the error page
      //   res.status(err.status || 500)
      //   res.render('error')
      // })
    })
    .then(() => app)
    .catch((err) => { throw err })
}

module.exports = appBuilder
