export const ADMIN_BUILDING_TABS = [
  { path: '', labelKey: 'buildingWorkspace.overview', end: true },
  { path: '/rooms', labelKey: 'buildingWorkspace.rooms' },
  { path: '/users', labelKey: 'buildingWorkspace.users' },
  { path: '/equipment', labelKey: 'buildingWorkspace.equipment' },
  { path: '/contracts', labelKey: 'buildingWorkspace.contracts' },
  { path: '/utility-readings', labelKey: 'buildingWorkspace.utilityReadings' },
  { path: '/invoices', labelKey: 'buildingWorkspace.invoices' },
  { path: '/service-fees', labelKey: 'buildingWorkspace.serviceFees' },
  { path: '/vehicles', labelKey: 'buildingWorkspace.vehicles' },
  { path: '/payments', labelKey: 'buildingWorkspace.payments' },
  { path: '/receipts', labelKey: 'buildingWorkspace.receipts' },
  { path: '/members', labelKey: 'buildingWorkspace.roomMembers' },
  { path: '/maintenance', labelKey: 'buildingWorkspace.maintenance' },
  { path: '/expenses', labelKey: 'buildingWorkspace.expenses' },
  { path: '/cashflow', labelKey: 'buildingWorkspace.cashFlow' },
  { path: '/tasks', labelKey: 'buildingWorkspace.tasks' },
  { path: '/feedbacks', labelKey: 'buildingWorkspace.feedbacks' },
  { path: '/invoice-complaints', labelKey: 'buildingWorkspace.invoiceComplaints' },
  { path: '/notifications', labelKey: 'buildingWorkspace.notifications' }
];

export const STAFF_BUILDING_TABS = [
  { path: '', labelKey: 'buildingWorkspace.overview', end: true },
  ...ADMIN_BUILDING_TABS.filter((tab) =>
    [
      '/rooms',
      '/equipment',
      '/utility-readings',
      '/invoices',
      '/service-fees',
      '/vehicles',
      '/payments',
      '/maintenance',
      '/expenses',
      '/cashflow',
      '/tasks'
    ].includes(tab.path)
  )
];

export const ADMIN_BUILDING_ACTIONS = {
  showRoomsLink: true,
  canCreateRoom: true,
  canEditBuilding: true,
  canDeleteBuilding: true
};

export const STAFF_BUILDING_ACTIONS = {
  showRoomsLink: true
};
