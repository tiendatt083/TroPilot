const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export function resolveFileUrl(fileUrl) {
  if (!fileUrl) {
    return '';
  }

  if (/^https?:\/\//i.test(fileUrl)) {
    return fileUrl;
  }

  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  const normalizedPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;

  return `${baseUrl}${normalizedPath}`;
}
