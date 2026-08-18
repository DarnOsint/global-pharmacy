import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { v4 as uuidv4 } from 'uuid';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return uuidv4();
}

export function generateInvoiceNumber(prefix: string): string {
  const date = new Date();
  const dateStr = date.getFullYear().toString().slice(-2) +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${dateStr}-${random}`;
}

export type Currency = 'SSP' | 'USD';

export function formatCurrency(amount: number, currency: Currency = 'SSP'): string {
  if (currency === 'USD') {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `SSP ${amount.toLocaleString('en-SS', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function convertCurrency(amount: number, from: Currency, to: Currency, rate: number): number {
  if (from === to) return amount;
  if (from === 'USD' && to === 'SSP') return Math.round(amount * rate);
  if (from === 'SSP' && to === 'USD') return Number((amount / rate).toFixed(2));
  return amount;
}

export function formatCurrencyPair(amount: number, currency: Currency, rate: number): string {
  const other: Currency = currency === 'SSP' ? 'USD' : 'SSP';
  const converted = convertCurrency(amount, currency, other, rate);
  return `${formatCurrency(amount, currency)} (${formatCurrency(converted, other)})`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function daysUntilExpiry(expiryDate: string): number {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diff = expiry.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getExpiryStatus(expiryDate: string): 'expired' | 'critical' | 'warning' | 'safe' {
  const days = daysUntilExpiry(expiryDate);
  if (days <= 0) return 'expired';
  if (days <= 30) return 'critical';
  if (days <= 90) return 'warning';
  return 'safe';
}
