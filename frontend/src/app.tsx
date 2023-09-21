import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './graphql/queries';
import { useState } from 'react';
import { useParams, Routes, Route } from 'react-router';
import { Link, useNavigate } from 'react-router-dom';
import { StationList } from './components/stationlist';
import { Controls } from './components/controls';

const ErrorMessage: React.FC<{
    message: string
}> = ({message}) => <div className='error-message'>

</div>

export const App: React.FC = () => {
    return <ApolloProvider client={apolloClient}>
        <main>
            <StationList></StationList>
            <Controls></Controls>
        </main>
    </ApolloProvider>
};