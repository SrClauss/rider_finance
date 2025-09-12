export interface TimeZone {
  label: string;
  hours: number;
  minutes: number;
  
}





export const timeZones: { [key: string]: TimeZone } = {
  "UTC-12:00": { label: "UTC-12:00", hours: -12, minutes: 0 },
  "Pacific/Midway (UTC-11:00)": { label: "Pacific/Midway (UTC-11:00)", hours: -11, minutes: 0 },
  "Pacific/Honolulu (UTC-10:00)": { label: "Pacific/Honolulu (UTC-10:00)", hours: -10, minutes: 0 },
  "Pacific/Marquesas": { label: "Pacific/Marquesas", hours: -9, minutes: -30 },
  "America/Anchorage (UTC-09:00)": { label: "America/Anchorage (UTC-09:00)", hours: -9, minutes: 0 },
  "America/Los_Angeles (UTC-08:00)": { label: "America/Los_Angeles (UTC-08:00)", hours: -8, minutes: 0 },
  "America/Denver (UTC-07:00)": { label: "America/Denver (UTC-07:00)", hours: -7, minutes: 0 },
  "America/Chicago (UTC-06:00)": { label: "America/Chicago (UTC-06:00)", hours: -6, minutes: 0 },
  "America/New_York (UTC-05:00)": { label: "America/New_York (UTC-05:00)", hours: -5, minutes: 0 },
  "America/Halifax (UTC-04:00)": { label: "America/Halifax (UTC-04:00)", hours: -4, minutes: 0 },
  "America/St_Johns": { label: "America/St_Johns", hours: -3, minutes: -30 },
  "America/Sao_Paulo (UTC-03:00)": { label: "America/Sao_Paulo (UTC-03:00)", hours: -3, minutes: 0 },
  "Atlantic/South_Georgia (UTC-02:00)": { label: "Atlantic/South_Georgia (UTC-02:00)", hours: -2, minutes: 0 },
  "Atlantic/Azores (UTC-01:00)": { label: "Atlantic/Azores (UTC-01:00)", hours: -1, minutes: 0 },
  "UTC±00:00": { label: "UTC±00:00", hours: 0, minutes: 0 },
  "Europe/London (UTC+01:00)": { label: "Europe/London (UTC+01:00)", hours: 1, minutes: 0 },
  "Europe/Berlin (UTC+02:00)": { label: "Europe/Berlin (UTC+02:00)", hours: 2, minutes: 0 },
  "Europe/Moscow (UTC+03:00)": { label: "Europe/Moscow (UTC+03:00)", hours: 3, minutes: 0 },
  "Asia/Tehran (UTC+03:30)": { label: "Asia/Tehran (UTC+03:30)", hours: 3, minutes: 30 },
  "Asia/Dubai (UTC+04:00)": { label: "Asia/Dubai (UTC+04:00)", hours: 4, minutes: 0 },
  "Asia/Kabul (UTC+04:30)": { label: "Asia/Kabul (UTC+04:30)", hours: 4, minutes: 30 },
  "Asia/Karachi (UTC+05:00)": { label: "Asia/Karachi (UTC+05:00)", hours: 5, minutes: 0 },
  "Asia/Kolkata (UTC+05:30)": { label: "Asia/Kolkata (UTC+05:30)", hours: 5, minutes: 30 },
  "Asia/Kathmandu (UTC+05:45)": { label: "Asia/Kathmandu (UTC+05:45)", hours: 5, minutes: 45 },
  "Asia/Dhaka (UTC+06:00)": { label: "Asia/Dhaka (UTC+06:00)", hours: 6, minutes: 0 },
  "Asia/Bangkok (UTC+07:00)": { label: "Asia/Bangkok (UTC+07:00)", hours: 7, minutes: 0 },
  "Asia/Shanghai (UTC+08:00)": { label: "Asia/Shanghai (UTC+08:00)", hours: 8, minutes: 0 },
  "Australia/Eucla (UTC+08:45)": { label: "Australia/Eucla (UTC+08:45)", hours: 8, minutes: 45 },
  "Asia/Tokyo (UTC+09:00)": { label: "Asia/Tokyo (UTC+09:00)", hours: 9, minutes: 0 },
  "Australia/Adelaide (UTC+09:30)": { label: "Australia/Adelaide (UTC+09:30)", hours: 9, minutes: 30 },
  "Australia/Sydney (UTC+10:00)": { label: "Australia/Sydney (UTC+10:00)", hours: 10, minutes: 0 },
  "Australia/Lord_Howe (UTC+10:30)": { label: "Australia/Lord_Howe (UTC+10:30)", hours: 10, minutes: 30 },
  "Pacific/Noumea (UTC+11:00)": { label: "Pacific/Noumea (UTC+11:00)", hours: 11, minutes: 0 },
  "Pacific/Norfolk (UTC+11:30)": { label: "Pacific/Norfolk (UTC+11:30)", hours: 11, minutes: 30 },
  "Pacific/Auckland (UTC+12:00)": { label: "Pacific/Auckland (UTC+12:00)", hours: 12, minutes: 0 },
  "Pacific/Chatham (UTC+12:45)": { label: "Pacific/Chatham (UTC+12:45)", hours: 12, minutes: 45 },
  "Pacific/Tongatapu (UTC+13:00)": { label: "Pacific/Tongatapu (UTC+13:00)", hours: 13, minutes: 0 },
  "Pacific/Kiritimati (UTC+14:00)": { label: "Pacific/Kiritimati (UTC+14:00)", hours: 14, minutes: 0 },
  }


