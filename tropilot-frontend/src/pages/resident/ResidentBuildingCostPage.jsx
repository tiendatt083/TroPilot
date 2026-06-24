import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as invoiceApi from '../../features/invoices/api.js';
import * as serviceFeeApi from '../../features/invoices/serviceFeeApi.js';
import LineIcon from '../../components/common/LineIcon.jsx';
import PageHeader from '../../components/PageHeader.jsx';
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

function getFeeTone(feeType) {
  if (feeType === 'ELECTRICITY') {
    return 'electricity';
  }

  if (feeType === 'WATER') {
    return 'water';
  }

  return 'service';
}

function getFeeIcon(feeType) {
  if (feeType === 'ELECTRICITY') {
    return 'activity';
  }

  if (feeType === 'WATER') {
    return 'monitor';
  }

  return 'wallet';
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

  const roomLabel = assignment?.roomCode && assignment?.roomName
    ? `${assignment.roomCode} - ${assignment.roomName}`
    : assignment?.roomName || assignment?.roomCode || t('common.notAvailable');
  const buildingLabel = assignment?.buildingCode && assignment?.buildingName
    ? `${assignment.buildingCode} - ${assignment.buildingName}`
    : assignment?.buildingName || assignment?.buildingCode || t('common.notAvailable');
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
      icon: 'monitor',
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
      <PageHeader eyebrow={t('resident.eyebrow')} title={t('resident.buildingCosts.title')} />
      <p className="page-support-text">{t('resident.buildingCosts.description')}</p>

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('resident.buildingCosts.loading')}</div>
      ) : assignment?.assigned ? (
        <>
          <section className="resident-cost-hero" aria-label={t('resident.buildingCosts.overview')}>
            <div>
              <span>{t('resident.buildingCosts.currentBuilding')}</span>
              <h2>{buildingLabel}</h2>
              <p>{t('resident.buildingCosts.roomSummary', { room: roomLabel })}</p>
            </div>
            <div className="resident-cost-hero-price">
              <span>{t('resident.buildingCosts.cards.roomPrice')}</span>
              <strong>{formatMoney(roomPrice, t)}</strong>
              <small>{t('resident.buildingCosts.perMonth')}</small>
            </div>
          </section>

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
            <h2>{t('resident.buildingCosts.feeListTitle')}</h2>
            {serviceFees.length > 0 ? (
              <div className="resident-cost-list">
                {serviceFees.map((fee) => (
                  <div className="resident-cost-row" key={fee.id}>
                    <div className="resident-cost-row-main">
                      <span className={`resident-cost-row-icon resident-cost-row-icon-${getFeeTone(fee.feeType)}`}>
                        <LineIcon className="resident-cost-icon" name={getFeeIcon(fee.feeType)} />
                      </span>
                      <div>
                        <strong>{fee.name}</strong>
                        <span>
                          {formatEnumLabel(t, 'feeType', fee.feeType)} - {getCalculationUnit(fee.calculationType, t, fee.fallbackNote)}
                        </span>
                      </div>
                    </div>
                    <div className="resident-cost-row-price">
                      <strong>{formatMoney(fee.unitPrice, t)}</strong>
                      <span>{getCalculationUnit(fee.calculationType, t, fee.fallbackNote)}</span>
                    </div>
                  </div>
                ))}
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
