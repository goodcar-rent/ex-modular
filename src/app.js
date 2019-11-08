import express from 'express'
import appBuilder from './packages/app-builder'

const app = appBuilder(express, {})

app()
  .then(() => {})
  .catch((e) => { throw e })
