"use client";

import { useCallback, useEffect, useState, useSyncExternalStore, type DependencyList } from "react";
import { friendlyError } from "./firebase-actions";
import { isFirebaseConfigured } from "./firebase";

// Results are tagged with the deps they were loaded for, so "loading" is simply
// "the latest result belongs to different deps" — no extra state updates needed.
const keyOf = (deps: DependencyList) => JSON.stringify(deps);

type Result<T> = { key: string; data: T | null; error: string };

// Runs an async loader on mount (and when deps change) and tracks its state.
export function useAsync<T>(loader: () => Promise<T>, deps: DependencyList) {
  const [version, setVersion] = useState(0);
  const key = keyOf([...deps, version]);
  const [result, setResult] = useState<Result<T>>({ key: "", data: null, error: "" });

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    let cancelled = false;
    loader()
      .then((data) => !cancelled && setResult({ key, data, error: "" }))
      .catch((err) => !cancelled && setResult({ key, data: null, error: friendlyError(err) }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const setData = useCallback((data: T | null) => setResult((r) => ({ ...r, data })), []);

  return {
    data: result.data,
    error: result.error,
    loading: isFirebaseConfigured && result.key !== key,
    reload,
    setData,
  };
}

type Subscribe<T> = (onData: (v: T) => void, onError: (e: Error) => void) => () => void;

// Subscribes to a live Firestore listener and tracks its latest value.
export function useSubscription<T>(subscribe: Subscribe<T> | null, deps: DependencyList) {
  const key = keyOf(deps);
  const [result, setResult] = useState<Result<T>>({ key: "", data: null, error: "" });

  useEffect(() => {
    if (!subscribe || !isFirebaseConfigured) return;
    return subscribe(
      (data) => setResult({ key, data, error: "" }),
      (err) => setResult({ key, data: null, error: friendlyError(err) }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data: result.data, error: result.error, loading: isFirebaseConfigured && result.key !== key };
}

// "Now" for date maths in render: the time the app loaded in this browser.
// Read via useSyncExternalStore so prerendering never touches the clock.
const loadedAt = typeof window === "undefined" ? 0 : Date.now();
const noopSubscribe = () => () => {};
export function useNow() {
  return useSyncExternalStore(noopSubscribe, () => loadedAt, () => 0);
}
