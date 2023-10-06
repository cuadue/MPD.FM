import React from 'react';
import { StationList } from './components/stationlist';
import { Controls } from './components/controls';
import style from './app.module.css'
import { useIsNarrow, useNotchStyle, useStatusSubscription } from './graphql/hooks';
import { mpdBackendQuery } from './graphql/queries';
import { useQuery } from '@apollo/client';

const ErrorMessage: React.FC<{
    message: string
}> = ({message}) => <div className='error-message'>
    {message}
</div>

const Footer: React.FC = () => {
    const {error, loading, data} = useQuery(mpdBackendQuery);

    return <footer>
        {error ? error.message : loading ? '' : 
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
    const {loading, error, status} = useStatusSubscription();
    const isNarrow = useIsNarrow();
    const notchStyle = useNotchStyle(style);

    return <div className={[
            style.root,
            isNarrow ? style.narrow : style.wide,
            notchStyle
        ].join(' ')}>
        <header className={style.header}>
            <Controls loading={loading} error={error} status={status} />
        </header>
        <main className={style.content}>
            <StationList status={status} />
        </main>
        <Footer />
    </div>
};