import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './graphql/client';
import { StationList } from './components/stationlist';
import { Controls } from './components/controls';
import style from './app.module.css'

const ErrorMessage: React.FC<{
    message: string
}> = ({message}) => <div className='error-message'>
    {message}
</div>

export const App: React.FC = () => {
    return <ApolloProvider client={apolloClient}>
    <div className={style.content}>
        <StationList></StationList>
    </div>
    <div className={style.header}>
        <Controls></Controls>
    </div>
    </ApolloProvider>
};