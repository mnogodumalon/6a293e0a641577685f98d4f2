// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface Kontakte {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    nachname?: string;
    geburtsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    kategorie?: LookupValue;
    email?: string;
    telefon?: string;
    mobil?: string;
    webseite?: string;
    strasse?: string;
    hausnummer?: string;
    postleitzahl?: string;
    ort?: string;
    notizen?: string;
    vorname?: string;
  };
}

export const APP_IDS = {
  KONTAKTE: '6a293dfe82919e53fd3a4d92',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'kontakte': {
    kategorie: [{ key: "privat", label: "Privat" }, { key: "geschaeftlich", label: "Geschäftlich" }, { key: "familie", label: "Familie" }, { key: "freunde", label: "Freunde" }, { key: "sonstiges", label: "Sonstiges" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'kontakte': {
    'nachname': 'string/text',
    'geburtsdatum': 'date/date',
    'kategorie': 'lookup/select',
    'email': 'string/email',
    'telefon': 'string/tel',
    'mobil': 'string/tel',
    'webseite': 'string/url',
    'strasse': 'string/text',
    'hausnummer': 'string/text',
    'postleitzahl': 'string/text',
    'ort': 'string/text',
    'notizen': 'string/textarea',
    'vorname': 'string/text',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateKontakte = StripLookup<Kontakte['fields']>;