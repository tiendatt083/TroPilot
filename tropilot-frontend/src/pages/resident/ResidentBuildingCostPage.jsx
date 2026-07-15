import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as invoiceApi from '../../features/invoices/api.js';
import * as serviceFeeApi from '../../features/invoices/serviceFeeApi.js';
import LineIcon from '../../components/common/LineIcon.jsx';
import ManagementPageHero from '../../components/common/ManagementPageHero.jsx';
import { formatEnumLabel } from '../../utils/i18nFormat.js';

function toNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function formatMoney(value, t) {
  const numberValue = toNumber(value);

  if (numberValue === null) {
    return t('common.notAvailable');
  }

  return `${numberValue.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} ${t('resident.buildingCosts.currencySuffix')}`;
}

function formatServiceName(name) {
  const normalized = String(name || '').trim();

  if (!normalized) {
    return '';
  }

  const sentenceCase = normalized.toLocaleLowerCase('vi-VN');
  return sentenceCase.charAt(0).toLocaleUpperCase('vi-VN') + sentenceCase.slice(1);
}

function getCalculationUnit(calculationType, t, fallback) {
  if (!calculationType) {
    return fallback || t('resident.buildingCosts.fromLatestInvoice');
  }

  return t(`resident.buildingCosts.calculationUnits.${calculationType}`, {
    defaultValue: formatEnumLabel(t, 'calculationType', calculationType)
  });
}

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function inferFeeType(itemName) {
  const normalized = normalizeSearchText(itemName);

  if (normalized.includes('electric') || normalized.includes('dien')) {
    return 'ELECTRICITY';
  }

  if (normalized.includes('water') || normalized.includes('nuoc')) {
    return 'WATER';
  }

  return 'OTHER';
}

function isRoomRentItem(itemName) {
  const normalized = normalizeSearchText(itemName);
  return normalized.includes('room rent') || normalized.includes('tien phong');
}

async function getInvoiceFallbackFees() {
  const invoicesResponse = await invoiceApi.getResidentInvoices();
  const invoices = invoicesResponse.data || [];
  const latestInvoice = [...invoices].sort((first, second) => {
    const firstTime = new Date(first.createdAt || first.invoiceDate || first.dueDate || 0).getTime();
    const secondTime = new Date(second.createdAt || second.invoiceDate || second.dueDate || 0).getTime();
    return secondTime - firstTime;
  })[0];

  if (!latestInvoice) {
    return [];
  }

  const invoiceDetail = latestInvoice.items
    ? latestInvoice
    : (await invoiceApi.getResidentInvoice(latestInvoice.id)).data;

  return (invoiceDetail?.items || [])
    .filter((item) => !isRoomRentItem(item.itemName))
    .map((item) => ({
      id: `invoice-${item.id}`,
      name: item.itemName,
      feeType: inferFeeType(item.itemName),
      unitPrice: item.unitPrice,
      calculationType: null,
      fallbackNote: item.note
    }));
}