export function formatDateToUtc(date: Date, timezone: TimeZone): string {
  const localDate = new Date(date.getTime() + (timezone.hours * 60 + timezone.minutes) * 60000);
  return localDate.toISOString();
}

export function parseUtcToDate(utcString: string, timezone: TimeZone): Date {
  const date = new Date(utcString);
  const localDate = new Date(date.getTime() + (timezone.hours * 60 + timezone.minutes) * 60000);
  return localDate;
}


export function getCurrentDateTime(): Date {
  // Retorna a data/hora atual do navegador. Não usa timezone.
  return new Date();
}
export function getCurrentUtcDateTime(): string {
  const now = new Date();
  return now.toISOString();
}

export function convertToUtc(date: Date, timezone: TimeZone): string {
  const utcDate = new Date(date.getTime() - (timezone.hours * 60 + timezone.minutes) * 60000);
  return utcDate.toISOString();
}

export function toBackendLocalString(date: Date, timezone: TimeZone): string {
  const offset = (timezone.hours * 60 + timezone.minutes) * 60000;
  const localDate = new Date(date.getTime() + offset);
  return localDate.toISOString();
}

/**
 * Converte uma data UTC (string ISO) para uma data local formatada
 * @param utcDateString - String de data em UTC (formato ISO)
 * @param timezone - Timezone do usuário
 * @returns String formatada no padrão brasileiro
 */
export function formatUtcToLocalString(utcDateString: string, timezone: TimeZone): string {
  const localDate = parseUtcToDate(utcDateString, timezone);
  
  return localDate.toLocaleString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Converte uma data UTC (string ISO) para apenas a data local formatada
 * @param utcDateString - String de data em UTC (formato ISO)
 * @param timezone - Timezone do usuário
 * @returns String formatada apenas com a data
 */
export function formatUtcToLocalDateString(utcDateString: string, timezone: TimeZone): string {
  const localDate = parseUtcToDate(utcDateString, timezone);
  
  return localDate.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Converte uma data UTC (string ISO) para apenas o horário local formatado
 * @param utcDateString - String de data em UTC (formato ISO)
 * @param timezone - Timezone do usuário
 * @returns String formatada apenas com o horário
 */
/**
 * Converte uma data UTC (string ISO) para apenas o horário local formatado
 * @param utcDateString - String de data em UTC (formato ISO)
 * @param timezone - Timezone do usuário
 * @returns String formatada apenas com o horário
 */
export function formatUtcToLocalTimeString(utcDateString: string, timezone: TimeZone): string {
  const localDate = parseUtcToDate(utcDateString, timezone);
  
  return localDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Hook para usar funções de data com timezone do usuário
 * Deve ser usado dentro de um componente que tenha acesso ao contexto do usuário
 */
export function useDateWithTimezone() {
  // Esta função será chamada nos componentes React
  // Por isso não podemos usar hooks aqui, apenas retornar as funções
  
  return {
    formatUtcToLocal: (utcDateString: string, timezone: TimeZone) => 
      formatUtcToLocalString(utcDateString, timezone),
    formatUtcToLocalDate: (utcDateString: string, timezone: TimeZone) => 
      formatUtcToLocalDateString(utcDateString, timezone),
    formatUtcToLocalTime: (utcDateString: string, timezone: TimeZone) => 
      formatUtcToLocalTimeString(utcDateString, timezone),
    convertToUtc: (date: Date, timezone: TimeZone) => 
      convertToUtc(date, timezone),
    parseUtcToDate: (utcString: string, timezone: TimeZone) => 
      parseUtcToDate(utcString, timezone),
  };
}

/**
 * Função auxiliar para obter o timezone do usuário a partir das configurações
 * @param configuracoes - Array de configurações do usuário
 * @returns TimeZone object
 */
export function getUserTimezone(configuracoes: { chave: string; valor: string }[]): TimeZone {
  const timeZoneValue = configuracoes.find(c => c.chave === 'time_zone')?.valor || 'America/Sao_Paulo (UTC-03:00)';
  return timeZones[timeZoneValue as keyof typeof timeZones] || timeZones["America/Sao_Paulo (UTC-03:00)"];
}