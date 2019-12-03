import uuid from 'uuid/v4'
import { crudRoutes } from './route-builder'

export const Session = (app, options) => {
  if (!options) {
    options = {}
  }
  options.storage = options.storage || 'default'

  return {
    name: 'Session',
    priority: 0,
    generateRoutes: crudRoutes,
    props: [
      {
        name: 'id',
        type: 'id',
        default: () => uuid()
      },
      {
        name: 'userId',
        type: 'ref',
        default: null
      },
      {
        name: 'createdAt',
        type: 'datetime',
        default: () => Date.now()
      },
      {
        name: 'ip',
        type: 'text',
        default: null
      }
    ]
  }
}
