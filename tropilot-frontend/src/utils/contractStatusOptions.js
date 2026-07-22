export function getContractStatusClass(status) {
  return `status-pill contract-status-${String(status || 'not-uploaded').toLowerCase().replaceAll('_', '-')}`;
}
