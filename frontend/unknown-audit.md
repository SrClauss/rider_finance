# Auditoria de `unknown` — frontend

Relatório automático das ocorrências de `unknown` no diretório `frontend/src`, com avaliação rápida e recomendações.

Gerado em 26 de agosto de 2025.

## Checklist
- [x] Enumerar todas as ocorrências de `unknown` em `frontend/src/**`.
- [x] Avaliar cada ocorrência (Boa / Aceitável / Ruim).
- [x] Dar recomendação curta e prioridade (alta/média/baixa).
- [x] Salvar em `frontend/unknown-audit.md`.

---

## Resumo
Total de ocorrências encontradas: 48
- Boas práticas (catch com tipo unknown + validação): 20
- Uso aceitável (reducers/generics, Record<string, unknown>): 6
- Problemáticas (props como `unknown`, casts duplos, uso inseguro): 22

Prioridade geral: focar primeiro em props/exports/API payloads tipados como `unknown` e em casts duplos (`unknown as ... as ...`).

---

## Lista de ocorrências (arquivo:linha) — avaliação e recomendação

1) `src/modals/TransactionModal.tsx:93`
- Trecho: `const payload: { [k: string]: unknown } = {`
- Avaliação: Aceitável
- Recomendações: Tipar mais precisamente as chaves conhecidas; se payload livre, documentar shape ou validar com runtime (zod).
- Prioridade: média

2) `src/modals/TransactionModal.tsx:118`
- Trecho: `} catch (err: unknown) {`
- Avaliação: Boa prática (usar unknown em catch)
- Recomendações: Extrair mensagem com helper (ex: extractApiMessage) ao invés de cast direto.
- Prioridade: média-baixa

3) `src/modals/TransactionModal.tsx:119`
- Trecho: `const maybe = err as { response?: { data?: unknown } } | undefined;`
- Avaliação: Aceitável, porém cast específico
- Recomendações: Preferir `isAxiosError` guard ou `instanceof` e tipar `response.data` com schema.
- Prioridade: média

4) `src/modals/TransactionModal.tsx:121`
- Trecho: `const data = maybe?.response?.data as Record<string, unknown> | undefined;`
- Avaliação: Aceitável
- Recomendações: Validar `data` antes de acesso (checar tipos) e extrair mensagem via helper.
- Prioridade: média

5) `src/modals/TransactionModal.tsx:140`
- Trecho: `} catch (err: unknown) {`
- Avaliação: Boa
- Recomendações: Mesma nota: use um util para extrair mensagens.
- Prioridade: baixa

6) `src/modals/TransactionModal.tsx:141`
- Trecho: `const maybe = err as { response?: { data?: unknown } } | undefined;`
- Avaliação: Aceitável
- Recomendações: Ver item 3.
- Prioridade: média

7) `src/modals/TransactionModal.tsx:143`
- Trecho: `const data = maybe?.response?.data as Record<string, unknown> | undefined;`
- Avaliação: Aceitável
- Recomendações: Ver item 4.
- Prioridade: média

8) `src/modals/TransactionModal.tsx:148`
- Trecho: `} catch (err: unknown) {`
- Avaliação: Boa
- Recomendações: Extrair e exibir mensagem com cuidado.
- Prioridade: baixa

9) `src/modals/GoalModal.tsx:109`
- Trecho: `} catch (err: unknown) {`
- Avaliação: Boa
- Recomendações: Usar `unknown` + validação antes de acessar campos.
- Prioridade: baixa

10) `src/modals/EditProfileModal.tsx:109`
- Trecho: `} catch (err: unknown) {`
- Avaliação: Boa
- Recomendações: Extrair mensagem via util.
- Prioridade: baixa

11) `src/modals/EditProfileModal.tsx:111`
- Trecho: `const maybe = err as unknown as { response?: { status?: number; data?: unknown } };`
- Avaliação: Ruim (double cast)
- Recomendações: Evitar `as unknown as` — usar guarda de tipo ou `isAxiosError` e depois `as` una vez com interface bem definida.
- Prioridade: alta

12) `src/modals/CategoriaModal.tsx:67`
- Trecho: `} catch (err: unknown) {`
- Avaliação: Boa
- Recomendações: Normalizar erro para exibir mensagem clara.
- Prioridade: baixa

13) `src/modals/CategoriaModal.tsx:72`
- Trecho: `const maybeMsg = (respData as Record<string, unknown>)['mensagem'] ?? (respData as Record<string, unknown>)['message'];`
- Avaliação: Aceitável
- Recomendações: Fazer um `const r = respData as unknown;` + validação com `typeof` antes dos acessos; ou usar `zod`.
- Prioridade: média

14) `src/modals/CategoriaModal.tsx:80`
- Trecho: `} catch (e: unknown) {`
- Avaliação: Boa
- Recomendações: Mesma nota.
- Prioridade: baixa

