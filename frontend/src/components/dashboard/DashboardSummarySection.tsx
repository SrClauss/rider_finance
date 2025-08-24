import { Box, Card, Typography, Chip } from '@mui/material';
import { AttachMoney, MoneyOff, Savings, TrendingUp, TrendingDown } from '@mui/icons-material';
import { motion } from 'framer-motion';

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

interface DashboardSummarySectionProps {
    data: MetricData | null;
    period: string;
}

function formatCurrency(value: number | null): string {
    if (value === null) return 'R$ 0,00';
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getPercentChange(current: number | null, previous: number | null): { 
    value: number; 
    isPositive: boolean;
    text: string;
} | null {
    if (!current || !previous || previous === 0) return null;
    const diff = current - previous;
    const percent = (diff / previous) * 100;
    const isPositive = percent >= 0;
    return {
        value: Math.abs(percent),
        isPositive,
        text: `${isPositive ? '+' : '-'}${Math.abs(percent).toFixed(1)}%`
    };
}

export default function DashboardSummarySection({ data }: DashboardSummarySectionProps) {
    
    if (!data) return null;

    const metrics = [
        {
            label: 'Ganhos',
            value: data.ganhos,
            previous: data.ganhos_anterior,
            icon: <AttachMoney />,
            color: '#388e3c',
            gradient: 'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)'
        },
        {
            label: 'Gastos',
            value: data.gastos,
            previous: data.gastos_anterior,
            icon: <MoneyOff />,
            color: '#c62828',
            gradient: 'linear-gradient(135deg, #ef5350 0%, #c62828 100%)'
        },
        {
            label: 'Lucro',
            value: data.lucro,
            previous: data.lucro_anterior,
            icon: <Savings />,
            color: '#1976d2',
            gradient: 'linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)'
        }
    ];

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
                Resumo Financeiro
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
                {metrics.map((metric, index) => {
                    const percentChange = getPercentChange(metric.value, metric.previous);
                    
                    return (
                        <motion.div
                            key={metric.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.4 }}
                            style={{ flex: '1 1 280px', maxWidth: 320 }}
                        >
                            <Card
                                elevation={2}
                                sx={{
                                    borderRadius: 3,
                                    p: 3,
                                    height: '100%',
                                    background: metric.gradient,
                                    color: 'white',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                        transform: 'translateY(-4px)'
                                    }
                                }}
                            >
                                {/* Background Pattern */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: -50,
                                        right: -50,
                                        width: 150,
                                        height: 150,
                                        borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.1)'
                                    }}
                                />
                                
                                {/* Content */}
                                <Box sx={{ position: 'relative', zIndex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: 48,
                                                height: 48,
                                                borderRadius: 2,
                                                backgroundColor: 'rgba(255,255,255,0.2)',
                                                mr: 2
                                            }}
                                        >
                                            {metric.icon}
                                        </Box>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            {metric.label}
                                        </Typography>
                                    </Box>
                                    
                                    <Typography 
                                        variant="h4" 
                                        sx={{ 
                                            fontWeight: 800,
                                            mb: 2,
                                            fontSize: { xs: '1.75rem', sm: '2.125rem' }
                                        }}
                                    >
                                        {formatCurrency(metric.value)}
                                    </Typography>
                                    
                                    {percentChange && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip
                                                icon={percentChange.isPositive ? <TrendingUp /> : <TrendingDown />}
                                                label={percentChange.text}
                                                size="small"
                                                sx={{
                                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                                    color: 'white',
                                                    fontWeight: 600,
                                                    '& .MuiChip-icon': {
                                                        color: 'white'
                                                    }
                                                }}
                                            />
                                            <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                                vs período anterior
                                            </Typography>
                                        </Box>
                                    )}
                                    
                                    {!percentChange && (
                                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                            Sem dados do período anterior
                                        </Typography>
                                    )}
                                </Box>
                            </Card>
                        </motion.div>
                    );
                })}
            </Box>
        </Box>
    );
}