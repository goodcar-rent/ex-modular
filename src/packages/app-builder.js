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
    })
    .then(()=> app)
    .catch((err) => { throw err })
}

module.exports = appBuilder
