import { Box, Typography, ToggleButton, ToggleButtonGroup, useTheme, useMediaQuery } from '@mui/material';
import { useState } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { DateRange, CalendarMonth } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardResponse } from "@/interfaces/DashboardResponse";

interface DashboardChartsSectionProps {
    data: DashboardResponse | null;
    selectedTab: number;
}

export default function DashboardChartsSection({ data, selectedTab }: DashboardChartsSectionProps) {
    const [chartPeriod, setChartPeriod] = useState<'7dias' | '30dias'>('7dias');
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    if (!data) return null;

    const handleChartPeriodChange = (_: React.MouseEvent<HTMLElement>, newPeriod: '7dias' | '30dias' | null) => {
        if (newPeriod !== null) {
            setChartPeriod(newPeriod);
        }
    };

    const getChartData = () => {
        const isSevenDays = chartPeriod === '7dias';
        
        switch (selectedTab) {
            case 0: // Ganhos
                return {
                    title: `Ganhos - Últimos ${isSevenDays ? '7' : '30'} dias`,
                    color: '#388e3c',
                    series: isSevenDays ? data.ganhos_7dias : data.ganhos_mes_array,
                    yAxisLabel: 'Ganhos (R$)'
                };
            case 1: // Gastos
                return {
                    title: `Gastos - Últimos ${isSevenDays ? '7' : '30'} dias`,
                    color: '#c62828',
                    series: isSevenDays ? data.gastos_7dias : data.gastos_mes_array,
                    yAxisLabel: 'Gastos (R$)'
                };
            case 2: // Corridas
                return {
                    title: `Corridas - Últimos ${isSevenDays ? '7' : '30'} dias`,
                    color: '#fbc02d',
                    series: isSevenDays ? data.corridas_7dias : data.corridas_mes_array,
                    yAxisLabel: 'Número de Corridas'
                };
            default:
                return null;
        }
    };

    const chartData = getChartData();
    
    if (!chartData || !chartData.series || chartData.series.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                    Sem dados disponíveis para este período
                </Typography>
            </Box>
        );
    }

    const seriesData = chartData.series || [];
    const xAxisData = Array.from({ length: seriesData.length }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (seriesData.length - 1 - i));
        return chartPeriod === '7dias' 
            ? date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })
            : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    });

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {chartData.title}
                </Typography>
                
                <ToggleButtonGroup
                    value={chartPeriod}
                    exclusive
                    onChange={handleChartPeriodChange}
                    size="small"
                    sx={{
                        '& .MuiToggleButton-root': {
                            px: { xs: 1.5, sm: 2 },
                            py: 0.5,
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            fontWeight: 600,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            '&.Mui-selected': {
                                backgroundColor: chartData.color,
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: chartData.color
                                }
                            }
                        }
                    }}
                >
                    <ToggleButton value="7dias">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <DateRange sx={{ fontSize: 16 }} />
                            7 dias
                        </Box>
                    </ToggleButton>
                    <ToggleButton value="30dias">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarMonth sx={{ fontSize: 16 }} />
                            30 dias
                        </Box>
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${selectedTab}-${chartPeriod}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    <Box
                        sx={{
                            width: '100%',
                            height: { xs: 300, sm: 400 },
                            '& .MuiChartsAxis-root': {
                                '& .MuiChartsAxis-tickLabel': {
                                    fontSize: '0.75rem'
                                }
                            }
                        }}
                    >
                        <LineChart
                            xAxis={[{
                                scaleType: 'point',
                                data: xAxisData,
                                tickLabelStyle: {
                                    fontSize: isMobile ? 10 : 12,
                                    angle: isMobile ? -45 : 0
                                }
                            }]}
                            yAxis={[{
                                label: chartData.yAxisLabel,
                                labelStyle: {
                                    fontSize: isMobile ? 10 : 12
                                },
                                tickLabelStyle: {
                                    fontSize: isMobile ? 10 : 12
                                }
                            }]}
                            series={[{
                                data: seriesData,
                                color: chartData.color,
                                curve: 'catmullRom',
                                area: true,
                                showMark: true
                            }]}
                            grid={{ vertical: true, horizontal: true }}
                            margin={{
                                left: isMobile ? 60 : 80,
                                right: isMobile ? 20 : 30,
                                top: 20,
                                bottom: isMobile ? 80 : 60
                            }}
                            sx={{
                                '& .MuiLineElement-root': {
                                    strokeWidth: 3
                                },
                                '& .MuiMarkElement-root': {
                                    fill: chartData.color,
                                    strokeWidth: 2,
                                    stroke: '#fff',
                                    r: 4
                                },
                                '& .MuiAreaElement-root': {
                                    fillOpacity: 0.1
                                }
                            }}
                        />
                    </Box>
                </motion.div>
            </AnimatePresence>

            {/* Estatísticas resumidas */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 2 }}>
                {(() => {
                    const values = seriesData;
                    if (values.length === 0) return null;
                    const total = values.reduce((sum, val) => sum + val, 0);
                    const average = total / values.length;
                    const max = Math.max(...values);
                    const min = Math.min(...values);

                    const stats = [
                        { label: 'Total', value: total },
                        { label: 'Média', value: average },
                        { label: 'Máximo', value: max },
                        { label: 'Mínimo', value: min }
                    ];

                    return stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1, duration: 0.3 }}
                        >
                            <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                    {stat.label}
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 700, color: chartData.color }}>
                                    {selectedTab === 2 
                                        ? stat.value.toFixed(0)
                                        : `R$ ${stat.value.toFixed(2)}`
                                    }
                                </Typography>
                            </Box>
                        </motion.div>
                    ));
                })()}
            </Box>
        </Box>
    );
}