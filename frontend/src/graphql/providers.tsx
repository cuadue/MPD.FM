import React, { useEffect } from 'react';
import { createContext, useState } from 'react';
import { useQuery } from 'urql';
import { instancesQuery } from './queries';

export const GlobalContext = createContext<{
    error: string | null
    setError: (e: string | null) => void
    instanceIds: string[]
    instanceId: string
    setInstanceId: (id: string) => void
}>({
    error: null,
    setError: function () {},
    instanceIds: [],
    instanceId: '',
    setInstanceId: function () {},
});

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({children}) => {
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [instanceId, setInstanceId] = useState<string | null>(null);

    const [result, ]  = useQuery({ query: instancesQuery });
    const {data} = result;

    useEffect(() => {
      if (data && !instanceId) {
        setInstanceId(data.instanceIds[0]);
      }
    }, [data]);

    return <GlobalContext.Provider value={{
        error: globalError,
        setError: setGlobalError,
        instanceIds: data?.instanceIds ?? [],
        instanceId,
        setInstanceId
    }}>
      {children}
    </GlobalContext.Provider>
}