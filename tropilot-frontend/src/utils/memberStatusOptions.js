export const MEMBER_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'LEFT', label: 'Left' }
];

export function getMemberStatusLabel(status) {
  return MEMBER_STATUS_OPTIONS.find((option) => option.value === status)?.label || status;
}
