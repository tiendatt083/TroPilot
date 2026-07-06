import { localizedOption } from './interfaceTranslations.js';

export const MEMBER_STATUS_OPTIONS = [
  localizedOption('PENDING', 'Pending'),
  localizedOption('APPROVED', 'Approved'),
  localizedOption('REJECTED', 'Rejected'),
  localizedOption('LEFT', 'Left')
];

export function getMemberStatusLabel(status) {
  return MEMBER_STATUS_OPTIONS.find((option) => option.value === status)?.label || status;
}
