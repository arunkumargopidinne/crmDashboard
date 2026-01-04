import { useQuery } from "@tanstack/react-query";

export interface ITag {
  _id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch all tags for the current user
 */
export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const response = await fetch("/api/tags");
      if (!response.ok) throw new Error("Failed to fetch tags");
      return response.json() as Promise<ITag[]>;
    },
  });
}
