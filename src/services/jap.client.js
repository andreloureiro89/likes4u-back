import axios from 'axios';

const client = axios.create({
  baseURL: process.env.JAP_API_URL,
  timeout: 15000,
});

export async function jap(action, params = {}) {
  const body = new URLSearchParams({
    key: process.env.JAP_API_KEY,
    action,
    ...params,
  }).toString();

  const { data } = await client.post('', body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  return data; // o JAP devolve JSON
}