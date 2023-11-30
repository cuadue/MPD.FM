import React, { MouseEventHandler, useCallback } from 'react';
import { usePlayControls } from '../graphql/hooks';
import style from './stationlist.module.css'

import { State, FullStatusFragment, } from '../generated/graphql';
import { useQuery } from 'urql';
import { allStationsQuery } from '../graphql/queries';

const Station: React.FC<{
    station: Exclude<FullStatusFragment['station'], null | undefined>,
    activeStation: boolean
    nowPlaying: boolean
}> = ({station, activeStation, nowPlaying}) => {
    const {id, description, logoUrl, name} = station;

    const {loading, error, play, stop} = usePlayControls(id || undefined);
    const handleClick: MouseEventHandler = useCallback(
        () => nowPlaying ? stop() : play(),
        [nowPlaying, play, stop]
    );

    return <div className={[
            error ? style.error : '',
            style.station,
            activeStation ? style.activeStation : '',
        ].join(' ')} onClick={handleClick}>
      	<div className={style.logo}>
            {logoUrl
                ? <img
                    alt={`Logo for ${station.name || 'current station'}`}
                    src={logoUrl} />
                : <></>
            }
        </div>
        <div className={style.details}>
            <div className={style.title}>{name}</div>
            <div>{
                error
                ? <><strong title={error.message}>Error!</strong></>
                : description
            }</div>
        </div>
    </div>
};

export const StationList: React.FC<{
    status: FullStatusFragment
}> = ({status}) => {
    const res = useQuery({query: allStationsQuery});
    const stations = res[0].data?.stations;
    const error = res[0].error;
    if (!stations) {
        if (error) {
            return 'Failed reading station list: ' + error?.message;
        } else {
            return 'Failed reading station list: unknown!';
        }
    }

    stations.sort((b, a) => (a.sortOrder || 0) - (b.sortOrder || 0));
    return <div className={style.stationList}>
        {stations.map(station => {
                const activeStation: boolean = !!status && status.station?.id === station.id;
                const nowPlaying = activeStation && status?.state === State.Playing;
                return <Station station={station} key={station.id}
                    activeStation={activeStation}
                    nowPlaying={nowPlaying}/>
            }
        )}
    </div>
}
