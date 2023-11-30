import React from 'react';
import { createContext, useState } from 'react';

export const GlobalContext = createContext<{
    error: string | null
    setError: (e: string | null) => void
}>({
    error: null,
    setError: function () {},
});

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({children}) => {
    const [globalError, setGlobalError] = useState<string | null>(null);
    return <GlobalContext.Provider value={{
        error: globalError,
        setError: setGlobalError
    }}>
      {children}
    </GlobalContext.Provider>
}