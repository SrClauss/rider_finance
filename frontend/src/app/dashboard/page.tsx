import { DashboardResponse } from "@/interfaces/DashboardResponse";
import LoggedLayout from "@/layouts/LoggedLayout";
import { Box} from "@mui/material";

import DashboardDataCard from "@/components/dashboard/DashboardDataCard";
import DashboardChartCard from "@/components/dashboard/DashboardChartCard";
import DashboardSwiper from "@/components/dashboard/DashboardSlide";


export default async function DashboardPage() {
    let data: DashboardResponse | null = null;
    try {
        const res = await fetch("http://localhost:3000/api/dashboard/stats", { cache: "no-store" });
        if (res.ok) {
            data = await res.json();
        }
    } catch (e) {
        data = null;
    }
        // Mock atualizado para refletir todos os campos
        const mockStats: DashboardResponse = {
            ganhos_hoje: 120,
            gastos_hoje: 45,
            lucro_hoje: 75,
            corridas_hoje: 8,
            horas_hoje: 5,
            eficiencia: 92,
            ganhos_semana: 850,
            gastos_semana: 320,
            lucro_semana: 530,
            corridas_semana: 52,
            horas_semana: 34,
            meta_diaria: 150,
            meta_semanal: 1000,
            tendencia_ganhos: 10,
            tendencia_gastos: -5,
            tendencia_corridas: 2,
            ganhos_7dias: [120, 110, 95, 130, 140, 155, 100],
            gastos_7dias: [45, 50, 40, 60, 55, 70, 35],
            lucro_7dias: [75, 60, 55, 70, 85, 85, 65],
            ganhos_mes: Array(31).fill(100).map((v, i) => v + i * 2),
            gastos_mes: Array(31).fill(50).map((v, i) => v + i),
            lucro_mes: Array(31).fill(50).map((v, i) => v + i),
        };
        const stats: DashboardResponse = data || mockStats;
        // Labels para gráficos
        const diasSemana = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
        const diasMes = stats.ganhos_mes.map((_, i) => `${i + 1}`);

        // Agrupamento dos cards por categoria
        const cardsGanhos = [
            { label: "Ganhos Hoje", value: stats.ganhos_hoje, color: "success", trend: stats.tendencia_ganhos },
            { label: "Ganhos Semana", value: stats.ganhos_semana, color: "success" },
        ];
        const cardsGastos = [
            { label: "Gastos Hoje", value: stats.gastos_hoje, color: "error", trend: stats.tendencia_gastos },
            { label: "Gastos Semana", value: stats.gastos_semana, color: "error" },
        ];
        const cardsLucros = [
            { label: "Lucro Hoje", value: stats.lucro_hoje, color: "primary" },
            { label: "Lucro Semana", value: stats.lucro_semana, color: "primary" },
        ];
        const cardsMetas = [
            { label: "Meta Diária", value: stats.meta_diaria ?? "-", color: "secondary" },
            { label: "Meta Semanal", value: stats.meta_semanal ?? "-", color: "secondary" },
        ];
        const cardsInfo = [
            { label: "Corridas Hoje", value: stats.corridas_hoje, color: "info" },
            { label: "Corridas Semana", value: stats.corridas_semana, color: "info" },
            { label: "Horas Hoje", value: stats.horas_hoje, color: "info" },
            { label: "Horas Semana", value: stats.horas_semana, color: "info" },
            { label: "Eficiência", value: stats.eficiencia + "%", color: "warning" },
        ];

        // Slides de gráficos para mobile/desktop
        const chartItemsSemana = [
            { title: "Ganhos Semana", chart: <DashboardChartCard key="ganhos_semana_bar" title="Ganhos Semana" data={stats.ganhos_7dias} labels={diasSemana} color="success" chartTypes={["bar", "line"]} trend={stats.tendencia_ganhos} /> },
            { title: "Gastos Semana", chart: <DashboardChartCard key="gastos_semana_bar" title="Gastos Semana" data={stats.gastos_7dias} labels={diasSemana} color="error" chartTypes={["bar", "line"]} trend={stats.tendencia_gastos} /> },
            { title: "Lucro Semana", chart: <DashboardChartCard key="lucro_semana_bar" title="Lucro Semana" data={stats.lucro_7dias} labels={diasSemana} color="primary" chartTypes={["bar", "line"]} /> },
        ];
        const chartItemsMes = [
            { title: "Ganhos Mês", chart: <DashboardChartCard key="ganhos_mes_bar" title="Ganhos Mês" data={stats.ganhos_mes} labels={diasMes} color="success" chartTypes={["bar", "line"]} trend={stats.tendencia_ganhos} /> },
            { title: "Gastos Mês", chart: <DashboardChartCard key="gastos_mes_bar" title="Gastos Mês" data={stats.gastos_mes} labels={diasMes} color="error" chartTypes={["bar", "line"]} trend={stats.tendencia_gastos} /> },
            { title: "Lucro Mês", chart: <DashboardChartCard key="lucro_mes_bar" title="Lucro Mês" data={stats.lucro_mes} labels={diasMes} color="primary" chartTypes={["bar", "line"]} /> },
        ];

        return (
            <LoggedLayout>
                <Box sx={{ p: 2 }}>
                    {/* Swiper de cards por categoria no mobile, grid no desktop */}
                    <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexWrap: 'wrap', gap: 2, mb: 2 }}>
                        {[cardsGanhos, cardsGastos, cardsLucros, cardsMetas, cardsInfo].map((group, idx) => (
                            group.map((card, j) => (
                                <Box key={idx + '-' + j} sx={{ flex: "1 1 120px" }}>
                                    <DashboardDataCard {...card} />
                                </Box>
                            ))
                        ))}
                    </Box>
                    {/* Mobile: Swiper para grupos de cards */}
                    <Box sx={{ display: { xs: 'block', sm: 'none' }, mb: 2 }}>
                        <DashboardSwiper items={[
                            { title: 'Ganhos', chart: <Box sx={{ display: 'flex', gap: 2 }}>{cardsGanhos.map((card, idx) => <DashboardDataCard key={idx} {...card} />)}</Box> },
                            { title: 'Gastos', chart: <Box sx={{ display: 'flex', gap: 2 }}>{cardsGastos.map((card, idx) => <DashboardDataCard key={idx} {...card} />)}</Box> },
                            { title: 'Lucros', chart: <Box sx={{ display: 'flex', gap: 2 }}>{cardsLucros.map((card, idx) => <DashboardDataCard key={idx} {...card} />)}</Box> },
                            { title: 'Metas', chart: <Box sx={{ display: 'flex', gap: 2 }}>{cardsMetas.map((card, idx) => <DashboardDataCard key={idx} {...card} />)}</Box> },
                            { title: 'Info', chart: <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>{cardsInfo.map((card, idx) => <DashboardDataCard key={idx} {...card} />)}</Box> },
                        ]} />
                    </Box>
                    {/* Swiper de gráficos semanais */}
                    <DashboardSwiper items={chartItemsSemana} />
                    {/* Swiper de gráficos mensais */}
                    <DashboardSwiper items={chartItemsMes} />
                </Box>
            </LoggedLayout>
        );
}