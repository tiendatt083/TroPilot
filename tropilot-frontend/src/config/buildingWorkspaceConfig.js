const BUILDING_WORKSPACE_GROUPS = [
  {
    id: 'overview',
    standalone: true,
    items: [
      { path: '', labelKey: 'buildingWorkspace.overview', end: true }
    ]
  },
  {
    id: 'accounts',
    labelKey: 'buildingWorkspace.groups.accounts',
    items: [
      { path: '/users', labelKey: 'buildingWorkspace.users' }
    ]
  },
  {
    id: 'communication',
    labelKey: 'buildingWorkspace.groups.communication',
    items: [
      { path: '/notifications', labelKey: 'buildingWorkspace.notifications' },
      { path: '/feedbacks', labelKey: 'buildingWorkspace.feedbacks' }
    ]
  },
  {
    id: 'operations',
    labelKey: 'buildingWorkspace.groups.operations',
    items: [
      { path: '/rooms', labelKey: 'buildingWorkspace.rooms' },
      { path: '/equipment', labelKey: 'buildingWorkspace.equipment' },
      { path: '/contracts', labelKey: 'buildingWorkspace.contracts' },
      { path: '/utility-readings', labelKey: 'buildingWorkspace.utilityReadings' },
      { path: '/service-fees', labelKey: 'buildingWorkspace.serviceFees' },
      { path: '/vehicles', labelKey: 'buildingWorkspace.vehicles' },
      { path: '/maintenance', labelKey: 'buildingWorkspace.maintenance' },
      { path: '/tasks', labelKey: 'buildingWorkspace.tasks' }
    ]
  },
  {
    id: 'finance',
    labelKey: 'buildingWorkspace.groups.finance',
    items: [
      { path: '/invoices', labelKey: 'buildingWorkspace.invoices' },
      { path: '/cashflow', labelKey: 'buildingWorkspace.cashFlow' }
    ]
  }
];

export const ADMIN_BUILDING_TABS = BUILDING_WORKSPACE_GROUPS;

export const STAFF_BUILDING_TABS = [
  ...filterBuildingWorkspaceGroups([
    '',
    '/rooms',
    '/equipment',
    '/utility-readings',
    '/service-fees',
    '/vehicles',
    '/maintenance',
    '/tasks'
  ])
];

function filterBuildingWorkspaceGroups(allowedPaths) {
  const allowed = new Set(allowedPaths);

  return BUILDING_WORKSPACE_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => allowed.has(item.path))
    }))
    .filter((group) => group.items.length > 0);
}
