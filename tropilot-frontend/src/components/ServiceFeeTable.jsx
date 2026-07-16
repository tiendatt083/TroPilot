import { useTranslation } from 'react-i18next';
import { isServiceFeeActive } from '../utils/serviceFeeOptions.js';
import { formatEnumLabel } from '../utils/i18nFormat.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

export default function ServiceFeeTable({
  serviceFees,
  renderActions,
  showBuilding = false,
  showFeeType = true,
  variant = 'cards',
  className = '',
  emptyMessage,
  getKey = (serviceFee) => serviceFee.id,
  getDescription,
  getActive = isServiceFeeActive,
  getStatusLabel,
  nameLabel,
  priceLabel,
  methodLabel
}) {
  const { t } = useTranslation();
  const hasActions = Boolean(renderActions);

  if (variant === 'table') {
    return (
      <div className={`table-wrap service-fee-table-wrap ${className}`.trim()}>
        <table className="data-table service-fee-table">
          <thead>
            <tr>
              <th>{nameLabel || t('tables.common.name')}</th>
              {showBuilding && <th>{t('tables.common.building')}</th>}
              {showFeeType && <th>{t('tables.common.feeType')}</th>}
              <th>{methodLabel || t('tables.common.calculation')}</th>
              <th>{priceLabel || t('tables.common.unitPrice')}</th>
              <th>{t('tables.common.status')}</th>
              {hasActions && <th>{t('tables.common.actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {serviceFees.map((serviceFee) => {
              const active = getActive(serviceFee);
              const description = getDescription?.(serviceFee);

              return (
                <tr key={getKey(serviceFee)}>
                  <td>
                    <strong>{serviceFee.name}</strong>
                    {description && <small>{description}</small>}
                  </td>
                  {showBuilding && (
                    <td>
                      {serviceFee.buildingCode || t('common.noBuilding')}
                      {serviceFee.buildingName ? ` - ${serviceFee.buildingName}` : ''}
                    </td>
                  )}
                  {showFeeType && <td>{formatEnumLabel(t, 'feeType', serviceFee.feeType)}</td>}
                  <td>{formatEnumLabel(t, 'calculationType', serviceFee.calculationType)}</td>
                  <td>
                    <strong>{formatNumber(serviceFee.unitPrice)}</strong>
                  </td>
                  <td>
                    <span className={`status-pill status-${active ? 'active' : 'inactive'}`}>
                      {getStatusLabel ? getStatusLabel(serviceFee) : active ? t('common.active') : t('common.inactive')}
                    </span>
                  </td>
                  {hasActions && (
                    <td>
                      <div className="table-actions">{renderActions(serviceFee)}</div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {serviceFees.length === 0 && (
          <div className="empty-state flat-empty-state">{emptyMessage || t('tables.serviceFees.empty')}</div>
        )}
      </div>
    );
  }

  const classes = [
    'service-fee-list',
    hasActions ? 'service-fee-list-has-actions' : 'service-fee-list-readonly',
    !showFeeType ? 'service-fee-list-no-type' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {serviceFees.map((serviceFee) => {
        const active = getActive(serviceFee);
        const description = getDescription?.(serviceFee);

        return (
          <article className="service-fee-row" key={getKey(serviceFee)}>
            <div className="service-fee-main">
              <span>{nameLabel || t('tables.common.name')}</span>
              <strong>{serviceFee.name}</strong>
              {description && <small>{description}</small>}
              {showBuilding && (
                <small>
                  {serviceFee.buildingCode || t('common.noBuilding')}
                  {serviceFee.buildingName ? ` - ${serviceFee.buildingName}` : ''}
                </small>
              )}
            </div>

            <div className="service-fee-meta-grid">
              {showFeeType && (
                <div>
                  <span>{t('tables.common.feeType')}</span>
                  <strong>{formatEnumLabel(t, 'feeType', serviceFee.feeType)}</strong>
                </div>
              )}
              <div>
                <span>{methodLabel || t('tables.common.calculation')}</span>
                <strong>{formatEnumLabel(t, 'calculationType', serviceFee.calculationType)}</strong>
              </div>
              <div>
                <span>{priceLabel || t('tables.common.unitPrice')}</span>
                <strong>{formatNumber(serviceFee.unitPrice)}</strong>
              </div>
            </div>

            <div className="service-fee-status">
              <span className={`status-pill status-${active ? 'active' : 'inactive'}`}>
                {getStatusLabel ? getStatusLabel(serviceFee) : active ? t('common.active') : t('common.inactive')}
              </span>
            </div>

            {hasActions && <div className="service-fee-actions">{renderActions(serviceFee)}</div>}
          </article>
        );
      })}
      {serviceFees.length === 0 && (
        <div className="empty-state flat-empty-state">{emptyMessage || t('tables.serviceFees.empty')}</div>
      )}
    </div>
  );
}
