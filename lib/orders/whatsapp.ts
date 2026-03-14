// lib/orders/whatsapp.ts

export function toWhatsAppLink(phone: string, message: string) {
    const digits = phone.replace(/\D/g, "");
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${digits}?text=${encoded}`;
  }