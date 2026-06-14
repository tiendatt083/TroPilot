import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import * as roomApi from '../../features/rooms/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { formatRoomCode } from '../../utils/roomDisplay.js';
import { formatEnumLabel } from '../../utils/i18nFormat.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

function statusClass(status) {
  return `status-pill room-status-${status.toLowerCase()}`;
}

export default function StaffRoomDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    roomApi
      .getStaffRoom(id)
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
  }, [id]);

  if (loading) {
    return <div className="empty-state">{t('roomManagement.loadingOne')}</div>;
  }

  if (!room) {
    return <div className="empty-state">{error || t('roomManagement.notFound')}</div>;
  }

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow={formatRoomCode(room)} title={room.roomName} />
        <Link className="secondary-link" to="/staff/rooms">
          {t('roomManagement.backToRooms')}
        </Link>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      <div className="detail-panel">
        <div>
          <span>{t('tables.common.building')}</span>
          <strong>
            {room.buildingCode} - {room.buildingName}
          </strong>
        </div>
        <div>
          <span>{t('tables.common.status')}</span>
          <strong>
            <span className={statusClass(room.status)}>{formatEnumLabel(t, 'roomStatus', room.status)}</span>
          </strong>
        </div>
        <div>
          <span>{t('tables.common.floor')}</span>
          <strong>{room.floor}</strong>
        </div>
        <div>
          <span>{t('roomManagement.maximumOccupants')}</span>
          <strong>{room.maxOccupants}</strong>
        </div>
        <div>
          <span>{t('tables.common.price')}</span>
          <strong>{formatNumber(room.price)}</strong>
        </div>
        <div>
          <span>{t('tables.common.area')}</span>
          <strong>{formatNumber(room.area)}</strong>
        </div>
        <div className="detail-wide">
          <span>{t('tables.common.description')}</span>
          <p>{room.description || t('roomManagement.noDescription')}</p>
        </div>
      </div>
    </section>
  );
}
