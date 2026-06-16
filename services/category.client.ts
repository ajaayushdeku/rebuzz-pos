import {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CategoriesResponse,
  CategoryResponse,
  DeleteCategoriesPayload,
} from "@/lib/types/category";

// ── Normalise color ────────────────────────────────────────────────────────
// Ensure a hex color is always rendered as "#RRGGBB" regardless of how the
// backend returns it (with or without "#" prefix, upper or lowercase).

export function normalizeColor(color: string): string {
  const hex = color.replace(/^#/, "");
  return `#${hex.toUpperCase()}`;
}

// ── Fetch all categories ───────────────────────────────────────────────────

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch("/api/categories");
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch categories");
  }
  const json: CategoriesResponse = await res.json();
  return json.data.categories;
}

// ── Fetch category by ID ──────────────────────────────────────────────────

export async function fetchCategoryById(id: string): Promise<Category> {
  const res = await fetch(`/api/categories/${id}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch category");
  }
  const json: CategoryResponse = await res.json();
  return json.data.category;
}

// ── Create category ────────────────────────────────────────────────────────

export async function createCategory(
  payload: CreateCategoryPayload,
): Promise<Category> {
  const res = await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create category");
  }

  const json: CategoryResponse = await res.json();
  return json.data.category;
}

// ── Update category ────────────────────────────────────────────────────────

export async function updateCategory(
  payload: UpdateCategoryPayload,
): Promise<Category> {
  const res = await fetch(`/api/categories/${payload._id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update category");
  }

  const json: CategoryResponse = await res.json();
  return json.data.category;
}

// ── Delete single category ─────────────────────────────────────────────────

export async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`/api/categories/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete category");
  }
}

// ── Delete multiple categories ─────────────────────────────────────────────

export async function deleteCategories(
  payload: DeleteCategoriesPayload,
): Promise<void> {
  const res = await fetch("/api/categories", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete categories");
  }
}
