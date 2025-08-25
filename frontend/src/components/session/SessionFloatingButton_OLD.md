# Código antigo do layout de receitas/despesas no SessionFloatingButton

```tsx
<Box sx={{ mt: 1, display: "flex", justifyContent: "space-between", minWidth: 200 }}>
  {active ? (
    <>
      <Typography
        variant="caption"
        sx={{ fontWeight: "bold", color: "#00e676", flex: 1, textAlign: "left" }}
      >
        R$ {totals.ganhos.toFixed(2)}
      </Typography>
      <Typography
        variant="caption"
        sx={{ fontWeight: "bold", color: "#ff1744", flex: 1, textAlign: "right" }}
      >
        R$ {totals.gastos.toFixed(2)}
      </Typography>
    </>
  ) : (
    <Typography variant="caption" sx={{ color: "#ccc", width: "100%", textAlign: "center" }}>
      Iniciar sessão
    </Typography>
  )}
</Box>
```
