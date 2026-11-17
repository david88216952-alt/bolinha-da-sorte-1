import QRCode from "qrcode";
import {
  generatePixCopyPaste,
  calculateCRC16,
  OFFICIAL_PIX_KEY,
  OFFICIAL_PIX_KEY_DISPLAY,
  OFFICIAL_PIX_MERCHANT_NAME,
  OFFICIAL_PIX_MERCHANT_CITY,
} from "./pix-emv";

export {
  generatePixCopyPaste,
  calculateCRC16,
  OFFICIAL_PIX_KEY,
  OFFICIAL_PIX_KEY_DISPLAY,
  OFFICIAL_PIX_MERCHANT_NAME,
  OFFICIAL_PIX_MERCHANT_CITY,
};

export interface PixPayload {
  qrCodeBase64: string;
  copyPaste: string;
  externalPaymentId: string;
  expiresAt: Date;
}

/**
 * Generates a real Base64 Data URL for a Pix QR Code.
 */
export async function generatePixData(
  amount: number,
  orderId: string,
  receiverKeyOrLink?: string,
  merchantName?: string,
  merchantCity?: string
): Promise<PixPayload> {
  const externalPaymentId = `PIX-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const copyPaste = generatePixCopyPaste(amount, orderId, receiverKeyOrLink, merchantName, merchantCity);

  // Generate QR Code as Data URL
  const qrCodeBase64 = await QRCode.toDataURL(copyPaste, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 340,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  // 15-minute reservation timer
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  return {
    qrCodeBase64,
    copyPaste,
    externalPaymentId,
    expiresAt,
  };
}

/**
 * Format currency to Brazilian Real (R$)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Formats ticket number with leading zeros (e.g. 30627 -> "0030627")
 */
export function formatTicketNumber(num: number, digits: number = 7): string {
  return num.toString().padStart(digits, "0");
}
