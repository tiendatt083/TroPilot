const API_ORIGIN = 'http://localhost:8080';

const USERS = {
  admin: {
    id: 1,
    fullName: 'Admin',
    email: 'admin@tropilot.com',
    phone: '0900000001',
    role: 'ADMIN',
    status: 'ACTIVE',
    mustChangePassword: false
  },
  staff: {
    id: 2,
    fullName: 'Staff User',
    email: 'staff@tropilot.test',
    phone: '0900000002',
    role: 'STAFF',
    status: 'ACTIVE',
    mustChangePassword: false
  },
  resident: {
    id: 3,
    fullName: 'Resident User',
    email: 'resident@tropilot.test',
    phone: '0900000003',
    role: 'RESIDENT_HEAD',
    status: 'ACTIVE',
    mustChangePassword: false
  }
};

function success(data, message = 'Operation completed successfully') {
  return {
    success: true,
    message,
    data
  };
}

function failure(message, errors = []) {
  return {
    success: false,
    message,
    errors
  };
}

function getRoleFromEmail(email = '') {
  const normalizedEmail = email.toLowerCase();

  if (normalizedEmail.includes('staff')) {
    return 'staff';
  }

  if (normalizedEmail.includes('resident')) {
    return 'resident';
  }

  return 'admin';
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createInvoice(room, overrides = {}) {
  return {
    id: overrides.id || 1,
    roomId: room.id,
    roomCode: room.roomCode,
    roomName: room.roomName,
    buildingId: room.buildingId,
    buildingCode: room.buildingCode,
    buildingName: room.buildingName,
    residentHeadId: USERS.resident.id,
    residentHeadName: USERS.resident.fullName,
    residentHeadEmail: USERS.resident.email,
    invoiceDate: '2026-06-03',
    month: '2026-06',
    utilityMonth: '2026-05',
    dueDate: '2026-06-05',
    status: overrides.status || 'UNPAID',
    totalAmount: 10500000,
    createdByName: USERS.admin.fullName,
    depositIncluded: true,
    utilityReadingRequired: false,
    qrImageUrl: overrides.status === 'PAID' ? null : '/mock/payment-qr.png',
    paymentCode: 'TP-INV-0001',
    items: [
      {
        id: 1,
        itemName: 'Deposit',
        quantity: 1,
        unitPrice: 5000000,
        amount: 5000000,
        note: 'Initial deposit'
      },
      {
        id: 2,
        itemName: 'Room rent',
        quantity: 1,
        unitPrice: 5000000,
        amount: 5000000,
        note: 'Monthly room rent'
      },
      {
        id: 3,
        itemName: 'Internet',
        quantity: 1,
        unitPrice: 500000,
        amount: 500000,
        note: 'Monthly service fee'
      }
    ]
  };
}

function createState(options = {}) {
  const building = {
    id: 1,
    buildingCode: 'BD01',
    name: 'Building 01',
    address: '123 Demo Street',
    floors: 5,
    description: 'Smoke test building'
  };
  const occupiedRoom = {
    id: 1,
    buildingId: building.id,
    buildingCode: building.buildingCode,
    buildingName: building.name,
    roomCode: 'BD01-P101',
    roomName: 'P101',
    floor: 1,
    price: 5000000,
    area: 30,
    maxOccupants: 4,
    status: 'OCCUPIED',
    residentHeadId: USERS.resident.id,
    residentHeadName: USERS.resident.fullName,
    residentHeadEmail: USERS.resident.email,
    description: 'Occupied smoke test room'
  };

  return {
    currentUser: null,
    residentHasRoom: options.residentHasRoom !== false,
    nextRoomId: 2,
    nextInvoiceId: 2,
    buildings: [building],
    rooms: [occupiedRoom],
    invoices: options.withInitialInvoice ? [createInvoice(occupiedRoom)] : [],
    notifications: [
      {
        id: 1,
        title: 'Payment received',
        content: 'Payment for invoice 1 has been received successfully.',
        source: 'SYSTEM',
        eventType: 'PAYMENT_RECEIVED',
        actionPath: null,
        createdByName: 'System',
        createdByRole: 'ADMIN',
        createdAt: '2026-06-24T20:03:00',
        read: false,
        readAt: null
      }
    ],
    sentNotifications: [
      {
        id: 101,
        title: 'Tenant payment notice',
        content: 'Please complete this month rental and utility payment before the due date.',
        source: 'MANUAL',
        eventType: 'MANUAL',
        actionPath: null,
        createdByName: USERS.admin.fullName,
        createdByRole: 'ADMIN',
        createdAt: '2026-06-24T20:10:00',
        read: true,
        readAt: null
      }
    ],
    activityLogs: [
      {
        id: 1,
        userFullName: 'Current User',
        userEmail: 'current@tropilot.test',
        userRole: 'ADMIN',
        action: 'PROFILE_UPDATED',
        description: 'Updated profile information',
        createdAt: '2026-06-24T20:00:00'
      }
    ],
    webhookPaid: false
  };
}

function getDashboardState(state) {
  const occupiedRooms = state.rooms.filter((room) => room.status === 'OCCUPIED').length;
  const emptyRooms = state.rooms.filter((room) => room.status === 'EMPTY').length;
  const unpaidInvoices = state.invoices.filter((invoice) => invoice.status !== 'PAID').length;
  const unpaidAmount = state.invoices
    .filter((invoice) => invoice.status !== 'PAID')
    .reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0);

  return {
    totalBuildings: state.buildings.length,
    totalRooms: state.rooms.length,
    emptyRooms,
    occupiedRooms,
    maintenanceRooms: 0,
    totalHeadResidents: occupiedRooms,
    totalApprovedRoomMembers: 0,
    totalPendingRoomMembers: 0,
    totalOccupants: occupiedRooms,
    totalActiveVehicles: 0,
    expiringContracts: 0,
    unpaidInvoices,
    overdueInvoices: 0,
    totalIncome: 0,
    unpaidAmount,
    totalExpense: 0,
    remainingCash: 0,
    pendingMaintenanceRequests: 0,
    inProgressTasks: 0,
    unresolvedFeedbacks: 0
  };
}