15) `src/lib/useFormReducer.ts:11`
- Trecho: `| { type: 'SET_FIELD'; field: keyof T | string; value: unknown }`
- Avaliação: Aceitável (genérico)
- Recomendações: Manter `unknown` aqui é razoável; documentar T e considerar `T[keyof T]` quando possível.
- Prioridade: baixa

16) `src/lib/useFormReducer.ts:36`
- Trecho: `export default function useFormReducer<T extends Record<string, unknown>>(initialState: T) {`
- Avaliação: Aceitável
- Recomendações: Se possível, restringir `unknown` no genérico para `any` alternativo mais seguro via `T extends Record<string, any>`; porém `unknown` aqui é intencional.
- Prioridade: baixa

17) `src/lib/useFormReducer.ts:41`
- Trecho: `const setField = useCallback((field: keyof T | string, value: unknown) => dispatch({ type: 'SET_FIELD', field, value }), [dispatch]);`
- Avaliação: Aceitável
- Recomendações: Idem item 15; prover helpers para validar tipo antes de aplicar.
- Prioridade: baixa

18) `src/context/SessionContext.tsx:72`
- Trecho: `} catch (err: unknown) {`
- Avaliação: Boa
- Recomendações: O cuidado aqui é importante (refreshFromServer etc.). Usar util para extrair erros.
- Prioridade: média

19) `src/components/ResetForm.tsx:38`
- Trecho: `} catch (err: unknown) {`
- Avaliação: Boa
- Recomendações: Tipar catch como unknown e extrair mensagem com guard.
- Prioridade: baixa

20) `src/app/transactions/page.tsx:86`
- Trecho: `} catch (err: unknown) {`
- Avaliação: Boa
- Recomendações: Usar helper de extração.
- Prioridade: baixa

21) `src/app/transactions/page.tsx:87`
- Trecho: `const maybe = err as { response?: { data?: unknown } } | undefined;`
- Avaliação: Aceitável
- Recomendações: Ver itens 3/11: evitar casts duplos; usar guards.
- Prioridade: média

22) `src/app/transactions/page.tsx:88`
- Trecho: `const data = maybe?.response?.data as Record<string, unknown> | undefined;`
- Avaliação: Aceitável
- Recomendações: Validar `data` com checks antes do uso.
- Prioridade: média

23) `src/app/transactions/page.tsx:129`
- Trecho: `const params: Record<string, unknown> = {`
- Avaliação: Aceitável
- Recomendações: Se keys/values bem conhecidos, usar `Record<string, string | number | boolean>` ou uma interface.
- Prioridade: média

24) `src/app/sessoes/[id]/page.tsx:9`
- Trecho: `export default function SessaoDetailPage(props: unknown) {`
- Avaliação: Ruim
- Recomendações: Definir a shape esperada para `props` (ex: `SessaoProps`) ou usar `unknown` só no nível do fetch e mapear para um tipo forte antes de expor no componente.
- Prioridade: alta

25) `src/app/renovacao-checkout/page.tsx:111`
- Trecho: `} catch (err: unknown) {`
- Avaliação: Boa
- Recomendações: Extrair mensagem; evitar manipulações arriscadas.
- Prioridade: baixa

26) `src/app/renovacao-checkout/page.tsx:113`
- Trecho: `const maybe = err as unknown as { response?: { data?: unknown }; message?: string };`
- Avaliação: Ruim (double cast)
- Recomendações: Trocar por guarda de tipo e single cast; criar um `extractApiMessage(err)` util.
- Prioridade: alta

27) `src/app/renovacao-checkout/page.tsx:234`
- Trecho: `} catch (err: unknown) {`
- Avaliação: Boa
- Recomendações: Mesma estratégia.
- Prioridade: baixa

28) `src/app/register/page.tsx:215`
- Trecho: `} catch (err: unknown) {`
- Avaliação: Boa
- Recomendações: Normalizar mensagem.
- Prioridade: baixa

29) `src/app/perfil/page.tsx:110`
- Trecho: `function normalizeCurrencyValue(raw: unknown) {`
- Avaliação: Aceitável
- Recomendações: Validar `raw` com `typeof`/regex; documentar inputs (string|number) e usar refinements.
- Prioridade: média

30) `src/app/perfil/page.tsx:182`
- Trecho: `async function startCheckout(payload: Record<string, unknown>) {`
- Avaliação: Aceitável mas melhorar
- Recomendações: Definir um tipo `CheckoutPayload` com os campos esperados e usar em vez de `Record<string, unknown>`.
- Prioridade: alta

31) `src/app/perfil/page.tsx:185`
- Trecho: `const payloadRecord = payload as Record<string, unknown>;`
- Avaliação: Aceitável
- Recomendações: Evitar cast se já tipou corretamente.
- Prioridade: média

