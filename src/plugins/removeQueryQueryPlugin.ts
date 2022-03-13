import type { Plugin } from 'postgraphile'
import { omit } from 'lodash'

const RemoveQueryQueryPlugin: Plugin = (builder) => {
  builder.hook('GraphQLObjectType:fields', (fields, build, context) => {
    if (context.scope.isRootQuery) {
      // Drop the `query` field
      return omit(fields, ['query'])
    }
    else {
      return fields
    }
  })
}

export default RemoveQueryQueryPlugin
