import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as chatApi from '../api/chatApi.js';
import { useAuth } from '../context/AuthContext.jsx';

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_MESSAGES = 8;

function createMessage(id, role, content) {
  return { id, role, content };
}

function getErrorKey(error) {
  if (error.response?.status === 403) {
    return 'chat.errors.assignmentRequired';
  }

  if (error.response?.status === 503) {
    return 'chat.errors.unavailable';
  }

  return 'chat.errors.sendFailed';
}

export default function ChatWidget() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const nextMessageId = useRef(1);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const residentHasRoom = user?.role !== 'RESIDENT_HEAD' || Boolean(user?.assignedRoomId);
  const available = Boolean(user && !user.mustChangePassword && residentHasRoom);

  useEffect(() => {
    if (open) {
      textareaRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, sending]);

  if (!available) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    const message = draft.trim();
    if (!message || sending) {
      return;
    }

    const userMessage = createMessage(nextMessageId.current++, 'user', message);
    const history = messages
      .slice(-MAX_HISTORY_MESSAGES)
      .map(({ role, content }) => ({ role, content }));

    setMessages((current) => [...current, userMessage]);
    setDraft('');
    setError('');
    setSending(true);

    try {
      const response = await chatApi.sendChatMessage({ message, history });
      const assistantMessage = createMessage(
        nextMessageId.current++,
        'assistant',
        response.data.reply
      );
      setMessages((current) => [...current, assistantMessage]);
    } catch (requestError) {
      setError(t(getErrorKey(requestError)));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setError('');
    setDraft('');
    textareaRef.current?.focus();
  };

  return (
    <div className={`chat-widget${open ? ' is-open' : ''}`}>
      {open && (
        <section
          className="chat-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="chat-widget-title"
        >
          <header className="chat-panel-header">
            <div>
              <span className="chat-panel-eyebrow">{t('chat.eyebrow')}</span>
              <h2 id="chat-widget-title">{t('chat.title')}</h2>
            </div>
            <div className="chat-panel-actions">
              <button
                className="chat-icon-button"
                type="button"
                aria-label={t('chat.clear')}
                title={t('chat.clear')}
                onClick={clearConversation}
                disabled={sending || messages.length === 0}
              >
                ↻
              </button>
              <button
                className="chat-icon-button"
                type="button"
                aria-label={t('chat.close')}
                title={t('chat.close')}
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
          </header>

          <div className="chat-message-list" aria-live="polite">
            {messages.length === 0 && (
              <div className="chat-welcome">
                <strong>{t('chat.welcomeTitle')}</strong>
                <p>{t('chat.welcomeMessage')}</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                className={`chat-message chat-message-${message.role}`}
                key={message.id}
              >
                <span>{message.role === 'user' ? t('chat.you') : t('chat.assistant')}</span>
                <p>{message.content}</p>
              </div>
            ))}

            {sending && (
              <div className="chat-message chat-message-assistant chat-message-loading">
                <span>{t('chat.assistant')}</span>
                <p>{t('chat.thinking')}</p>
              </div>
            )}

            {error && <div className="chat-error">{error}</div>}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-composer" onSubmit={handleSubmit}>
            <label className="visually-hidden" htmlFor="chat-message">
              {t('chat.inputLabel')}
            </label>
            <textarea
              id="chat-message"
              ref={textareaRef}
              value={draft}
              maxLength={MAX_MESSAGE_LENGTH}
              rows="2"
              placeholder={t('chat.placeholder')}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
            />
            <div className="chat-composer-footer">
              <small>{draft.length}/{MAX_MESSAGE_LENGTH}</small>
              <button type="submit" disabled={sending || !draft.trim()}>
                {sending ? t('chat.sending') : t('chat.send')}
              </button>
            </div>
          </form>
        </section>
      )}

      <button
        className="chat-launcher"
        type="button"
        aria-expanded={open}
        aria-controls="chat-widget-title"
        aria-label={open ? t('chat.close') : t('chat.open')}
        title={open ? t('chat.close') : t('chat.open')}
        onClick={() => setOpen((current) => !current)}
      >
        AI
      </button>
    </div>
  );
}
