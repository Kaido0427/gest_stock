import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://api.mahoutodjii.online', // ton backend Hono
});
