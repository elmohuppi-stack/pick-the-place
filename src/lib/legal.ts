export interface LegalInfo {
  company: string;
  address: string;
  city: string;
  representative: string;
  email: string;
  phone?: string;
  register?: string;
  vatId?: string;
  hosting?: string;
}

function optional(key: string): string | undefined {
  const v = process.env[key];
  return v && v.trim() ? v.trim() : undefined;
}

function required(key: string): string {
  return optional(key) ?? `[bitte ${key} in .env setzen]`;
}

/**
 * Rechtliche Angaben für Impressum & Datenschutz — aus Umgebungsvariablen,
 * damit sie pro Deployment konfigurierbar sind und nicht im Code stehen.
 * Pflichtfelder zeigen einen sichtbaren Platzhalter, wenn nicht gesetzt.
 */
export function getLegalInfo(): LegalInfo {
  return {
    company: required("LEGAL_COMPANY"),
    address: required("LEGAL_ADDRESS"),
    city: required("LEGAL_CITY"),
    representative: required("LEGAL_REPRESENTATIVE"),
    email: required("LEGAL_EMAIL"),
    phone: optional("LEGAL_PHONE"),
    register: optional("LEGAL_REGISTER"),
    vatId: optional("LEGAL_VAT_ID"),
    hosting: optional("LEGAL_HOSTING"),
  };
}
