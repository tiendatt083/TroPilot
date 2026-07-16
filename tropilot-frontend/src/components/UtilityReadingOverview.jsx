import { useTranslation } from 'react-i18next';
import UtilityReadingStatusDonut from './UtilityReadingStatusDonut.jsx';

const emptyOverview = {
  totalRooms: 0,
  recordedRooms: 0,
  pendingRooms: 0,
  emptyRooms: 0
};

export default function UtilityReadingOverview({
  month,
  overview = emptyOverview,
  loading,
  onMonthChange
}) {
  const { t } = useTranslation();
  const overviewData = overview || emptyOverview;

  const handleMonthChange = (event) => {
    const nextMonth = event.target.value;

    if (nextMonth) {
      onMonthChange(nextMonth);
    }
  };

  return (
    <section className="utility-reading-overview">
      <div className="utility-reading-month-control">
        <div>
          <strong>{t('buildingUtilityReadings.readingMonth')}</strong>
          <span>{t('buildingUtilityReadings.readingMonthHelp')}</span>
        </div>
        <input
          aria-label={t('buildingUtilityReadings.readingMonth')}
          type="month"
          value={month}
          onChange={handleMonthChange}
          disabled={loading}
          required
        />
      </div>
      <UtilityReadingStatusDonut overview={overviewData} />
    </section>
  );
}
