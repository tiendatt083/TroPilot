import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import LineIcon from '../../components/common/LineIcon.jsx';
import * as roomApi from '../../api/roomApi.js';
import useRoomRouteContext from '../../hooks/useRoomRouteContext.js';
import { formatDisplayDate } from '../../utils/dateFormat.js';
import { formatEnumLabel } from '../../utils/i18nFormat.js';
import { translateInterfaceText } from '../../utils/interfaceTranslations.js';

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
  return `status-pill room-status-${String(status || 'UNKNOWN').toLowerCase()}`;
}

function RoomDetailInfoItem({ icon, label, children }) {
  return (
    <div className="room-detail-info-item">
      <span className="room-detail-info-icon" aria-hidden="true">
        <LineIcon name={icon} />
      </span>
      <div className="room-detail-info-copy">
        <span>{label}</span>
        <strong>{children}</strong>
      </div>
    </div>
  );
}

/** Trang chi tiết một phòng để nhân viên xem cư dân, hợp đồng và vận hành liên quan. */
export default function StaffRoomDetailPage() {
  const { t } = useTranslation();
  const { roomId } = useRoomRouteContext('staff');
  const { building } = useOutletContext() || {};
  const [room, setRoom] = useState(null);
  const [headInfo, setHeadInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all([
      roomApi.getStaffRoom(roomId),
      roomApi.getStaffHeadResidentAssignment(roomId)
    ])
      .then(([roomResponse, headResponse]) => {
        if (active) {
          setRoom(roomResponse.data);
          setHeadInfo(headResponse.data);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(translateInterfaceText(apiError.response?.data?.message || t('roomManagement.loadOneError')));
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
  }, [roomId, t]);

  if (loading) {
    return <div className="empty-state">{t('roomManagement.loadingOne')}</div>;
  }

  if (!room) {
    return <div className="empty-state">{error || t('roomManagement.notFound')}</div>;
  }

  const hasHeadResident = Boolean(headInfo?.assigned);
  const buildingAddress = room.buildingAddress || building?.address || t('common.notProvided');

  return (
    <section className="content-section admin-room-detail-page staff-room-detail-page">
      {error && <div className="alert error-alert">{error}</div>}

      <div className="detail-panel room-detail-card">
        <RoomDetailInfoItem icon="building" label={t('tables.common.building')}>
          {room.buildingCode} - {room.buildingName}
        </RoomDetailInfoItem>
        <RoomDetailInfoItem icon="mapPin" label={t('forms.building.address')}>
          {buildingAddress}
        </RoomDetailInfoItem>
        <RoomDetailInfoItem icon="checkShield" label={t('tables.common.status')}>
          <span className={statusClass(room.status)}>{formatEnumLabel(t, 'roomStatus', room.status)}</span>
        </RoomDetailInfoItem>
        <RoomDetailInfoItem icon="barChart" label={t('tables.common.floor')}>
          {room.floor}
        </RoomDetailInfoItem>
        <RoomDetailInfoItem icon="users" label={t('roomManagement.maximumOccupants')}>
          {room.maxOccupants}
        </RoomDetailInfoItem>
        <RoomDetailInfoItem icon="wallet" label={t('tables.common.price')}>
          <span className="room-detail-metric">{formatMoney(room.price)}</span>
        </RoomDetailInfoItem>
        <RoomDetailInfoItem icon="activity" label={t('tables.common.area')}>
          <span className="room-detail-metric">{formatArea(room.area)}</span>
        </RoomDetailInfoItem>
        <RoomDetailInfoItem icon="fileText" label={t('tables.common.description')}>
          {room.description || t('roomManagement.noDescription')}
        </RoomDetailInfoItem>
      </div>

      <section className="assignment-panel">
        <div className="page-title-row compact-title-row">
          <span className="workspace-section-eyebrow">{t('roomManagement.assignment.eyebrow')}</span>
        </div>

        {hasHeadResident ? (
          <div className="detail-panel room-assignment-card">
            <RoomDetailInfoItem icon="user" label={t('tables.common.headResident')}>
              {headInfo.residentHeadName}
            </RoomDetailInfoItem>
            <RoomDetailInfoItem icon="mail" label={t('profile.fields.email')}>
              {headInfo.residentHeadEmail}
            </RoomDetailInfoItem>
            <RoomDetailInfoItem icon="calendar" label={t('roomManagement.assignment.period')}>
              {formatDisplayDate(headInfo.assignmentStartDate)} {t('common.to')}{' '}
              {formatDisplayDate(headInfo.assignmentEndDate)}
            </RoomDetailInfoItem>
            <RoomDetailInfoItem icon="activity" label={t('roomManagement.assignment.status')}>
              {formatEnumLabel(t, 'rentalStatus', headInfo.assignmentStatus)}
            </RoomDetailInfoItem>
            <RoomDetailInfoItem icon="wallet" label={t('roomManagement.assignment.deposit')}>
              {formatNumber(headInfo.depositAmount)}
            </RoomDetailInfoItem>
            <RoomDetailInfoItem icon="checkShield" label={t('roomManagement.assignment.rentalStatus')}>
              {formatEnumLabel(t, 'rentalStatus', headInfo.rentalStatus)}
            </RoomDetailInfoItem>
            <RoomDetailInfoItem icon="fileText" label={t('roomManagement.assignment.contractStatus')}>
              {formatEnumLabel(t, 'contractStatus', headInfo.contractStatus)}
            </RoomDetailInfoItem>
            <RoomDetailInfoItem icon="calendar" label={t('roomManagement.assignment.contractPeriod')}>
              {formatDisplayDate(headInfo.contractStartDate)} {t('common.to')}{' '}
              {formatDisplayDate(headInfo.contractEndDate)}
            </RoomDetailInfoItem>
          </div>
        ) : (
          <div className="empty-state">
            {room.status !== 'EMPTY'
              ? t('roomManagement.assignment.emptyOnlyBlocked')
              : t('roomManagement.assignment.unassigned')}
          </div>
        )}
      </section>
    </section>
  );
}
