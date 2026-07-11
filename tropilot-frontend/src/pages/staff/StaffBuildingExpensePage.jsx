import { useEffect, useMemo, useState } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as equipmentApi from '../../features/equipment/api.js';
import * as expenseApi from '../../features/payments/expenseApi.js';
import * as roomApi from '../../features/rooms/api.js';
import ActionDialog from '../../components/common/ActionDialog.jsx';
import ExpenseForm from '../../components/ExpenseForm.jsx';
import LineIcon from '../../components/common/LineIcon.jsx';
import { getExpenseStatusClass } from '../../utils/expenseOptions.js';
import { resolveFileUrl } from '../../utils/fileUrl.js';
import { formatDisplayDateTime } from '../../utils/dateFormat.js';
import { formatEnumLabel } from '../../utils/i18nFormat.js';
import { formatRoomCode } from '../../utils/roomDisplay.js';
import { translateInterfaceText } from '../../utils/interfaceTranslations.js';

function formatAmount(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('vi-VN', { maximumFractionDigits: 0 })
    : value;
}

function compactExpenseCode(expenseCode) {
  const normalizedCode = String(expenseCode || '').trim();

  if (!normalizedCode) {
    return '';
  }

  const parts = normalizedCode.split('-').filter(Boolean);
  if (parts.length >= 3) {
    return `${parts[0]}-${parts.at(-1)}`;
  }

  return normalizedCode.length > 18
    ? `${normalizedCode.slice(0, 6)}...${normalizedCode.slice(-8)}`
    : normalizedCode;
}

function ExpenseCardList({ expenses }) {
  const { t } = useTranslation();

  if (expenses.length === 0) {
    return <div className="empty-state flat-empty-state">{t('tables.expenses.empty')}</div>;
  }

  return (
    <section className="expense-card-list">
      {expenses.map((expense) => (
        <article className="expense-card-row" key={expense.id}>
          <div className="expense-card-main">
            <span className="expense-card-label">{t('tables.common.expenseCode')}</span>
            <strong title={expense.expenseCode}>{compactExpenseCode(expense.expenseCode)}</strong>
            <small>{formatDisplayDateTime(expense.createdAt)}</small>
          </div>
          <div className="expense-card-meta">
            <span>{t('tables.common.room')}</span>
            <strong>{expense.roomCode ? formatRoomCode(expense) : t('common.notLinked')}</strong>
          </div>
          <div className="expense-card-meta">
            <span>{t('tables.common.type')}</span>
            <strong>{formatEnumLabel(t, 'expenseType', expense.expenseType)}</strong>
          </div>
          <div className="expense-card-meta">
            <span>{t('tables.common.amount')}</span>
            <strong>{formatAmount(expense.amount)} đ</strong>
          </div>
          <div className="expense-card-meta">
            <span>{t('tables.common.createdBy')}</span>
            <strong>{expense.createdByName}</strong>
          </div>
          <div className="expense-card-content">
            <span>{t('tables.common.content')}</span>
            <strong>{expense.content}</strong>
          </div>
          <div className="expense-card-actions">
            <span className={getExpenseStatusClass(expense.status)}>
              {formatEnumLabel(t, 'expenseStatus', expense.status)}
            </span>
            {expense.proofImageUrl && (
              <a
                className="icon-button"
                href={resolveFileUrl(expense.proofImageUrl)}
                target="_blank"
                rel="noreferrer"
                title={t('common.view')}
              >
                <LineIcon name="search" />
              </a>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}

export default function StaffBuildingExpensePage() {
  useTranslation();
  const location = useLocation();
  const { building } = useOutletContext();
  const [rooms, setRooms] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [initialFormValues, setInitialFormValues] = useState(null);

  const buildingFilter = useMemo(() => ({ buildingId: building.id }), [building.id]);

  const loadData = async () => {
    setError('');

    try {
      const [roomsResponse, equipmentResponse, expensesResponse] = await Promise.all([
        roomApi.getStaffRooms(buildingFilter),
        equipmentApi.getStaffBuildingEquipment(building.id, {}),
        expenseApi.getStaffExpenses(buildingFilter)
      ]);
      setRooms(roomsResponse.data || []);
      setEquipment(equipmentResponse.data || []);
      setExpenses(expensesResponse.data || []);
    } catch (apiError) {
      setError(translateInterfaceText(apiError.response?.data?.message || 'Expenses could not be loaded'));
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [building.id]);

  useEffect(() => {
    const state = location.state || {};
    if (!state.openCreateExpense && !state.maintenanceRequestId && !state.roomId) {
      return;
    }

    setInitialFormValues({
      roomId: state.roomId || '',
      maintenanceRequestId: state.maintenanceRequestId || '',
      expenseType: state.expenseType || 'MAINTENANCE',
      equipmentReference: state.equipmentId || (state.equipmentCode ? 'OTHER' : ''),
      content: state.content || ''
    });
    setFormOpen(true);
  }, [location.state]);

  const openCreateForm = () => {
    setInitialFormValues(null);
    setFormOpen(true);
  };

  const closeCreateForm = () => {
    if (!creating) {
      setFormOpen(false);
    }
  };

  const handleSubmit = async (payload) => {
    setCreating(true);
    setMessage('');
    setError('');

    try {
      await expenseApi.createStaffExpense(payload);
      setMessage(translateInterfaceText('Expense created successfully.'));
      setFormOpen(false);
      await loadData();
    } catch (apiError) {
      setError(translateInterfaceText(apiError.response?.data?.message || 'Expense could not be created'));
      throw apiError;
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="building-workspace staff-expense-workspace">
      <div className="building-section-header compact-section-header">
        <span className="page-eyebrow">{translateInterfaceText('Building expenses')}</span>
        <button className="button-link" type="button" onClick={openCreateForm}>
          <LineIcon name="plus" />
          {translateInterfaceText('Create expense')}
        </button>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <div className="staff-expense-list-shell">
        {loading ? (
          <div className="empty-state">{translateInterfaceText('Loading expenses...')}</div>
        ) : (
          <ExpenseCardList expenses={expenses} />
        )}
      </div>

      <ActionDialog
        className="expense-create-dialog"
        eyebrow={translateInterfaceText('Expense entry')}
        labelledBy="staff-building-expense-dialog-title"
        open={formOpen}
        title={translateInterfaceText('Create expense')}
        onClose={closeCreateForm}
      >
        {loading ? (
          <div className="empty-state">{translateInterfaceText('Loading rooms...')}</div>
        ) : (
          <ExpenseForm
            compactRoomLabels
            equipmentOptions={equipment}
            initialValues={initialFormValues}
            loading={creating}
            noRoomLabel="Việc chung của tòa nhà"
            rooms={rooms}
            showEquipmentField
            showReferenceFields={false}
            onSubmit={handleSubmit}
          />
        )}
      </ActionDialog>
    </section>
  );
}
