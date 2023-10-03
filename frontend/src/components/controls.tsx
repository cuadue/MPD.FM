import React, { forwardRef, useEffect, useState } from "react";
import { State, FullStatusFragment } from "../generated/graphql";
import { useSetVolume, usePlayControls, useIsNarrow, useNotchStyle } from "../graphql/hooks";
import loadingImage from "../assets/pause.svg"
import errorImage from "../assets/pause.svg"
import stopImage from "../assets/pause.svg"
import playImage from "../assets/play.svg"
import volumeImage from "../assets/volume.svg"
import style from './controls.module.css'
import Slider from 'react-slider';
import { ApolloError } from "@apollo/client";

type Station = FullStatusFragment['station'];
type Status = FullStatusFragment;

const Logo: React.FC<{
    station: Station,
    onLoad?: (img: HTMLImageElement) => void
}> = ({station, onLoad}) => 
    <img className={style.logo} src={station?.logoUrl}
        onLoad={(e) => onLoad(e.target as HTMLImageElement)}
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
            <img src={volumeImage} {...props} />
        }
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
    var title = status.title?.trim() || '';
    switch (status.state) {
        case State.Connecting: return 'Connecting...';
        case State.Error: return `Error: ${errorMessage}`;
        case State.Playing: return title.match(/[a-zA-Z]/) ? title : '';
        case State.Stopped: return 'Stopped';
        case State.Paused: return `Paused: ${stationName}`;
        default: return 'What is happening?';
    }
}

const StatusDescription: React.FC<{
    description: string
    loading: boolean
    error: ApolloError
}> = ({description, loading, error}) => {
    return <div className={`${style.statusMessage} ${error ? style.error : ''}`}>
        {description}
    </div>
}

export const Controls: React.FC<{
    loading: boolean
    error: ApolloError
    status: Status
}> = ({loading, error, status}) => {
    const [logoDimensions, setLogoDimensions] = useState({w: NaN, h: NaN});
    const isNarrow = useIsNarrow();
    const notchStyle = useNotchStyle(style);
    const title = stateText({status, loading, error});

    const logo = <Logo station={status.station} onLoad={(img) => {
        setLogoDimensions({w: img.naturalWidth, h: img.naturalHeight});
    }} />

    const logoIsWide = logoDimensions.w > 1.5 * logoDimensions.h;
    console.log(logoDimensions, logoIsWide);

    if (isNarrow) {
        const maybeMiddle = status.state !== State.Playing || title ? 
            <div className={style.middle}>
                <StatusDescription description={title} loading={loading} error={error} />
            </div>
            : <></>;

        const className = [
            style.narrow,
            notchStyle,
            logoIsWide ? style.wideLogo : ''
        ].join(' ');
        console.log(className);

        return <div className={className}>
            <div className={style.upper}>
                <div className={style.begin}>
                    {logo}
                </div>
                {maybeMiddle}
            </div>
            <div className={style.lower}>
                <ActionButton loading={loading} status={status} />
                <VolumeSlider volume={status.volume}/>
            </div>
        </div>
    } else {
        return <div className={[style.wide, notchStyle].join(' ')}>
            <div className={style.upper}>
                <div className={style.begin}>
                    <Logo station={status.station} />
                </div>
                <div className={style.middle}>
                    <StatusDescription description={title} loading={loading} error={error} />
                </div>
                <div className={style.end}>
                    <ActionButton loading={loading} status={status} />
                </div>
            </div>
            <div className={style.lower}>
                <VolumeSlider volume={status.volume}/>
            </div>
        </div>
    }
};