/* eslint-env mocha */
import { describe, it, before } from 'mocha'
import supertest from 'supertest'
import chai, { expect } from 'chai'
import dirtyChai from 'dirty-chai'
import env from 'dotenv-safe'

import App from '../../src/packages/app-builder'

import {
  loginAs,
  UserAdmin,
  // UserFirst,
  // userList,
  signupUser
  // userDelete,
  // userSave
} from '../client/client-api'

/**

 Simple flow: простой use case:

 Регистрируем первый пользовательский аккаунт
 Он становится административным аккаунтом

 Регистрируем второй и третий аккаунты. Они - обычные пользователи.

 Администратору доступен список пользователей. Простым пользователем - нет.

 Всем доступен собственный профиль.
*/

chai.use(dirtyChai)

// test case:
describe('ex-modular tests', function () {
  env.config()
  process.env.NODE_ENV = 'test' // just to be sure
  let app = null

  const context = {
    request: null,
    apiRoot: '',
    authSchema: 'Bearer',
    adminToken: null,
    userToken: null
  }

  before((done) => {
    App()
      .then((a) => {
        app = a
        context.request = supertest(app)
        done()
      })
      .catch((err) => {
        done(err)
      })
  })

  after((done) => {
    // app.storage.closeStorage()
    //   .then(() => done())
    //   .catch(done)
  })
  /*
    beforeEach(function (done) {
      app.models.clearData()
        .then(() => app.models.UserGroup.createSystemData())
        .then(() => createAdminUser(context))
        .then((res) => {
          expect(res.body).to.exist('res.body should exist')
          expect(res.body.email).to.exist('res.body.email should exist')
          expect(res.body.id).to.exist('res.body.id should exist')
          context.UserAdminId = res.body.id
          return loginAs(context, UserAdmin)
        })
        .then((res) => {
          expect(res.body).to.exist('res.body should exist')
          expect(res.body.token).to.exist('res.body.token should exist')
          context.adminToken = context.token
        })
        .then(() => done())
        .catch((err) => {
          done(err)
        })
    })
  */

  describe('First use-case:', function () {
    it('Register first user account', function (done) {
      signupUser(context, UserAdmin)
        .then((res) => {
          expect(res.body).to.exist('Body should exist')
          expect(res.body).to.be.an('object')
          expect(res.body.email).to.exist()
          expect(res.body.email).to.be.equal(UserAdmin.email)
          return loginAs(context, UserAdmin)
        })
        .then((res) => {
          expect(res.body).to.exist('res.body should exist')
          expect(res.body.token).to.exist('res.body.token should exist')

          context.adminToken = res.body.token
        })
        .then(() => done())
        .catch((err) => {
          done(err)
        })
    })
  })
})

/*
      context.token = context.adminToken
      userList(context)
        .then((res) => {
          expect(res.body).to.exist('Body should exist')
          expect(res.body).to.be.an('array')
          expect(res.body).to.have.lengthOf(1)
        })
        .then(() => done())
        .catch((err) => {
          done(err)
        })
    })
  })

  describe('add method:', function () {
    it('should add users to system', function (done) {
      context.token = context.adminToken
      userCreate(context, UserFirst)
        .then((res) => {
          expect(res.body).to.exist('Body should exist')
          expect(res.body).to.be.an('object')
          expect(res.body.email).to.exist()
          expect(res.body.email).to.be.equal(UserFirst.email)
          return loginAs(context, UserFirst)
        })
        .then((res) => {
          expect(res.body).to.exist('res.body should exist')
          expect(res.body.token).to.exist('res.body.token should exist')
        })
        .then(() => done())
        .catch((err) => {
          done(err)
        })
    })
  })

  describe('delete method:', function () {
    it('should delete users from system', function (done) {
      context.token = context.adminToken
      userCreate(context, UserFirst)
        .then((res) => {
          expect(res.body).to.exist('Body should exist')
          expect(res.body).to.be.an('object')
          expect(res.body.email).to.exist()
          expect(res.body.email).to.be.equal(UserFirst.email)
          expect(res.body.id).to.exist()
          context.UserFirstId = res.body.id
          return userList(context)
        })
        .then((res) => {
          expect(res.body).to.exist('Body should exist')
          expect(res.body).to.be.an('array')
          expect(res.body).to.have.lengthOf(2)
          return userDelete(context, context.UserFirstId)
        })
        .then((res) => {
          expect(res.body).to.exist('Body should exist')
          expect(res.body).to.be.an('object')
          expect(res.body.email).to.exist()
          expect(res.body.email).to.be.equal(UserFirst.email)
          expect(res.body.id).to.exist()
          expect(res.body.id).to.be.equal(context.UserFirstId)
          return userList(context)
        })
        .then((res) => {
          expect(res.body).to.exist('Body should exist')
          expect(res.body).to.be.an('array')
          expect(res.body).to.have.lengthOf(1)
        })
        .then(() => done())
        .catch((err) => {
          done(err)
        })
    })
  })

  describe('update method:', function () {
    it('should update users profiles', function (done) {
      context.token = context.adminToken
      userCreate(context, UserFirst)
        .then((res) => {
          expect(res.body).to.exist('Body should exist')
          expect(res.body).to.be.an('object')
          expect(res.body.email).to.exist()
          expect(res.body.email).to.be.equal(UserFirst.email)
          expect(res.body.id).to.exist()
          context.UserFirstId = res.body.id
          return userList(context)
        })
        .then((res) => {
          expect(res.body).to.exist('Body should exist')
          expect(res.body).to.be.an('array')
          expect(res.body).to.have.lengthOf(2)
          return userSave(context, context.UserFirstId, { email: 'a@b.com' })
        })
        .then((res) => {
          expect(res.body).to.exist('Body should exist')
          expect(res.body).to.be.an('object')
          expect(res.body.email).to.exist()
          expect(res.body.email).to.be.equal('a@b.com')
          expect(res.body.id).to.exist()
          expect(res.body.id).to.be.equal(context.UserFirstId)
        })
        .then(() => done())
        .catch((err) => {
          done(err)
        })
    })
  })
 */
