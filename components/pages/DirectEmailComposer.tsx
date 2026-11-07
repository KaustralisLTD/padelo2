'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { directEmailLimits } from '@/lib/direct-email';

const labels = {
  en: {
    newMessage: 'New email', reply: 'Reply', to: 'To', subject: 'Subject', message: 'Message',
    send: 'Send email', cancel: 'Cancel', sending: 'Sending…', sent: 'Email sent.',
    invalid: 'Enter one email address, a subject and a message.',
    forbidden: 'Your account does not have permission to send direct emails.',
    unauthorized: 'Sign in again to send this email.',
    unconfigured: 'Direct email is not configured. Your draft is still here.',
    unconfirmed: 'Sending could not be confirmed. Retry with the same draft to avoid a duplicate.',
  },
  ru: {
    newMessage: 'Новое письмо', reply: 'Ответить', to: 'Кому', subject: 'Тема', message: 'Сообщение',
    send: 'Отправить письмо', cancel: 'Отмена', sending: 'Отправляем…', sent: 'Письмо отправлено.',
    invalid: 'Укажите один адрес получателя, тему и текст письма.',
    forbidden: 'У вашей учётной записи нет доступа к отправке прямых писем.',
    unauthorized: 'Войдите снова, чтобы отправить письмо.',
    unconfigured: 'Отправка писем не настроена. Черновик сохранён в форме.',
    unconfirmed: 'Отправка не подтверждена. Повторите попытку с тем же черновиком, чтобы избежать дубликата.',
  },
  ua: {
    newMessage: 'Новий лист', reply: 'Відповісти', to: 'Кому', subject: 'Тема', message: 'Повідомлення',
    send: 'Надіслати лист', cancel: 'Скасувати', sending: 'Надсилаємо…', sent: 'Лист надіслано.',
    invalid: 'Вкажіть одну адресу одержувача, тему й текст листа.',
    forbidden: 'Ваш обліковий запис не має дозволу надсилати прямі листи.',
    unauthorized: 'Увійдіть ще раз, щоб надіслати лист.',
    unconfigured: 'Надсилання листів не налаштовано. Чернетка залишилася у формі.',
    unconfirmed: 'Надсилання не підтверджено. Повторіть спробу з тією самою чернеткою, щоб уникнути дубліката.',
  },
  es: {
    newMessage: 'Nuevo correo', reply: 'Responder', to: 'Para', subject: 'Asunto', message: 'Mensaje',
    send: 'Enviar correo', cancel: 'Cancelar', sending: 'Enviando…', sent: 'Correo enviado.',
    invalid: 'Introduce una sola dirección de correo, un asunto y un mensaje.',
    forbidden: 'Tu cuenta no tiene permiso para enviar correos directos.',
    unauthorized: 'Inicia sesión de nuevo para enviar el correo.',
    unconfigured: 'El envío directo no está configurado. El borrador sigue en el formulario.',
    unconfirmed: 'No se pudo confirmar el envío. Vuelve a intentarlo con el mismo borrador para evitar duplicados.',
  },
};

export function getDirectEmailLabels(locale: string) {
  return labels[locale as keyof typeof labels] || labels.en;
}

export interface DirectEmailDraft {
  to: string;
  subject: string;
  reply: boolean;
}

interface Props {
  draft: DirectEmailDraft;
  locale: string;
  onCancel: () => void;
  onSent: () => void;
}

type SendError = 'invalid' | 'forbidden' | 'unauthorized' | 'unconfigured' | 'unconfirmed';

const fieldClass = 'block w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-text';

export default function DirectEmailComposer({ draft, locale, onCancel, onSent }: Props) {
  const copy = getDirectEmailLabels(locale);
  const dialog = useRef<HTMLDialogElement>(null);
  const draftId = useRef<string | null>(null);
  const requestInFlight = useRef(false);
  const [to, setTo] = useState(draft.to);
  const [subject, setSubject] = useState(draft.subject);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<SendError | null>(null);

  useEffect(() => {
    const modal = dialog.current;
    modal?.showModal();
    return () => modal?.close();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestInFlight.current) return;
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('unauthorized');
      return;
    }

    draftId.current ??= crypto.randomUUID();
    requestInFlight.current = true;
    setSending(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/partner-emails/direct', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, message, draftId: draftId.current }),
      });
      const result = await response.json().catch(() => null);
      if (response.ok && result?.success === true) {
        onSent();
        return;
      }
      const reason = result?.error;
      setError(
        reason === 'invalid' || reason === 'unauthorized' || reason === 'forbidden' || reason === 'unconfigured'
          ? reason : 'unconfirmed',
      );
    } catch {
      setError('unconfirmed');
    } finally {
      requestInFlight.current = false;
      setSending(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="direct-email-title"
      className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-auto rounded-2xl border border-border bg-background-secondary p-5 text-text shadow-xl backdrop:bg-black/60 sm:p-7"
      onCancel={(event) => {
        event.preventDefault();
        if (!requestInFlight.current) onCancel();
      }}
    >
      <h2 id="direct-email-title" className="mb-5 text-2xl font-bold">{draft.reply ? copy.reply : copy.newMessage}</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <fieldset disabled={sending} className="space-y-4">
          <label className="block text-sm font-semibold">
            {copy.to}
            <input className={fieldClass} type="email" name="to" autoFocus={!draft.to} maxLength={254} required
              value={to} onChange={(event) => setTo(event.target.value)} />
          </label>
          <label className="block text-sm font-semibold">
            {copy.subject}
            <input className={fieldClass} name="subject" maxLength={directEmailLimits.subject} required
              value={subject} onChange={(event) => setSubject(event.target.value)} />
          </label>
          <label className="block text-sm font-semibold">
            {copy.message}
            <textarea className={fieldClass} name="message" autoFocus={Boolean(draft.to)} rows={8}
              maxLength={directEmailLimits.message} required value={message} onChange={(event) => setMessage(event.target.value)} />
          </label>
        </fieldset>
        {error && <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-text">{copy[error]}</p>}
        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" disabled={sending} onClick={onCancel} className="rounded-lg border border-border px-4 py-2 disabled:opacity-50">
            {copy.cancel}
          </button>
          <button type="submit" disabled={sending || !to.trim() || !subject.trim() || !message.trim()}
            className="rounded-lg bg-primary px-4 py-2 font-semibold text-white disabled:opacity-50">
            {sending ? copy.sending : copy.send}
          </button>
        </div>
      </form>
    </dialog>
  );
}
