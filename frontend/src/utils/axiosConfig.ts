import axios from 'axios';

// Configuração global do Axios
const axiosInstance = axios.create({
  baseURL: 'http://localhost', // Substitua pela URL base da sua API
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
