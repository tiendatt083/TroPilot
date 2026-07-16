import { useTranslation } from 'react-i18next';
import { DonutChart } from './common/DashboardCharts.jsx';

const emptyOverview = {
  totalRooms: 0,
  recordedRooms: 0,
  pendingRooms: 0,
  emptyRooms: 0
};

function toNumber(value) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export default function UtilityReadingStatusDonut({ overview = emptyOverview }) {
  const { i18n, t } = useTranslation();
  const overviewData = overview || emptyOverview;
  const locale = i18n.language === 'en' ? 'en-US' : 'vi-VN';

  return (
    <div className="utility-reading-status-donut">
      <UtilityReadingMeterDonut
        color="warning"
        locale={locale}
        meter="electricity"
        overview={overviewData}
        title={t('tables.common.electricity')}
        t={t}
      />
      <UtilityReadingMeterDonut
        color="paid"
        locale={locale}
        meter="water"
        overview={overviewData}
        title={t('tables.common.water')}
        t={t}
      />
    </div>
  );
}

function UtilityReadingMeterDonut({ color, locale, meter, overview, title, t }) {
  const totalRooms = getMeterNumber(overview, meter, 'totalRooms');
  const recordedRooms = getMeterNumber(overview, meter, 'recordedRooms');
  const pendingRooms = getMeterNumber(overview, meter, 'pendingRooms');
  const emptyRooms = getMeterNumber(overview, meter, 'emptyRooms');
  const items = [
    {
      key: `${meter}-recorded`,
      label: t('buildingUtilityReadings.metrics.recordedRooms'),
      value: recordedRooms,
      color
    },
    {
      key: `${meter}-pending`,
      label: t('buildingUtilityReadings.metrics.pendingRooms'),
      value: pendingRooms,
      color: 'violet'
    },
    {
      key: `${meter}-empty`,
      label: t('buildingUtilityReadings.metrics.emptyRooms'),
      value: emptyRooms,
      color: 'neutral'
    }
  ];

  return (
    <section className={`utility-reading-meter-donut utility-reading-meter-donut-${meter}`}>
      <h3>{title}</h3>
      <DonutChart center={totalRooms.toLocaleString(locale)} items={items} locale={locale} />
    </section>
  );
}

function getMeterNumber(overview, meter, key) {
  const meterKey = `${meter}${key.charAt(0).toUpperCase()}${key.slice(1)}`;

  if (key === 'pendingRooms') {
    const pendingValue = overview?.[meterKey] ?? overview?.pendingRooms ?? overview?.unrecordedRooms;
    return toNumber(pendingValue);
  }

  return toNumber(overview?.[meterKey] ?? overview?.[key]);
}
