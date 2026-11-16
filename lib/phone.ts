/**
 * LGPD Data Protection: Formats phone numbers by masking the digits
 * Example: "43998765432" or "(43) 99876-5432" -> "(43) *****-****"
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "(**) *****-****";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length >= 2) {
    const ddd = cleaned.substring(0, 2);
    return `(${ddd}) *****-****`;
  }
  return "(**) *****-****";
}

/**
 * Standard Brazilian Phone display format for authenticated user profile
 * Example: 43998765432 -> (43) 99876-5432
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
  }
  return phone;
}

/**
 * Standard CPF masking: 123.456.789-00 -> ***.456.789-**
 */
export function maskCpf(cpf: string | null | undefined): string {
  if (!cpf) return "***.***.***-**";
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `***.${cleaned.substring(3, 6)}.${cleaned.substring(6, 9)}-**`;
  }
  return "***.***.***-**";
}
