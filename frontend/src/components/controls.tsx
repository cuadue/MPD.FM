import React, { MouseEventHandler } from "react";
import { State } from "../generated/graphql";
import { useStatusSubscription, useStop } from "../graphql/hooks";
import stopImage from "../assets/pause.svg"
import './controls.css'

const Container: React.FC<{
    children: React.ReactNode
}> = ({children}) => {
    return <div className='controls-container'>
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

const Playing: React.FC<{
    name?: string
    logoUrl?: string
    description?: string
    title?: string
}> = ({name: stationName, logoUrl, description: stationDescription, title}) => {
    const {loading, error, stop} = useStop();
    const clickHandler: MouseEventHandler = async () => {
        const state = await stop()
        console.log('state after stopping', state);
    }
    if (loading) {
        console.log('Stopping');
    }
    if (error) {
        console.log('Failed to stop', error);
    }
    return <Container>
        <img src={stopImage}  onClick={clickHandler} alt='Pause' />
        <img src={logoUrl}
             alt={`${stationName} (${stationDescription})`} />
        <b>{stationName}</b> &mdash; <i>{title}</i>
        <br></br>
    </Container>
}

const Stopped: React.FC<{
    name?: string
    logoUrl?: string
    description?: string
}> = ({name, logoUrl, description}) => <Container>
    <img src={logoUrl} height='100px' width='100px' />
    Stopped {name} {description}
</Container>

export const Controls: React.FC = () => {
    const {loading, error, status} = useStatusSubscription();

    if (loading) {
        return <div>Loading...</div>
    }
    if (error) {
        console.log('status has an error, state is', status.state);
        return <Error message={error.message} />
    }

    switch (status.state) {
        case State.Connecting: return <Connecting />;
        case State.Error: return <Error message={status.errorMessage} />;
        case State.Playing:
            return <Playing {...status.station} title={status.title} />;
        case State.Paused:
        case State.Stopped:
            return <Stopped {...status.station} />;
    }
};