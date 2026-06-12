import { Navigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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
