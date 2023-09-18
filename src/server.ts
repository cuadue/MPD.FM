import { ApolloServer } from '@apollo/server';
import { expressMiddleware as apolloMiddleware } from '@apollo/server/express4';
import express from 'express';
import cors from 'cors';
import { readFile } from 'node:fs/promises';
import {resolvers, statusChangedPublisher, ResolverContext} from './resolvers.js';
import { RadioClient } from './radioclient.js';
import { StationList } from './stationlist.js';
import json from 'body-parser';
import { PubSub } from 'graphql-subscriptions';
import { createServer } from 'http';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';

const main = async () => {
  const PORT = process.env.PORT || 4200;
  const app = express();
  app.use(cors(), json());

  const httpServer = createServer(app);

  const typeDefs = await readFile('./schema.graphql', 'utf8');
  const schema = makeExecutableSchema({typeDefs, resolvers});
  const apolloServer = new ApolloServer({
    schema,
    plugins: [
    // Proper shutdown for the HTTP server.
    ApolloServerPluginDrainHttpServer({ httpServer }),

    // Proper shutdown for the WebSocket server.
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
  });
  await apolloServer.start();

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/subscriptions'
  });

  const serverCleanup = useServer({ schema, }, wsServer);

  const radioClient = new RadioClient();
  console.log('new radio client', radioClient);
  const stationList = new StationList();
  stationList.insertStation({id: 'xray', name: 'XRAY PDX', streamUrl: 'https://listen.xray.fm/stream'});

  const pubSub = new PubSub();
  radioClient.on('state', statusChangedPublisher(pubSub, radioClient, stationList));

  async function getContext(): Promise<ResolverContext> {
    return { stationList, radioClient, pubSub };
  }

  app.use('/graphql', apolloMiddleware(apolloServer, { context: getContext }));

  await radioClient.connect();
  console.log('Radio client connected');

  httpServer.listen({ port: PORT }, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
  });
};

main()