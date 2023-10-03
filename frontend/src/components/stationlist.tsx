import React, { MouseEventHandler } from 'react';
import { useQuery } from '@apollo/client';
import { State, FullStatusFragment } from '../generated/graphql';
import { allStationsQuery } from '../graphql/queries';
import { useNotchStyle, usePlayControls } from '../graphql/hooks';
import style from './stationlist.module.css'

const Station: React.FC<{
    station: FullStatusFragment['station'],
    activeStation: boolean
    nowPlaying: boolean
}> = ({station, activeStation, nowPlaying}) => {
    const { id, description, logoUrl, name} = station;

    const {loading, error, play, stop} = usePlayControls(id);
    const handleClick: MouseEventHandler = () =>
        nowPlaying ? stop() : play();

    return <div className={`${style.station} ${activeStation && style.activeStation}`} onClick={handleClick}>
      	<div className={style.logo}>
            <img src={logoUrl} />
        </div>
        <div className={style.details}>
            <div className={style.title}>{name}</div>
            <div>{description}</div>
        </div>
    </div>
};

export const StationList: React.FC<{status: FullStatusFragment}> = ({status}) => {
    const {loading, error, data} = useQuery(allStationsQuery);
    const notchStyle = useNotchStyle(style);
    if (loading) {
        return <div>Loading...</div>
    }
    if (error) {
        return <div>Error: {error.message}</div>
    }
    const stations = [...data.stations];
    stations.sort((b, a) => a.sortOrder - b.sortOrder);
    return <div className={[style.stationList, notchStyle].join(' ')}>
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
