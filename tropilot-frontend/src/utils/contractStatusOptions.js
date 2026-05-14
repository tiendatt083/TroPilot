export function getContractStatusLabel(status) {
  if (!status) {
    return 'Not available';
  }

  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getContractStatusClass(status) {
  return `status-pill contract-status-${String(status || 'not-uploaded').toLowerCase().replaceAll('_', '-')}`;
}
