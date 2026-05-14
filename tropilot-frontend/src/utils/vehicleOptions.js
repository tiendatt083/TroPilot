export const VEHICLE_OWNER_TYPE_OPTIONS = [
  { value: 'RESIDENT_HEAD', label: 'Head Resident' },
  { value: 'ROOM_MEMBER', label: 'Room Member' }
];

export const VEHICLE_TYPE_OPTIONS = [
  { value: 'MOTORBIKE', label: 'Motorbike' },
  { value: 'CAR', label: 'Car' },
  { value: 'BICYCLE', label: 'Bicycle' },
  { value: 'ELECTRIC_BIKE', label: 'Electric bike' }
];

export function getVehicleOwnerTypeLabel(ownerType) {
  return VEHICLE_OWNER_TYPE_OPTIONS.find((option) => option.value === ownerType)?.label || ownerType;
}

export function getVehicleTypeLabel(vehicleType) {
  return VEHICLE_TYPE_OPTIONS.find((option) => option.value === vehicleType)?.label || vehicleType;
}

export function getVehicleStatusLabel(status) {
  if (!status) {
    return 'Not available';
  }

  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function getVehicleStatusClass(status) {
  return `status-pill vehicle-status-${String(status || 'pending').toLowerCase()}`;
}
