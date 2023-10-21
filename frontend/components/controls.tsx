'use client';

import React, { useEffect, useState } from "react";
import { State, FullStatusFragment } from "@/lib/graphql/generated/graphql";
import { useSetVolume, usePlayControls, useNotchStyle } from "@/lib/graphql/hooks";
import loadingImage from "@/public/pause.svg"
import errorImage from "@/public/pause.svg"
import stopImage from "@/public/pause.svg"
import playImage from "@/public/play.svg"
import volumeImage from "@/public/volume.svg"
import style from './controls.module.css'
import Slider from 'react-slider';
import { ApolloError } from "@apollo/client";

type Station = FullStatusFragment['station'];
type Status = FullStatusFragment;

const Logo: React.FC<{
    station: Station,
    onLoad?: (img: HTMLImageElement) => void
}> = ({station, onLoad}) => 
    <img className={style.logo} src={station?.logoUrl || undefined}
        onLoad={(e) => onLoad && onLoad(e.target as HTMLImageElement)}
        alt={`${station?.name} (${station?.description})`} />

const ActionButton: React.FC<{
    status: Status
    loading: boolean
}> = ({status, loading}) => {
    const {play, stop, loading: controlsLoading, error} = usePlayControls(status.station?.id || undefined);
    loading ||= controlsLoading;

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
    className?: string
    volume: number
}> = ({volume, className = ''}) => {
    const [state, setState] = useState(0);
    const {setVolume, error, loading} = useSetVolume();

    useEffect(() => setState(volume), [volume]);

    return <Slider
        orientation='horizontal'
        value={state}
        disabled={loading}
        className={[style.volumeSlider, className].join(' ')}
        thumbClassName={style.volumeThumb}
        trackClassName={style.volumeTrack}
        thumbActiveClassName={style.active}
        renderThumb={(props, state) =>
            <img src={volumeImage.src} {...{...props, key: undefined}} key={props.key} />
        }
        onAfterChange={async (newVolume) => {
            setState(newVolume);
            await setVolume(newVolume);
        }}
    />
};

const getStatusText = ({status, loading, error}: {
    status: Status
    loading: boolean
    error?: ApolloError
}): string => {
    if (error) {
        return `Error: ${error.message}`;
    }
    if (loading) {
        return 'Loading...'; 
    }
    const errorMessage = status.errorMessage || 'Mystery problem!';
    const stationName = status.station?.name || 'Mystery station!';
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
    loading: boolean
    error?: ApolloError
}> = ({description, loading, error}) => {
    return <div className={`${style.statusMessage} ${error ? style.error : ''}`}>
        {description}
    </div>
}

export const Controls: React.FC<{
    loading: boolean
    error?: ApolloError
    status: Status
}> = ({loading, error, status}) => {
    const [logoDimensions, setLogoDimensions] = useState({w: NaN, h: NaN});
    const statusText = getStatusText({status, loading, error});

    const logo = <Logo station={status.station} onLoad={(img) => {
        setLogoDimensions({w: img.naturalWidth, h: img.naturalHeight});
    }} />

    const logoIsWide = logoDimensions.w > 1.5 * logoDimensions.h;

    const className = [
        style.controls,
        logoIsWide ? style.wideLogo : ''
    ].join(' ');

    return <div className={className}>
        <div className={style.upper}>
            <div className={style.begin}>
                {logo}
            </div>
            {statusText &&
                <div className={style.middle}>
                    <StatusDescription description={statusText} loading={loading} error={error} />
                </div>
            }
        </div>
        <div className={style.lower}>
            <ActionButton loading={loading} status={status} />
            <VolumeSlider volume={status.volume || 0}/>
        </div>
    </div>
};