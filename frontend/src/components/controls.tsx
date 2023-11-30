import React, { useContext } from "react";
import { State, FullStatusFragment, MyError } from "../generated/graphql";
import { usePlayControls } from "../graphql/hooks";
import loadingImage from "../assets/pause.svg"
import errorImage from "../assets/play.svg"
import stopImage from "../assets/pause.svg"
import playImage from "../assets/play.svg"
import style from './controls.module.css'
import {VolumeSlider} from './volumeslider';
import { GlobalContext } from "../graphql/providers";

type Station = FullStatusFragment['station'];
type Status = FullStatusFragment;

const Logo: React.FC<{
    station?: Station,
    onLoad?: (img: HTMLImageElement) => void
}> = ({station, onLoad}) => 
    station?.logoUrl 
        ? <img className={style.logo} src={station?.logoUrl ?? undefined}
            onLoad={(e) => onLoad && onLoad(e.target as HTMLImageElement)}
            alt={`Logo for ${station?.name}`} />
        : <></>

const ActionButton: React.FC<{
    status: Status
}> = ({status}) => {
    const {play, stop, loading} = usePlayControls(status?.station?.id ?? undefined);
    const className = `${style.actionButton} ${loading ? 'loading' : ''}`;
    if (!status) {
        return <></>
    }

    switch (status.state) {
    case State.Connecting:
        return <img className={className} src={loadingImage} alt='Connecting' />;
    case State.Paused:
        return <img className={className} src={playImage} alt='Paused' onClick={play} />
    case State.Stopped:
        return <img className={className} src={playImage} alt='Stopped' onClick={play} />
    case State.Playing:
        return <img className={className} src={stopImage} alt='Playing' onClick={stop} />
    default:
        return <img className={className} src={errorImage} alt='Error' />;
    }
}

const useStatusText = (status?: Status | null): string => {
    const ctx = useContext(GlobalContext);
    if (status?.errorMessage) {
        return status?.errorMessage;
    }
    if (ctx.error) {
        return `Error! ${ctx.error}`;
    }

    var title = status?.title?.trim() || '';
    switch (status?.state) {
        default:
        case State.Connecting: return 'Connecting...';
        case State.Playing: return title.match(/[a-zA-Z]/) ? title : '';
        case State.Stopped: return '';
        case State.Paused: return '';
    }
}

const StatusDescription: React.FC<{
    description: string
}> = ({description}) => {
    const ctx = useContext(GlobalContext);
    return <div className={`${style.statusMessage} ${ctx.error ? style.error : ''}`}>
        {description}
    </div>
}

const stateEmoji = (state: State) => {
    switch (state) {
        case State.Paused: return '⏸';
        case State.Playing: return '▶';
        case State.Stopped: return '⏹';
        case State.Connecting: return '⋯'
        default: return '';
    }
}

export const Controls: React.FC<{
    status: FullStatusFragment | null
}> = ({status}) => {
    const statusText = useStatusText(status);

    if (status && typeof document !== typeof undefined) {
        const emoji = stateEmoji(status.state);

        document.title = (emoji ? `${emoji} ` : '') + [
            status.station?.name,
            statusText
        ].filter(x => x?.length).join(' - ');
    }

    return <div className={style.controls}>
        <div className={style.upper}>
            <div className={style.begin}>
                <Logo station={status?.station} />
            </div>
            <div className={style.middle}>
                <StatusDescription description={statusText} />
            </div>
        </div>
        <div className={style.lower}>
            {status ? <ActionButton status={status} /> : <></>}
            {status ? <VolumeSlider value={status.volume} /> : <></>}
        </div>
    </div>
};