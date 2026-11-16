import {
  Addon,
  CreateAddonPayload,
  UpdateAddonPayload,
  AddonsResponse,
  AddonResponse,
  DeleteAddonsPayload,
} from "@/lib/types/addons";

// ── Fetch all categories ───────────────────────────────────────────────────

export async function fetchAddons(): Promise<Addon[]> {
  const res = await fetch("/api/addons");
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch addons");
  }
  const json: AddonsResponse = await res.json();
  return json.data.addons;
}

// ── Fetch addon by ID ──────────────────────────────────────────────────

export async function fetchAddonById(id: string): Promise<Addon> {
  const res = await fetch(`/api/addons/${id}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch addon");
  }
  const json: AddonResponse = await res.json();
  return json.data.addon;
}

// ── Create category ────────────────────────────────────────────────────────

export async function createAddon(payload: CreateAddonPayload): Promise<Addon> {
  const res = await fetch("/api/addons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create addon");
  }

  const json = await res.json();

  const addon = json.data?.addon ?? json.data?.addons;

  if (!addon?._id) {
    console.error("[createAddon] Unexpected response structure:", json);
    throw new Error(
      "Add-on was created, but its details could not be retrieved.",
    );
  }

  return addon as Addon;
}

// ── Update category ────────────────────────────────────────────────────────

export async function updateAddon(payload: UpdateAddonPayload): Promise<Addon> {
  const res = await fetch(`/api/addons/${payload._id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update addon");
  }

  const json: AddonResponse = await res.json();
  return json.data.addon;
}

// ── Delete single category ─────────────────────────────────────────────────

export async function deleteAddon(id: string): Promise<void> {
  const res = await fetch(`/api/addons/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete addon");
  }
}

// ── Delete multiple categories ─────────────────────────────────────────────

export async function deleteAddons(
  payload: DeleteAddonsPayload,
): Promise<void> {
  const res = await fetch("/api/addons", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete addons");
  }
}
