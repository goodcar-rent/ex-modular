import express from 'express'
import appBuilder from './packages/app-builder'
import serverBuilder from './packages/server-builder'

import env from 'dotenv-safe'

// load .env

env.config()

// build app & server
const app = appBuilder(express, {})

// run server
app
  .then((app) => serverBuilder(app, {}))
  .catch((e) => { throw e })
