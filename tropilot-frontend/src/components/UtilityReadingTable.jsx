import { useTranslation } from 'react-i18next';
import LineIcon from './common/LineIcon.jsx';
import { resolveFileUrl } from '../utils/fileUrl.js';
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
        <a key={link.key} href={resolveFileUrl(link.url)} target="_blank" rel="noreferrer">
          <LineIcon name="fileText" />
          {link.label}
        </a>
      ))}
    </div>
  );
}

function MeterBlock({ label, oldValue, newValue, usage, joinText, usageLabel }) {
  return (
    <div className="utility-reading-meter-chip">
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
    <div className="utility-reading-list">
      {readings.map((reading) => (
        <article className="utility-reading-row" key={reading.id}>
          <div className="utility-reading-room-cell">
            <span>{t('tables.common.room')}</span>
            <strong>{formatRoomCode(reading)}</strong>
            <small>{formatDisplayMonth(reading.month)}</small>
          </div>

          <div className="utility-reading-date-cell">
            <span>{t('tables.common.readingDate')}</span>
            <strong>{formatDisplayDate(reading.readingDate, t('common.notSet'))}</strong>
          </div>

          <div className="utility-reading-meter-grid">
            <MeterBlock
              label={t('tables.common.electricity')}
              oldValue={reading.oldElectricity}
              newValue={reading.newElectricity}
              usage={reading.electricityUsage}
              joinText={t('common.to')}
              usageLabel={t('tables.utilityReadings.usage')}
            />
            <MeterBlock
              label={t('tables.common.water')}
              oldValue={reading.oldWater}
              newValue={reading.newWater}
              usage={reading.waterUsage}
              joinText={t('common.to')}
              usageLabel={t('tables.utilityReadings.usage')}
            />
          </div>

          <div className="utility-reading-meta-cell">
            <div>
              <span>{t('tables.common.createdBy')}</span>
              <strong>{reading.createdByName || t('common.notSet')}</strong>
            </div>
            {reading.editReason && (
              <div>
                <span>{t('tables.common.editReason')}</span>
                <strong>{reading.editReason}</strong>
              </div>
            )}
          </div>

          <div className="utility-reading-evidence-cell">
            <span>{t('tables.common.evidence')}</span>
            <EvidenceLinks reading={reading} t={t} />
          </div>

          {hasActions && (
            <div className="utility-reading-row-actions">
              {renderActions(reading)}
            </div>
          )}
        </article>
      ))}
      {readings.length === 0 && <div className="empty-state flat-empty-state">{t('tables.utilityReadings.empty')}</div>}
    </div>
  );
}
