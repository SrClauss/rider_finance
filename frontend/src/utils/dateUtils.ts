/**
 * Utilitários para manipulação de datas no formato padronizado "2025-08-30 08:00:00"
 */

/**
 * Formata uma data para o formato padronizado "2025-08-30 08:00:00"
 * @param date - Data a ser formatada
 * @returns String no formato "YYYY-MM-DD HH:mm:ss"
 */
export function formatDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Cria uma data atual formatada no padrão "2025-08-30 08:00:00"
 * @returns String com data/hora atual formatada
 */
export function getCurrentDateTime(): string {
  return formatDateTime(new Date());
}

/**
 * Converte uma string de data para Date object
 * @param dateTimeStr - String no formato "2025-08-30 08:00:00" ou "2025-08-30T08:00:00"
 * @returns Date object
 */
export function parseDateTime(dateTimeStr: string): Date {
  // Remove espaços e converte para formato ISO se necessário
  const normalized = dateTimeStr.replace(' ', 'T');
  return new Date(normalized);
}

/**
 * Formata data para input datetime-local (YYYY-MM-DDTHH:mm)
 * @param date - Data a ser formatada
 * @returns String no formato "YYYY-MM-DDTHH:mm"
 */
export function formatForDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
