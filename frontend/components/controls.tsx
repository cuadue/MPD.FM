'use client';

import React, { useCallback, useEffect, useState } from "react";
import { State, FullStatusFragment } from "@/lib/graphql/generated/graphql";
import { useVolumeControl, usePlayControls, useNotchStyle, useStatusSubscription } from "@/lib/graphql/hooks";
import loadingImage from "@/public/pause.svg"
import errorImage from "@/public/pause.svg"
import stopImage from "@/public/pause.svg"
import playImage from "@/public/play.svg"
import style from './controls.module.css'
import {VolumeSlider} from '@/components/volumeslider';
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
    const [logoDimensions, setLogoDimensions] = useState({w: NaN, h: NaN});
    const {status, error} = useStatusSubscription(initialStatus);
    const statusText = getStatusText({status, error});

    const {volume, setVolume} = useVolumeControl(status.volume);

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
               <Logo station={status.station} onLoad={useCallback((img) => {
                    setLogoDimensions({w: img.naturalWidth, h: img.naturalHeight});
                }, [])} />
            </div>
            {statusText &&
                <div className={style.middle}>
                    <StatusDescription description={statusText} error={error} />
                </div>
            }
        </div>
        <div className={style.lower}>
            <ActionButton status={status} />
            <VolumeSlider
                value={volume}
                onChange={(newVolume: number) => setVolume(newVolume)}
            />
        </div>
    </div>
};