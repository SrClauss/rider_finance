function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export function extractErrorMessage(err: unknown): string | undefined {
  if (err == null) return undefined;
  // axios-like error: err.response?.data?.message || err.response?.data?.mensagem
  if (isObject(err)) {
    try {
      const respRaw = (err as Record<string, unknown>)['response'] as unknown;
      const respData = isObject(respRaw) ? (respRaw as Record<string, unknown>)['data'] : undefined;
      if (respData) {
        if (typeof respData === 'string') return respData;
        if (isObject(respData)) {
          if (typeof (respData as Record<string, unknown>)['message'] === 'string') return (respData as Record<string, unknown>)['message'] as string;
          if (typeof (respData as Record<string, unknown>)['mensagem'] === 'string') return (respData as Record<string, unknown>)['mensagem'] as string;
        }
      }
      if (typeof (err as Record<string, unknown>)['message'] === 'string') return (err as Record<string, unknown>)['message'] as string;
    } catch {
      // ignore
    }
  }
  if (typeof err === 'string') return err;
  return undefined;
}

export function getAxiosResponseInfo(err: unknown): { status?: number; data?: unknown } | undefined {
  if (isObject(err)) {
    const respRaw = (err as Record<string, unknown>)['response'] as unknown;
    if (isObject(respRaw)) {
      const status = (respRaw as Record<string, unknown>)['status'] as number | undefined;
      const data = (respRaw as Record<string, unknown>)['data'] as unknown;
      return { status: status, data };
    }
  }
  return undefined;
}
