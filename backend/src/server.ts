import { ApolloServer } from '@apollo/server';
import { expressMiddleware as apolloMiddleware } from '@apollo/server/express4';
import express from 'express';
import cors from 'cors';
import { readFile } from 'node:fs/promises';
import {resolvers, statusChangedPublisher, ResolverContext} from './resolvers.js';
import { RadioClient } from './radioclient.js';
import { StationList } from './stationlist.js';
import bodyParser from 'body-parser';
import { PubSub } from 'graphql-subscriptions';
import { createServer } from 'http';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer as useWsServer } from 'graphql-ws/lib/use/ws';
import {pubSub} from './resolvers.js'

const PORT = 8080;

const graphqlApp = async () => {
  const typeDefs = await readFile('../schema.graphql', 'utf8');
  const schema = makeExecutableSchema({typeDefs, resolvers});

  const app = express();
  const httpServer = createServer(app);
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql'
  });
  const serverCleanup = useWsServer({
    schema,
    context: getContext
   }, wsServer);

  const apolloServer = new ApolloServer({
    schema,
    plugins: [
    // Proper shutdown for the HTTP server.
    ApolloServerPluginDrainHttpServer({ httpServer }),

    // Proper shutdown for the WebSocket server.
    {async serverWillStart() {
        return { async drainServer() { await serverCleanup.dispose(); } };
    }},
  ],
  });
  await apolloServer.start();

  const stationList = new StationList();
  const radioClient = new RadioClient(stationList);

  radioClient.on('statusUpdated', statusChangedPublisher(pubSub, radioClient, stationList));

  async function getContext(): Promise<ResolverContext> {
    return { stationList, radioClient };
  }

  await radioClient.connect();
  console.log('Radio client connected');

  app.use('/graphql', cors(), bodyParser.json(),
          apolloMiddleware(apolloServer, { context: getContext }));
  const staticPath = '../frontend/dist';
  app.use('/', cors(), express.static(staticPath));

  httpServer.listen({ port: PORT }, () => {
    console.log(`🚀 GraphQL endpoint: http://localhost:${PORT}/graphql`);
    console.log(`🚀 GraphQL subscription endpoint: ws://localhost:${PORT}/graphql`);
  });
};

graphqlApp()