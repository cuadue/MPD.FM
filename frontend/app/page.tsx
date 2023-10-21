'use client';

import React from 'react';
import { StationList } from '@/components/stationlist';
import { Controls } from '@/components/controls';
import style from './app.module.css'
import { useNotchStyle, useStatusSubscription } from '@/lib/graphql/hooks';
import { mpdBackendQuery } from '@/lib/graphql/queries';
import { useQuery } from '@apollo/client';

const Footer: React.FC = () => {
    const {error, loading, data} = useQuery(mpdBackendQuery);

    return <footer>
        {error ? error.message : loading || !data ? '' : 
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

export default function App() {
  const {loading, error, status} = useStatusSubscription();

  return <div className={[
          style.root,
          style.narrow,
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
