import React from 'react';
import { StationList } from './components/stationlist';
import { Controls } from './components/controls';
import style from './app.module.css'
import { useStatusSubscription } from './graphql/hooks';

const ErrorMessage: React.FC<{
    message: string
}> = ({message}) => <div className='error-message'>
    {message}
</div>

export const App: React.FC = () => {
    const {loading, error, status} = useStatusSubscription();

    return <>
        <div className={style.content}>
            <StationList status={status} />
        </div>
        <div className={style.header}>
            <Controls loading={loading} error={error} status={status} />
        </div>
    </>
};