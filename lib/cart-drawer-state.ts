"use client";

// Simple global state for cart drawer open/close
// Using a pub-sub pattern to avoid prop drilling
type Listener = (open: boolean) => void;

let _isOpen = false;
const listeners = new Set<Listener>();

export function openCartDrawer() {
  _isOpen = true;
  listeners.forEach((l) => l(true));
}

export function closeCartDrawer() {
  _isOpen = false;
  listeners.forEach((l) => l(false));
}

export function toggleCartDrawer() {
  _isOpen = !_isOpen;
  listeners.forEach((l) => l(_isOpen));
}

export function subscribeCartDrawer(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCartDrawerState(): boolean {
  return _isOpen;
}
