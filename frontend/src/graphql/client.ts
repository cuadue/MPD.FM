import { ApolloClient, InMemoryCache, Operation, createHttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { RetryLink } from '@apollo/client/link/retry';
import { getMainDefinition } from '@apollo/client/utilities';
import { Kind, OperationTypeNode } from 'graphql';
import {createClient as createWsClient} from 'graphql-ws';

const httpLink = createHttpLink({
  uri: window.location.origin + '/graphql',
});

const wsLink = new GraphQLWsLink(createWsClient({
    url: `ws://${window.location.host}/graphql`,
}));

const isSubscription = (op: Operation): boolean => {
    const definition = getMainDefinition(op.query);
    return definition.kind === Kind.OPERATION_DEFINITION &&
           definition.operation === OperationTypeNode.SUBSCRIPTION;
}

export const apolloClient = new ApolloClient({
    link: new RetryLink({
        attempts: {
            max: Infinity,
            retryIf: () => navigator.onLine
        }
    }).split(isSubscription, wsLink, httpLink),
    cache: new InMemoryCache(),
});
