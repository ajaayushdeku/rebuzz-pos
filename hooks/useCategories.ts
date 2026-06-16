import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  fetchCategories,
  fetchCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  deleteCategories,
} from "@/services/category.client";
import type {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  DeleteCategoriesPayload,
} from "@/lib/types/category";

export const CATEGORY_KEY = ["categories"] as const;

// ── Queries ────────────────────────────────────────────────────────────────

/** Fetch all categories */
export const useCategories = () => {
  return useQuery({
    queryKey: CATEGORY_KEY,
    queryFn: fetchCategories,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

/** Fetch a single category by id */
export const useCategory = (id: string) => {
  return useQuery({
    queryKey: [...CATEGORY_KEY, id],
    queryFn: () => fetchCategoryById(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
};

// ── Mutations ──────────────────────────────────────────────────────────────

/** Create a new category */
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) => createCategory(payload),
    onSuccess: (newCategory: Category) => {
      queryClient.setQueryData<Category[]>(CATEGORY_KEY, (old) => {
        return old ? [...old, newCategory] : [newCategory];
      });
      toast.success("Category created successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create category");
    },
  });
};

/** Update an existing category */
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCategoryPayload) => updateCategory(payload),
    onSuccess: (updatedCategory: Category) => {
      queryClient.setQueryData<Category[]>(CATEGORY_KEY, (old) => {
        if (!old) return old;
        return old.map((cat) =>
          cat._id === updatedCategory._id ? updatedCategory : cat,
        );
      });
      toast.success("Category updated successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update category");
    },
  });
};

/** Delete a single category */
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEY });
      toast.success("Category deleted successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete category");
    },
  });
};

/** Delete multiple categories at once */
export const useDeleteCategories = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeleteCategoriesPayload) => deleteCategories(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEY });
      toast.success("Categories deleted successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete categories");
    },
  });
};
