import React, { MouseEventHandler } from 'react';
import { useQuery } from '@apollo/client';
import type { Station as StationModel } from '../generated/graphql';
import { allStationsQuery } from '../graphql/queries';
import { usePlay } from '../graphql/hooks';

const Station: React.FC<StationModel> = ({ id, description, logoUrl, name, streamUrl}) => {
    const {loading, play} = usePlay();
    const handleClick: MouseEventHandler = async () => {
        const state = await play(id);
        console.log(state);
    }

    return <div className='station'>
        <button onClick={handleClick}>Play</button>
        {name}
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
    const stations = data.stations.sort((a, b) => a.sortOrder - b.sortOrder);
    return <div className='station-list'>
        {stations.map(s => 
            <Station key={s.id} {...s}></Station>
        )}
    </div>
}