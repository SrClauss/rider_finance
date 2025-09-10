import axios from 'axios';

// Configuração dinâmica da baseURL baseada no ambiente
const getBaseURL = () => {
  // Em produção, usar URLs relativas (sem baseURL)
  if (typeof window !== 'undefined') {
    // Client-side: usar URL relativa para aproveitar o proxy nginx
    return '';
  }
  // Server-side (SSR): usar a URL interna do container
  return process.env.BACKEND_INTERNAL_URL || '';
};

// Configuração global do Axios
const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});

// Interceptor para tratar erros 401 de forma silenciosa
axiosInstance.interceptors.response.use(
  (response) => response, // Retorna a resposta diretamente se não houver erro
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Erro 401 esperado: não logar no console
      console.info('Erro 401 capturado e tratado silenciosamente.');
      return Promise.reject(error); // Rejeita a promessa para que o chamador possa lidar com isso
    }
    return Promise.reject(error); // Rejeita outros erros normalmente
  }
);

export default axiosInstance;
