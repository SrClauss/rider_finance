import { Box, Card, Typography, LinearProgress, Chip, CircularProgress } from '@mui/material';
import { 
    LocalTaxi, 
    AccessTime, 
    TrendingUp, 
    Speed,
    EmojiEvents,
    TrendingDown
} from '@mui/icons-material';
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

interface DashboardPerformanceSectionProps {
    data: MetricData | null;
    eficiencia: number | null | undefined;
    metaDiaria: number | null | undefined;
    metaSemanal: number | null | undefined;
    period: string;
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

export default function DashboardPerformanceSection({ 
    data, 
    eficiencia, 
    metaDiaria, 
    metaSemanal,
    period 
}: DashboardPerformanceSectionProps) {
    
    if (!data) return null;

    const corridasChange = getPercentChange(data.corridas, data.corridas_anterior);
    const horasChange = getPercentChange(data.horas, data.horas_anterior);

    const ganhosPorHora = data.ganhos && data.horas && data.horas > 0 
        ? data.ganhos / data.horas 
        : 0;

    const ganhosPorCorrida = data.ganhos && data.corridas && data.corridas > 0 
        ? data.ganhos / data.corridas 
        : 0;

    const progressoMetaDiaria = data.ganhos && metaDiaria && metaDiaria > 0 
        ? Math.min((data.ganhos / metaDiaria) * 100, 100)
        : 0;

    const progressoMetaSemanal = data.ganhos && metaSemanal && metaSemanal > 0 
        ? Math.min((data.ganhos / metaSemanal) * 100, 100)
        : 0;

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
                Desempenho & Produtividade
            </Typography>
            
            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' } }}>
                {/* Corridas */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                >
                    <Card
                        elevation={2}
                        sx={{
                            borderRadius: 3,
                            p: 3,
                            height: '100%',
                            background: 'linear-gradient(135deg, #ffc107 0%, #ff8f00 100%)',
                            color: 'white',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <Box
                            sx={{
                                position: 'absolute',
                                top: -30,
                                right: -30,
                                width: 120,
                                height: 120,
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.1)'
                            }}
                        />
                        
                        <Box sx={{ position: 'relative', zIndex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <LocalTaxi sx={{ fontSize: 32, mr: 2 }} />
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Corridas
                                </Typography>
                            </Box>
                            
                            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                                {data.corridas ?? 0}
                            </Typography>
                            
                            {corridasChange && (
                                <Chip
                                    icon={corridasChange.isPositive ? <TrendingUp /> : <TrendingDown />}
                                    label={corridasChange.text}
                                    size="small"
                                    sx={{
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        color: 'white',
                                        fontWeight: 600
                                    }}
                                />
                            )}
                            
                            {ganhosPorCorrida > 0 && (
                                <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                                    Média: R$ {ganhosPorCorrida.toFixed(2)} por corrida
                                </Typography>
                            )}
                        </Box>
                    </Card>
                </motion.div>

                {/* Horas Trabalhadas */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                >
                    <Card
                        elevation={2}
                        sx={{
                            borderRadius: 3,
                            p: 3,
                            height: '100%',
                            background: 'linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)',
                            color: 'white',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <Box
                            sx={{
                                position: 'absolute',
                                top: -30,
                                right: -30,
                                width: 120,
                                height: 120,
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.1)'
                            }}
                        />
                        
                        <Box sx={{ position: 'relative', zIndex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <AccessTime sx={{ fontSize: 32, mr: 2 }} />
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Horas
                                </Typography>
                            </Box>
                            
                            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                                {data.horas?.toFixed(1) ?? '0.0'}h
                            </Typography>
                            
                            {horasChange && (
                                <Chip
                                    icon={horasChange.isPositive ? <TrendingUp /> : <TrendingDown />}
                                    label={horasChange.text}
                                    size="small"
                                    sx={{
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        color: 'white',
                                        fontWeight: 600
                                    }}
                                />
                            )}
                            
                            {ganhosPorHora > 0 && (
                                <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                                    R$ {ganhosPorHora.toFixed(2)} por hora
                                </Typography>
                            )}
                        </Box>
                    </Card>
                </motion.div>

                {/* Eficiência */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                >
                    <Card
                        elevation={2}
                        sx={{
                            borderRadius: 3,
                            p: 3,
                            height: '100%',
                            background: 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)',
                            color: 'white',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <Box
                            sx={{
                                position: 'absolute',
                                top: -30,
                                right: -30,
                                width: 120,
                                height: 120,
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.1)'
                            }}
                        />
                        
                        <Box sx={{ position: 'relative', zIndex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Speed sx={{ fontSize: 32, mr: 2 }} />
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Eficiência
                                </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                    <CircularProgress
                                        variant="determinate"
                                        value={eficiencia ? Math.min(eficiencia, 100) : 0}
                                        size={80}
                                        thickness={4}
                                        sx={{
                                            color: 'white',
                                            '& .MuiCircularProgress-circle': {
                                                strokeLinecap: 'round',
                                            }
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            top: 0,
                                            left: 0,
                                            bottom: 0,
                                            right: 0,
                                            position: 'absolute',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                            {eficiencia?.toFixed(0) ?? 0}%
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Taxa de eficiência operacional
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Card>
                </motion.div>

                {/* Metas */}
                {(metaDiaria || metaSemanal) && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.4 }}
                        style={{ gridColumn: 'span 1' }}
                    >
                        <Card
                            elevation={2}
                            sx={{
                                borderRadius: 3,
                                p: 3,
                                height: '100%',
                                background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
                                color: 'white'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <EmojiEvents sx={{ fontSize: 32, mr: 2 }} />
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Progresso das Metas
                                </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {metaDiaria && period === 'hoje' && (
                                    <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                Meta Diária
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                {progressoMetaDiaria.toFixed(0)}%
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={progressoMetaDiaria}
                                            sx={{
                                                height: 8,
                                                borderRadius: 4,
                                                backgroundColor: 'rgba(255,255,255,0.3)',
                                                '& .MuiLinearProgress-bar': {
                                                    backgroundColor: 'white',
                                                    borderRadius: 4
                                                }
                                            }}
                                        />
                                        <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                                            R$ {(data.ganhos ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ {metaDiaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </Typography>
                                    </Box>
                                )}
                                
                                {metaSemanal && period === 'semana' && (
                                    <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                Meta Semanal
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                {progressoMetaSemanal.toFixed(0)}%
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={progressoMetaSemanal}
                                            sx={{
                                                height: 8,
                                                borderRadius: 4,
                                                backgroundColor: 'rgba(255,255,255,0.3)',
                                                '& .MuiLinearProgress-bar': {
                                                    backgroundColor: 'white',
                                                    borderRadius: 4
                                                }
                                            }}
                                        />
                                        <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                                            R$ {(data.ganhos ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ {metaSemanal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Card>
                    </motion.div>
                )}
            </Box>
        </Box>
    );
}