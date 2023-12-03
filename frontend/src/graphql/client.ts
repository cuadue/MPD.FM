import {Client, cacheExchange, fetchExchange, subscriptionExchange} from 'urql';
import { retryExchange } from '@urql/exchange-retry';
import { createClient as createWsClient } from 'graphql-ws';

const {port, protocol, hostname, pathname} = window.location;
const graphqlPathname = `${pathname}/graphql`.replace(/^\/+/, '');

const graphqlWsUri = `ws://${hostname}:${port}/${graphqlPathname}`;
const graphqlHttpUri = `${protocol}//${hostname}:${port}/${graphqlPathname}`;

const wsClient = createWsClient({
    url: graphqlWsUri
});

export const client = new Client({
    url: graphqlHttpUri,
    exchanges: [
        cacheExchange,
        retryExchange({
            initialDelayMs: 1000,
            maxDelayMs: 1000,
            randomDelay: false,
            maxNumberAttempts: 2,
            retryIf: err => err && !!err.networkError,
        }),
        fetchExchange,
        subscriptionExchange({
            forwardSubscription(request) {
                const input = { ...request, query: request.query || '' };
                return {
                    subscribe(sink) {
                        const unsubscribe = wsClient.subscribe(input, sink);
                        return { unsubscribe };
                    }
                }
            }
        })
    ]
});