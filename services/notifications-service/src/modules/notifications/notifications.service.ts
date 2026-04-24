import { randomUUID } from 'node:crypto';

export type Notification = {
  id: string;
  channel: 'email' | 'sms' | 'push';
  recipient: string;
  message: string;
  createdAt: string;
};

// Repositório em memória — suficiente para a Fase 2.
// Em produção real, isso seria um banco (Postgres, Mongo, Redis, etc.).
const store: Notification[] = [];

export const notificationsService = {
  send(input: Omit<Notification, 'id' | 'createdAt'>): Notification {
    const notification: Notification = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...input,
    };
    store.push(notification);
    // Aqui seria onde realmente despacharíamos para um provider (SES, Twilio, FCM...).
    // Por ora apenas registramos.
    return notification;
  },

  list(): Notification[] {
    return [...store].reverse();
  },
};
