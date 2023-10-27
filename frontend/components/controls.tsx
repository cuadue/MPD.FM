'use client';

import React, { useCallback, useEffect, useState } from "react";
import { State, FullStatusFragment } from "@/lib/graphql/generated/graphql";
import { useSetVolume, usePlayControls, useNotchStyle, useStatusSubscription } from "@/lib/graphql/hooks";
import loadingImage from "@/public/pause.svg"
import errorImage from "@/public/pause.svg"
import stopImage from "@/public/pause.svg"
import playImage from "@/public/play.svg"
import volumeImage from "@/public/volume.svg"
import style from './controls.module.css'
import {Slider} from '@/components/slider';
import { ApolloError } from "@apollo/client";

type Station = FullStatusFragment['station'];
type Status = FullStatusFragment;

const Logo: React.FC<{
    station?: Station,
    onLoad?: (img: HTMLImageElement) => void
}> = ({station, onLoad}) => 
    <img className={style.logo} src={station?.logoUrl || undefined}
        onLoad={(e) => onLoad && onLoad(e.target as HTMLImageElement)}
        alt={`${station?.name} (${station?.description})`} />

const ActionButton: React.FC<{
    status: Status
}> = ({status}) => {
    const {play, stop, loading, error} = usePlayControls(status.station?.id || undefined);

    const className = `${style.actionButton} ${loading && 'loading'}`;

    switch (status.state) {
    case State.Connecting:
        return <img className={className} src={loadingImage.src} alt='Connecting' />;
    case State.Paused:
        return <img className={className} src={playImage.src} alt='Paused' onClick={play} />
    case State.Stopped:
        return <img className={className} src={playImage.src} alt='Stopped' onClick={play} />
    case State.Playing:
        return <img className={className} src={stopImage.src} alt='Paused' onClick={stop} />
    case State.Error:
    default:
        return <img className={className} src={errorImage.src} alt='Error' />;
    }
}

const VolumeSlider: React.FC<{
    volume: number
}> = ({volume: controlledVolume}) => {
    const [volume, setVolumeState] = useState(controlledVolume);
    const {setVolume, loading, error} = useSetVolume();
    console.log('Volume controlled', controlledVolume, 'state', volume);

    const onChange = useCallback((newVolume: number) => {
        console.log('new volume', newVolume);
        setVolumeState(newVolume);
        setVolume(newVolume);
    }, []);

    return <Slider
        min={0}
        max={100}
        value={volume}
        className='flex grow h-4'
        handleClassName='w-0 p-6 -translate-x-1/2 -translate-y-1/2 rounded-full'
        handleInactiveClassName='bg-emerald-700 '
        handleActiveClassName='bg-emerald-300 '
        trackBeginClassName='bg-amber-700 rounded-l-full cursor-pointer'
        trackEndClassName='bg-cyan-600 rounded-r-full cursor-pointer'
        onChange={onChange}
    />
};

const getStatusText = ({status, error}: {
    status: Status
    error?: ApolloError
}): string => {
    if (error) {
        return `Error: ${error.message}`;
    }
    const errorMessage = status?.errorMessage || 'Mystery problem!';
    var title = status.title?.trim() || '';
    switch (status.state) {
        case State.Connecting: return 'Connecting...';
        case State.Error: return `Error: ${errorMessage}`;
        case State.Playing: return title.match(/[a-zA-Z]/) ? title : '';
        case State.Stopped: return '';
        case State.Paused: return '';
        default: return 'What is happening?';
    }
}

const StatusDescription: React.FC<{
    description: string
    error?: ApolloError
}> = ({description, error}) => {
    return <div className={`${style.statusMessage} ${error ? style.error : ''}`}>
        {description}
    </div>
}

export const Controls: React.FC<{
    status: FullStatusFragment
}> = ({status: initialStatus}) => {
    console.log('Controls initial status', initialStatus);
    const [logoDimensions, setLogoDimensions] = useState({w: NaN, h: NaN});
    const {status, error} = useStatusSubscription(initialStatus);
    const statusText = getStatusText({status, error});

    if (error) {
        return error.message;
    }

    const logoIsWide = logoDimensions.w > 1.5 * logoDimensions.h;

    const className = [
        style.controls,
        logoIsWide ? style.wideLogo : ''
    ].join(' ');

    return <div className={className}>
        <div className={style.upper}>
            <div className={style.begin}>
               <Logo station={status.station} onLoad={(img) => {
                    setLogoDimensions({w: img.naturalWidth, h: img.naturalHeight});
                }} />
            </div>
            {statusText &&
                <div className={style.middle}>
                    <StatusDescription description={statusText} error={error} />
                </div>
            }
        </div>
        <div className={style.lower}>
            <ActionButton status={status} />
            <VolumeSlider volume={status.volume || 0}/>
        </div>
    </div>
};