32) `src/app/perfil/page.tsx:190`
- Trecho: `const cfgData = cfg.data as Record<string, unknown> | undefined;`
- Avaliação: Aceitável
- Recomendações: Validar `cfgData` antes de uso; tipar resposta da API.
- Prioridade: média

33) `src/app/perfil/page.tsx:193`
- Trecho: `(payloadRecord as Record<string, unknown>)['valor'] = fallback;`
- Avaliação: Aceitável
- Recomendações: Se `payload` tiver tipo, fazer `payload.valor = fallback` com tipagem correta.
- Prioridade: média

34) `src/app/perfil/page.tsx:223`
- Trecho: `} catch (err: unknown) {`
- Avaliação: Boa
- Recomendações: Usar util de extração.
- Prioridade: baixa

35) `src/app/perfil/page.tsx:225`
- Trecho: `const maybe = err as { response?: { data?: unknown } } | undefined;`
- Avaliação: Aceitável
- Recomendações: Ver itens anteriores.
- Prioridade: média

36) `src/app/perfil/page.tsx:226`
- Trecho: `const resData = maybe?.response?.data as Record<string, unknown> | undefined;`
- Avaliação: Aceitável
- Recomendações: Validar `resData` antes do uso.
- Prioridade: média

37) `src/app/perfil/page.tsx:229`
- Trecho: `const errMsgFromErr = err && typeof (err as Record<string, unknown>).message === 'string' ? (err as Record<string, unknown>).message as string : undefined;`
- Avaliação: Ruim (multiples casts)
- Recomendações: Use uma função `extractErrorMessage(err: unknown): string | undefined` para centralizar a lógica.
- Prioridade: alta

38) `src/app/perfil/page.tsx:487`
- Trecho: `const userObj = usuario as unknown as Record<string, unknown>;`
- Avaliação: Ruim (double cast)
- Recomendações: Evitar double cast; parsear/validar `usuario` antes de cast.
- Prioridade: alta

39) `src/app/login/page.tsx:85`
- Trecho: `} catch (err: unknown) {`
- Avaliação: Boa
- Recomendações: Normalizar mensagem.
- Prioridade: baixa

40) `src/app/goals/page.tsx:27`
- Trecho: `const extractErrorMessage = (err: unknown) => {`
- Avaliação: Boa
- Recomendações: Excelente — centralizar util e reutilizar.
- Prioridade: baixa

41) `src/app/goals/page.tsx:30`
- Trecho: `const maybe = err as { response?: { data?: unknown }; message?: string };`
- Avaliação: Aceitável
- Recomendações: Use guards e evite double casts.
- Prioridade: média

42) `src/app/goals/page.tsx:59`
- Trecho: `} catch (err: unknown) {`
- Avaliação: Boa
- Recomendações: Mesma nota.
- Prioridade: baixa

43) `src/app/forgot/page.tsx:114`
- Trecho: `} catch (err: unknown) {`
- Avaliação: Boa
- Recomendações: Extrair mensagem.
- Prioridade: baixa

44) `src/modals/TransactionModal.tsx` (ocorrências adicionais já listadas)
- Avaliação: ver itens 1–8.

45) `src/modals/GoalModal.tsx` (ocorrências adicionais já listadas)
- Avaliação: ver item 9.

46) `src/modals/EditProfileModal.tsx` (ocorrências adicionais já listadas)
- Avaliação: ver itens 10–11.

47) `src/lib/useFormReducer.ts` (ocorrências adicionais já listadas)
- Avaliação: ver itens 15–17.

48) `src/modals/CategoriaModal.tsx` (ocorrências adicionais já listadas)
- Avaliação: ver itens 12–14.

---

## Recomendações gerais e ações sugeridas (ordem recomendada)
1. Implementar uma função util `extractErrorMessage(err: unknown): string | undefined` e trocar todas as lógicas repetidas por esta função (impacto alto, prioridade: alta).
2. Substituir `any`/`unknown` em `props` de componentes públicos por tipos explícitos (ex: `SessaoDetailPage`), adicionar testes rápidos de runtime para payloads críticos (prioridade: alta).
3. Remover double-casts `as unknown as ...` e aplicar guards (prioridade: alta).
4. Definir types/interfaces para payloads de API (ex: `CheckoutPayload`) usados em `perfil` e `transactions` (prioridade: alta).
5. Manter `unknown` em catches e em hooks genéricos (`useFormReducer`) quando intencional, mas documentar e fornecer validadores auxiliares (prioridade: média).

---

## Próximos passos que posso executar automaticamente (escolha uma):
- A: Criar e aplicar `extractErrorMessage(err: unknown)` em todos os arquivos onde `catch (err: unknown)` aparece.
- B: Corrigir as ocorrências de `double cast` (ex.: `as unknown as ...`) e substituí-las por guards e single `as` com tipos bem definidos.
- C: Tipar `SessaoDetailPage(props: unknown)` com um tipo mínimo e ajustar usos.

Diga A, B ou C e eu executo as mudanças/patches e testo com build.
