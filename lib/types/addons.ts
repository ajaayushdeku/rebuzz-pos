export interface Addon {
  _id: string;
  name: string;
  price: number;
  description?: string;
  maxAvailable?: number;
  adminId?: string;
}

// ── Payloads ───────────────────────────────────────────────────────────────

export interface CreateAddonPayload {
  name: string;
  price: number;
  description?: string;
  maxAvailable?: number;
}

export interface UpdateAddonPayload {
  _id: string;
  name: string;
  price: number;
  description?: string;
  maxAvailable?: number;
}

export interface DeleteAddonsPayload {
  addonIds: string[];
}

// ── API Responses ──────────────────────────────────────────────────────────

export interface AddonResponse {
  status: string;
  data: {
    addon: Addon;
  };
}

export interface AddonsResponse {
  status: string;
  data: {
    addons: Addon[];
  };
}
