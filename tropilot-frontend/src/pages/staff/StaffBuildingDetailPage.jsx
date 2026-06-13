import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as buildingApi from '../../features/buildings/api.js';
import PageHeader from '../../components/PageHeader.jsx';

export default function StaffBuildingDetailPage() {
  const { id } = useParams();
  const [building, setBuilding] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    buildingApi
      .getStaffBuilding(id)
      .then((response) => {
        if (active) {
          setBuilding(response.data);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || 'Building could not be loaded');
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
  }, [id]);

  if (loading) {
    return <div className="empty-state">Loading building...</div>;
  }

  if (!building) {
    return <div className="empty-state">{error || 'Building not found.'}</div>;
  }

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow={building.buildingCode} title={building.name} />
        <Link className="secondary-link" to="/staff/buildings">
          Back to buildings
        </Link>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      <div className="detail-panel">
        <div>
          <span>Building code</span>
          <strong>{building.buildingCode}</strong>
        </div>
        <div>
          <span>Address</span>
          <strong>{building.address}</strong>
        </div>
        <div>
          <span>Floors</span>
          <strong>{building.floors}</strong>
        </div>
        <div className="detail-wide">
          <span>Description</span>
          <p>{building.description || 'No description provided.'}</p>
        </div>
      </div>
    </section>
  );
}
