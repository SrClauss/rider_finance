"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useCategoriaContext } from '@/context/CategoriaContext';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { Box, Card, CardContent, Typography, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { formatarMoeda } from '@/utils/currencyUtils';
import type { Transaction } from '@/interfaces/Transaction';

// usando a interface centralizada

const LastTransactionsCard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { categorias } = useCategoriaContext();
  const theme = useTheme();

  
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.post('/api/transacoes', {
          page: 1,
          page_size: 5,
        });
        setTransactions(response.data.items);
      } catch (error) {
        console.error('Erro ao buscar transações:', error);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <ThemeProvider>
      <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 2, boxShadow: 3 }}>
       
        {transactions.map((transaction) => {
          // cada transação usa o campo `id_categoria` no projeto
          const categoria = categorias.find((c) => c.id === (transaction as any).id_categoria || (transaction as any).categoria);
          const iconName = categoria?.icone || '';
          const iconClasses = iconName ? `${iconName}` : '';

          return (
            <Card key={transaction.id} sx={{ mb: 2, bgcolor: 'background.paper', boxShadow: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {iconName ? (
                    (() => {
                      const isImage = /\.(png|jpe?g|svg)$|^https?:\/\//i.test(iconName);
                      const iconColor = theme.palette.mode === 'dark' ? theme.palette.text.primary : '#000';

                      if (isImage) {
                        return <img src={iconName} alt={categoria?.nome || 'icon'} style={{ width: 36, height: 36, objectFit: 'contain' }} />;
                      }

                      return <i className={iconClasses} style={{ color: iconColor, fontSize: 36, lineHeight: 1 }} aria-hidden />;
                    })()
                  ) : (
                    <Typography sx={{ color: 'text.secondary', fontSize: 21 }}>{categoria?.nome?.charAt(0) || '?'}</Typography>
                  )}
                  <Box sx={{ flex: 1 }}>
                    {/* Linha superior: descrição à esquerda, valor à direita (valor menor) */}
                    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2 }}>
                      <Typography variant="subtitle1" sx={{ color: 'text.primary' }}>
                        {transaction.descricao}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: transaction.tipo === 'entrada' ? 'success.main' : 'error.main', fontWeight: 'bold', fontSize: '0.9rem' }}
                      >
                        {transaction.tipo === 'entrada' ? '' : '-'} {formatarMoeda(transaction.valor)}
                      </Typography>
                    </Box>

                    {/* Linha inferior: relógio + hora à esquerda; tipo (Receita/Despesa) à direita */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {/* tenta FontAwesome, se não renderar, emoji aparece como fallback visual */}
                        <i className="fa-regular fa-clock" aria-hidden style={{ fontSize: 12, opacity: 0.9 }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {new Date(transaction.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>

                      <Typography variant="caption" sx={{ color: transaction.tipo === 'entrada' ? 'success.main' : 'error.main', fontWeight: 700 }}>
                        {transaction.tipo === 'entrada' ? 'Receita' : 'Despesa'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
              <Divider sx={{ bgcolor: 'divider' }} />
            </Card>
          );
        })}
      </Box>
    </ThemeProvider>
  );
};

export default LastTransactionsCard;
