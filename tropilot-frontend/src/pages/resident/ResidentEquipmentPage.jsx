import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as equipmentApi from '../../features/equipment/api.js';
import EquipmentMaintenancePanel from '../../components/EquipmentMaintenancePanel.jsx';
import EquipmentTable from '../../components/EquipmentTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';

export default function ResidentEquipmentPage() {
  const { t } = useTranslation();
  const [equipment, setEquipment] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false);

  const loadEquipment = async () => {
    setError('');

    try {
      const response = await equipmentApi.getResidentEquipment();
      setEquipment((response.data || []).filter((item) => item.scope === 'ROOM'));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('equipment.messages.loadError'));
    }
  };

  useEffect(() => {
    loadEquipment().finally(() => setLoading(false));
  }, []);

  const handleMaintenanceRequest = async (payload) => {
    setRequestLoading(true);
    setMessage('');
    setError('');

    try {
      await equipmentApi.requestResidentEquipmentMaintenance(selectedEquipment.id, payload);
      setMessage(t('equipment.request.created'));
      setSelectedEquipment(null);
      await loadEquipment();
      return true;
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('equipment.request.createError'));
      return false;
    } finally {
      setRequestLoading(false);
    }
  };

  const renderActions = (item) => (
    <button
      className="secondary-button compact-button"
      type="button"
      onClick={() => setSelectedEquipment(item)}
    >
      {t('equipment.actions.requestMaintenance')}
    </button>
  );

  return (
    <section className="content-section equipment-page">
      <PageHeader eyebrow={t('role.residentHead')} title={t('equipment.residentTitle')} />
      <p className="page-support-text">{t('equipment.residentDescription')}</p>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('equipment.messages.loading')}</div>
      ) : (
        <EquipmentTable equipment={equipment} renderActions={renderActions} />
      )}

      <EquipmentMaintenancePanel
        equipment={selectedEquipment}
        history={[]}
        historyLoading={false}
        requestLoading={requestLoading}
        showHistory={false}
        onClose={() => setSelectedEquipment(null)}
        onSubmit={handleMaintenanceRequest}
      />
    </section>
  );
}
