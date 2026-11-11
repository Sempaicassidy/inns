export type ToastKind = 'success' | 'error' | 'info';

export interface ToastPayload {
    id: number;
    kind: ToastKind;
    message: string;
}

const TOAST_EVENT = 'inns:toast';
let counter = 0;

/**
 * Fire a lightweight toast notification. Safe to call from services,
 * event handlers and plain async code — no React context required.
 */
export function toast(kind: ToastKind, message: string): void {
    if (typeof window === 'undefined' || !message) {
        return;
    }
    counter += 1;
    window.dispatchEvent(new CustomEvent<ToastPayload>(TOAST_EVENT, {
        detail: { id: counter, kind, message },
    }));
}

export function toastSuccess(message: string): void {
    toast('success', message);
}

export function toastError(message: string): void {
    toast('error', message);
}

export const TOAST_EVENT_NAME = TOAST_EVENT;
