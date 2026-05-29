import { useTranslation } from 'react-i18next';
import { isServiceFeeActive } from '../utils/serviceFeeOptions.js';
import { formatEnumLabel } from '../utils/i18nFormat.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

export default function ServiceFeeTable({ serviceFees, renderActions }) {
  const { t } = useTranslation();
  const hasActions = Boolean(renderActions);

  return (
    <div className="table-wrap">
      <table className="data-table service-fee-table">
        <thead>
          <tr>
            <th>{t('tables.common.code')}</th>
            <th>{t('tables.common.name')}</th>
            <th>{t('tables.common.feeType')}</th>
            <th>{t('tables.common.calculation')}</th>
            <th>{t('tables.common.vehicleType')}</th>
            <th>{t('tables.common.unitPrice')}</th>
            <th>{t('tables.common.status')}</th>
            {hasActions && <th>{t('tables.common.actions')}</th>}
          </tr>
        </thead>
        <tbody>
          {serviceFees.map((serviceFee) => {
            const active = isServiceFeeActive(serviceFee);

            return (
              <tr key={serviceFee.id}>
                <td>{serviceFee.feeCode}</td>
                <td>{serviceFee.name}</td>
                <td>{formatEnumLabel(t, 'feeType', serviceFee.feeType)}</td>
                <td>{formatEnumLabel(t, 'calculationType', serviceFee.calculationType)}</td>
                <td>{serviceFee.vehicleType ? formatEnumLabel(t, 'vehicleType', serviceFee.vehicleType) : t('common.notApplicable')}</td>
                <td>{formatNumber(serviceFee.unitPrice)}</td>
                <td>
                  <span className={`status-pill status-${active ? 'active' : 'inactive'}`}>
                    {active ? t('common.active') : t('common.inactive')}
                  </span>
                </td>
                {hasActions && <td>{renderActions(serviceFee)}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
      {serviceFees.length === 0 && <div className="empty-state flat-empty-state">{t('tables.serviceFees.empty')}</div>}
    </div>
  );
}
