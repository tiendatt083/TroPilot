import { localizedOption } from './interfaceTranslations.js';

export const VEHICLE_OWNER_TYPE_OPTIONS = [
  localizedOption('RESIDENT_HEAD', 'Head Resident'),
  localizedOption('ROOM_MEMBER', 'Room Member')
];

export const VEHICLE_TYPE_OPTIONS = [
  localizedOption('MOTORBIKE', 'Motorbike'),
  localizedOption('CAR', 'Car'),
  localizedOption('BICYCLE', 'Bicycle'),
  localizedOption('ELECTRIC_BIKE', 'Electric bike')
];

export function getVehicleStatusClass(status) {
  return `status-pill vehicle-status-${String(status || 'pending').toLowerCase()}`;
}
