/**
 * Utilitários para manipulação de datas no formato padronizado "2025-08-30 08:00:00"
 */

use chrono::{NaiveDateTime, Utc};

/**
 * Formata uma NaiveDateTime para o formato padronizado "2025-08-30 08:00:00"
 */
pub fn format_datetime(dt: &NaiveDateTime) -> String {
    dt.format("%Y-%m-%d %H:%M:%S").to_string()
}

/**
 * Retorna a data/hora atual formatada no padrão "2025-08-30 08:00:00"
 */
pub fn current_datetime() -> String {
    format_datetime(&Utc::now().naive_utc())
}

/**
 * Faz parse de uma string de data/hora no formato "2025-08-30 08:00:00"
 * Suporta também formatos sem segundos ou com T ao invés de espaço
 */
pub fn parse_datetime(date_str: &str) -> Result<NaiveDateTime, chrono::ParseError> {
    // Tenta primeiro o formato completo com segundos
    match NaiveDateTime::parse_from_str(date_str, "%Y-%m-%d %H:%M:%S") {
        Ok(dt) => Ok(dt),
        Err(_) => {
            // Tenta formato sem segundos
            match NaiveDateTime::parse_from_str(date_str, "%Y-%m-%d %H:%M") {
                Ok(dt) => Ok(dt),
                Err(_) => {
                    // Tenta formato com T ao invés de espaço
                    match NaiveDateTime::parse_from_str(date_str, "%Y-%m-%dT%H:%M:%S") {
                        Ok(dt) => Ok(dt),
                        Err(_) => {
                            // Tenta formato com T sem segundos
                            NaiveDateTime::parse_from_str(date_str, "%Y-%m-%dT%H:%M")
                        }
                    }
                }
            }
        }
    }
}

/**
 * Faz parse robusto de uma string de data/hora, retornando None se falhar
 */
pub fn parse_datetime_safe(date_str: &str) -> Option<NaiveDateTime> {
    parse_datetime(date_str).ok()
}
