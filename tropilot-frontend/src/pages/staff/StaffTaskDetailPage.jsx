import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as taskApi from '../../api/taskApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import TaskDetail from '../../components/TaskDetail.jsx';

export default function StaffTaskDetailPage() {
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
  const [rejectNote, setRejectNote] = useState('');

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
          setError(apiError.response?.data?.message || 'Task could not be loaded');
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
      setMessage('Task started successfully.');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Task could not be started');
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
      setMessage('Task completed successfully.');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Task could not be completed');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (event) => {
    event.preventDefault();
    setProcessing(true);
    setMessage('');
    setError('');

    try {
      const response = await taskApi.rejectStaffTask(id, { resultNote: rejectNote });
      setTask(response.data);
      setRejectNote('');
      setMessage('Task rejected successfully.');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Task could not be rejected');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="empty-state">Loading task...</div>;
  }

  if (!task) {
    return <div className="empty-state">{error || 'Task not found.'}</div>;
  }

  const canStart = task.status === 'NEW';
  const canComplete = task.status === 'IN_PROGRESS';
  const canReject = task.status !== 'COMPLETED' && task.status !== 'REJECTED';

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow="Operations staff" title={task.title} />
        <Link className="secondary-link" to="/staff/tasks">
          Back to tasks
        </Link>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <section className="task-workspace">
        <TaskDetail task={task} />

        <aside className="task-actions-panel">
          <PageHeader eyebrow="Actions" title="Task progress" />

          {canStart && (
            <button className="inline-button" type="button" disabled={processing} onClick={handleStart}>
              {processing ? 'Starting...' : 'Start task'}
            </button>
          )}

          {canComplete && (
            <form className="panel-form" onSubmit={handleComplete}>
              <label htmlFor="resultNote">Result note</label>
              <textarea
                id="resultNote"
                name="resultNote"
                rows="5"
                value={completionForm.resultNote}
                onChange={handleCompletionChange}
                required
              />

              <label htmlFor="resultImage">Result image</label>
              <input
                id="resultImage"
                name="resultImage"
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleCompletionChange}
              />

              <button type="submit" disabled={processing}>
                {processing ? 'Completing...' : 'Complete task'}
              </button>
            </form>
          )}

          {canReject && (
            <form className="panel-form" onSubmit={handleReject}>
              <label htmlFor="rejectNote">Rejection note</label>
              <textarea
                id="rejectNote"
                name="rejectNote"
                rows="4"
                value={rejectNote}
                onChange={(event) => setRejectNote(event.target.value)}
              />
              <button className="secondary-button" type="submit" disabled={processing}>
                {processing ? 'Rejecting...' : 'Reject task'}
              </button>
            </form>
          )}

          {!canStart && !canComplete && !canReject && (
            <div className="empty-state">No staff action is available for this task status.</div>
          )}
        </aside>
      </section>
    </section>
  );
}
