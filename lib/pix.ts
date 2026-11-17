import QRCode from "qrcode";

export interface PixPayload {
  qrCodeBase64: string;
  copyPaste: string;
  externalPaymentId: string;
  expiresAt: Date;
}

/**
 * Calculates standard CRC16-CCITT (0x1021) required by Central Bank of Brazil (BCB) / EMV standard.
 */
function calculateCRC16(payload: string): string {
  let crc = 0xffff;
  for (let c = 0; c < payload.length; c++) {
    crc ^= payload.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Generates an authentic Pix Copy-and-Paste string adhering to the EMV/BCB standard
 * or returns the direct payment link if the receiver is configured as a URL.
 */
export function generatePixCopyPaste(
  amount: number,
  txId: string,
  receiverKeyOrLink?: string,
  merchantName: string = "BOLINHA DA SORTE",
  merchantCity: string = "SAO PAULO"
): string {
  const target = (receiverKeyOrLink || "").trim();

  // Se o recebedor for um link direto de pagamento (ex: Mercado Pago, Nubank, etc.)
  if (target.startsWith("http://") || target.startsWith("https://")) {
    return target;
  }

  // Chave oficial padrão do Bolinha da Sorte
  let pixKey = target || "+5575991638134";
  const digitsOnly = pixKey.replace(/\D/g, "");

  // Formatar chave de telefone no padrão internacional exigido pelo Banco Central (+55...)
  if ((digitsOnly.length === 11 || digitsOnly.length === 10) && !pixKey.includes("@")) {
    pixKey = `+55${digitsOnly}`;
  } else if (digitsOnly.length === 13 && digitsOnly.startsWith("55") && !pixKey.startsWith("+")) {
    pixKey = `+${digitsOnly}`;
  }

  const formattedAmount = amount.toFixed(2);
  const cleanTxId = (txId.replace(/[^a-zA-Z0-9]/g, "") || "PIX").substring(0, 25);
  const cleanName = (merchantName || "BOLINHA DA SORTE").trim().substring(0, 25).toUpperCase();
  const cleanCity = (merchantCity || "SAO PAULO").trim().substring(0, 15).toUpperCase();

  // Subcampos do Merchant Account Information (Tag 26)
  const gui = "0014br.gov.bcb.pix";
  const keyField = `01${pixKey.length.toString().padStart(2, "0")}${pixKey}`;
  const tag26Value = `${gui}${keyField}`;
  const tag26 = `26${tag26Value.length.toString().padStart(2, "0")}${tag26Value}`;

  // Campos principais EMV
  const payloadFormat = "000201";
  const pointOfInitiation = "010212"; // 12 = QR Dinâmico / Recorrente com valor
  const merchantCategory = "52040000";
  const transactionCurrency = "5303986"; // 986 = BRL
  const transactionAmount = `54${formattedAmount.length.toString().padStart(2, "0")}${formattedAmount}`;
  const countryCode = "5802BR";
  const nameTag = `59${cleanName.length.toString().padStart(2, "0")}${cleanName}`;
  const cityTag = `60${cleanCity.length.toString().padStart(2, "0")}${cleanCity}`;

  // Campo adicional de referência (Tag 62 -> txid)
  const txIdField = `05${cleanTxId.length.toString().padStart(2, "0")}${cleanTxId}`;
  const tag62 = `62${txIdField.length.toString().padStart(2, "0")}${txIdField}`;

  const payloadWithoutCRC = `${payloadFormat}${pointOfInitiation}${tag26}${merchantCategory}${transactionCurrency}${transactionAmount}${countryCode}${nameTag}${cityTag}${tag62}6304`;
  const checksum = calculateCRC16(payloadWithoutCRC);

  return `${payloadWithoutCRC}${checksum}`;
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
