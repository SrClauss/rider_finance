function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export function extractErrorMessage(err: unknown): string | undefined {
  if (err == null) return undefined;
  try {
    // Handle axios-like errors with response.data
    if (isObject(err)) {
      const respRaw = (err as Record<string, unknown>)['response'] as unknown;
      const respData = isObject(respRaw) ? (respRaw as Record<string, unknown>)['data'] : undefined;
      if (respData) {
        if (typeof respData === 'string') return respData;
        if (isObject(respData)) {
          if (typeof (respData as Record<string, unknown>)['message'] === 'string') return (respData as Record<string, unknown>)['message'] as string;
          if (typeof (respData as Record<string, unknown>)['mensagem'] === 'string') return (respData as Record<string, unknown>)['mensagem'] as string;
          if (typeof (respData as Record<string, unknown>)['error'] === 'string') return (respData as Record<string, unknown>)['error'] as string;
        }
      }
      if (typeof (err as Record<string, unknown>)['message'] === 'string') return (err as Record<string, unknown>)['message'] as string;
    }
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    return JSON.stringify(err);
  } catch {
    return undefined;
  }
}

// Nota: a lógica que extrai status/data da resposta do axios foi inlined nos consumos para
// evitar uma função utilitária extra e manter o código localmente claro.
