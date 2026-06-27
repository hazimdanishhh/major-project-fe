import { useQuery } from "@tanstack/react-query";
import { fetchRequirements } from "../services/requirementService";
import { useMessage } from "../context/MessageContext";

// ─── Query keys ───────────────────────────────────────────────────────────────
// Centralised here so mutations can invalidate precisely.
export const requirementKeys = {
  all: ["requirements"],
  single: (id) => ["requirements", id],
};

// ─── List all requirements ────────────────────────────────────────────────────
export function useRequirements() {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: requirementKeys.all,
    queryFn: fetchRequirements,
    staleTime: 1000 * 60 * 2,
  });

  return {
    requirements: data?.requirements ?? [],
    isLoading,
    isFetching,
    error,
  };
}
