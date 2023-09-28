import React, { useEffect, useState } from "react";
import { State } from "../generated/graphql";
import { usePlay, useStatusSubscription, useStop, useSetVolume } from "../graphql/hooks";
import stopImage from "../assets/pause.svg"
import playImage from "../assets/play.svg"
import style from './controls.module.css'
import Slider from 'react-slider';

type DisplayStation = {
  description?: string
  id?: string
  logoUrl?: string
  name?: string
};

const Logo: React.FC<{station: DisplayStation}> = ({station}) => 
    <img className={style.logo} src={station?.logoUrl}
        alt={`${station?.name} (${station?.description})`} />

const ActionButton: React.FC<{
    src: string
    alt: string
    onClick: () => void
    loading: boolean
}> = ({src, alt, onClick, loading}) =>
    <img className={`${style.actionButton} ${loading && 'loading'}`}
        src={src} alt={alt}
        onClick={onClick} />

const Container: React.FC<{
    message: string
    children: React.ReactNode
}> = ({message, children}) => <>
    <div className={style.container}>
        {children}
    </div>
    <div className={style.statusMessage}>{message}</div>
</>

const Connecting: React.FC = () =>
    <Container message='Connecting...'>
    </Container>

const Error: React.FC<{
    message: string
}> = ({message}) =>
    <Container message={`Error: ${message}`}>
    </Container>

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

const Playing: React.FC<{
    volume: number
    station: DisplayStation
    title?: string
}> = ({title, station, volume}) => {
    const {loading, error, stop} = useStop();
    if (error) {
        return <Error message={error.message} />
    }
    return <Container message={`Now Playing: ${station.name}`}>
        <ActionButton loading={loading} src={stopImage} alt='Pause' onClick={stop} />
        <div className={style.title}>{title}</div>
        <Logo station={station} />
        <VolumeSlider volume={volume}/>
    </Container>
}

const Stopped: React.FC<{
    volume: number
    station?: DisplayStation
}> = ({station, volume}) => {
    const {loading, error, play} = usePlay();
    if (error) {
        return <Error message={error.message} />
    }
    const onClick = () => play(station.id);
    return <Container message={`Stopped: ${station.name}`}>
        <ActionButton loading={loading} src={playImage} alt='Resume' onClick={onClick} />
        <Logo station={station} />
        <VolumeSlider volume={volume}/>
    </Container>
}

export const Controls: React.FC = () => {
    const {loading, error, status} = useStatusSubscription();

    if (loading) {
        return <div>Loading...</div>
    }
    if (error) {
        return <Error message={error.message} />
    }
    switch (status.state) {
        case State.Connecting: return <Connecting />;
        case State.Error: return <Error message={status.errorMessage} />;
        case State.Playing:
            return <Playing volume={status.volume} station={status.station} title={status.title} />;
        case State.Paused:
        case State.Stopped:
            return <Stopped volume={status.volume} station={status.station} />;
    }
};