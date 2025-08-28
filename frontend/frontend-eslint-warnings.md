# Relatório de Avisos ESLint/TypeScript

Lista de avisos gerados pelo build atual (ordem conforme saída do build). Marcarei cada item como resolvido ([V]) à medida que eu corrigir e validar com um novo build.

1. [V] `./src/app/forgot/page.tsx:169:19` - Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image`. (@next/next/no-img-element)
2. [V] `./src/app/perfil/page.tsx:62:16` - Warning: 'e' is defined but never used. (@typescript-eslint/no-unused-vars)
3. [V] `./src/app/perfil/page.tsx:73:6` - Warning: React Hook useEffect has a missing dependency: 'validateProjecaoMetodo'. (react-hooks/exhaustive-deps)
4. [V] `./src/app/perfil/page.tsx:219:18` - Warning: 'e' is defined but never used. (@typescript-eslint/no-unused-vars)
5. [V] `./src/app/perfil/page.tsx:441:34` - Warning: 'e' is defined but never used. (@typescript-eslint/no-unused-vars)
6. [V] `./src/app/register/page.tsx:4:73` - Warning: 'Link' is defined but never used. (@typescript-eslint/no-unused-vars)
7. [V] `./src/app/register/page.tsx:149:16` - Warning: 'err' is defined but never used. (@typescript-eslint/no-unused-vars)
8. [V] `./src/app/register/page.tsx:196:7` - Warning: Unused eslint-disable directive (no problems were reported from 'no-console').
9. [V] `./src/app/register/page.tsx:211:15` - Warning: 'valor' is assigned a value but never used. (@typescript-eslint/no-unused-vars)
10. [V] `./src/app/register/page.tsx:212:15` - Warning: 'url' is assigned a value but never used. (@typescript-eslint/no-unused-vars)
11. [V] `./src/app/register/page.tsx:307:23` - Warning: Using `<img>` could result in slower LCP and higher bandwidth. (@next/next/no-img-element)
12. [V] `./src/app/relatorios/page.tsx:24:6` - Warning: React Hook useEffect has missing dependencies: 'categorias.length' and 'setCategorias'. (react-hooks/exhaustive-deps)
13. [V] `./src/app/relatorios/page.tsx:59:14` - Warning: 'err' is defined but never used. (@typescript-eslint/no-unused-vars)
14. [ ] `./src/app/renovacao-checkout/page.tsx:18:22` - Warning: '_setAssinatura' is assigned a value but never used. (@typescript-eslint/no-unused-vars)
15. [ ] `./src/app/renovacao-checkout/page.tsx:20:25` - Warning: '_setDiasRestantes' is assigned a value but never used. (@typescript-eslint/no-unused-vars)
16. [ ] `./src/app/renovacao-checkout/page.tsx:41:16` - Warning: 'e' is defined but never used. (@typescript-eslint/no-unused-vars)
17. [ ] `./src/app/renovacao-checkout/page.tsx:75:16` - Warning: 'e' is defined but never used. (@typescript-eslint/no-unused-vars)
18. [ ] `./src/app/renovacao-checkout/page.tsx:236:26` - Warning: 'err' is defined but never used. (@typescript-eslint/no-unused-vars)
19. [V] `./src/app/sessoes/page.tsx:18:6` - Warning: 'PaginatedSessoes' is defined but never used. (@typescript-eslint/no-unused-vars)
20. [V] `./src/app/sessoes/[id]/page.tsx:9:49` - Warning: Unexpected any. Specify a different type. (@typescript-eslint/no-explicit-any) — NOTE: já convertido para `unknown` durante correção.
21. [ ] `./src/app/transactions/page.tsx:55:58` - Warning: 'setFiltros' is assigned a value but never used. (@typescript-eslint/no-unused-vars)
22. [V] `./src/app/transactions/page.tsx:124:6` - Warning: React Hook useEffect has missing dependencies: 'categorias' and 'setCategorias'. (react-hooks/exhaustive-deps)
23. [V] `./src/app/transactions/page.tsx:151:6` - Warning: React Hook useEffect has a missing dependency: 'fetchTransacoes'. (react-hooks/exhaustive-deps)
24. [ ] `./src/app/transactions/page.tsx:154:9` - Warning: 'handleCloseModal' is assigned a value but never used. (@typescript-eslint/no-unused-vars)
25. [ ] `./src/components/goals/GoalCard.tsx:23:11` - Warning: 'atualizarMeta' is assigned a value but never used. (@typescript-eslint/no-unused-vars)
26. [ ] `./src/components/goals/GoalCard.tsx:29:6` - Warning: React Hook useEffect has a missing dependency: 'setLocalGoal'. (react-hooks/exhaustive-deps)
27. [ ] `./src/components/goals/GoalProgress.tsx:57:6` - Warning: React Hook React.useEffect has missing dependencies: 'atualizarMeta', 'meta', and 'total'. (react-hooks/exhaustive-deps)
28. [ ] `./src/components/ResetForm.tsx:38:14` - Warning: 'err' is defined but never used. (@typescript-eslint/no-unused-vars)
29. [V] `./src/components/transactions/TransactionList.tsx:13:8` - Warning: 'axios' is defined but never used. (@typescript-eslint/no-unused-vars)
30. [ ] `./src/context/SessionContext.tsx:115:6` - Warning: React Hook useEffect has a missing dependency: 'refreshFromServer'. (react-hooks/exhaustive-deps)
31. [V] `./src/layouts/LoggedLayout.tsx:52:15` - Warning: 'err' is defined but never used. (@typescript-eslint/no-unused-vars)
32. [V] `./src/layouts/LoggedLayout.tsx:55:6` - Warning: React Hook useEffect has a missing dependency: 'router'. (react-hooks/exhaustive-deps)
33. [V] `./src/modals/EditProfileModal.tsx:70:14` - Warning: 'e' is defined but never used. (@typescript-eslint/no-unused-vars)
34. [ ] `./src/modals/GoalModal.tsx:6:16` - Warning: 'GoalPayload' is defined but never used. (@typescript-eslint/no-unused-vars)
35. [ ] `./src/modals/GoalModal.tsx:75:6` - Warning: React Hook useEffect has missing dependencies: 'reset' and 'setState'. (react-hooks/exhaustive-deps)
36. [ ] `./src/modals/TransactionModal.tsx:11:10` - Warning: 'AcaoTransacao' is defined but never used. (@typescript-eslint/no-unused-vars)
37. [ ] `./src/modals/TransactionModal.tsx:69:6` - Warning: React Hook useEffect has missing dependencies: 'reset' and 'setState'. (react-hooks/exhaustive-deps)
38. [ ] `./src/modals/TransactionModal.tsx:78:6` - Warning: React Hook useEffect has missing dependencies: 'categorias' and 'setCategorias'. (react-hooks/exhaustive-deps)
39. [ ] `./src/theme/ThemeProvider.tsx:9:13` - Warning: '_' is defined but never used. (@typescript-eslint/no-unused-vars)
40. [ ] `./src/theme/ThemeProvider.tsx:28:6` - Warning: React Hook useEffect has a missing dependency: 'mode'. (react-hooks/exhaustive-deps)


---

Vou começar pelo item 1 (substituir `<img>` por `next/image` em `src/app/forgot/page.tsx`) e, após a correção, rodar o build e marcar o item como resolvido no MD.
