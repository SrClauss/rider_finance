/**
 * parseNumber
 * Aceita strings numéricas com separador decimal vírgula ou ponto e retorna
 * um inteiro (Math.round). Exemplos:
 *  "1.200,50" -> 120050 (se considerar centavos) ou, neste projeto, assumimos valores inteiros e
 *  apenas removemos separadores de milhares e convertemos decimais para número arredondado.
 */
export function parseNumberToInt(value: string | number | undefined | null): number {
  if (value == null) return 0;
  if (typeof value === 'number' && !isNaN(value)) return Math.round(value);
  let s = String(value).trim();
  if (!s) return 0;
  // Remover espaços
  s = s.replace(/\s+/g, '');
  // Se houver vírgula como separador decimal e pontos como milhares: "1.234,56"
  if (s.indexOf(',') !== -1 && s.indexOf('.') !== -1) {
    // remove pontos (milhares) e trocar vírgula por ponto
    s = s.replace(/\./g, '').replace(/,/g, '.');
  } else if (s.indexOf(',') !== -1) {
    // apenas vírgula presente -> tratamos como separador decimal
    s = s.replace(/,/g, '.');
  } else {
    // apenas pontos ou nenhum -> remover espaços extras
    s = s.replace(/\./g, ''); // remover pontos como separador de milhares
  }
  const n = Number(s);
  if (isNaN(n)) return 0;
  // Retornar em centavos (multiplica por 100) para compatibilidade com armazenamento em i32 de centavos
  return Math.round(n * 100);
}

export default parseNumberToInt;
