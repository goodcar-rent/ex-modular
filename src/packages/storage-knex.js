import _ from 'lodash'
import fs from 'fs'
import moment from 'moment'

export const processBeforeSaveToStorage = (Model) => (item) => {
  // console.log(`processBeforeSaveToStorage(${Model.name}, ${JSON.stringify(item)})\n`)
  const aItem = _.merge({}, item)

  // check if all keys are defined in model
  const aKeys = Object.keys(aItem)
  aKeys.map((key) => {
    // copy property to proxy object
    const prop = _.find(Model.props, { name: key })
    if (!prop) {
      throw new Error(`${Model.name}.processBeforeSaveToStorage: property "${key}" is not defined in model`)
    }
  })

  // process all default props if they are not defined in item:
  Model.props.map((prop) => {
    if ((prop.default || prop.default !== undefined || true) &&
      (!item[prop.name] || item[prop.name] === null || item[prop.name] === undefined)) {
      if (typeof prop.default === 'function') {
        aItem[prop.name] = prop.default(aItem)
      } else {
        aItem[prop.name] = prop.default
      }
    }
    if (prop.beforeSave && item[prop.name] && (typeof prop.beforeSave === 'function')) {
      // console.log(prop.beforeSave.toString())
      // console.log(aItem)
      aItem[prop.name] = prop.beforeSave(aItem)
    }
    if (prop.type === 'boolean') {
      aItem[prop.name] = item[prop.name] ? 1 : 0
    }
    if (prop.type === 'id') {
      Model.key = prop.name
    }
    if (item[prop.name] && prop.type === 'datetime') {
      aItem[prop.name] = moment(item[prop.name]).toDate()
    }

    // replace refs array with string representation
    if (prop.type === 'refs') {
      if (!item[prop.name] || item[prop.name] === [] || item[prop.name] === '') {
        aItem[prop.name] = null
      } else if (Array.isArray(item[prop.name])) {
        aItem[prop.name] = item[prop.name].join(',')
      }
    }
  })
  // console.log(`processBeforeSaveToStorage result:\n${JSON.stringify(aItem)}`)
  return aItem
}

// transform some item using rules from Model:l
export const processAfterLoadFromStorage = (Model) => (item) => {
  // console.log(`\nprocessGetProps(${Model.name}, ${JSON.stringify(item)}\n`)
  // if item is not defined, return null
  if (!item) {
    return item
  }

  const aItem = _.merge({}, item)

  const aKeys = Object.keys(aItem)
  aKeys.map((key) => {
    const prop = _.find(Model.props, { name: key })
    if (!prop) {
      throw new Error(`${Model.name}.processAfterLoadFromStorage: Model "${Model.name}" does not have definition for property "${key}"`)
    }
    aItem[key] = item[key]

    if ((prop.default || prop.default !== undefined || prop.default !== null) &&
      (!item[prop.name] || item[prop.name] === null || item[prop.name] === undefined)) {
      if (typeof prop.default === 'function') {
        aItem[prop.name] = prop.default(aItem)
      } else {
        aItem[prop.name] = prop.default
      }
    }
    if (prop.afterLoad && (typeof prop.afterLoad === 'function')) {
      aItem[prop.name] = prop.afterLoad(aItem)
    }

    if (item[key] && prop.type === 'boolean') {
      aItem[key] = (!!item[key])
    }
    if (prop.type === 'refs') {
      // console.log('refs prop')
      if (!item[key]) {
        aItem[key] = []
      } else if (item[key].length > 0) {
        aItem[key] = item[key].split(',')
        if (!Array.isArray(aItem[key])) {
          aItem[key] = [aItem[key]]
        }
      } else {
        aItem[key] = []
      }
    }
    if (item[key] && prop.type === 'datetime') {
      aItem[key] = moment(item[key]).toDate()
    }
  })
  // console.log(`processAfterLoadFromStorage result:\n${JSON.stringify(aItem)}`)
  return aItem
}

const withWhereIn = (queryBuilder, opt) => {
  if (opt && opt.whereIn && opt.whereIn.column && opt.whereIn.ids) {
    queryBuilder.whereIn(opt.whereIn.column, opt.whereIn.ids)
  }
}

