import { getStoredAuth } from './authStorage.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export function resolveFileUrl(fileUrl) {
  return buildProtectedFileUrl(fileUrl);
}

export async function openFileUrl(fileUrl, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  try {
    const url = buildProtectedFileUrl(fileUrl);
    if (!url) {
      return;
    }

    const { token } = getStoredAuth();
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    if (!response.ok) {
      throw new Error('Không thể mở tệp.');
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
  } catch (error) {
    window.alert(error.message || 'Không thể mở tệp.');
  }
}

function buildProtectedFileUrl(fileUrl) {
  if (!fileUrl) {
    return '';
  }

  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  const normalizedPath = normalizeUploadPath(fileUrl);

  return `${baseUrl}/api/files${normalizedPath}`;
}

function normalizeUploadPath(fileUrl) {
  let pathname = fileUrl;

  if (/^https?:\/\//i.test(fileUrl)) {
    try {
      pathname = new URL(fileUrl).pathname;
    } catch {
      pathname = fileUrl;
    }
  }

  pathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return pathname.startsWith('/uploads/') ? pathname : `/uploads${pathname}`;
}
