export const environment = {
  production: true,
  apiUrl: process.env['API_URL'] || 'https://api.example.com/api',
  wsUrl: process.env['WS_URL'] || 'https://api.example.com',
  enableRetry: true,
  maxRetries: 2,
  retryDelay: 2000,
};

