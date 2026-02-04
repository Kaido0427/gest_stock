import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://api.mahoutondji.online', // ton backend Hono
});
