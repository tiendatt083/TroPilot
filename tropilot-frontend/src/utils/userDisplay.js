const BRAND_NAMES = new Set(['tropilot', 'tro pilot']);

function normalizeName(value) {
  return String(value || '').trim();
}

function isBrandName(value) {
  return BRAND_NAMES.has(normalizeName(value).toLowerCase());
}

export function getUserDisplayName(user, fallback = 'user') {
  const fullName = normalizeName(user?.fullName);

  if (fullName && !isBrandName(fullName)) {
    return fullName;
  }

  const emailName = normalizeName(user?.email).split('@')[0];

  if (emailName) {
    return emailName;
  }

  return fallback;
}

export function getRoleDisplayName(role, t) {
  if (role === 'ADMIN') {
    return t ? t('role.admin') : 'Admin';
  }

  if (role === 'STAFF') {
    return t ? t('role.staff') : 'Staff';
  }

  if (role === 'RESIDENT_HEAD') {
    return t ? t('role.residentHead') : 'Head resident';
  }

  return normalizeName(role).replaceAll('_', ' ') || 'User';
}
