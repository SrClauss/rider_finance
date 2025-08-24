import { useState } from 'react';
import { 
    Box, 
    Card, 
    Typography, 
    IconButton,
    Chip,
    LinearProgress
} from '@mui/material';
import {
    AttachMoney,
    MoneyOff,
    Savings,
    LocalTaxi,
    AccessTime,
    TrendingUp,
    Flag,
    CalendarToday,
    ArrowBackIos,
    ArrowForwardIos
} from '@mui/icons-material';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

interface MetricData {
    ganhos: number | null;
    ganhos_anterior: number | null;
    gastos: number | null;
    gastos_anterior: number | null;
    lucro: number | null;
    lucro_anterior: number | null;
    corridas: number | null;
    corridas_anterior: number | null;
    horas: number | null;
    horas_anterior: number | null;
    label: string;
}

interface DashboardMetricsCarouselProps {
    data: MetricData;
    eficiencia: number | null | undefined;
    metaDiaria: number | null | undefined;
    metaSemanal: number | null | undefined;
}

function formatCurrency(value: number | null): string {
    if (value === null) return 'R$ 0,00';
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function getPercentChange(current: number | null, previous: number | null): { value: number; isPositive: boolean } | null {
    if (!current || !previous || previous === 0) return null;
    const diff = current - previous;
    const percent = (diff / previous) * 100;
    return {
        value: Math.abs(percent),
        isPositive: percent >= 0
    };
}

export default function DashboardMetricsCarousel({
    data,
    eficiencia,
    metaDiaria,
    metaSemanal
}: DashboardMetricsCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const metrics = [
        {
            title: 'Resumo Financeiro',
            items: [
                {
                    label: 'Ganhos',
                    value: data.ganhos,
                    previous: data.ganhos_anterior,
                    icon: <AttachMoney />,
                    color: '#388e3c',
                    format: 'currency'
                },
                {
                    label: 'Gastos',
                    value: data.gastos,
                    previous: data.gastos_anterior,
                    icon: <MoneyOff />,
                    color: '#c62828',
                    format: 'currency'
                },
                {
                    label: 'Lucro',
                    value: data.lucro,
                    previous: data.lucro_anterior,
                    icon: <Savings />,
                    color: '#1976d2',
                    format: 'currency'
                }
            ]
        },
        {
            title: 'Desempenho',
            items: [
                {
                    label: 'Corridas',
                    value: data.corridas,
                    previous: data.corridas_anterior,
                    icon: <LocalTaxi />,
                    color: '#fbc02d',
                    format: 'number'
                },
                {
                    label: 'Horas Trabalhadas',
                    value: data.horas,
                    previous: data.horas_anterior,
                    icon: <AccessTime />,
                    color: '#7b1fa2',
                    format: 'hours'
                },
                {
                    label: 'Eficiência',
                    value: eficiencia,
                    previous: null,
                    icon: <TrendingUp />,
                    color: '#00acc1',
                    format: 'percent'
                }
            ]
        },
        {
            title: 'Metas',
            items: [
                {
                    label: 'Meta Diária',
                    value: metaDiaria,
                    previous: null,
                    icon: <Flag />,
                    color: '#43a047',
                    format: 'currency',
                    progress: data.ganhos && metaDiaria ? (data.ganhos / metaDiaria) * 100 : 0
                },
                {
                    label: 'Meta Semanal',
                    value: metaSemanal,
                    previous: null,
                    icon: <CalendarToday />,
                    color: '#43a047',
                    format: 'currency',
                    progress: data.ganhos && metaSemanal ? (data.ganhos / metaSemanal) * 100 : 0
                }
            ]
        }
    ];

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % metrics.length);
    };

    const handlePrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + metrics.length) % metrics.length);
    };

    const handlePanEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const swipeThreshold = 50;
        if (info.offset.x > swipeThreshold) {
            handlePrevious();
        } else if (info.offset.x < -swipeThreshold) {
            handleNext();
        }
    };

    const formatValue = (value: number | null, format: string): string => {
        if (value === null) return '-';
        
        switch (format) {
            case 'currency':
                return formatCurrency(value);
            case 'percent':
                return `${value.toFixed(1)}%`;
            case 'hours':
                return `${value.toFixed(1)}h`;
            case 'number':
            default:
                return value.toString();
        }
    };

    return (
        <Box sx={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 300 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -300 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.1}
                    onPanEnd={handlePanEnd}
                >
                    <Card
                        elevation={3}
                        sx={{
                            borderRadius: 3,
                            p: 3,
                            background: `linear-gradient(135deg, ${metrics[currentIndex].items[0].color}15 0%, ${metrics[currentIndex].items[0].color}05 100%)`,
                            position: 'relative',
                            minHeight: 280
                        }}
                    >
                        {/* Header */}
                        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                {metrics[currentIndex].title}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {metrics.map((_, idx) => (
                                    <Box
                                        key={idx}
                                        sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            backgroundColor: idx === currentIndex ? 'primary.main' : 'grey.300',
                                            transition: 'background-color 0.3s'
                                        }}
                                    />
                                ))}
                            </Box>
                        </Box>

                        {/* Metrics */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {metrics[currentIndex].items.map((item, idx) => (
                                <Box key={idx}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: 40,
                                                height: 40,
                                                borderRadius: 2,
                                                backgroundColor: `${item.color}20`,
                                                color: item.color
                                            }}
                                        >
                                            {item.icon}
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                                {item.label}
                                            </Typography>
                                            <Typography variant="h5" sx={{ fontWeight: 700, color: item.color }}>
                                                {formatValue(item.value, item.format)}
                                            </Typography>
                                        </Box>
                                        {item.previous !== null && getPercentChange(item.value, item.previous) && (
                                            <Chip
                                                size="small"
                                                label={`${getPercentChange(item.value, item.previous)?.isPositive ? '+' : '-'}${getPercentChange(item.value, item.previous)?.value.toFixed(1)}%`}
                                                sx={{
                                                    backgroundColor: getPercentChange(item.value, item.previous)?.isPositive 
                                                        ? '#00e67620' 
                                                        : '#ff174420',
                                                    color: getPercentChange(item.value, item.previous)?.isPositive 
                                                        ? '#00e676' 
                                                        : '#ff1744',
                                                    fontWeight: 600
                                                }}
                                            />
                                        )}
                                    </Box>
                                    {'progress' in item && item.progress !== undefined && (
                                        <Box sx={{ px: 1 }}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={Math.min(item.progress, 100)}
                                                sx={{
                                                    height: 6,
                                                    borderRadius: 3,
                                                    backgroundColor: `${item.color}20`,
                                                    '& .MuiLinearProgress-bar': {
                                                        backgroundColor: item.color,
                                                        borderRadius: 3
                                                    }
                                                }}
                                            />
                                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                                {item.progress.toFixed(0)}% da meta
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            ))}
                        </Box>

                        {/* Navigation Buttons */}
                        <IconButton
                            onClick={handlePrevious}
                            sx={{
                                position: 'absolute',
                                left: -16,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                backgroundColor: 'background.paper',
                                boxShadow: 2,
                                '&:hover': {
                                    backgroundColor: 'background.paper'
                                }
                            }}
                        >
                            <ArrowBackIos sx={{ fontSize: 18 }} />
                        </IconButton>
                        <IconButton
                            onClick={handleNext}
                            sx={{
                                position: 'absolute',
                                right: -16,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                backgroundColor: 'background.paper',
                                boxShadow: 2,
                                '&:hover': {
                                    backgroundColor: 'background.paper'
                                }
                            }}
                        >
                            <ArrowForwardIos sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Card>
                </motion.div>
            </AnimatePresence>
        </Box>
    );
}