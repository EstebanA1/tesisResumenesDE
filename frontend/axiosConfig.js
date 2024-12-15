import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Asegúrate de usar la misma URL
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Necesario para cookies
});

export default api;
