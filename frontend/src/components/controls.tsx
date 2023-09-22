import React, { MouseEventHandler } from "react";
import { useQuery } from '@apollo/client';
import { State, Station, Status } from "../generated/graphql";
import { fullStatusQuery } from "../graphql/queries";
import { useStatusSubscription, useStop } from "../graphql/hooks";

const Container: React.FC<{
    children: React.ReactNode
}> = ({children}) => {
    return <div className='controls'>
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
}> = ({name, logoUrl, description, title}) => {
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
        <img src={logoUrl} height='100px' width='100px' />
        <button onClick={clickHandler}>Stop</button>
        Playing {name} {logoUrl} {description} {title}
    </Container>
}

const Stopped: React.FC<{
    name?: string
    logoUrl?: string
    description?: string
}> = ({name, logoUrl, description}) => <Container>
    Stopped {name} {logoUrl} {description}
</Container>

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
        case State.Error: return <Error message='unknown'/>;
        case State.Playing:
            return <Playing {...status.station} title={status.title} />;
        case State.Paused:
        case State.Stopped:
            return <Stopped {...status.station} />;
    }
};