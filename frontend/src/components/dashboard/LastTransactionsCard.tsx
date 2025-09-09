"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { useUsuarioContext } from '@/context/UsuarioContext';
import { useUsuarioContext as useUsuarioContextSession } from '@/context/SessionContext';
import { formatUtcToLocalTimeString, getUserTimezone } from '@/utils/dateUtils';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { Box, Card, CardContent, Typography, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { formatarMoeda } from '@/utils/currencyUtils';
import type { Transaction } from '@/interfaces/Transaction';

// usando a interface centralizada

const LastTransactionsCard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { categorias } = useUsuarioContext();
  const { configuracoes } = useUsuarioContextSession();
  const userTimezone = getUserTimezone(configuracoes);
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
          // cada transação pode ter id_categoria ou categoria; acessos via unknown->Record
          const tx = transaction as unknown as Record<string, unknown>;
          const idCategoria = tx['id_categoria'] ?? tx['categoria'];
          const categoria = categorias.find((c) => c.id === idCategoria);
          const iconName = (categoria?.icone as string) ?? '';
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
                        return (
                          <Image
                            src={String(iconName)}
                            alt={categoria?.nome || 'icon'}
                            width={36}
                            height={36}
                            style={{ objectFit: 'contain' }}
                            unoptimized
                          />
                        );
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
                          {formatUtcToLocalTimeString(transaction.data, userTimezone)}
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
