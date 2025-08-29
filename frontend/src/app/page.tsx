

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function Home() {
  // Faz uma requisição server-side para o backend validar o token
  const res = await fetch('http://127.0.0.1:8000/api/validate_token', {
    method: 'GET',
    // Importante: repassar os cookies do request original
    headers: {
      Cookie: cookies().toString(),
    },
    cache: 'no-store',
    credentials: 'include',
  });
  const data = await res.json();
  if (data.valid) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
  return null;
}
