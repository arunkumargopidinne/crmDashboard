import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Contact, IContactFormData } from "@/types/contact";
import { apiFetch } from "@/app/lib/api";

const API_BASE = "/api/contacts";

// ============= QUERIES =============

/**
 * Fetch paginated contacts with search and filters
 */
export function useContacts(
  page: number = 1,
  limit: number = 10,
  search: string = "",
  tags: string[] = []
) {
  return useQuery({
    queryKey: ["contacts", { page, limit, search, tags }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) params.append("search", search);
      if (tags.length > 0) params.append("tags", tags.join(","));

      return apiFetch(`${API_BASE}?${params.toString()}`);
    },
    keepPreviousData: true,
  });
}

/**
 * Fetch a single contact by ID
 */
export function useContact(id: string | null) {
  return useQuery({
    queryKey: ["contact", id],
    queryFn: async () => {
      return apiFetch(`${API_BASE}/${id}`);
    },
    enabled: !!id,
  });
}

/**
 * Fetch dashboard statistics
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      return apiFetch(`${API_BASE}/stats`);
    },
  });
}

// ============= MUTATIONS =============

/**
 * Create a new contact
 */
export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: IContactFormData) => {
      return apiFetch(API_BASE, { method: "POST", body: JSON.stringify(data) });
    },
    onSuccess: () => {
      // Invalidate contacts list and stats
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

/**
 * Update an existing contact
 */
export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<IContactFormData> }) => {
      return apiFetch(`${API_BASE}/${id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    onSuccess: (_, { id }) => {
      // Invalidate specific contact and list
      queryClient.invalidateQueries({ queryKey: ["contact", id] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

/**
 * Delete a contact
 */
export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiFetch(`${API_BASE}/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

/**
 * Bulk delete contacts
 */
export function useBulkDeleteContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      return apiFetch(`${API_BASE}/bulk-delete`, { method: "POST", body: JSON.stringify({ ids }) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

/**
 * Bulk import contacts from CSV
 */
export function useBulkImportContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      contacts: Array<{
        name: string;
        email: string;
        phone?: string;
        company?: string;
        tags?: string[];
        notes?: string;
      }>
    ) => {
      return apiFetch(`${API_BASE}/bulk-import`, {
        method: "POST",
        body: JSON.stringify({ contacts }),
        allowedStatuses: [207],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}
