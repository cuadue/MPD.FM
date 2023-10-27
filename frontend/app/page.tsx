import React from 'react';

import { StationList } from '@/components/stationlist';
import { Controls } from '@/components/controls';
import style from './app.module.css'
import { allStationsQuery, fullStatusQuery, mpdBackendQuery } from '@/lib/graphql/queries';
import { getClient } from '@/lib/graphql/apollossrclient';

const Footer: React.FC = async () => {
    const {data} = await getClient().query({query: mpdBackendQuery});
    const error = null;
    const loading = false;

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
export default async function App() {
  const {data: {status}} = await getClient().query({query: fullStatusQuery});
  const {data: {stations}} = await getClient().query({query: allStationsQuery});

  return <div className={[
          style.root,
          style.narrow,
      ].join(' ')}>
      <header className={style.header}>
          <Controls status={status}/>
      </header>
      <main className={style.content}>
          <StationList status={status} stations={stations} />
      </main>
      <Footer />
  </div>
};
