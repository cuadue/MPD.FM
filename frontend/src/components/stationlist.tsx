import React, { MouseEventHandler } from 'react';
import { useQuery } from '@apollo/client';
import type { Station as StationModel } from '../generated/graphql';
import { allStationsQuery } from '../graphql/queries';
import { usePlay } from '../graphql/hooks';
import style from './stationlist.module.css'

const Station: React.FC<StationModel> = ({ id, description, logoUrl, name, streamUrl}) => {
    const {loading, error, play} = usePlay();
    const handleClick: MouseEventHandler = async () => {
        const state = await play(id);
        console.log('state after play', state);
    }
    if (loading) {
        console.log('Starting to play...');
    }
    if (error) {
        console.log('Failed to play', error);
    }

    return <div className={style.station} onClick={handleClick}>
      	<div className={style.logo}>
            <img src={logoUrl} />
        </div>
        <div className={style.details}>
            <div className={style.title}>{name}</div>
            <div>{description}</div>
        </div>
    </div>
};

export const StationList: React.FC = () => {
    const {loading, error, data} = useQuery(allStationsQuery);
    if (loading) {
        return <div>Loading...</div>
    }
    if (error) {
        return <div>Error: {error.message}</div>
    }
    const stations = [...data.stations];
    stations.sort((a, b) => a.sortOrder - b.sortOrder);
    return <div className={style.stationList}>
        {stations.map(s => 
            <Station key={s.id} {...s}></Station>
        )}
    </div>
}
