import { useTranslation } from 'react-i18next';
import { resolveFileUrl } from '../utils/fileUrl.js';
import { formatDisplayDate, formatDisplayMonth } from '../utils/dateFormat.js';
import { formatRoomCode } from '../utils/roomDisplay.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

function evidenceLinks(reading, t) {
  return (
    <div className="evidence-links">
      <a href={resolveFileUrl(reading.electricityImageUrl)} target="_blank" rel="noreferrer">
        {t('tables.common.electricity')}
      </a>
      <a href={resolveFileUrl(reading.waterImageUrl)} target="_blank" rel="noreferrer">
        {t('tables.common.water')}
      </a>
    </div>
  );
}

export default function UtilityReadingTable({ readings, renderActions }) {
  const { t } = useTranslation();
  const hasActions = Boolean(renderActions);

  return (
    <div className="table-wrap">
      <table className="data-table utility-reading-table">
        <thead>
          <tr>
            <th>{t('tables.common.room')}</th>
            <th>{t('tables.common.month')}</th>
            <th>{t('tables.common.readingDate')}</th>
            <th>{t('tables.common.electricity')}</th>
            <th>{t('tables.common.water')}</th>
            <th>{t('tables.common.evidence')}</th>
            <th>{t('tables.common.createdBy')}</th>
            <th>{t('tables.common.editReason')}</th>
            {hasActions && <th>{t('tables.common.actions')}</th>}
          </tr>
        </thead>
        <tbody>
          {readings.map((reading) => (
            <tr key={reading.id}>
              <td>
                <strong>{formatRoomCode(reading)}</strong>
                <span className="table-subtext">{reading.buildingCode}</span>
              </td>
              <td>{formatDisplayMonth(reading.month)}</td>
              <td>{formatDisplayDate(reading.readingDate, t('common.notSet'))}</td>
              <td>
                {formatNumber(reading.oldElectricity)} {t('common.to')} {formatNumber(reading.newElectricity)}
                <span className="table-subtext">{t('tables.utilityReadings.usage')}: {formatNumber(reading.electricityUsage)}</span>
              </td>
              <td>
                {formatNumber(reading.oldWater)} {t('common.to')} {formatNumber(reading.newWater)}
                <span className="table-subtext">{t('tables.utilityReadings.usage')}: {formatNumber(reading.waterUsage)}</span>
              </td>
              <td>{evidenceLinks(reading, t)}</td>
              <td>
                <strong>{reading.createdByName}</strong>
                <span className="table-subtext">{reading.createdByRole}</span>
              </td>
              <td>{reading.editReason || t('tables.utilityReadings.notEdited')}</td>
              {hasActions && <td>{renderActions(reading)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      {readings.length === 0 && <div className="empty-state flat-empty-state">{t('tables.utilityReadings.empty')}</div>}
    </div>
  );
}