async function fulfillJson(route, payload, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(payload)
  });
}

async function getPostBody(request) {
  try {
    return request.postDataJSON();
  } catch {
    return {};
  }
}

function getPath(requestUrl) {
  return new URL(requestUrl).pathname;
}

function getQuery(requestUrl) {
  return new URL(requestUrl).searchParams;
}

function listRooms(state, requestUrl) {
  const buildingId = getQuery(requestUrl).get('buildingId');
  if (!buildingId) {
    return state.rooms;
  }

  return state.rooms.filter((room) => String(room.buildingId) === String(buildingId));
}

function getHeadAssignment(state, roomId) {
  const room = state.rooms.find((item) => String(item.id) === String(roomId));

  if (!room || room.status !== 'OCCUPIED') {
    return { assigned: false };
  }

  return {
    assigned: true,
    roomId: room.id,
    residentHeadId: USERS.resident.id,
    residentHeadName: USERS.resident.fullName,
    residentHeadEmail: USERS.resident.email,
    assignmentStartDate: '2026-06-01',
    assignmentEndDate: '2026-12-01',
    assignmentStatus: 'ACTIVE',
    depositAmount: 5000000,
    rentalStatus: 'ACTIVE',
    contractStatus: 'UPLOADED',
    contractStartDate: '2026-06-01',
    contractEndDate: '2026-12-01'
  };
}

function previewInvoice(state, body) {
  const room = state.rooms.find((item) => String(item.id) === String(body.roomId)) || state.rooms[0];
  return createInvoice(room, { id: state.nextInvoiceId });
}

function generateInvoice(state, body) {
  const room = state.rooms.find((item) => String(item.id) === String(body.roomId)) || state.rooms[0];
  const invoice = createInvoice(room, { id: state.nextInvoiceId });
  state.nextInvoiceId += 1;
  state.invoices.push(invoice);
  return invoice;
}

