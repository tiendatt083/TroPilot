import { Navigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/** Quyết định trang bắt đầu của cư dân tùy việc tài khoản đã được gán phòng hay chưa. */
export default function ResidentIndexRoute() {
  const { t } = useTranslation();
  const { assignmentLoading, hasActiveRoom } = useOutletContext();

  if (assignmentLoading) {
    return <div className="route-state">{t('residentAccess.loading')}</div>;
  }

  return (
    <Navigate
      to={hasActiveRoom ? '/resident/dashboard' : '/resident/profile'}
      replace
    />
  );
}
