import { ApolloServer } from '@apollo/server';
import { expressMiddleware as apolloMiddleware } from '@apollo/server/express4';
import express from 'express';
import cors from 'cors';
import { readFile } from 'node:fs/promises';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer as useWsServer } from 'graphql-ws/lib/use/ws';

import {resolvers, ResolverContext} from './resolvers.js';
import { RadioClient } from './radioclient.js';
import { StationList } from './stationlist.js';
import { ImageCache } from './imagecache.js';
import { nanoid } from 'nanoid';

const PORT = Number(process.env.PORT) || 4200;
const MPD_INSTANCES = process.env.MPD_INSTANCES || 'Self=localhost:6600';
const WS_SERVER_PATH = '/graphql';

const makeRadioClients = (a: string): Array<[string, RadioClient]> =>
  a.split(';').map(b => {
    if (b.indexOf('=') > 0) {
      const [id, rest] = b.split('=', 2);
      const [host, port] = rest.split(':', 2);
      return {id, host, port};
    } else {
      const [host, port] = b.split(':', 2);
      return {id: nanoid(), host, port}
    }
  }).map(({id, host, port}) =>
    [id, new RadioClient({host, port: Number.parseInt(port)})]
  );

const imageCache = new ImageCache({
  storagePath: './logo-cache',
  urlPrefix: '/logo'
});
const stationList = new StationList(imageCache);
const allClients = makeRadioClients(MPD_INSTANCES);
export const clientIds: string[] = allClients.map(c => c[0]);
export const radioClients = Object.fromEntries(allClients);

const graphqlApp = async () => {
  const typeDefs = await readFile('schema.graphql', 'utf8');
  const schema = makeExecutableSchema({typeDefs, resolvers});

  const app = express();
  const httpServer = createServer(app);
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: WS_SERVER_PATH
  });
  const serverCleanup = useWsServer({
    schema,
    context: () => {
      return { stationList };
    }
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

  async function getContext({req}): Promise<ResolverContext> {
    return { stationList };
  }

  await Promise.all([
    apolloServer.start(),
    stationList.init(),
    ...allClients.map(async ([id, c]) =>
      c.connect().then(() => console.log('Radio client connected to', id))
    ),
  ]);

  app.use('/', cors(), express.static('frontend/dist'));
  app.use('/graphql', cors(), bodyParser.json(),
          apolloMiddleware(apolloServer, { context: getContext }));
  app.use(imageCache.urlPrefix, cors(), express.static(imageCache.storagePath));

  httpServer.listen({ port: PORT }, () => {
    console.log(`🚀 GraphQL endpoint: http://localhost:${PORT}/graphql`);
    console.log(`🚀 GraphQL subscription endpoint: ws://localhost:${PORT}/${WS_SERVER_PATH}`);
  });
};

graphqlApp()
