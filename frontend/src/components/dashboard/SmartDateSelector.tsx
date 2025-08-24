'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    Fade,
    Slide,
    useTheme,
    Chip,
    Stack,
    Tooltip
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    Today,
    CalendarMonth,
    DateRange,
    ShowChart,
    RestartAlt
} from '@mui/icons-material';

type PeriodType = 'hoje' | 'semana' | 'mes' | 'anual';

interface SmartDateSelectorProps {
    period: PeriodType;
    onDateChange: (filters: {
        ano?: number;
        mes?: number;
        data_referencia?: string;
        periodo: string;
    }) => void;
}

const SmartDateSelector: React.FC<SmartDateSelectorProps> = ({ period, onDateChange }) => {
    const theme = useTheme();
    const currentDate = new Date();
    
    // Estados para diferentes tipos de período
    const [selectedYear, setSelectedYear] = useState(2024); // Começar com 2024 onde temos dados
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
    const [referenceDate, setReferenceDate] = useState(new Date());

    // Gerar anos disponíveis (2020 até ano atual + 1)
    const availableYears = Array.from(
        { length: currentDate.getFullYear() - 2019 }, 
        (_, i) => 2020 + i
    );

    const months = [
        { value: 1, label: 'Janeiro', short: 'Jan' },
        { value: 2, label: 'Fevereiro', short: 'Fev' },
        { value: 3, label: 'Março', short: 'Mar' },
        { value: 4, label: 'Abril', short: 'Abr' },
        { value: 5, label: 'Maio', short: 'Mai' },
        { value: 6, label: 'Junho', short: 'Jun' },
        { value: 7, label: 'Julho', short: 'Jul' },
        { value: 8, label: 'Agosto', short: 'Ago' },
        { value: 9, label: 'Setembro', short: 'Set' },
        { value: 10, label: 'Outubro', short: 'Out' },
        { value: 11, label: 'Novembro', short: 'Nov' },
        { value: 12, label: 'Dezembro', short: 'Dez' }
    ];

    // Efeito para notificar mudanças de data
    useEffect(() => {
        const filters = {
            periodo: period,
            data_referencia: referenceDate.toISOString()
        };

        if (period === 'anual') {
            onDateChange({ ...filters, ano: selectedYear });
        } else if (period === 'mes') {
            onDateChange({ ...filters, ano: selectedYear, mes: selectedMonth });
        } else {
            onDateChange(filters);
        }
    }, [period, selectedYear, selectedMonth, referenceDate, onDateChange]);

    // Navegação temporal
    const navigateTime = (direction: 'prev' | 'next') => {
        switch (period) {
            case 'anual':
                setSelectedYear(prev => direction === 'next' ? prev + 1 : prev - 1);
                break;
            case 'mes':
                if (direction === 'next') {
                    if (selectedMonth === 12) {
                        setSelectedMonth(1);
                        setSelectedYear(prev => prev + 1);
                    } else {
                        setSelectedMonth(prev => prev + 1);
                    }
                } else {
                    if (selectedMonth === 1) {
                        setSelectedMonth(12);
                        setSelectedYear(prev => prev - 1);
                    } else {
                        setSelectedMonth(prev => prev - 1);
                    }
                }
                break;
            case 'semana':
                const newDate = new Date(referenceDate);
                newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
                setReferenceDate(newDate);
                break;
            case 'hoje':
                const newDateToday = new Date(referenceDate);
                newDateToday.setDate(newDateToday.getDate() + (direction === 'next' ? 1 : -1));
                setReferenceDate(newDateToday);
                break;
        }
    };

    // Reset para data atual
    const resetToToday = () => {
        const now = new Date();
        setSelectedYear(now.getFullYear());
        setSelectedMonth(now.getMonth() + 1);
        setReferenceDate(now);
    };

    // Formatação de display baseada no período
    const getDisplayText = () => {
        switch (period) {
            case 'anual':
                return selectedYear.toString();
            case 'mes':
                const month = months.find(m => m.value === selectedMonth);
                return `${month?.label} ${selectedYear}`;
            case 'semana':
                const startWeek = new Date(referenceDate);
                startWeek.setDate(startWeek.getDate() - startWeek.getDay() + 1); // Segunda-feira
                const endWeek = new Date(startWeek);
                endWeek.setDate(endWeek.getDate() + 6); // Domingo
                return `${startWeek.getDate()}/${startWeek.getMonth() + 1} - ${endWeek.getDate()}/${endWeek.getMonth() + 1}`;
            case 'hoje':
                return referenceDate.toLocaleDateString('pt-BR');
            default:
                return '';
        }
    };

    // Ícone baseado no período
    const getPeriodIcon = () => {
        switch (period) {
            case 'anual': return <ShowChart />;
            case 'mes': return <CalendarMonth />;
            case 'semana': return <DateRange />;
            case 'hoje': return <Today />;
        }
    };

    // Cor temática baseada no período
    const getPeriodColor = () => {
        switch (period) {
            case 'anual': return '#ff6b35';
            case 'mes': return '#4ecdc4';
            case 'semana': return '#45b7d1';
            case 'hoje': return '#96ceb4';
            default: return theme.palette.primary.main;
        }
    };

    return (
        <Fade in timeout={300}>
            <Paper 
                elevation={3}
                sx={{ 
                    p: 2,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${getPeriodColor()}15 0%, ${getPeriodColor()}08 100%)`,
                    border: `1px solid ${getPeriodColor()}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    minHeight: 60
                }}
            >
                {/* Navegação Esquerda */}
                <Tooltip title="Período anterior">
                    <IconButton 
                        onClick={() => navigateTime('prev')}
                        sx={{ 
                            color: getPeriodColor(),
                            '&:hover': { 
                                backgroundColor: `${getPeriodColor()}20`,
                                transform: 'scale(1.1)'
                            },
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    >
                        <ChevronLeft />
                    </IconButton>
                </Tooltip>

                {/* Display Central */}
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2, 
                    flex: 1,
                    justifyContent: 'center'
                }}>
                    <Slide direction="down" in timeout={200}>
                        <Chip
                            icon={getPeriodIcon()}
                            label={getDisplayText()}
                            sx={{
                                backgroundColor: getPeriodColor(),
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '1rem',
                                height: 40,
                                '& .MuiChip-icon': {
                                    color: 'white'
                                }
                            }}
                        />
                    </Slide>

                    {/* Seletores específicos para cada período */}
                    {period === 'anual' && (
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                            <Select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                sx={{
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: getPeriodColor()
                                    }
                                }}
                            >
                                {availableYears.map(year => (
                                    <MenuItem key={year} value={year}>
                                        {year}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {period === 'mes' && (
                        <Stack direction="row" spacing={1}>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <Select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                    sx={{
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: getPeriodColor()
                                        }
                                    }}
                                >
                                    {months.map(month => (
                                        <MenuItem key={month.value} value={month.value}>
                                            {month.short}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 80 }}>
                                <Select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    sx={{
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: getPeriodColor()
                                        }
                                    }}
                                >
                                    {availableYears.map(year => (
                                        <MenuItem key={year} value={year}>
                                            {year}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    )}
                </Box>

                {/* Controles Direita */}
                <Stack direction="row" spacing={1}>
                    <Tooltip title="Voltar para hoje">
                        <IconButton 
                            onClick={resetToToday}
                            size="small"
                            sx={{ 
                                color: theme.palette.text.secondary,
                                '&:hover': { 
                                    backgroundColor: `${getPeriodColor()}15`,
                                    color: getPeriodColor()
                                }
                            }}
                        >
                            <RestartAlt fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Próximo período">
                        <IconButton 
                            onClick={() => navigateTime('next')}
                            sx={{ 
                                color: getPeriodColor(),
                                '&:hover': { 
                                    backgroundColor: `${getPeriodColor()}20`,
                                    transform: 'scale(1.1)'
                                },
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                        >
                            <ChevronRight />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Paper>
        </Fade>
    );
};

export default SmartDateSelector;