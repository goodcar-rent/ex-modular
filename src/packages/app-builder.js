import logger from 'morgan'
import path from 'path'
import cookieParser from 'cookie-parser'
import cors from 'cors'

export const appBuilder = (express, options) => {
  const app = express()

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
      app.express = express

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
      //
      // // init storage:
      // app.storage = knexStorage(app)
      // app.validator = Validator(app)
      // app.controller = Controller(app)
      // app.controller.CrudActions = CrudActions(app)
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
