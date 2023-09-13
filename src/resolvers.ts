import {Resolvers} from './generated/schema.js'
import {RadioClient} from './radioclient.js'

export interface ResolverContext {
  radioClient: RadioClient
}

export const resolvers: Resolvers = {
  Query: {
    state: async () => {
    }
  },
  Mutation: {
  },
  Subscription: {
  },
};