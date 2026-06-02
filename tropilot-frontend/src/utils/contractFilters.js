export function isActiveRentalContract(contract) {
  return contract?.rentalStatus === 'ACTIVE' && Boolean(contract?.residentHeadId);
}
