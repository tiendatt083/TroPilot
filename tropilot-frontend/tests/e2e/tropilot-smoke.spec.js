import { expect, test } from '@playwright/test';
import { getMockStateSnapshot, loginAs, mockTropilotApi } from './helpers/mockApi.js';

async function expectNoVisibleAppError(page) {
  await expect(page.locator('.error-alert')).toHaveCount(0);
}

test.describe('Tropilot smoke flow', () => {
  test('admin can log in, open dashboard, and enter a building workspace', async ({ page }) => {
    await mockTropilotApi(page);

    await loginAs(page, 'admin');

    await expect(page).toHaveURL(/\/admin\/dashboard$/);
    await expect(page.getByRole('heading', { name: "Today's operations" })).toBeVisible();

    await page.goto('/admin/buildings');
    await expect(page.getByRole('heading', { name: 'Building management' })).toBeVisible();
    await expect(page.getByText('BD01')).toBeVisible();

    await page.goto('/admin/buildings/1');
    await expect(page.getByRole('heading', { name: 'Building 01' })).toBeVisible();
    await expectNoVisibleAppError(page);
  });

  test('staff can log in and open operational work screens', async ({ page }) => {
    await mockTropilotApi(page);

    await loginAs(page, 'staff');

    await expect(page).toHaveURL(/\/staff\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    await page.goto('/staff/tasks');
    await expect(page.getByRole('heading', { name: 'My tasks' })).toBeVisible();
    await expectNoVisibleAppError(page);

    await page.goto('/staff/maintenance');
    await expect(page.getByRole('heading', { name: 'Maintenance requests' })).toBeVisible();
    await expectNoVisibleAppError(page);
  });

  test('staff building overview requests utility overview for the current month', async ({ page }) => {
    await mockTropilotApi(page);
    const utilityOverviewRequests = [];

    page.on('request', (request) => {
      const url = new URL(request.url());

      if (url.pathname === '/api/staff/utility-readings/overview') {
        utilityOverviewRequests.push(url);
      }
    });

    await loginAs(page, 'staff');
    await page.goto('/staff/buildings/1');

    await expect(page.getByRole('heading', { name: 'Building 01' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Today operations' })).toBeVisible();
    expect(utilityOverviewRequests.some((url) => url.searchParams.has('month'))).toBe(true);
    await expectNoVisibleAppError(page);
  });

  test('resident without active room is redirected away from room-only pages', async ({ page }) => {
    await mockTropilotApi(page, { residentHasRoom: false });

    await loginAs(page, 'resident');

    await expect(page).toHaveURL(/\/resident\/profile$/);

    await page.goto('/resident/invoices');
    await expect(page).toHaveURL(/\/resident\/profile$/);
    await expect(page.getByRole('link', { name: 'Personal information' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Invoices' })).toHaveCount(0);
  });

  test('admin can create a room and assign a Head Resident', async ({ page }) => {
    const state = await mockTropilotApi(page);

    await loginAs(page, 'admin');
    await page.goto('/admin/buildings/1/rooms/create');

    await page.locator('#roomCode').fill('P202');
    await page.locator('#roomName').fill('Room 202');
    await page.locator('#floor').fill('2');
    await page.locator('#maxOccupants').fill('4');
    await page.locator('#price').fill('5500000');
    await page.locator('#area').fill('32');
    await page.getByRole('button', { name: 'Create room' }).click();

    await expect(page).toHaveURL(/\/admin\/buildings\/1\/rooms$/);

    const createdRoom = getMockStateSnapshot(state).rooms.find((room) => room.roomCode === 'BD01-P202');
    expect(createdRoom).toBeTruthy();

    await page.goto(`/admin/buildings/1/rooms/${createdRoom.id}`);
    await page.getByRole('button', { name: 'Assign Head Resident' }).click();
    await page.locator('#residentHeadId').selectOption('3');
    await page.locator('.assignment-form button[type="submit"]').click();

    await expect(page.getByText('Head Resident assigned successfully')).toBeVisible();

    const assignedRoom = getMockStateSnapshot(state).rooms.find((room) => room.id === createdRoom.id);
    expect(assignedRoom.status).toBe('OCCUPIED');
    expect(assignedRoom.residentHeadId).toBe(3);
  });

  test('admin can preview and generate a building invoice', async ({ page }) => {
    const state = await mockTropilotApi(page);

    await loginAs(page, 'admin');
    await page.goto('/admin/buildings/1/invoices');

    await page.getByRole('button', { name: 'Create invoice' }).click();
    await page.locator('#roomId').selectOption('1');
    await page.getByRole('button', { name: 'Preview invoice' }).click();

    await expect(page.getByText('Invoice preview')).toBeVisible();
    await expect(page.getByText('10,500,000')).toBeVisible();

    await page.getByRole('button', { name: 'Generate invoice' }).click();

    await expect(page.getByText('Invoice generated successfully.')).toBeVisible();
    expect(getMockStateSnapshot(state).invoices).toHaveLength(1);
  });

  test('admin can fetch simulated utility readings into the shared form', async ({ page }) => {
    await mockTropilotApi(page);

    await loginAs(page, 'admin');
    await page.goto('/admin/buildings/1/utility-readings');
    await page.getByRole('button', { name: 'Record reading' }).click();

    const fetchElectricityButton = page.getByRole('button', { name: 'Fetch electricity' });
    const fetchWaterButton = page.getByRole('button', { name: 'Fetch water' });
    await expect(fetchElectricityButton).toBeDisabled();
    await expect(fetchWaterButton).toBeDisabled();

    await page.locator('#roomId').selectOption('1');
    await expect(fetchElectricityButton).toBeEnabled();
    await expect(fetchWaterButton).toBeEnabled();
    await fetchElectricityButton.click();
    await fetchWaterButton.click();

    await expect(page.locator('#newElectricity')).toHaveValue('437');
    await expect(page.locator('#newWater')).toHaveValue('31');
    await expectNoVisibleAppError(page);
  });

  test('mocked SePay webhook marks invoices as paid', async ({ page }) => {
    const state = await mockTropilotApi(page, { withInitialInvoice: true });

    await loginAs(page, 'admin');
    await page.goto('/admin/buildings/1/invoices');
    await expect(page.getByRole('table').getByText('Unpaid')).toBeVisible();

    await page.evaluate(() => {
      return fetch('http://localhost:8080/api/sepay/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transferAmount: 10500000,
          content: 'TP-INV-0001'
        })
      });
    });

    expect(getMockStateSnapshot(state).webhookPaid).toBe(true);

    await page.reload();
    await expect(page.getByRole('table').getByText('Paid')).toBeVisible();
    await expectNoVisibleAppError(page);
  });

  test('admin can open created notifications and activity logs', async ({ page }) => {
    await mockTropilotApi(page);
    await loginAs(page, 'admin');

    await page.goto('/admin/notifications');
    await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
    await expect(page.getByText('Tenant payment notice')).toBeVisible();
    await expect(page.getByRole('tab')).toHaveCount(0);

    await page.goto('/admin/activity-logs');
    await expect(page.getByRole('heading', { name: 'Activity logs' })).toBeVisible();
    await expect(page.getByText('Updated profile information')).toBeVisible();
    await expectNoVisibleAppError(page);
  });

  for (const role of ['staff', 'resident']) {
    test(`${role} can open personal notifications and activity logs`, async ({ page }) => {
      await mockTropilotApi(page);
      await loginAs(page, role);

      await page.goto(`/${role}/notifications`);
      await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
      await expect(page.getByText('Payment received')).toBeVisible();

      await page.goto(`/${role}/activity-logs`);
      await expect(page.getByRole('heading', { name: 'Activity logs' })).toBeVisible();
      await expect(page.getByText('Updated profile information')).toBeVisible();
      await expectNoVisibleAppError(page);
    });
  }
});
