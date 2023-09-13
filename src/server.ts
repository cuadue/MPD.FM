import { ApolloServer } from '@apollo/server';
import { expressMiddleware as apolloMiddleware } from '@apollo/server/express4';
import express from 'express';
import cors from 'cors';
import { readFile } from 'node:fs/promises';
import {resolvers, ResolverContext} from './resolvers.js';
import { RadioClient } from './radioclient.js';

const PORT = process.env.PORT || 4200;
const app = express();
app.use(cors(), express.json());

const typeDefs = await readFile('./schema.graphql', 'utf8');
const apolloServer = new ApolloServer({typeDefs, resolvers});
await apolloServer.start();

const radioClient = new RadioClient();
await radioClient.connect();

async function getContext({ req }): Promise<ResolverContext> {
  console.log('Getting context');
  return { radioClient };
}

app.use('/graphql', apolloMiddleware(apolloServer, { context: getContext }));

app.listen({ port: PORT }, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
});
  