export default function ResidentBuildingCostPage() {
  const { t } = useTranslation();
  const { assignment, assignmentLoading } = useOutletContext() || {};
  const [serviceFees, setServiceFees] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (assignmentLoading) {
      return undefined;
    }

    if (!assignment?.assigned) {
      setServiceFees([]);
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);
    setError('');

    async function loadCosts() {
      try {
        const response = await serviceFeeApi.getResidentBuildingServiceFees();
        if (active) {
          setServiceFees(response.data || []);
        }
      } catch (apiError) {
        if (apiError.response?.status === 404) {
          try {
            const fallbackFees = await getInvoiceFallbackFees();
            if (active) {
              setServiceFees(fallbackFees);
            }
          } catch (fallbackError) {
            if (active) {
              setError(fallbackError.response?.data?.message || t('resident.buildingCosts.loadError'));
            }
          }
          return;
        }

        if (active) {
          setError(apiError.response?.data?.message || t('resident.buildingCosts.loadError'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCosts();

    return () => {
      active = false;
    };
  }, [assignment?.assigned, assignmentLoading, t]);

  const feeGroups = useMemo(() => {
    const electricityFee = serviceFees.find((fee) => fee.feeType === 'ELECTRICITY') || null;
    const waterFee = serviceFees.find((fee) => fee.feeType === 'WATER') || null;
    const otherFees = serviceFees.filter((fee) => fee.feeType !== 'ELECTRICITY' && fee.feeType !== 'WATER');

    return {
      electricityFee,
      waterFee,
      otherFees
    };
  }, [serviceFees]);

  const roomPrice = assignment?.roomPrice ?? assignment?.depositAmount;

  const summaryCards = [
    {
      key: 'room',
      icon: 'home',
      tone: 'room',
      label: t('resident.buildingCosts.cards.roomPrice'),
      value: formatMoney(roomPrice, t),
      meta: t('resident.buildingCosts.perMonth')
    },
    {
      key: 'electricity',
      icon: 'activity',
      tone: 'electricity',
      label: t('resident.buildingCosts.cards.electricity'),
      value: feeGroups.electricityFee ? formatMoney(feeGroups.electricityFee.unitPrice, t) : t('resident.buildingCosts.notConfigured'),
      meta: feeGroups.electricityFee
        ? getCalculationUnit(feeGroups.electricityFee.calculationType, t, feeGroups.electricityFee.fallbackNote)
        : t('resident.buildingCosts.waitingForSetup')
    },
    {
      key: 'water',
      icon: 'droplet',
      tone: 'water',
      label: t('resident.buildingCosts.cards.water'),
      value: feeGroups.waterFee ? formatMoney(feeGroups.waterFee.unitPrice, t) : t('resident.buildingCosts.notConfigured'),
      meta: feeGroups.waterFee
        ? getCalculationUnit(feeGroups.waterFee.calculationType, t, feeGroups.waterFee.fallbackNote)
        : t('resident.buildingCosts.waitingForSetup')
    },
    {
      key: 'service',
      icon: 'wallet',
      tone: 'service',
      label: t('resident.buildingCosts.cards.services'),
      value: t('resident.buildingCosts.serviceCount', { count: feeGroups.otherFees.length }),
      meta: t('resident.buildingCosts.activeFees')
    }
  ];

  return (
    <section className="content-section resident-cost-page">
      <ManagementPageHero
        description={t('resident.buildingCosts.description')}
        title={t('resident.buildingCosts.title')}
      />

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('resident.buildingCosts.loading')}</div>
      ) : assignment?.assigned ? (
        <>
          <div className="resident-cost-grid">
            {summaryCards.map((card) => (
              <article className={`resident-cost-card resident-cost-card-${card.tone}`} key={card.key}>
                <span className="resident-cost-card-icon">
                  <LineIcon className="resident-cost-icon" name={card.icon} />
                </span>
                <div>
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                  <small>{card.meta}</small>
                </div>
              </article>
            ))}
          </div>

          <article className="dashboard-panel resident-cost-panel">
            <div className="resident-cost-panel-header">
              <div>
                <h2>{t('resident.buildingCosts.feeListTitle')}</h2>
              </div>
              <strong>{t('resident.buildingCosts.serviceCount', { count: serviceFees.length })}</strong>
            </div>
            {serviceFees.length > 0 ? (
              <div className="table-wrap resident-fee-table-wrap">
                <table className="data-table resident-fee-table">
                  <thead>
                    <tr>
                      <th>{t('resident.buildingCosts.feeNameColumn')}</th>
                      <th>{t('tables.common.calculation')}</th>
                      <th>{t('tables.common.amount')}</th>
                      <th>{t('tables.common.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceFees.map((fee) => (
                      <tr key={fee.id}>
                        <td className="resident-fee-name-cell">
                          <strong>{formatServiceName(fee.name)}</strong>
                        </td>
                        <td>{getCalculationUnit(fee.calculationType, t, fee.fallbackNote)}</td>
                        <td className="resident-fee-price-cell">{formatMoney(fee.unitPrice, t)}</td>
                        <td className="resident-fee-status-cell">
                          <span className="status-pill status-active">{t('common.active')}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state flat-empty-state">{t('resident.buildingCosts.empty')}</div>
            )}
          </article>
        </>
      ) : (
        <div className="empty-state">{t('dashboard.resident.empty.noAssignedRoom')}</div>
      )}
    </section>
  );
}
