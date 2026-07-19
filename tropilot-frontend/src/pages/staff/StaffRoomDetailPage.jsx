import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as roomApi from '../../features/rooms/api.js';
import useRoomRouteContext from '../../features/rooms/useRoomRouteContext.js';
import { formatEnumLabel } from '../../utils/i18nFormat.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

function formatMoney(value) {
  return `${formatNumber(value)} đ`;
}

function formatArea(value) {
  return `${formatNumber(value)} m2`;
}

function statusClass(status) {
  return `status-pill room-status-${status.toLowerCase()}`;
}

export default function StaffRoomDetailPage() {
  const { t } = useTranslation();
  const { roomId } = useRoomRouteContext('staff');
  const { building } = useOutletContext() || {};
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    roomApi
      .getStaffRoom(roomId)
      .then((response) => {
        if (active) {
          setRoom(response.data);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || t('roomManagement.loadOneError'));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [roomId]);

  if (loading) {
    return <div className="empty-state">{t('roomManagement.loadingOne')}</div>;
  }

  if (!room) {
    return <div className="empty-state">{error || t('roomManagement.notFound')}</div>;
  }

  const buildingAddress = room.buildingAddress || building?.address || t('common.notProvided');

  return (
    <section className="content-section staff-room-detail-page">
      {error && <div className="alert error-alert">{error}</div>}

      <div className="detail-panel staff-room-detail-panel room-detail-card">
        <div>
          <span>{t('tables.common.building')}</span>
          <span className="staff-room-detail-value">
            {room.buildingCode} - {room.buildingName}
          </span>
        </div>
        <div>
          <span>{t('forms.building.address')}</span>
          <span className="staff-room-detail-value">{buildingAddress}</span>
        </div>
        <div>
          <span>{t('tables.common.status')}</span>
          <span className="staff-room-detail-value">
            <span className={statusClass(room.status)}>{formatEnumLabel(t, 'roomStatus', room.status)}</span>
          </span>
        </div>
        <div>
          <span>{t('tables.common.floor')}</span>
          <span className="staff-room-detail-value">{room.floor}</span>
        </div>
        <div>
          <span>{t('roomManagement.maximumOccupants')}</span>
          <span className="staff-room-detail-value">{room.maxOccupants}</span>
        </div>
        <div>
          <span>{t('tables.common.price')}</span>
          <span className="staff-room-detail-value room-detail-metric">{formatMoney(room.price)}</span>
        </div>
        <div>
          <span>{t('tables.common.area')}</span>
          <span className="staff-room-detail-value room-detail-metric">{formatArea(room.area)}</span>
        </div>
        <div className="detail-wide">
          <span>{t('tables.common.description')}</span>
          <p>{room.description || t('roomManagement.noDescription')}</p>
        </div>
      </div>
    </section>
  );
}
