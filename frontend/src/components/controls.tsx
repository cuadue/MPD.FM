import React from "react";
import { useQuery } from '@apollo/client';
import { State, Station, Status } from "../generated/graphql";
import { fullStatusQuery } from "../graphql/queries";

const Container: React.FC<{
    children: React.ReactNode
}> = ({children}) => {
    return <div>
        {children}
    </div>
};

const Connecting: React.FC = () => {
    return <Container>
        Connecting
    </Container>
};

const Error: React.FC = () => {
    return <Container>
        Error
    </Container>
};

const Playing: React.FC<{
    name?: string
    logoUrl?: string
    description?: string
    title?: string
}> = ({name, logoUrl, description, title}) => <Container>
    Playing {name} {logoUrl} {description} {title}
</Container>

const Stopped: React.FC<{
    name?: string
    logoUrl?: string
    description?: string
}> = ({name, logoUrl, description}) => <Container>
    Stopped {name} {logoUrl} {description}
</Container>

export const Controls: React.FC = () => {
    const {loading, error, data} = useQuery(fullStatusQuery);
    if (loading) {
        return <div>Loading...</div>
    }
    if (error) {
        return <div>Error: {error.message}</div>
    }

    switch (data.status.state) {
        case State.Connecting: return <Connecting />;
        case State.Error: return <Error />;
        case State.Playing:
            return <Playing {...data.status.station} title={data.status.title} />;
        case State.Paused:
        case State.Stopped:
            return <Stopped {...data.status.station} />;
    }
};