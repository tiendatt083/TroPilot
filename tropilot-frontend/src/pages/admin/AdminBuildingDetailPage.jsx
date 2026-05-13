import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import * as buildingApi from '../../api/buildingApi.js';
import PageHeader from '../../components/PageHeader.jsx';

export default function AdminBuildingDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [building, setBuilding] = useState(null);
  const [message, setMessage] = useState(location.state?.message || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;

    buildingApi
      .getAdminBuilding(id)
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

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete building ${building.buildingCode}?`);
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setMessage('');
    setError('');

    try {
      await buildingApi.deleteAdminBuilding(building.id);
      navigate('/admin/buildings', { replace: true });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Building could not be deleted');
    } finally {
      setDeleting(false);
    }
  };

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
        <div className="button-row">
          <Link className="secondary-link" to="/admin/buildings">
            Back
          </Link>
          <Link className="button-link" to={`/admin/buildings/${building.id}/edit`}>
            Edit
          </Link>
          <button className="secondary-button inline-button" type="button" disabled={deleting} onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
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
