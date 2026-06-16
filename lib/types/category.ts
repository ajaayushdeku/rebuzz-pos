// ── Category Entity ────────────────────────────────────────────────────────

export interface Category {
  _id: string;
  name: string;
  color: string; // Hex color code (e.g. "F47003" or "#F47003")
  adminId?: string;
}

// ── Payloads ───────────────────────────────────────────────────────────────

export interface CreateCategoryPayload {
  name: string;
  color: string;
}

export interface UpdateCategoryPayload {
  _id: string;
  name: string;
  color: string;
}

export interface DeleteCategoriesPayload {
  categoryIds: string[];
}

// ── API Responses ──────────────────────────────────────────────────────────

export interface CategoryResponse {
  status: string;
  data: {
    category: Category;
  };
}

export interface CategoriesResponse {
  status: string;
  data: {
    categories: Category[];
  };
}
