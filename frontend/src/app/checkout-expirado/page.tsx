export default function CheckoutExpirado() {
  return (
    <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#181818'}}>
      <h1 style={{color: '#fbc02d'}}>Pagamento expirado</h1>
      <p>O tempo para pagamento expirou. Por favor, gere um novo checkout.</p>
    </div>
  );
}
