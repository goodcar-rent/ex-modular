import express from 'express'
import appBuilder from './packages/app-builder'
import serverBuilder from './packages/server-builder'

import env from 'dotenv-safe'

// load .env

env.config()

// build app & server
appBuilder(express, {})
  .then((app) => serverBuilder(app, {}))
  .catch((e) => { throw e })
