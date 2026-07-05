// src/hooks/useTeam.js
//
// Backs the pm-only Team screen: list pm/member accounts, create new ones.
// Reuses GET /api/auth/users (already implemented, unpaginated — this
// project's account volumes don't warrant the full paginated list pattern)
// and the new POST /api/auth/team endpoint.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUsers, filterMembers, filterPMs } from "../services/userService";
import { createTeamMember } from "../services/authService";
import { useMessage } from "../context/MessageContext";

export const teamKeys = {
  all: ["users"],
};

// ─── List pm + member accounts ─────────────────────────────────────────────────
export function useTeamMembers() {
  const { data, isLoading, error } = useQuery({
    queryKey: teamKeys.all,
    queryFn: fetchUsers,
    staleTime: 1000 * 60 * 2,
  });

  const users = data?.users ?? [];
  return {
    teamMembers: [...filterPMs(users), ...filterMembers(users)],
    isLoading,
    error,
  };
}

// ─── Create a pm/member account ────────────────────────────────────────────────
export function useCreateTeamMember() {
  const queryClient = useQueryClient();
  const { showMessage } = useMessage();

  const mutation = useMutation({
    mutationFn: createTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
    },
    onError: (err) => showMessage(err.message, "error"),
  });

  return {
    createTeamMember: mutation.mutateAsync,
    creating: mutation.isPending,
  };
}
