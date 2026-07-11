import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as equipmentApi from '../../features/equipment/api.js';
import EquipmentTable from '../../components/EquipmentTable.jsx';
import ManagementPageHero from '../../components/common/ManagementPageHero.jsx';

const residentEquipmentColumns = ['code', 'name', 'installationDate', 'condition', 'maintenanceSchedule'];

export default function ResidentEquipmentPage() {
  const { t } = useTranslation();
  const [equipment, setEquipment] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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

  return (
    <section className="content-section equipment-page">
      <ManagementPageHero
        description={t('equipment.residentDescription')}
        title={t('equipment.residentTitle')}
      />

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('equipment.messages.loading')}</div>
      ) : (
        <EquipmentTable equipment={equipment} visibleColumns={residentEquipmentColumns} />
      )}
    </section>
  );
}
