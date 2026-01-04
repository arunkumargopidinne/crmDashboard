import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Contact, IContactFormData } from "@/types/contact";

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

      const response = await fetch(`${API_BASE}?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch contacts");
      return response.json();
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
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) throw new Error("Failed to fetch contact");
      return response.json();
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
      const response = await fetch(`${API_BASE}/stats`);
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
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
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create contact");
      }

      return response.json();
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
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<IContactFormData>;
    }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update contact");
      }

      return response.json();
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
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete contact");
      }

      return response.json();
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
      const response = await fetch(`${API_BASE}/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete contacts");
      }

      return response.json();
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
      const response = await fetch(`${API_BASE}/bulk-import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts }),
      });

      if (!response.ok && response.status !== 207) {
        const error = await response.json();
        throw new Error(error.message || "Failed to import contacts");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}
