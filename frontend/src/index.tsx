import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app.js';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './graphql/client';
import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";

loadDevMessages();
loadErrorMessages();
 
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ApolloProvider client={apolloClient}>
        <App />
      </ApolloProvider>
    </BrowserRouter>
  </React.StrictMode>
);