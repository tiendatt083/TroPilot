import { useTranslation } from 'react-i18next';
import AdminUserCreateForm from './AdminUserCreateForm.jsx';
import ActionDialog from './common/ActionDialog.jsx';

export default function AdminUserCreateDialog({
  error,
  initialRole = 'STAFF',
  loading,
  onClose,
  onSubmit,
  open,
  roleLocked = true,
  resetKey
}) {
  const { t } = useTranslation();
  const isStaff = initialRole === 'STAFF';

  return (
    <ActionDialog
      className="user-create-dialog"
      eyebrow={t('userCreate.eyebrow')}
      labelledBy="admin-user-create-dialog-title"
      open={open}
      title={isStaff ? t('userCreate.staffTitle') : t('userCreate.residentHeadTitle')}
      onClose={onClose}
    >
      {error && <div className="alert error-alert">{error}</div>}

      <AdminUserCreateForm
        formIdPrefix="adminUserCreateDialog"
        initialRole={initialRole}
        loading={loading}
        resetKey={resetKey}
        roleLocked={roleLocked}
        submitLabel={isStaff ? t('userCreate.actions.saveStaff') : t('userCreate.actions.saveResidentHead')}
        submittingLabel={isStaff ? t('userCreate.actions.savingStaff') : t('userCreate.actions.savingResidentHead')}
        onSubmit={onSubmit}
      />
    </ActionDialog>
  );
}