async function handleApiRoute(route, state) {
  const request = route.request();
  const method = request.method();
  const path = getPath(request.url());

  if (method === 'POST' && path === '/api/auth/login') {
    const body = await getPostBody(request);
    const userKey = getRoleFromEmail(body.email);
    state.currentUser = USERS[userKey];
    return fulfillJson(route, success({
      token: `mock-${state.currentUser.role.toLowerCase()}-token`,
      userId: state.currentUser.id,
      fullName: state.currentUser.fullName,
      email: state.currentUser.email,
      role: state.currentUser.role,
      mustChangePassword: false
    }));
  }

  if (method === 'GET' && path === '/api/auth/me') {
    return fulfillJson(route, success(state.currentUser || USERS.admin));
  }

  if (method === 'GET' && path === '/api/notifications/me') {
    return fulfillJson(route, success(state.notifications));
  }

  const notificationReadMatch = path.match(/^\/api\/notifications\/(\d+)\/read$/);
  if (method === 'PUT' && notificationReadMatch) {
    const notification = state.notifications.find((item) => String(item.id) === notificationReadMatch[1]);
    if (notification) {
      notification.read = true;
      notification.readAt = '2026-06-24T20:05:00';
    }
    return fulfillJson(route, success(notification));
  }

  if (method === 'GET' && path === '/api/activity-logs/me') {
    const query = new URL(request.url()).searchParams.get('query')?.trim().toLowerCase();
    const logs = query
      ? state.activityLogs.filter((log) => [
        log.action,
        log.description,
        log.userFullName,
        log.userEmail,
        log.userRole
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)))
      : state.activityLogs;
    return fulfillJson(route, success(logs));
  }

  if (method === 'GET' && path === '/api/admin/notifications/sent') {
    return fulfillJson(route, success(state.sentNotifications));
  }

  if (method === 'GET' && path === '/api/admin/dashboard') {
    return fulfillJson(route, success(getDashboardState(state)));
  }

  if (method === 'GET' && path === '/api/staff/dashboard') {
    return fulfillJson(route, success({
      totalRooms: state.rooms.length,
      assignedTasks: 1,
      overdueTasks: 0,
      roomsNeedingUtilityReading: 1,
      pendingPaymentConfirmations: 0,
      activeMaintenanceRequests: 0,
      createdExpenses: 0
    }));
  }

  if (method === 'GET' && path === '/api/resident/dashboard') {
    return fulfillJson(route, success({
      currentRoom: 'BD01-P101',
      approvedMemberCount: 0,
      currentContract: null,
      latestInvoice: state.invoices[0] || null,
      paymentDueDate: state.invoices[0]?.dueDate || null,
      activeVehicles: 0,
      unreadNotifications: 0,
      recentMaintenanceRequests: []
    }));
  }

  if (method === 'GET' && path === '/api/resident/room') {
    if (!state.residentHasRoom) {
      return fulfillJson(route, success({ assigned: false }));
    }

    const room = state.rooms[0];
    return fulfillJson(route, success({
      assigned: true,
      roomId: room.id,
      roomCode: room.roomCode,
      roomName: room.roomName,
      buildingId: room.buildingId,
      buildingCode: room.buildingCode,
      buildingName: room.buildingName
    }));
  }

  if (method === 'GET' && path === '/api/admin/buildings') {
    return fulfillJson(route, success(state.buildings));
  }

  if (method === 'GET' && path === '/api/staff/buildings') {
    return fulfillJson(route, success(state.buildings));
  }

  const buildingMatch = path.match(/^\/api\/(admin|staff)\/buildings\/(\d+)$/);
  if (method === 'GET' && buildingMatch) {
    const building = state.buildings.find((item) => String(item.id) === buildingMatch[2]);
    return fulfillJson(route, success(building || state.buildings[0]));
  }

  if (method === 'GET' && ['/api/admin/users', '/api/admin/residents'].includes(path)) {
    return fulfillJson(route, success(Object.values(USERS)));
  }

  if (method === 'GET' && path === '/api/admin/rooms') {
    return fulfillJson(route, success(listRooms(state, request.url())));
  }

  if (method === 'GET' && path === '/api/staff/rooms') {
    return fulfillJson(route, success(listRooms(state, request.url())));
  }

  if (method === 'GET' && ['/api/admin/utility-readings', '/api/staff/utility-readings'].includes(path)) {
    return fulfillJson(route, success([]));
  }

  if (
    method === 'GET'
    && ['/api/admin/utility-readings/overview', '/api/staff/utility-readings/overview'].includes(path)
  ) {
    return fulfillJson(route, success({
      month: getQuery(request.url()).get('month'),
      totalRooms: state.rooms.length,
      recordedRooms: 0,
      pendingRooms: state.rooms.length,
      emptyRooms: 0,
      eligibleRooms: state.rooms
    }));
  }

  if (method === 'POST' && path === '/api/staff/utility-readings/fetch') {
    return fulfillJson(route, success({
      source: 'MOCK',
      recordedAt: getQuery(request.url()).get('readingDate'),
      oldElectricity: 350,
      newElectricity: 437,
      electricityUsage: 87,
      oldWater: 24,
      newWater: 31,
      waterUsage: 7
    }));
  }

  if (method === 'POST' && path === '/api/staff/utility-readings/fetch/electricity') {
    return fulfillJson(route, success({
      source: 'MOCK',
      meterType: 'ELECTRICITY',
      recordedAt: getQuery(request.url()).get('readingDate'),
      oldReading: 350,
      newReading: 437,
      usage: 87
    }));
  }

  if (method === 'POST' && path === '/api/staff/utility-readings/fetch/water') {
    return fulfillJson(route, success({
      source: 'MOCK',
      meterType: 'WATER',
      recordedAt: getQuery(request.url()).get('readingDate'),
      oldReading: 24,
      newReading: 31,
      usage: 7
    }));
  }

  if (method === 'POST' && path === '/api/admin/rooms') {
    const body = await getPostBody(request);
    const building = state.buildings.find((item) => item.id === Number(body.buildingId)) || state.buildings[0];
    const room = {
      id: state.nextRoomId,
      buildingId: building.id,
      buildingCode: building.buildingCode,
      buildingName: building.name,
      roomCode: body.roomCode,
      roomName: body.roomName,
      floor: body.floor,
      price: body.price,
      area: body.area,
      maxOccupants: body.maxOccupants,
      status: body.status || 'EMPTY',
      description: body.description || ''
    };
    state.nextRoomId += 1;
    state.rooms.push(room);
    return fulfillJson(route, success(room, 'Room created successfully.'));
  }

  const roomMatch = path.match(/^\/api\/(admin|staff)\/rooms\/(\d+)$/);
  if (method === 'GET' && roomMatch) {
    const room = state.rooms.find((item) => String(item.id) === roomMatch[2]);
    return fulfillJson(route, success(room || state.rooms[0]));
  }

  const headResidentMatch = path.match(/^\/api\/admin\/rooms\/(\d+)\/head-resident$/);
  if (headResidentMatch) {
    const roomId = headResidentMatch[1];
    const room = state.rooms.find((item) => String(item.id) === roomId);

    if (method === 'GET') {
      return fulfillJson(route, success(getHeadAssignment(state, roomId)));
    }

    if (method === 'POST') {
      if (room) {
        room.status = 'OCCUPIED';
        room.residentHeadId = USERS.resident.id;
        room.residentHeadName = USERS.resident.fullName;
        room.residentHeadEmail = USERS.resident.email;
      }
      return fulfillJson(route, success(getHeadAssignment(state, roomId), 'Head Resident assigned successfully.'));
    }
  }

  const buildingCollectionMatch = path.match(/^\/api\/(admin|staff)\/buildings\/(\d+)\/([a-z-]+)$/);
  if (method === 'GET' && buildingCollectionMatch) {
    const resource = buildingCollectionMatch[3];

    if (resource === 'invoices') {
      return fulfillJson(route, success(state.invoices));
    }

    if (resource === 'users') {
      return fulfillJson(route, success(Object.values(USERS)));
    }

    return fulfillJson(route, success([]));
  }

  const invoiceActionMatch = path.match(/^\/api\/(admin|staff)\/buildings\/(\d+)\/invoices\/(preview|generate|bulk-preview|bulk-generate)$/);
  if (method === 'POST' && invoiceActionMatch) {
    const body = await getPostBody(request);
    const action = invoiceActionMatch[3];

    if (action === 'preview') {
      return fulfillJson(route, success(previewInvoice(state, body)));
    }

    if (action === 'generate') {
      return fulfillJson(route, success(generateInvoice(state, body), 'Invoice generated successfully.'));
    }

    if (action === 'bulk-preview') {
      const invoice = previewInvoice(state, { roomId: state.rooms[0].id });
      return fulfillJson(route, success({
        eligibleCount: 1,
        blockedCount: 0,
        totalAmount: invoice.totalAmount,
        invoiceMonth: invoice.month,
        utilityMonth: invoice.utilityMonth,
        eligibleInvoices: [invoice],
        blockedRooms: []
      }));
    }

    return fulfillJson(route, success([generateInvoice(state, { roomId: state.rooms[0].id })]));
  }

  const invoiceDetailMatch = path.match(/^\/api\/(admin|staff)\/buildings\/(\d+)\/invoices\/(\d+)$/);
  if (method === 'GET' && invoiceDetailMatch) {
    const invoice = state.invoices.find((item) => String(item.id) === invoiceDetailMatch[3]);
    return fulfillJson(route, success(invoice || state.invoices[0] || createInvoice(state.rooms[0])));
  }

  if (method === 'POST' && path === '/api/sepay/webhook') {
    state.webhookPaid = true;
    state.invoices = state.invoices.map((invoice) => ({
      ...invoice,
      status: 'PAID',
      qrImageUrl: null
    }));
    return fulfillJson(route, success({ paymentStatus: 'PAID' }, 'Payment confirmed successfully.'));
  }

  if (path.startsWith('/api/resident/') && !state.residentHasRoom) {
    return fulfillJson(route, failure('Resident does not have an active room assignment.'), 403);
  }

  return fulfillJson(route, success([]));
}

export async function mockTropilotApi(page, options = {}) {
  const state = createState(options);

  await page.addInitScript(() => {
    window.localStorage.setItem('lang', 'en');
    window.localStorage.removeItem('adminSidebarCollapsed');
  });

  await page.route(`${API_ORIGIN}/api/**`, (route) => handleApiRoute(route, state));

  return state;
}

export async function loginAs(page, role) {
  const credentials = {
    admin: { email: USERS.admin.email, password: 'Admin@123' },
    staff: { email: USERS.staff.email, password: 'Staff@123' },
    resident: { email: USERS.resident.email, password: 'Resident@123' }
  }[role];

  await page.goto('/login');
  await page.getByLabel('Email address').fill(credentials.email);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

export function getMockStateSnapshot(state) {
  return clone(state);
}
