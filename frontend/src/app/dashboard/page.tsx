import DashboardCardData from "@/components/dashboard/DashboardCardData";
import DashboardSimpleCard from "@/components/dashboard/DashboardSimpleCard";

import { DashboardResponse } from "@/interfaces/DashboardResponse";
import LoggedLayout from "@/layouts/LoggedLayout";
import dashboardMock from "@/mocks/dashboardMock";
import {
    AttachMoney,
    MoneyOff,
    Savings,
    LocalTaxi,
    AccessTime,
    TrendingUp,
    Flag,
    CalendarToday
} from "@mui/icons-material";
import { Box } from "@mui/material";
import DashboardLineChartCard from "@/components/dashboard/DashboardLineChartCard";


export default async function DashboardPage() {
    let data: DashboardResponse | null = null;
    let mode: 'mock' | 'real' = 'real';

    try {
    
        const res = await fetch("http://localhost/api/dashboard/stats", {
            cache: "no-store",
            credentials: "include"
        });
        if (res.ok) {
          
            data = await res.json();
            console.log(data);
        }
        console.log(data) 
    } catch (e) {
        data = null;
    }




    return (
        <LoggedLayout>
            <Box sx={{ padding: 5 }}>
                {/* Agrupa os cards em trios para layout mobile especial */}
                {/* Mobile: grupos de 3, Desktop: grid padrão */}
                <Box sx={{ display: { xs: "block", md: "none" } }}>
                    {/* Cards principais agrupados em trios */}
                    {(() => {
                        const cards = [
                            <DashboardCardData label="Ganhos Hoje" value={data?.ganhos_hoje ?? 0} color="verde" icon={<AttachMoney />} periodoAnterior={data?.ganhos_ontem ?? null} mod="currency" key="ganhos-hoje" />,
                            <DashboardCardData label="Ganhos Semana" value={data?.ganhos_semana ?? 0} color="verde" icon={<AttachMoney />} periodoAnterior={data?.ganhos_semana_passada ?? null} mod="currency" key="ganhos-semana" />,
                            <DashboardCardData label="Ganhos Mês" value={data?.ganhos_mes ?? 0} color="verde" icon={<AttachMoney />} periodoAnterior={data?.ganhos_mes_passado ?? null} mod="currency" key="ganhos-mes" />,
                            <DashboardCardData label="Gastos Hoje" value={data?.gastos_hoje ?? 0} color="vermelha" icon={<MoneyOff />} periodoAnterior={data?.gastos_ontem ?? null} mod="currency" key="gastos-hoje" />,
                            <DashboardCardData label="Gastos Semana" value={data?.gastos_semana ?? 0} color="vermelha" icon={<MoneyOff />} periodoAnterior={data?.gastos_semana_passada ?? null} mod="currency" key="gastos-semana" />,
                            <DashboardCardData label="Gastos Mês" value={data?.gastos_mes ?? 0} color="vermelha" icon={<MoneyOff />} periodoAnterior={data?.gastos_mes_passado ?? null} mod="currency" key="gastos-mes" />,
                            <DashboardCardData label="Lucro Hoje" value={data?.lucro_hoje ?? 0} color="azul" icon={<Savings />} periodoAnterior={data?.lucro_ontem ?? null} mod="currency" key="lucro-hoje" />,
                            <DashboardCardData label="Lucro Semana" value={data?.lucro_semana ?? 0} color="azul" icon={<Savings />} periodoAnterior={data?.lucro_semana_passada ?? null} mod="currency" key="lucro-semana" />,
                            <DashboardCardData label="Lucro Mês" value={data?.lucro_mes ?? 0} color="azul" icon={<Savings />} periodoAnterior={data?.lucro_mes_passado ?? null} mod="currency" key="lucro-mes" />,
                            <DashboardCardData label="Corridas Hoje" value={data?.corridas_hoje ?? 0} color="amarela" icon={<LocalTaxi />} periodoAnterior={data?.corridas_ontem ?? null} mod="default" key="corridas-hoje" />,
                            <DashboardCardData label="Corridas Semana" value={data?.corridas_semana ?? 0} color="amarela" icon={<LocalTaxi />} periodoAnterior={data?.corridas_semana_passada ?? null} mod="default" key="corridas-semana" />,
                            <DashboardCardData label="Corridas Mês" value={data?.corridas_mes ?? 0} color="amarela" icon={<LocalTaxi />} periodoAnterior={data?.corridas_mes_passado ?? null} mod="default" key="corridas-mes" />,
                            <DashboardCardData label="Horas Hoje" value={data?.horas_hoje ?? 0} color="azul" icon={<AccessTime />} periodoAnterior={data?.horas_ontem ?? null} mod="default" key="horas-hoje" />,
                            <DashboardCardData label="Horas Semana" value={data?.horas_semana ?? 0} color="azul" icon={<AccessTime />} periodoAnterior={data?.horas_semana_passada ?? null} mod="default" key="horas-semana" />,
                            <DashboardCardData label="Horas Mês" value={data?.horas_mes ?? 0} color="azul" icon={<AccessTime />} periodoAnterior={data?.horas_mes_passado ?? null} mod="default" key="horas-mes" />,
                        ];
                        // Agrupa em trios
                        const groups = [];
                        for (let i = 0; i < cards.length; i += 3) {
                            groups.push(cards.slice(i, i + 3));
                        }
                        return (
                            <>
                                {groups.map((group, idx) => (
                                    <Box key={`group-${idx}`}> {/* Fragmento com key */}
                                        <Box
                                            key={`cards-${idx}`}
                                            sx={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: 2,
                                                mb: 2,
                                            }}
                                        >
                                            {/* Mobile: primeiro centralizado, os outros dois lado a lado */}
                                            <Box key={`card-main-${idx}`} sx={{ width: "100%", display: "flex", justifyContent: "center" }}>{group[0]}</Box>
                                            <Box key={`card-row-${idx}`} sx={{ width: "100%", display: "flex", justifyContent: "center", gap: 2 }}>
                                                {group.slice(1).map((card, i) => (
                                                    <Box key={`card-${idx}-${i}`} sx={{ width: "50%", display: "flex", justifyContent: "center" }}>{card}</Box>
                                                ))}
                                            </Box>
                                        </Box>
                                        {idx < groups.length - 1 && (
                                            <Box key={`divider-${idx}`} sx={{ width: "100%", my: 2 }}>
                                                <Box sx={{ maxWidth: 400, mx: "auto" }}>
                                                    <Box sx={{ borderBottom: "1px solid", borderColor: "divider", opacity: 0.3 }} />
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>
                                ))}
                                {/* SimpleCards para mobile - layout 1/2 igual aos CardData */}
                                {(() => {
                                    const simpleCards = [
                                        <DashboardSimpleCard label="Eficiência" value={data?.eficiencia ?? 0} icon={<TrendingUp />} color="#7b1fa288" mod="percent" key="eficiencia" />,
                                        <DashboardSimpleCard label="Meta Diária" value={data?.meta_diaria ?? 0} icon={<Flag />} color="#388e3c88" mod="currency" key="meta-diaria" />,
                                        <DashboardSimpleCard label="Meta Semanal" value={data?.meta_semanal ?? 0} icon={<CalendarToday />} color="#388e3c88" mod="currency" key="meta-semanal" />,
                                    ];
                                    return (
                                        <Box sx={{ width: "100%", mt: 2 }}>
                                            {/* Primeiro centralizado, largura fixa igual aos outros cards */}
                                            <Box sx={{ width: "100%", display: "flex", justifyContent: "center", mb: 2 }}>
                                                <Box sx={{ width: 180, minWidth: 180, maxWidth: 260, display: "flex", justifyContent: "center" }}>
                                                    {simpleCards[0]}
                                                </Box>
                                            </Box>
                                            {/* Os outros dois lado a lado */}
                                            <Box sx={{ width: "100%", display: "flex", justifyContent: "center", gap: 2 }}>
                                                <Box sx={{ width: "50%", display: "flex", justifyContent: "center" }}>{simpleCards[1]}</Box>
                                                <Box sx={{ width: "50%", display: "flex", justifyContent: "center" }}>{simpleCards[2]}</Box>
                                            </Box>
                                        </Box>
                                    );
                                })()}
                            </>
                        );
                    })()}
                </Box>
                {/* Desktop: grid padrão 3 colunas */}
                <Box
                    sx={{
                        display: { xs: "none", md: "grid" },
                        gridTemplateColumns: "repeat(3, 260px)",
                        gap: 2,
                        justifyContent: "center",
                        justifyItems: "center"
                    }}
                >
                    {/* Ganhos */}
                    <DashboardCardData label="Ganhos Hoje" value={data?.ganhos_hoje ?? 0} color="verde" icon={<AttachMoney />} periodoAnterior={data?.ganhos_ontem ?? null} mod="currency" />
                    <DashboardCardData label="Ganhos Semana" value={data?.ganhos_semana ?? 0} color="verde" icon={<AttachMoney />} periodoAnterior={data?.ganhos_semana_passada ?? null} mod="currency" />
                    <DashboardCardData label="Ganhos Mês" value={data?.ganhos_mes ?? 0} color="verde" icon={<AttachMoney />} periodoAnterior={data?.ganhos_mes_passado ?? null} mod="currency" />
                    {/* Gastos */}
                    <DashboardCardData label="Gastos Hoje" value={data?.gastos_hoje ?? 0} color="vermelha" icon={<MoneyOff />} periodoAnterior={data?.gastos_ontem ?? null} mod="currency" />
                    <DashboardCardData label="Gastos Semana" value={data?.gastos_semana ?? 0} color="vermelha" icon={<MoneyOff />} periodoAnterior={data?.gastos_semana_passada ?? null} mod="currency" />
                    <DashboardCardData label="Gastos Mês" value={data?.gastos_mes ?? 0} color="vermelha" icon={<MoneyOff />} periodoAnterior={data?.gastos_mes_passado ?? null} mod="currency" />
                    {/* Lucro */}
                    <DashboardCardData label="Lucro Hoje" value={data?.lucro_hoje ?? 0} color="azul" icon={<Savings />} periodoAnterior={data?.lucro_ontem ?? null} mod="currency" />
                    <DashboardCardData label="Lucro Semana" value={data?.lucro_semana ?? 0} color="azul" icon={<Savings />} periodoAnterior={data?.lucro_semana_passada ?? null} mod="currency" />
                    <DashboardCardData label="Lucro Mês" value={data?.lucro_mes ?? 0} color="azul" icon={<Savings />} periodoAnterior={data?.lucro_mes_passado ?? null} mod="currency" />
                    {/* Corridas */}
                    <DashboardCardData label="Corridas Hoje" value={data?.corridas_hoje ?? 0} color="amarela" icon={<LocalTaxi />} periodoAnterior={data?.corridas_ontem ?? null} mod="default" />
                    <DashboardCardData label="Corridas Semana" value={data?.corridas_semana ?? 0} color="amarela" icon={<LocalTaxi />} periodoAnterior={data?.corridas_semana_passada ?? null} mod="default" />
                    <DashboardCardData label="Corridas Mês" value={data?.corridas_mes ?? 0} color="amarela" icon={<LocalTaxi />} periodoAnterior={data?.corridas_mes_passado ?? null} mod="default" />
                    {/* Horas */}
                    <DashboardCardData label="Horas Hoje" value={data?.horas_hoje ?? 0} color="azul" icon={<AccessTime />} periodoAnterior={data?.horas_ontem ?? null} mod="default" />
                    <DashboardCardData label="Horas Semana" value={data?.horas_semana ?? 0} color="azul" icon={<AccessTime />} periodoAnterior={data?.horas_semana_passada ?? null} mod="default" />
                    <DashboardCardData label="Horas Mês" value={data?.horas_mes ?? 0} color="azul" icon={<AccessTime />} periodoAnterior={data?.horas_mes_passado ?? null} mod="default" />
                    {/* Eficiência, Metas */}
                    <DashboardSimpleCard label="Eficiência" value={data?.eficiencia ?? 0} icon={<TrendingUp />} color="#7b1fa288" mod="percent" />
                    <DashboardSimpleCard label="Meta Diária" value={data?.meta_diaria ?? 0} icon={<Flag />} color="#388e3c88" mod="currency" />
                    <DashboardSimpleCard label="Meta Semanal" value={data?.meta_semanal ?? 0} icon={<CalendarToday />} color="#388e3c88" mod="currency" />
                </Box>
            </Box>
            {/* Gráficos das séries temporais abaixo dos cards */}
            <Box sx={{ width: "100%", mt: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <DashboardLineChartCard
                    label="Ganhos - Últimos 7 dias"
                    series={data?.ganhos_7dias ?? []}
                    color="#388e3c"
                    trendMethod="media_movel_30"
                />
                <DashboardLineChartCard
                    label="Ganhos - Últimos 30 dias"
                    series={data?.ganhos_mes_array ?? []}
                    color="#388e3c"
                    trendMethod="media_movel_30"
                />
                <DashboardLineChartCard
                    label="Gastos - Últimos 7 dias"
                    series={data?.gastos_7dias ?? []}
                    color="#c62828"
                    trendMethod="media_movel_30"
                />
                <DashboardLineChartCard
                    label="Gastos - Últimos 30 dias"
                    series={data?.gastos_mes_array ?? []}
                    color="#c62828"
                    trendMethod="media_movel_30"
                />
                <DashboardLineChartCard
                    label="Corridas - Últimos 7 dias"
                    series={data?.corridas_7dias ?? []}
                    color="#fbc02d"
                    trendMethod="media_movel_30"
                />
                <DashboardLineChartCard
                    label="Corridas - Últimos 30 dias"
                    series={data?.corridas_mes_array ?? []}
                    color="#fbc02d"
                    trendMethod="media_movel_30"
                />
            </Box>
        </LoggedLayout>
    );
}