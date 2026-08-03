import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const ALLOWED_ROLES = new Set(['STAFF', 'RESIDENT_HEAD']);

/** Tạo dữ liệu khởi đầu cho form theo vai trò tài khoản được chọn. */
function createInitialForm(role) {
  return {
    fullName: '',
    email: '',
    phone: '',
    role: ALLOWED_ROLES.has(role) ? role : 'STAFF'
  };
}

/** Form tạo tài khoản mới, đồng thời thu thập thông tin gán phòng khi vai trò cần thiết. */
export default function AdminUserCreateForm({
  formIdPrefix = 'adminUserCreate',
  initialRole = 'STAFF',
  loading = false,
  roleLocked = false,
  submitLabel,
  submittingLabel,
  onSubmit,
  resetKey
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState(() => createInitialForm(initialRole));

  useEffect(() => {
    setForm(createInitialForm(initialRole));
  }, [initialRole, resetKey]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim()
    });
  };

  return (
    <form className="admin-profile-form user-create-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div>
          <label htmlFor={`${formIdPrefix}FullName`}>{t('userCreate.fields.fullName')}</label>
          <input
            id={`${formIdPrefix}FullName`}
            maxLength={120}
            name="fullName"
            required
            value={form.fullName}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor={`${formIdPrefix}Email`}>{t('userCreate.fields.email')}</label>
          <input
            id={`${formIdPrefix}Email`}
            maxLength={160}
            name="email"
            required
            type="email"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor={`${formIdPrefix}Phone`}>{t('userCreate.fields.phone')}</label>
          <input
            id={`${formIdPrefix}Phone`}
            maxLength={30}
            name="phone"
            value={form.phone}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor={`${formIdPrefix}Role`}>{t('userCreate.fields.role')}</label>
          <select
            disabled={roleLocked}
            id={`${formIdPrefix}Role`}
            name="role"
            value={form.role}
            onChange={handleChange}
          >
            <option value="STAFF">{t('userCreate.roles.staff')}</option>
            <option value="RESIDENT_HEAD">{t('userCreate.roles.residentHead')}</option>
          </select>
        </div>
      </div>

      <div className="admin-profile-actions">
        <button disabled={loading} type="submit">
          {loading
            ? (submittingLabel || t('userCreate.actions.creating'))
            : (submitLabel || t('userCreate.actions.create'))}
        </button>
      </div>
    </form>
  );
}
