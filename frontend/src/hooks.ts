import { useEffect, useState } from "react";
import { MyError } from "./generated/graphql";

export function isMyError(obj: any): obj is MyError {
  return obj?.__typename === 'MyError';
}

export function useAfterDelay(input: boolean, delay: number = 1000): boolean {
  const [state, setState] = useState(false);
  const [result, setResult] = useState(false);
  const [timeoutHandle, setTimeoutHandle] = useState<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!input && timeoutHandle) {
      clearTimeout(timeoutHandle);
      setTimeoutHandle(undefined);
    }

    if (input && !state) {
      setTimeoutHandle(setTimeout(() => {
        setResult(true);
      }, delay));
    }

    setState(input);
  }, [input]);

  return result;
}