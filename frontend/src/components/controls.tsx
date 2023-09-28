import React, { useEffect, useState } from "react";
import { State, FullStatusFragment } from "../generated/graphql";
import { useSetVolume, usePlayControls } from "../graphql/hooks";
import loadingImage from "../assets/pause.svg"
import errorImage from "../assets/pause.svg"
import stopImage from "../assets/pause.svg"
import playImage from "../assets/play.svg"
import style from './controls.module.css'
import Slider from 'react-slider';
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
}> = (props) => {
    const [state, setState] = useState(0);
    const {setVolume, error, loading} = useSetVolume();

    useEffect(() => setState(props.volume), [props.volume]);

    return <Slider
        value={state}
        disabled={loading}
        className={style.volumeSlider}
        thumbClassName={style.volumeThumb}
        trackClassName={style.volumeTrack}
        thumbActiveClassName={style.active}
        renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
        onAfterChange={async (v) => {
            setState(v);
            await setVolume(v);
        }}
    />
};

const stateText = ({status, loading, error}: {
    status: Status
    loading: boolean
    error: ApolloError
}): string => {
    if (error) {
        return error.message;
    }
    if (loading) {
        return 'Loading...'; 
    }
    const errorMessage = status.errorMessage || 'Mystery problem!';
    const stationName = status.station?.name || 'Mystery station!';
    switch (status.state) {
        case State.Connecting: return 'Connecting...';
        case State.Error: return `Error: ${errorMessage}`;
        case State.Playing: return `Now Playing: ${stationName}`;
        case State.Stopped: return 'Stopped';
        case State.Paused: return `Paused: ${stationName}`;
        default: return 'What is happening?';
    }
}

export const Controls: React.FC<{
    loading: boolean
    error: ApolloError
    status: Status
}> = ({loading, error, status}) => {
    return <>
        <div className={style.container}>
            <ActionButton loading={loading} status={status} />
            <Logo station={status.station} />
            <VolumeSlider volume={status.volume}/>
        </div>
        <div className={style.statusMessage}>
            {stateText({status, error, loading})}
        </div>
    </>
};