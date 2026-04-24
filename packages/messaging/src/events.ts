/**
 * Catálogo de eventos da aplicação.
 * Centraliza nomes e formatos — fonte única de verdade entre serviços.
 */

export const EVENTS = {
  ORDER_CREATED: 'order.created',
} as const;

export interface OrderCreatedEvent {
  orderId: string;
  customer: string;
  totalCents: number;
  items: Array<{
    productSku: string;
    quantity: number;
    priceCents: number;
  }>;
  createdAt: string;
}
