import React, { forwardRef, useEffect, useState } from "react";
import { State, FullStatusFragment } from "../generated/graphql";
import { useSetVolume, usePlayControls, useClickOutside } from "../graphql/hooks";
import loadingImage from "../assets/pause.svg"
import errorImage from "../assets/pause.svg"
import stopImage from "../assets/pause.svg"
import playImage from "../assets/play.svg"
import volumeImage from "../assets/volume.svg"
import style from './controls.module.css'
import Slider, { ReactSliderProps } from 'react-slider';
import { ApolloError } from "@apollo/client";

type Station = FullStatusFragment['station'];
type Status = FullStatusFragment;

const Logo: React.FC<{station: Station}> = ({station}) => 
    <img className={style.logo} src={station?.logoUrl}
        alt={`${station?.name} (${station?.description})`} />

const ActionButton: React.FC<{
    status: Status
    loading: boolean
}> = ({status, loading}) => {
    const {play, stop, loading: controlsLoading, error} = usePlayControls(status.station?.id);
    loading ||= controlsLoading;

    const className = `${style.actionButton} ${loading && 'loading'}`;

    switch (status.state) {
    case State.Connecting:
        return <img className={className} src={loadingImage} alt='Connecting' />;
    case State.Paused:
        return <img className={className} src={playImage} alt='Paused' onClick={play} />
    case State.Stopped:
        return <img className={className} src={playImage} alt='Stopped' onClick={play} />
    case State.Playing:
        return <img className={className} src={stopImage} alt='Paused' onClick={stop} />
    case State.Error:
    default:
        return <img className={className} src={errorImage} alt='Error' />;
    }
}

const VolumeSlider: React.FC<{
    volume: number
}> = ({volume}) => {
    const [state, setState] = useState(0);
    const {setVolume, error, loading} = useSetVolume();

    useEffect(() => setState(volume), [volume]);

    return <Slider
        orientation='horizontal'
        value={state}
        disabled={loading}
        className={style.volumeSlider}
        thumbClassName={style.volumeThumb}
        trackClassName={style.volumeTrack}
        thumbActiveClassName={style.active}
        renderThumb={(props, state) => {
            console.log(props)
            return <img src={volumeImage} {...props} />
        }}
        onAfterChange={async (newVolume) => {
            setState(newVolume);
            await setVolume(newVolume);
        }}
    />
};

const stateText = ({status, loading, error}: {
    status: Status
    loading: boolean
    error: ApolloError
}): string => {
    if (error) {
        return `Error: ${error.message}`;
    }
    if (loading) {
        return 'Loading...'; 
    }
    const errorMessage = status.errorMessage || 'Mystery problem!';
    const stationName = status.station?.name || 'Mystery station!';
    switch (status.state) {
        case State.Connecting: return 'Connecting...';
        case State.Error: return `Error: ${errorMessage}`;
        case State.Playing: return null;
        case State.Stopped: return 'Stopped';
        case State.Paused: return `Paused: ${stationName}`;
        default: return 'What is happening?';
    }
}

const StatusDescription: React.FC<{
    status: Status
    loading: boolean
    error: ApolloError
}> = ({status, loading, error}) => {
    if (status.title) {
        status.title = status.title.trim();
    }
    const text = stateText({status, loading, error});
    if (!status.title && !text) {
        return <></>
    }
    return <div className={`${style.statusMessage} ${error && style.error}`}>
        {text &&
            <div>{text}</div>
        }
        {status.title && 
            <div className={style.title}>{status.title}</div>
        }
    </div>
}

export const Controls: React.FC<{
    loading: boolean
    error: ApolloError
    status: Status
}> = ({loading, error, status}) => {
    return <>
        <div className={style.container}>
            <div className={style.end}>
                <Logo station={status.station} />
            </div>
            <div className={style.middle}>
                <StatusDescription status={status} loading={loading} error={error} />
                <VolumeSlider volume={status.volume}/>
            </div>
            <div className={style.end}>
                <ActionButton loading={loading} status={status} />
            </div>
        </div>
    </>
};