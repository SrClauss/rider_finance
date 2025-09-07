# Padronização de Datas para UTC - Rider Finance

## Análise do Projeto Atual

### Estrutura Identificada
- **Backend**: Rust (Axum) com Diesel ORM e PostgreSQL
- **Frontend**: Next.js com TypeScript
- **Datas**: Uso inconsistente de fusos horários (local, UTC, ou não especificado)
- **Banco de Dados**: Campos de data armazenados como `TIMESTAMP` sem timezone

### Problemas Identificados
1. **Inconsistência**: Algumas datas são armazenadas em UTC, outras no horário local.
2. **Conversões**: Erros ao converter entre fusos horários no frontend e backend.
3. **Relatórios**: Dados de diferentes fusos horários geram inconsistências.
4. **Debugging**: Dificuldade em rastrear eventos devido a fusos horários mistos.

## Objetivos da Padronização

### Fluxo de Uso Definido
1. **Armazenamento**: Todas as datas no banco de dados devem ser armazenadas em UTC.
2. **Backend**: Todas as operações de manipulação de datas devem usar UTC como padrão.
3. **Frontend**: Todas as datas recebidas do backend devem ser tratadas como UTC e convertidas para o fuso horário local do usuário apenas na exibição.
4. **APIs**: Todas as APIs devem enviar e receber datas em formato ISO 8601 com timezone explícito (ex.: `2025-09-07T12:00:00Z`).
5. **Logs**: Todas as entradas de log devem usar UTC para timestamps.

### Requisitos Funcionais
- ✅ Armazenar todas as datas no banco de dados em UTC.
- ✅ Garantir que todas as APIs enviem e recebam datas em formato ISO 8601 com timezone explícito.
- ✅ Atualizar todas as manipulações de data no backend para usar UTC como padrão.
- ✅ Converter datas para o fuso horário local do usuário apenas no frontend.
- ✅ Atualizar logs para usar timestamps em UTC.

### Requisitos Não-Funcionais
- ✅ Garantir compatibilidade com dados legados (migração de dados existentes para UTC).
- ✅ Documentar claramente o padrão de uso de UTC para toda a equipe.
- ✅ Garantir que a padronização não introduza regressões ou quebras no sistema.

### Plano de Implementação
1. **Análise de Impacto**:
   - Identificar todos os pontos no código onde datas são manipuladas ou armazenadas.
   - Mapear todos os campos de data no banco de dados.
2. **Migração de Dados**:
   - Escrever scripts para converter campos de data existentes para UTC.
   - Validar a consistência dos dados após a migração.
3. **Atualização do Backend**:
   - Atualizar todas as funções que manipulam datas para usar UTC.
   - Garantir que todas as APIs enviem e recebam datas em formato ISO 8601 com timezone explícito.
4. **Atualização do Frontend**:
   - Garantir que todas as datas recebidas do backend sejam tratadas como UTC.
   - Implementar conversão para o fuso horário local do usuário na exibição.
5. **Atualização de Logs**:
   - Configurar o logger para usar timestamps em UTC.
6. **Testes**:
   - Escrever testes para validar a consistência das datas em todo o sistema.
   - Testar a migração de dados em um ambiente de staging.
7. **Documentação**:
   - Atualizar a documentação do projeto para refletir o padrão de uso de UTC.
   - Comunicar a mudança para toda a equipe.

### Métricas de Sucesso
- ✅ 100% das datas armazenadas no banco de dados em UTC.
- ✅ 100% das APIs enviando e recebendo datas em formato ISO 8601 com timezone explícito.
- ✅ Nenhuma inconsistência de fuso horário detectada nos testes.
- ✅ Redução de erros relacionados a fusos horários em produção.

### Cronograma
- **Semana 1**: Análise de impacto e planejamento.
- **Semana 2**: Migração de dados e atualização do backend.
- **Semana 3**: Atualização do frontend e logs.
- **Semana 4**: Testes e validação.
- **Semana 5**: Documentação e lançamento.
