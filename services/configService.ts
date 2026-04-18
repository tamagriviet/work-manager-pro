const SERVER_URL_KEY = 'work_manager_server_url';
const DEFAULT_URL = 'http://localhost:3000';

export const getServerUrl = (): string => {
  return localStorage.getItem(SERVER_URL_KEY) || DEFAULT_URL;
};

export const setServerUrl = (url: string) => {
  // Remove trailing slash if exists
  const formattedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  localStorage.setItem(SERVER_URL_KEY, formattedUrl);
};
