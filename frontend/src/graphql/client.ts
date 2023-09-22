import { ApolloClient, InMemoryCache, Operation, createHttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { Kind, OperationTypeNode } from 'graphql';
import {createClient as createWsClient} from 'graphql-ws';

const httpLink = createHttpLink({
  uri: 'http://localhost:8080/graphql',
});

const wsLink = new GraphQLWsLink(createWsClient({
    url: 'ws://localhost:8080/graphql',
}));

const isSubscription = (op: Operation): boolean => {
    const definition = getMainDefinition(op.query);
    return definition.kind === Kind.OPERATION_DEFINITION &&
           definition.operation === OperationTypeNode.SUBSCRIPTION;
}

export const apolloClient = new ApolloClient({
    link: split(isSubscription, wsLink, httpLink),
    cache: new InMemoryCache(),
});
