import { useReducer, useCallback } from 'react';

type InternalMeta = {
  loading?: boolean;
  error?: string | null;
};

type InternalState<T> = T & InternalMeta;

type Action<T> =
  | { type: 'SET_FIELD'; field: keyof T | string; value: unknown }
  | { type: 'RESET' }
  | { type: 'SET_LOADING'; value: boolean }
  | { type: 'SET_ERROR'; value: string | null }
  | { type: 'SET_STATE'; payload: Partial<T> };

function createReducer<T>(initial: InternalState<T>) {
  return function reducer(state: InternalState<T>, action: Action<T>): InternalState<T> {
    switch (action.type) {
      case 'SET_FIELD':
        return { ...state, [action.field]: action.value } as InternalState<T>;
      case 'RESET':
        return { ...initial };
      case 'SET_LOADING':
        return { ...state, loading: action.value };
      case 'SET_ERROR':
        return { ...state, error: action.value };
      case 'SET_STATE':
        return { ...state, ...(action.payload as Partial<T>) };
      default:
        return state;
    }
  };
}

export default function useFormReducer<T extends Record<string, unknown>>(initialState: T) {
  const initial: InternalState<T> = { ...initialState, loading: false, error: null };
  const reducer = createReducer<T>(initial);
  const [state, dispatch] = useReducer(reducer, initial);

  const setField = useCallback((field: keyof T | string, value: unknown) => dispatch({ type: 'SET_FIELD', field, value }), [dispatch]);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), [dispatch]);
  const setLoading = useCallback((value: boolean) => dispatch({ type: 'SET_LOADING', value }), [dispatch]);
  const setError = useCallback((value: string | null) => dispatch({ type: 'SET_ERROR', value }), [dispatch]);
  const setState = useCallback((payload: Partial<T>) => dispatch({ type: 'SET_STATE', payload }), [dispatch]);

  return { state, dispatch, setField, reset, setLoading, setError, setState } as const;
}
