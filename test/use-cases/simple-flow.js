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
        console.log('app initialized')
        done()
      })
      .catch((err) => {
        done(err)
      })
  })

  after((done) => {
    app.exModular.storagesClose()
      .then(() => done())
      .catch(done)
  })

  describe('First use-case:', function () {
    it('Register first user account', function () {
      console.log('1')
      return signupUser(context, UserAdmin)
        .then((res) => {
          console.log('2')
          expect(res.body).to.exist('Body should exist')
          expect(res.body).to.be.an('object')
          expect(res.body.email).to.exist()
          expect(res.body.email).to.be.equal(UserAdmin.email)
          return loginAs(context, UserAdmin)
        })
        .then((res) => {
          console.log('3')
          expect(res.body).to.exist('res.body should exist')
          expect(res.body.token).to.exist('res.body.token should exist')

          context.adminToken = res.body.token
        })
    })
  })
})
