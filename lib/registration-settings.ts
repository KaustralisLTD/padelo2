export interface RegistrationCustomField {
  id: string;
  label: string;
  enabled: boolean;
  required: boolean;
}

export interface TournamentRegistrationSettings {
  partner: {
    required: boolean;
  };
  tshirtField: {
    enabled: boolean;
    required: boolean;
    label: string;
  };
  customFields: RegistrationCustomField[];
}

export const defaultRegistrationSettings: TournamentRegistrationSettings = {
  partner: {
    required: false,
  },
  tshirtField: {
    enabled: true,
    required: false,
    label: '',
  },
  customFields: [
    {
      id: 'customField1',
      label: '',
      enabled: false,
      required: false,
    },
  ],
};

export const getDefaultRegistrationSettings = (): TournamentRegistrationSettings =>
  JSON.parse(JSON.stringify(defaultRegistrationSettings));

export function normalizeRegistrationSettings(
  value?: Partial<TournamentRegistrationSettings> | null
): TournamentRegistrationSettings {
  const normalized = getDefaultRegistrationSettings();

  if (!value || typeof value !== 'object') {
    return normalized;
  }

  if (value.partner) {
    normalized.partner.required = !!value.partner.required;
  }

  if (value.tshirtField) {
    normalized.tshirtField.enabled =
      value.tshirtField.enabled !== undefined ? !!value.tshirtField.enabled : normalized.tshirtField.enabled;
    normalized.tshirtField.required =
      value.tshirtField.required !== undefined ? !!value.tshirtField.required : normalized.tshirtField.required;
    normalized.tshirtField.label =
      typeof value.tshirtField.label === 'string' ? value.tshirtField.label : normalized.tshirtField.label;
  }

  if (Array.isArray(value.customFields) && value.customFields.length > 0) {
    normalized.customFields = value.customFields.map((field, index) => ({
      id: field?.id || `customField${index + 1}`,
      label: field?.label || '',
      enabled: !!field?.enabled,
      required: !!field?.required,
    }));
  }

  return normalized;
}

