import AsyncStorage from '@react-native-async-storage/async-storage';

// export const URL = 'https://renata-pungent-johnna.ngrok-free.dev';
export const URL = 'https://badminton-backend-1pp7.onrender.com';
export const BASE_URL = 'https://badminton-core-backend.vercel.app';
// export const WS_BASE_URL = 'wss://renata-pungent-johnna.ngrok-free.dev';
export const WS_BASE_URL = 'wss://badminton-backend-1pp7.onrender.com';

// Central request handler
// baseUrl defaults to the Vercel URL; pass URL (Render) to use the other one
const request = async (
  method,
  endPoint,
  body = null,
  token = null,
  baseUrl = BASE_URL,
) => {
  try {
    // Uses passed token, or falls back to AsyncStorage if not passed
    const authToken = token || (await AsyncStorage.getItem('token'));

    const headers = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true', // Bypasses ngrok warning page
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const config = {
      method,
      headers,
    };

    if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      config.body = JSON.stringify(body);
    }

    const res = await fetch(`${baseUrl || BASE_URL}${endPoint}`, config);
    const data = await res.json();

    if (!res.ok) {
      // throw new Error(data.message || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (error) {
    // console.error(`${method} ${endPoint} error:`, error.message);
    throw error;
  }
};

// GET: fetch data
export const get_api = (endPoint, token = null, baseUrl = BASE_URL) =>
  request('GET', endPoint, null, token, baseUrl);

// POST: create resource
export const post_api = (
  endPoint,
  body = {},
  token = null,
  baseUrl = BASE_URL,
) => request('POST', endPoint, body, token, baseUrl);

// PUT: full update
export const put_api = (
  endPoint,
  body = {},
  token = null,
  baseUrl = BASE_URL,
) => request('PUT', endPoint, body, token, baseUrl);

// PATCH: partial update
export const patch_api = (
  endPoint,
  body = {},
  token = null,
  baseUrl = BASE_URL,
) => request('PATCH', endPoint, body, token, baseUrl);

// DELETE: remove resource
export const delete_api = (
  endPoint,
  token = null,
  body = null,
  baseUrl = BASE_URL,
) => request('DELETE', endPoint, body, token, baseUrl);