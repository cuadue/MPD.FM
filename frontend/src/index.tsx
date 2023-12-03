import React, { useContext, useState } from 'react';

import ReactDOM from 'react-dom/client';
import { Provider as UrqlProvider, useQuery } from 'urql';
import { client } from './graphql/client';

import { StationList } from './components/stationlist';
import { Controls } from './components/controls';
import style from './app.module.css'
import { useStatusSubscription } from './graphql/hooks';
import { mpdBackendQuery } from './graphql/queries';
import { GlobalContext, Providers } from './graphql/providers';

const Footer: React.FC = () => {
    const ctx = useContext(GlobalContext);

    const [result, ]  = useQuery({
      query: mpdBackendQuery,
      variables: {instance: {id: ctx.instanceId}}
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

const InstancePicker: React.FC = () => {
    const ctx = useContext(GlobalContext);

    if (ctx.instanceIds?.length < 2) {
        return <></>
    }
    return <div className={style.instances}>
        {ctx.instanceIds.map(id =>
            <span
                className={[
                    style.instance,
                    ctx.instanceId === id ? style.active : ''
                ].join(' ')}
                onClick={() => ctx.setInstanceId(id)}
            >
                {id}
            </span>
        )}
    </div>
}

export const App: React.FC = () => {
    const ctx = useContext(GlobalContext);
    const {status, fetching} = useStatusSubscription(ctx.instanceId);

    return <div id='app' className={[
            style.root,
            style.narrow,
        ].join(' ')}>
        <header id='app-header' className={style.header}>
            <InstancePicker />
            {fetching || !status ? 'Loading...' : <>
                <Controls status={status} />
            </>
            }
        </header>
        <main className={style.content}>
            {fetching || !status ? 'Loading...' :
                <StationList status={status} />
            }
        </main>
        <Footer />
    </div>
};

const render = () => {
    ReactDOM.createRoot(document.getElementById('root')).render(
        <React.StrictMode>
            <UrqlProvider value={client}>
                <Providers>
                    <App />
                </Providers>
            </UrqlProvider>
        </React.StrictMode>)
}

self.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        if (!document.getElementById('app')) {
            render()
        }
    }
});

render();

window.onerror = (e, source, lineno, error) => {
    document.getElementById('root').innerHTML = `${e}<br>${source}:${lineno}<br>${error}`;
}