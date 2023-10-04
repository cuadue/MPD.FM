import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app.js';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './graphql/client';
import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";

loadDevMessages();
loadErrorMessages();
 
ReactDOM.createRoot(document.body).render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
);