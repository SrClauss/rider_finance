# Dashboard — Brainstorming

Este documento reúne o brainstorming organizado para terminar a nova dashboard. Use-o como checklist, cole ideias e marque o que quiser implementar.

## Checklist rápido
- [ok ] Cards KPI (Ganhos/Gastos/Lucro) com deltas percentuais e cor
- [ok ] R$/hora e ganho médio por corrida
- [ ] Sparklines (7 dias) para ganhos/gastos/lucro
- [ ] Gráfico principal (30 dias) multi-linha (ganhos/gastos/lucro)
- [ ] Tabela de dias com drill-down para ver transações do dia
- [ ] Heatmap hora × dia (opcional)
- [ ] Metas / Alertas / Notificações
- [ ] Export CSV / snapshot social

---

## 1) KPIs de topo (cards)
- Cards: Ganhos / Gastos / Lucro — exibir hoje / ontem / semana / mês.
- Mostrar delta percentual vs período anterior com ícone (↑↓) e cor (verde/vermelho).
- Exibir R$/hora (ganhos_hoje / horas_hoje) e R$/corrida (ganhos_hoje / corridas_hoje) como subtítulo.

## 2) Indicadores rápidos de saúde
- Tempo médio por corrida: ganhos / corridas.
- Utilização: horas_trabalhadas / horas_disponiveis (se aplicável).
- Eficácia de metas: barra de progresso para meta_diaria / meta_semanal (se nulas, CTA para configurar).


## 4) Comparações e tendências
- Mostrar: delta % vs semana passada / mês passado (ex.: `ganhos_semana` vs `ganhos_semana_passada`).
- "Top contributors": os 3 dias do mês que mais impactaram ganho (diferença para média).
- Projeção: exibir `projecao_mes` / `projecao_semana` e método `trend_method` (ex.: regressao_linear).

## 5) Drill-down e tabelas
- Tabela: últimos 30 dias com colunas (data, ganhos, gastos, lucro, corridas, horas, ação VerDia).
- Endpoint/acción: abrir painel lateral com lista de transações do dia (GET /api/dashboard/day/{date}).
- Top categorias (se existir categorização nas transações).

## 6) Metas e alertas
- Painel de metas com progresso visual e CTA para ajustar metas.
- Alertas: quando `tendencia_ganhos` cair abaixo de threshold ou `ganhos_semana` << `ganhos_semana_passada`.

## 7) Ferramentas / ações rápidas
- Botão rápido: "Registrar corrida" (abrir modal de transação rápida).
- Exportar CSV/JSON do período selecionado.
- Snapshot compartilhável (pequeno resumo para redes sociais).

## 8) Diagnóstico e qualidade de dados
- Mostrar "Último registro" / "Último sync".
- Validadores: transações sem categoria, valores estranhos, horas = 0 (evitar divisão por zero).
- Mostrar contagem de registros que o reset apagaria (já implementado no modal de reset).

## 9) UX / Visual
- Tema escuro/claro; cartões limpos; microinterações em hover.
- Mobile-first: cards empilháveis; charts responsivos; esconder detalhes em telas pequenas.
- Acessibilidade: contrastes e labels ARIA nos charts.

## 10) APIs sugeridas (contratos)
- GET /api/dashboard/stats  (já existe) — exemplo: o JSON que você enviou.
- GET /api/dashboard/day/{YYYY-MM-DD} — lista transações do dia + categorias + resumo.
- GET /api/dashboard/heatmap?range=30d — retorna matriz hora×dia para heatmap.
- POST /api/dashboard/goals — criar/atualizar metas.

## 11) Prioridade (quick-wins)
1. Cards KPI com deltas e tooltips (rápido e alto valor).
2. Sparklines 7 dias (baixo esforço, grande sinal visual).
3. Tabela de dias com drill-down (muito útil para navegar dados).
4. Gráfico 30 dias multi-linha.
5. Heatmap e forecast (mais trabalho, alto valor analítico).

## 12) Edge cases & validações
- Quando `horas_X` = 0: mostrar `—` em vez de dividir.
- Valores nulos em metas: UX para setar meta.
- Truncar grandes números e mostrar tooltip com valor real.

## 13) Próximos passos sugeridos
- Escolha a prioridade: quero que eu gere os Cards KPI + sparklines (componentes React + mock data)?
- Se sim: eu crio 1 componente `KpiCards.tsx` e 1 `Sparkline.tsx` com dados mock do JSON e exemplos de uso.
- Se preferir charts primeiro: eu preparo `Dashboard30Days.tsx` com chart multi-linha (recomendo Recharts / Chart.js / ECharts).

---

Se quiser eu já gero um PR com os componentes iniciais (Cards + sparklines) usando MUI + uma lib de charts que você prefira.

Coloque aqui o que quer priorizar e eu implemento o próximo passo.
