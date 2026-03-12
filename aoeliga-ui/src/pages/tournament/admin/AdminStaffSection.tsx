import { useMemo, useState } from "react";
import { Button, Divider, Group, Stack, Text, Title } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { tournamentKeys } from "../../../api/queryKeys";
import {
  addTournamentAdmin,
  removeTournamentAdmin,
  type TournamentAdminRow,
} from "../../../api/tournaments";
import type { UserListItem } from "../../../api/users";
import { CollapsibleTile, CurrentUserCard, SelectedUserInfo, UserPicker } from "../../../components/tournament-admin/shared";

const adminSchema = z.object({
  user_id: z.number().int().positive(),
  role: z.enum(["admin", "moderator"]),
});

type AdminFormValues = z.infer<typeof adminSchema>;

export function AdminStaffSection({
  slug,
  users,
  adminMembers,
}: {
  slug: string;
  users: UserListItem[];
  adminMembers: TournamentAdminRow[];
}) {
  const queryClient = useQueryClient();
  const [selectedAdminUser, setSelectedAdminUser] = useState<UserListItem | null>(null);

  const adminForm = useForm<AdminFormValues>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      user_id: 0,
      role: "moderator",
    },
  });

  const availableUsers = useMemo(() => {
    const assignedUserIds = new Set(adminMembers.map((member) => member.user_id));
    return users.filter((user) => !assignedUserIds.has(user.id));
  }, [adminMembers, users]);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: tournamentKeys.admins(slug) }),
      queryClient.invalidateQueries({ queryKey: tournamentKeys.context(slug) }),
    ]);
  };

  const addAdminMutation = useMutation({
    mutationFn: (values: AdminFormValues) => addTournamentAdmin(slug, values),
    onSuccess: async () => {
      setSelectedAdminUser(null);
      adminForm.reset({ user_id: 0, role: "moderator" });
      await refresh();
    },
  });

  const removeAdminMutation = useMutation({
    mutationFn: (userId: number) => removeTournamentAdmin(slug, userId),
    onSuccess: refresh,
  });

  return (
    <CollapsibleTile
      title="Admins & Moderators"
      subtitle="Assign and remove tournament admin roles."
      defaultOpen
    >
      <Stack gap="md">
        <UserPicker
          label="Select user"
          users={availableUsers}
          value={selectedAdminUser}
          onChange={(user) => {
            setSelectedAdminUser(user);
            adminForm.setValue("user_id", user?.id ?? 0);
          }}
          disabled={addAdminMutation.isPending}
        />

        <Divider />

        <div>
          <Text fw={600} mb={4}>
            Selected user
          </Text>
          <SelectedUserInfo user={selectedAdminUser} />
        </div>

        <Group>
          <Button
            variant={adminForm.watch("role") === "admin" ? "filled" : "light"}
            color="red"
            onClick={() => adminForm.setValue("role", "admin")}
            disabled={!selectedAdminUser || addAdminMutation.isPending}
          >
            Add as admin
          </Button>

          <Button
            variant={adminForm.watch("role") === "moderator" ? "filled" : "light"}
            color="blue"
            onClick={() => adminForm.setValue("role", "moderator")}
            disabled={!selectedAdminUser || addAdminMutation.isPending}
          >
            Add as moderator
          </Button>
        </Group>

        <Button
          color="gold"
          disabled={!selectedAdminUser}
          loading={addAdminMutation.isPending}
          onClick={adminForm.handleSubmit((values) => addAdminMutation.mutate(values))}
        >
          Save role assignment
        </Button>

        {addAdminMutation.isError && (
          <Text c="red" size="sm">
            Failed to add admin/moderator
          </Text>
        )}

        <Divider />

        <Title order={4}>Current staff</Title>
        <Stack gap="xs">
          {adminMembers.length === 0 ? (
            <Text c="dimmed" size="sm">
              No staff assigned yet.
            </Text>
          ) : (
            adminMembers.map((item) => (
              <CurrentUserCard
                key={`${item.user_id}-${item.role}`}
                user={item}
                badge={item.role}
                badgeColor={item.role === "admin" ? "red" : "blue"}
                onRemove={() => removeAdminMutation.mutate(item.user_id)}
                removeLoading={
                  removeAdminMutation.isPending && removeAdminMutation.variables === item.user_id
                }
              />
            ))
          )}
        </Stack>
      </Stack>
    </CollapsibleTile>
  );
}
