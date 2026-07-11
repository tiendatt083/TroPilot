import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as invoiceApi from '../../features/invoices/api.js';
import { InvoiceTable } from '../../features/invoices/components/index.js';
import ManagementPageHero from '../../components/common/ManagementPageHero.jsx';

export default function ResidentInvoiceListPage() {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    invoiceApi
      .getResidentInvoices()
      .then((response) => {
        if (active) {
          setInvoices(response.data);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || t('resident.invoices.loadError'));
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
  }, []);

  return (
    <section className="content-section">
      <ManagementPageHero
        description={t('resident.invoices.description')}
        title={t('resident.invoices.title')}
      />

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('resident.invoices.loading')}</div>
      ) : (
        <InvoiceTable invoices={invoices} detailPathBase="/resident/invoices" />
      )}
    </section>
  );
}
