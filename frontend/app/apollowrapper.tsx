"use client";

import { ApolloLink, HttpLink, Operation } from "@apollo/client";
import { RetryLink } from "@apollo/client/link/retry";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import {
    ApolloNextAppProvider,
    NextSSRInMemoryCache,
    NextSSRApolloClient,
    SSRMultipartLink,
} from "@apollo/experimental-nextjs-app-support/ssr";
import { Kind, OperationTypeNode } from "graphql";
import {createClient as createWsClient} from 'graphql-ws';

// have a function to create a client for you
function makeClient() {
    const origin = 'http://localhost:4200';
    const host = 'localhost:4200';    
    const httpLink = new HttpLink({
        // this needs to be an absolute url, as relative urls cannot be used in SSR
        uri: origin + '/graphql',
        // you can disable result caching here if you want to
        // (this does not work if you are rendering your page with `export const dynamic = "force-static"`)
        fetchOptions: { cache: "no-store" },
        // you can override the default `fetchOptions` on a per query basis
        // via the `context` property on the options passed as a second argument
        // to an Apollo Client data fetching hook, e.g.:
        // const { data } = useSuspenseQuery(MY_QUERY, { context: { fetchOptions: { cache: "force-cache" }}});
    });
    
    const wsLink = new GraphQLWsLink(createWsClient({
        url: `ws://${host}/graphql`,
    }));
    
    const isSubscription = (op: Operation): boolean => {
        const definition = getMainDefinition(op.query);
        return definition.kind === Kind.OPERATION_DEFINITION &&
            definition.operation === OperationTypeNode.SUBSCRIPTION;
    }

    
    return new NextSSRApolloClient({
        // use the `NextSSRInMemoryCache`, not the normal `InMemoryCache`
        cache: new NextSSRInMemoryCache(),
        link:
        typeof window === "undefined"
        ? ApolloLink.from([
            // in a SSR environment, if you use multipart features like
            // @defer, you need to decide how to handle these.
            // This strips all interfaces with a `@defer` directive from your queries.
            new SSRMultipartLink({
                stripDefer: true,
            }),
            httpLink,
        ])
        : new RetryLink({
            attempts: {
                max: Infinity,
                retryIf: () => navigator.onLine
            }
        }).split(isSubscription, wsLink, httpLink),
    });
}

// you need to create a component to wrap your app in
export function ApolloWrapper({ children }: React.PropsWithChildren) {
    return (
        <ApolloNextAppProvider makeClient={makeClient}>
            {children}
        </ApolloNextAppProvider>
    );
}