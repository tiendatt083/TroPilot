import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import * as taskApi from '../../features/maintenance/taskApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import TaskDetail from '../../components/TaskDetail.jsx';

export default function StaffTaskDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [completionForm, setCompletionForm] = useState({
    resultNote: '',
    resultImage: null
  });

  useEffect(() => {
    let active = true;

    taskApi
      .getStaffTask(id)
      .then((response) => {
        if (active) {
          setTask(response.data);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || t('taskManagement.loadOneError'));
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

  const handleStart = async () => {
    setProcessing(true);
    setMessage('');
    setError('');

    try {
      const response = await taskApi.startStaffTask(id);
      setTask(response.data);
      setMessage(t('taskManagement.started'));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('taskManagement.startError'));
    } finally {
      setProcessing(false);
    }
  };

  const handleCompletionChange = (event) => {
    const { name, value, files } = event.target;
    setCompletionForm((current) => ({
      ...current,
      [name]: files ? files[0] || null : value
    }));
  };

  const handleComplete = async (event) => {
    event.preventDefault();
    setProcessing(true);
    setMessage('');
    setError('');

    try {
      const response = await taskApi.completeStaffTask(id, completionForm);
      setTask(response.data);
      setCompletionForm({ resultNote: '', resultImage: null });
      event.target.reset();
      setMessage(t('taskManagement.completed'));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('taskManagement.completeError'));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="empty-state">{t('taskManagement.loadingOne')}</div>;
  }

  if (!task) {
    return <div className="empty-state">{error || t('taskManagement.notFound')}</div>;
  }

  const canStart = task.status === 'NEW';
  const canComplete = task.status === 'IN_PROGRESS';

  return (
    <section className="content-section staff-task-detail-page">
      <div className="page-title-row">
        <PageHeader eyebrow={t('role.staff')} title={task.title} />
        <Link className="secondary-link" to="/staff/tasks">
          {t('taskManagement.back')}
        </Link>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <section className="task-workspace">
        <TaskDetail task={task} />

        <aside className="task-actions-panel">
          <PageHeader eyebrow={t('taskManagement.actionsEyebrow')} title={t('taskManagement.progressTitle')} />

          {canStart && (
            <button className="inline-button" type="button" disabled={processing} onClick={handleStart}>
              {processing ? t('taskManagement.starting') : t('taskManagement.start')}
            </button>
          )}

          {canComplete && (
            <form className="panel-form" onSubmit={handleComplete}>
              <label htmlFor="resultNote">{t('taskManagement.resultNote')}</label>
              <textarea
                id="resultNote"
                name="resultNote"
                rows="5"
                value={completionForm.resultNote}
                onChange={handleCompletionChange}
                required
              />

              <label htmlFor="resultImage">{t('taskManagement.resultImage')}</label>
              <input
                id="resultImage"
                name="resultImage"
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleCompletionChange}
              />

              <button type="submit" disabled={processing}>
                {processing ? t('taskManagement.completing') : t('taskManagement.complete')}
              </button>
            </form>
          )}

          {!canStart && !canComplete && (
            <div className="empty-state">{t('taskManagement.noAction')}</div>
          )}
        </aside>
      </section>
    </section>
  );
}
