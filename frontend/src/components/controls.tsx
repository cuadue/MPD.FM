import React, { MouseEventHandler } from "react";
import { State } from "../generated/graphql";
import { usePlay, useStatusSubscription, useStop } from "../graphql/hooks";
import stopImage from "../assets/pause.svg"
import playImage from "../assets/play.svg"
import style from './controls.module.css'

type DisplayStation = {
  description?: string
  id: string
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
}> =
    ({src, alt, onClick, loading}) =>
        <img className={`${style.actionButton} ${loading && 'loading'}`}
            src={src} alt={alt}
            onClick={onClick} />

const Container: React.FC<{
    children: React.ReactNode
}> = ({children}) => {
    return <div className={style.container}>
        {children}
    </div>
};

const Connecting: React.FC = () => {
    return <Container>
        Connecting
    </Container>
};

const Error: React.FC<{
    message: string
}> = ({message}) => {
    return <Container>
        Error: {message}
    </Container>
};

const Ready: React.FC<{
    station: DisplayStation
    title?: string
    children: React.ReactNode
}> = ({station, title, children}) => {
    return <Container>
        {children}
        <div className={style.title}>{title}</div>
        <Logo station={station} />
    </Container>
}

const Playing: React.FC<{
    station: DisplayStation
    title?: string
}> = ({title, station}) => {
    const {loading, error, stop} = useStop();
    if (error) {
        return <Error message={error.message} />
    }
    return <Ready station={station} title={title}>
        <ActionButton loading={loading} src={stopImage} alt='Pause' onClick={stop} />
    </Ready>
}

const Stopped: React.FC<{
    station?: DisplayStation
}> = ({station}) => {
    const {loading, error, play} = usePlay();
    if (error) {
        return <Error message={error.message} />
    }
    const onClick = () => play(station.id);
    return <Ready station={station}>
        <ActionButton loading={loading} src={playImage} alt='Resume' onClick={onClick} />
    </Ready>
}

export const Controls: React.FC = () => {
    const {loading, error, status} = useStatusSubscription();

    if (loading) {
        return <div>Loading...</div>
    }
    if (error) {
        return <Error message={error.message} />
    }
    console.log(status.station);

    switch (status.state) {
        case State.Connecting: return <Connecting />;
        case State.Error: return <Error message={status.errorMessage} />;
        case State.Playing:
            return <Playing station={status.station} title={status.title} />;
        case State.Paused:
        case State.Stopped:
            return <Stopped station={status.station} />;
    }
};