export default (app) => {
  const aStorage = {
    db: {},
    props: {},
    name: 'KNEX-Generic',

    processBeforeSaveToStorage: processBeforeSaveToStorage,
    processAfterLoadFromStorage: processAfterLoadFromStorage,

    mapPropToKnexTable: (prop, table) => {
      return table.string(prop.name)
    },

    storageInit: () => {
      return Promise.resolve()
    },

    storageClose: () => {
      return Promise.resolve()
    },

    storageSchemaInit: (Model) => (id) => {
      // console.log(`${Model.name}.init`)
      if (!Model || !Model.app || !Model.app.storage || !Model.app.storage.db) {
        return Promise.reject(new Error(`${Model.name}.storageSchemaInit: some Model's properties are invalid:
          Model ${Model},
          .app ${Model.app}
          .storage${Model.app.storage}
          .db ${Model.app.storage.db}`))
      }
      const knex = app.storage.db

      return knex.schema.hasTable(Model.name)
        .then((exists) => {
          if (exists && process.env.START_FRESH) {
            return knex.schema.dropTable(Model.name)
              .then(() => Promise.resolve(false))
          }

          return Promise.resolve(exists)
        })
        .then((exists) => {
          Model.props.map((prop) => {
            if (prop.type === 'id') {
              Model.key = prop.name
            }
          })
          if (!exists) {
            return knex.schema.createTable(Model.name, (table) => {
              Model.props.map((prop) => {
                aStorage.mapPropToKnexTable(prop, table)
              })
            })
          }
        })
    },

    storageSchemaClear: (Model) => () => {
      if (!Model || !Model.app || !Model.app.storage || !Model.app.storage.db) {
        return Promise.reject(new Error(`${Model.name}.storageSchemaClear: some Model's properties are invalid:
          Model ${Model},
          .app ${Model.app}
          .storage${Model.app.storage}
          .db ${Model.app.storage.db}`))
      }
      const knex = app.storage.db

      return knex.schema.hasTable(Model.name)
        .then((exists) => {
          if (exists) {
            return knex.schema.dropTable(Model.name)
          }
          return Promise.resolve(false)
        })
    },

    storageDataInit: (Model) => (seedFileName) => {
      if (!Model || !Model.app || !Model.app.storage || !Model.app.storage.db) {
        return Promise.reject(new Error(`${Model.name}.storageDataInit: some Model's properties are invalid:
          Model ${Model},
          .app ${Model.app}
          .storage ${Model.app.storage}
          .db ${Model.app.storage.db}`))
      }
      const knex = app.storage.db
      const seedData = JSON.parse(fs.readFileSync(seedFileName))

      const tasks = seedData.map((item) => knex(Model.name).insert(item))
      return Promise.all(tasks)
        .catch((err) => { throw err })
    },

    storageDataClear: (Model) => () => {
      if (!Model || !Model.app || !Model.app.storage || !Model.app.storage.db) {
        return Promise.reject(new Error(`${Model.name}.storageDataClear: some Model's properties are invalid:
          Model ${Model},
          .app ${Model.app}
          .storage ${Model.app.storage}
          .db ${Model.app.storage.db}`))
      }
      const knex = app.storage.db
      return knex(Model.name).del()
        .catch((err) => { throw err })
    },

    storageRefsInit: (Model) => () => {},
    storageRefsClear: (Model) => () => {},

    findById: (Model) => (id) => {
      if (!Model || !Model.app || !Model.app.storage || !Model.app.storage.db) {
        return Promise.reject(new Error(`${Model.name}.findById: some Model's properties are invalid:
          Model ${Model},
          .app ${Model.app}
          .storage ${Model.app.storage}
          .db ${Model.app.storage.db}`))
      }
      const knex = app.storage.db

      return knex.select()
        .from(Model.name)
        .where(Model.key, id)
        .then((res) => Model.processAfterLoadFromStorage(res[0]))
        .catch((err) => { throw err })
    },

    findOne: (Model) => (opt) => {
      if (!Model || !Model.app || !Model.app.storage || !Model.app.storage.db) {
        return Promise.reject(new Error(`${Model.name}.findOne: some Model's properties are invalid:
          Model ${Model},
          .app ${Model.app}
          .storage ${Model.app.storage}
          .db ${Model.app.storage.db}`))
      }
      const knex = app.storage.db

      return knex.select()
        .from(Model.name)
        .where(opt ? opt.where : {})
        .limit(1)
        .then((res) => Model.processAfterLoadFromStorage(res[0]))
        .catch((err) => { throw err })
    },

    findAll: (Model) => (opt) => {
      // console.log('storage.findAll:')
      // console.log(opt)
      if (!Model || !Model.app || !Model.app.storage || !Model.app.storage.db) {
        return Promise.reject(new Error(`${Model.name}.findAll: some Model's properties are invalid:
          Model ${Model},
          .app ${Model.app}
          .storage ${Model.app.storage}
          .db ${Model.app.storage.db}`))
      }
      const knex = app.storage.db

      return knex.select()
        .from(Model.name)
        .where((opt && opt.where) ? opt.where : {})
        .modify(withWhereIn, opt)
        .then((res) => res.map((item) => Model.processAfterLoadFromStorage(item)))
        .then((res) => {
          // console.log('res:')
          // console.log(res)
          return Promise.resolve(res)
        })
        .catch((err) => {
          // console.log('error:')
          // console.log(err)
          throw err
        })
    },

    count: (Model) => () => {
      // console.log('storage.count')
      if (!Model || !Model.app || !Model.app.storage || !Model.app.storage.db) {
        return Promise.reject(new Error(`${Model.name}.count: some Model's properties are invalid:
          Model ${Model},
          .app ${Model.app}
          .storage ${Model.app.storage}
          .db ${Model.app.storage.db}`))
      }
      const knex = app.storage.db
      return knex(Model.name)
        .count()
        .then((res) => {
          if (!res) return 0
          const count = res[0]
          return ((Object.values(count))[0])
        })
        .then((res) => {
          // console.log('res:')
          // console.log(res)
          return Promise.resolve(res)
        })
        .catch((err) => {
          // console.log('error:')
          // console.log(err)
          throw err
        })
    },

    removeById: (Model) => (id) => {
      if (!Model || !Model.app || !Model.app.storage || !Model.app.storage.db) {
        return Promise.reject(new Error(`${Model.name}.removeById: some Model's properties are invalid:
          Model ${Model},
          .app ${Model.app}
          .storage ${Model.app.storage}
          .db ${Model.app.storage.db}`))
      }
      const knex = app.storage.db
      return Model.findById(id)
        .then((res) => {
          if (!res) {
            throw new Error(`${Model.name}.removeById: record with id ${id} not found`)
          }
          return Promise.all([res, knex(Model.name).del().where(Model.key, id)])
        })
        .then((res) => {
          return res[0] // res
        })
        .catch((err) => { throw err })
    },

    removeAll: (Model) => (opt) => {
      // console.log(`${Model.name}.removeAll: opt:`)
      // console.log(opt)
      return Model.findAll(opt)
        .then((res) => {
          // console.log('.findAll res:')
          // console.log(res)
          if (res) {
            return Promise.all(res.map((item) => {
              // console.log('item:')
              // console.log(item)
              return Model.removeById(item.id)
                .then((removedItem) => removedItem.id)
                .catch((err) => { throw err })
            }))
          }
          return null
        })
        .catch((err) => { throw err })
    },

    create: (Model) => (item) => {
      if (!Model || !Model.app || !Model.app.storage || !Model.app.storage.db) {
        return Promise.reject(new Error(`${Model.name}.create: some Model's properties are invalid:
          Model ${Model},
          .app ${Model.app}
          .storage ${Model.app.storage}
          .db ${Model.app.storage.db}`))
      }
      const knex = app.storage.db
      const aItem = Model.processBeforeSaveToStorage(item)

      // build query:
      return knex(Model.name)
        .insert(aItem)
        .then(() => Model.findById(aItem.id))
        .catch((err) => {
          // console.log(`--\nError: ${JSON.stringify(err)}`)
          throw err
        })
    },

    update: (Model) => (item) => {
      if (!item.id) {
        return Promise.reject(new Error(`${Model.name}.update: item.id should have proper value`))
      }
      if (!Model || !Model.app || !Model.app.storage || !Model.app.storage.db) {
        return Promise.reject(new Error(`${Model.name}.update: some Model's properties are invalid:
          Model ${Model},
          .app ${Model.app}
          .storage ${Model.app.storage}
          .db ${Model.app.storage.db}`))
      }
      const knex = app.storage.db

      // console.log('item:')
      // console.log(item)
      const aKeys = Object.keys(item)
      const aItem = Model.processBeforeSaveToStorage(item)
      // console.log('aItem:')
      // console.log(aItem)
      // process all item's props
      aKeys.map((key) => {
        aItem[key] = item[key]

        // exec beforeSet hook:
        const aProp = _.find(Model.props, { name: key })
        if (aProp && aProp.beforeSet && (typeof aProp.beforeSet === 'function')) {
          aItem[key] = aProp.beforeSet(item)
        }
        // process booleans
        if (item[key] && aProp.type === 'boolean') {
          aItem[key] = item[key] ? 1 : 0
        }

        // process refs:
        if (item[key] && aProp.type === 'refs') {
          aItem[key] = item[key].join(',')
        }
      })

      // console.log('processed aItem:')
      // console.log(aItem)
      // process all props in item:
      return knex(Model.name)
        .where(Model.key, item.id)
        .update(aItem)
        .then(() => Model.findById(item.id))
        .catch((err) => { throw err })
    }
  }

  return aStorage
}
