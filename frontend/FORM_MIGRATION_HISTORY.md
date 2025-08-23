# Form Migration History

Este arquivo registra as alterações feitas migrando formulários de useState para useReducer.

## 2025-08-23
- frontend/src/modals/CategoriaModal.tsx
  - Migrado `form`, `loading` e `error` de `useState` para `useReducer`.
  - Criado `initialState`, `Action` types e `reducer`.
  - Substituído `setForm` por `dispatch({ type: 'SET_FIELD', field, value })`.
  - Handlers atualizados: `handleChange`, `handleSubmit` e `useEffect` para reset.
  - Observações: comportamento funcional preservado; mantida tipagem mínima `FormState`.

- frontend/src/lib/useFormReducer.ts
  - Novo hook reutilizável `useFormReducer<T>(initialState)` com API: `{ state, dispatch, setField, reset, setLoading, setError, setState }`.
  - Centraliza ações comuns (SET_FIELD, RESET, SET_LOADING, SET_ERROR, SET_STATE).

- frontend/src/modals/CategoriaModal.tsx
  - Refatorado para usar `useFormReducer` em vez de reducer local; código do modal ficou mais conciso e consistente com padrão a ser aplicado nos demais modais.

- frontend/src/modals/TransactionModal.tsx
  - Migrado `form`, `loading` e `error` de `useState` para `useFormReducer`.
  - Substituído `setForm` por `setField`/`setState`/`reset` do hook.
  - Handlers atualizados: `handleChange` agora usa `setField`; `handleSubmit` usa `setLoading`/`setError`.
  - Observações: comportamento preservado; campos de data continuam formatados para backend.

- frontend/src/modals/GoalModal.tsx
  - Migrado `form`, `loading` e `error` de `useState` para `useFormReducer`.
  - Substituído `setForm` por `setField`/`setState`/`reset` do hook.
  - Handlers atualizados: `handleChange` agora usa `setField`; `handleSubmit` usa `setLoading`/`setError`.
  - Observações: comportamento preservado; campos de data continuam formatados para backend.

