'use client';

import React, { MouseEventHandler, useCallback, useEffect, useState } from 'react';
import { State, FullStatusFragment, AllStationsQuery } from '@/lib/graphql/generated/graphql';
import { usePlayControls, useStatusSubscription } from '@/lib/graphql/hooks';
import style from './stationlist.module.css'

const Station: React.FC<{
    station: FullStatusFragment['station'],
    activeStation: boolean
    nowPlaying: boolean
}> = ({station, activeStation, nowPlaying}) => {
    if (!station) {
        return <></>
    }
    const { id, description, logoUrl, name} = station;

    const {loading, error, play, stop} = usePlayControls(id || undefined);
    const handleClick: MouseEventHandler = useCallback(
        () => nowPlaying ? stop() : play(),
        [nowPlaying]
    );

    return <div className={`${style.station} ${activeStation ? style.activeStation : ''}`} onClick={handleClick}>
      	<div className={style.logo}>
            <img src={logoUrl || undefined} />
        </div>
        <div className={style.details}>
            <div className={style.title}>{name}</div>
            <div>{description}</div>
        </div>
    </div>
};

export const StationList: React.FC<{
    status: FullStatusFragment,
    stations: AllStationsQuery['stations']
}> = ({status: initialStatus, stations}) => {
    const {status, loading, error} = useStatusSubscription(initialStatus);

    stations.sort((b, a) => (a.sortOrder || 0) - (b.sortOrder || 0));
    return <div className={style.stationList}>
        {stations.map(station => {
                const activeStation = status.station?.id === station.id;
                const nowPlaying = activeStation && status.state === State.Playing;
                return <Station station={station} key={station.id}
                    activeStation={activeStation}
                    nowPlaying={nowPlaying}/>
            }
        )}
    </div>
}
