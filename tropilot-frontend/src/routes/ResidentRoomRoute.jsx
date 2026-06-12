import { Navigate, Outlet, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function ResidentRoomRoute() {
  const { t } = useTranslation();
  const residentAccess = useOutletContext();

  if (residentAccess.assignmentLoading) {
    return <div className="route-state">{t('residentAccess.loading')}</div>;
  }

  if (!residentAccess.hasActiveRoom) {
    return <Navigate to="/resident/profile" replace />;
  }

  return <Outlet context={residentAccess} />;
}
