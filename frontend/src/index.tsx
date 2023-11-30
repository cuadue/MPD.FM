import React, { useState } from 'react';

import ReactDOM from 'react-dom/client';
import { Provider as UrqlProvider, useQuery } from 'urql';
import { client } from './graphql/client';

import { StationList } from './components/stationlist';
import { Controls } from './components/controls';
import style from './app.module.css'
import { useStatusSubscription } from './graphql/hooks';
import { mpdBackendQuery } from './graphql/queries';

export const GlobalContext = React.createContext<{
    error: string | null
    setError: (e: string | null) => void
}>({
    error: null,
    setError: function () {},
});

export const INSTANCE = {id: 'livingroom'};

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({children}) => {
    const [globalError, setGlobalError] = useState<string | null>(null);
    return <GlobalContext.Provider value={{
        error: globalError,
        setError: setGlobalError
    }}>
      {children}
    </GlobalContext.Provider>
}

const Footer: React.FC = () => {
    const [result, ]  = useQuery({
      query: mpdBackendQuery,
      variables: {instance: INSTANCE}
    });
    const {data, fetching, error} = result;

    return <footer className={style.footer}>
        {error ? error.message : fetching ? '' : 
            <>
                MPD {data.mpdBackend.version} on
                {' '}
                <span style={{fontFamily: 'monospace'}}>
                    {data.mpdBackend.hostname}:{data.mpdBackend.port}
                </span>
            </>
        }
    </footer>
}

export const App: React.FC = () => {
    const {error, status} = useStatusSubscription();

    return <div className={[
            style.root,
            style.narrow,
        ].join(' ')}>
        <header id='app-header' className={style.header}>
            <Controls error={error} status={status} />
        </header>
        <main className={style.content}>
            <StationList status={status} />
        </main>
        <Footer />
    </div>
};
 
ReactDOM.createRoot(document.body).render(
  <React.StrictMode>
    <UrqlProvider value={client}>
      <App />
    </UrqlProvider>
  </React.StrictMode>
);