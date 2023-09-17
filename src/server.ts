import { ApolloServer } from '@apollo/server';
import { expressMiddleware as apolloMiddleware } from '@apollo/server/express4';
import express from 'express';
import cors from 'cors';
import { readFile } from 'node:fs/promises';
import {resolvers, ResolverContext} from './resolvers.js';
import { RadioClient } from './radioclient.js';
import { StationList } from './stationlist.js';
import { json } from 'body-parser';

const main = async () => {
  const PORT = process.env.PORT || 4200;
  const app = express();
  app.use(cors(), json());

  const typeDefs = await readFile('./schema.graphql', 'utf8');
  const apolloServer = new ApolloServer({typeDefs, resolvers});
  await apolloServer.start();

  const radioClient = new RadioClient();
  await radioClient.connect();
  console.log('Radio client connected');

  const stationList = new StationList();
  stationList.addStation({id: 'xray', name: 'XRAY PDX', streamUrl: 'https://listen.xray.fm/stream'});

  async function getContext({ req }): Promise<ResolverContext> {
    return { stationList, radioClient };
  }

  app.use('/graphql', apolloMiddleware(apolloServer, { context: getContext }));

  app.listen({ port: PORT }, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
  });
};

main()