import AsyncStorage from '@react-native-async-storage/async-storage';

// export const URL = 'https://renata-pungent-johnna.ngrok-free.dev';
export const URL = 'https://badminton-backend-1pp7.onrender.com';
// export const WS_BASE_URL = 'wss://renata-pungent-johnna.ngrok-free.dev';
export const WS_BASE_URL = 'wss://badminton-backend-1pp7.onrender.com';

// Central request handler
const request = async (method, endPoint, body = null, token = null) => {
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

    const res = await fetch(`${URL}${endPoint}`, config);
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
export const get_api = (endPoint, token = null) =>
  request('GET', endPoint, null, token);

// POST: create resource
export const post_api = (endPoint, body = {}, token = null) =>
  request('POST', endPoint, body, token);

// PUT: full update
export const put_api = (endPoint, body = {}, token = null) =>
  request('PUT', endPoint, body, token);

// PATCH: partial update
export const patch_api = (endPoint, body = {}, token = null) =>
  request('PATCH', endPoint, body, token);

// DELETE: remove resource
export const delete_api = (endPoint, token = null, body = null) =>
  request('DELETE', endPoint, body, token);
