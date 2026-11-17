/**
 * Gerador Oficial de BR Code EMV Pix do Banco Central do Brasil (BACEN)
 * Padrão EMV QRCPS-MPM com cálculo CRC16-CCITT (0x1021)
 */

export const OFFICIAL_PIX_KEY = "+5575991638134";
export const OFFICIAL_PIX_KEY_DISPLAY = "75991638134";
export const OFFICIAL_PIX_MERCHANT_NAME = "BOLINHA DA SORTE";
export const OFFICIAL_PIX_MERCHANT_CITY = "SAO PAULO";

/**
 * Calcula o checksum CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF)
 * exigido na Tag 63 pelo padrão EMV do Banco Central.
 */
export function calculateCRC16(payload: string): string {
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
 * Formata a chave para o padrão internacional exigido pelo Banco Central (+55...)
 */
export function formatPixPhoneKey(key: string): string {
  const clean = (key || "").trim();
  const digits = clean.replace(/\D/g, "");

  if ((digits.length === 11 || digits.length === 10) && !clean.includes("@")) {
    return `+55${digits}`;
  }
  if (digits.length === 13 && digits.startsWith("55") && !clean.startsWith("+")) {
    return `+${digits}`;
  }
  return clean || OFFICIAL_PIX_KEY;
}

/**
 * Gera o código Pix Copia e Cola Oficial no padrão BR Code EMV do Banco Central
 */
export function generatePixCopyPaste(
  amount: number,
  txId: string = "PIX",
  receiverKeyOrLink?: string,
  merchantName: string = OFFICIAL_PIX_MERCHANT_NAME,
  merchantCity: string = OFFICIAL_PIX_MERCHANT_CITY
): string {
  const target = (receiverKeyOrLink || "").trim();

  // Se o recebedor for um link direto HTTP/HTTPS (ex: Mercado Pago, gateway externo)
  if (target.startsWith("http://") || target.startsWith("https://")) {
    return target;
  }

  // Chave oficial padrão do Bolinha da Sorte
  const pixKey = formatPixPhoneKey(target || OFFICIAL_PIX_KEY);

  const formattedAmount = Number(amount || 0).toFixed(2);
  const cleanTxId = (txId ? txId.replace(/[^a-zA-Z0-9]/g, "") : "PIX").substring(0, 25) || "PIX";
  const cleanName = (merchantName || OFFICIAL_PIX_MERCHANT_NAME).trim().substring(0, 25).toUpperCase();
  const cleanCity = (merchantCity || OFFICIAL_PIX_MERCHANT_CITY).trim().substring(0, 15).toUpperCase();

  // Subcampos do Merchant Account Information (Tag 26)
  const gui = "0014br.gov.bcb.pix";
  const keyField = `01${pixKey.length.toString().padStart(2, "0")}${pixKey}`;
  const tag26Value = `${gui}${keyField}`;
  const tag26 = `26${tag26Value.length.toString().padStart(2, "0")}${tag26Value}`;

  // Campos principais EMV
  const payloadFormat = "000201";
  const pointOfInitiation = "010212"; // 12 = QR Dinâmico com valor definido
  const merchantCategory = "52040000";
  const transactionCurrency = "5303986"; // 986 = BRL (Real Brasileiro)
  const transactionAmount = `54${formattedAmount.length.toString().padStart(2, "0")}${formattedAmount}`;
  const countryCode = "5802BR";
  const nameTag = `59${cleanName.length.toString().padStart(2, "0")}${cleanName}`;
  const cityTag = `60${cleanCity.length.toString().padStart(2, "0")}${cleanCity}`;

  // Campo adicional de referência (Tag 62 -> txid)
  const txIdField = `05${cleanTxId.length.toString().padStart(2, "0")}${cleanTxId}`;
  const tag62 = `62${txIdField.length.toString().padStart(2, "0")}${txIdField}`;

  // Montagem da estrutura completa antes do CRC
  const payloadWithoutCRC = `${payloadFormat}${pointOfInitiation}${tag26}${merchantCategory}${transactionCurrency}${transactionAmount}${countryCode}${nameTag}${cityTag}${tag62}6304`;
  const checksum = calculateCRC16(payloadWithoutCRC);

  return `${payloadWithoutCRC}${checksum}`;
}
