import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://api.mahoutodji.online', // ton backend Hono
});
