import { useTranslation } from 'react-i18next';
import LineIcon from './common/LineIcon.jsx';
import { openFileUrl, resolveFileUrl } from '../utils/fileUrl.js';
import { formatDisplayDate, formatDisplayMonth } from '../utils/dateFormat.js';
import { formatRoomCode } from '../utils/roomDisplay.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

function EvidenceLinks({ reading, t }) {
  const links = [
    {
      key: 'electricity',
      label: t('tables.common.electricity'),
      url: reading.electricityImageUrl
    },
    {
      key: 'water',
      label: t('tables.common.water'),
      url: reading.waterImageUrl
    }
  ].filter((link) => Boolean(link.url));

  if (links.length === 0) {
    return <span className="utility-reading-empty-value">{t('common.notSet')}</span>;
  }

  return (
    <div className="utility-reading-evidence-links">
      {links.map((link) => (
        <a key={link.key} href={resolveFileUrl(link.url)} target="_blank" rel="noreferrer" onClick={(event) => openFileUrl(link.url, event)}>
          <LineIcon name="fileText" />
          {link.label}
        </a>
      ))}
    </div>
  );
}

function MeterBlock({ label, oldValue, newValue, usage, joinText, usageLabel }) {
  return (
    <div className="utility-reading-meter-cell">
      <span>{label}</span>
      <strong>
        {formatNumber(oldValue)} <small>{joinText}</small> {formatNumber(newValue)}
      </strong>
      <em>{usageLabel}: {formatNumber(usage)}</em>
    </div>
  );
}

export default function UtilityReadingTable({ readings, renderActions }) {
  const { t } = useTranslation();
  const hasActions = Boolean(renderActions);

  return (
    <div className="table-wrap utility-reading-table-wrap">
      <table className="data-table utility-reading-table">
        <thead>
          <tr>
            <th>{t('tables.common.room')}</th>
            <th>{t('tables.common.readingDate')}</th>
            <th>{t('tables.common.electricity')}</th>
            <th>{t('tables.common.water')}</th>
            <th>{t('tables.common.createdBy')}</th>
            <th>{t('tables.common.evidence')}</th>
            {hasActions && <th>{t('tables.common.actions')}</th>}
          </tr>
        </thead>
        <tbody>
          {readings.length === 0 ? (
            <tr>
              <td colSpan={hasActions ? 7 : 6}>
                <div className="empty-state flat-empty-state">{t('tables.utilityReadings.empty')}</div>
              </td>
            </tr>
          ) : (
            readings.map((reading) => (
              <tr key={reading.id}>
                <td>
                  <div className="utility-reading-room-cell">
                    <strong>{formatRoomCode(reading)}</strong>
                    <span className="table-subtext">{formatDisplayMonth(reading.month)}</span>
                  </div>
                </td>
                <td>
                  <strong>{formatDisplayDate(reading.readingDate, t('common.notSet'))}</strong>
                </td>
                <td>
                  <MeterBlock
                    label={t('tables.common.electricity')}
                    oldValue={reading.oldElectricity}
                    newValue={reading.newElectricity}
                    usage={reading.electricityUsage}
                    joinText={t('common.to')}
                    usageLabel={t('tables.utilityReadings.usage')}
                  />
                </td>
                <td>
                  <MeterBlock
                    label={t('tables.common.water')}
                    oldValue={reading.oldWater}
                    newValue={reading.newWater}
                    usage={reading.waterUsage}
                    joinText={t('common.to')}
                    usageLabel={t('tables.utilityReadings.usage')}
                  />
                </td>
                <td>
                  <div className="utility-reading-meta-cell">
                    <strong>{reading.createdByName || t('common.notSet')}</strong>
                    {reading.editReason && (
                      <span className="table-subtext">
                        {t('tables.common.editReason')}: {reading.editReason}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <EvidenceLinks reading={reading} t={t} />
                </td>
                {hasActions && (
                  <td>
                    <div className="table-actions utility-reading-row-actions">
                      {renderActions(reading)}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
