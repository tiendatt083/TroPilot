import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as serviceFeeApi from '../../features/invoices/serviceFeeApi.js';
import { ServiceFeeTable } from '../../features/invoices/components/index.js';
import { isServiceFeeActive } from '../../utils/serviceFeeOptions.js';

export default function StaffBuildingServiceFeePage() {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const [serviceFees, setServiceFees] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    serviceFeeApi
      .getStaffBuildingServiceFees(building.id)
      .then((response) => {
        if (active) {
          setServiceFees(response.data);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || t('buildingServiceFees.loadError'));
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
  }, [building.id, t]);

  return (
    <section className="building-workspace">
      <div className="building-section-header">
        <span className="page-eyebrow">{t('buildingServiceFees.eyebrow')}</span>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('buildingServiceFees.loading')}</div>
      ) : (
        <section className="building-service-fee-page">
          <div className="settings-card additional-service-card">
            <div className="additional-service-layout additional-service-list-only">
              <ServiceFeeTable
                className="building-service-fee-list"
                serviceFees={serviceFees}
                showFeeType={false}
                variant="table"
                nameLabel={t('buildingServiceFees.additional.name')}
                priceLabel={t('buildingServiceFees.additional.unitPrice')}
                methodLabel={t('buildingServiceFees.calculationMethod')}
                emptyMessage={t('buildingServiceFees.additional.empty')}
                getActive={isServiceFeeActive}
                getStatusLabel={(serviceFee) => (
                  isServiceFeeActive(serviceFee) ? t('common.active') : t('common.inactive')
                )}
              />
            </div>
          </div>
        </section>
      )}
    </section>
  );
}
