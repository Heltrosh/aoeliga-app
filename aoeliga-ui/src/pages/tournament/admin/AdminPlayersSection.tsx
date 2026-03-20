import { useMemo, useState } from "react";
import { Button, Divider, SimpleGrid, Stack, Text, TextInput, Title } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { tournamentKeys } from "../../../api/queryKeys";
import {
  addTournamentPlayer,
  removeTournamentPlayer,
  type TournamentPlayerRow,
} from "../../../api/tournaments";
import type { UserListItem } from "../../../api/users";
import { AoE2InsightsLink, CollapsibleTile, CurrentUserCard, SelectedUserInfo, UserPicker } from "../../../components/tournament-admin/shared";

const playerSchema = z.object({
  user_id: z.number().int().positive(),
  aoe_id: z.string().min(1, "AoE ID is required"),
  status: z.string(),
});

type PlayerFormValues = z.infer<typeof playerSchema>;

export function AdminPlayersSection({
  slug,
  users,
  playerMembers,
}: {
  slug: string;
  users: UserListItem[];
  playerMembers: TournamentPlayerRow[];
}) {
  const queryClient = useQueryClient();
  const [selectedPlayerUser, setSelectedPlayerUser] = useState<UserListItem | null>(null);

  const playerForm = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      user_id: 0,
      aoe_id: "",
      status: "active",
    },
  });

  const availableUsers = useMemo(() => {
    const assignedUserIds = new Set(playerMembers.map((member) => member.user_id));
    return users.filter((user) => !assignedUserIds.has(user.id));
  }, [playerMembers, users]);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: tournamentKeys.players(slug) }),
      queryClient.invalidateQueries({ queryKey: tournamentKeys.context(slug) }),
    ]);
  };

  const addPlayerMutation = useMutation({
    mutationFn: (values: PlayerFormValues) => addTournamentPlayer(slug, values),
    onSuccess: async () => {
      setSelectedPlayerUser(null);
      playerForm.reset({ user_id: 0, aoe_id: "", status: "active" });
      await refresh();
    },
  });

  const removePlayerMutation = useMutation({
    mutationFn: (playerId: number) => removeTournamentPlayer(slug, playerId),
    onSuccess: refresh,
  });

  return (
    <CollapsibleTile title="Players" subtitle="Add and remove tournament players." defaultOpen>
      <Stack gap="md">
        <UserPicker
          label="Select user"
          users={availableUsers}
          value={selectedPlayerUser}
          onChange={(user) => {
            setSelectedPlayerUser(user);
            playerForm.setValue("user_id", user?.id ?? 0);
          }}
          disabled={addPlayerMutation.isPending}
        />

        <Divider />

        <SimpleGrid cols={{ base: 1, md: 2 }}>
          <div>
            <Text fw={600} mb={4}>
              Selected user
            </Text>
            <SelectedUserInfo user={selectedPlayerUser} />
          </div>

          <TextInput
            label="AoE ID"
            placeholder="e.g. 2047125"
            {...playerForm.register("aoe_id")}
            error={playerForm.formState.errors.aoe_id?.message}
          />
        </SimpleGrid>

        <Button
          color="green"
          disabled={!selectedPlayerUser}
          loading={addPlayerMutation.isPending}
          onClick={playerForm.handleSubmit((values) => addPlayerMutation.mutate(values))}
        >
          Add as player
        </Button>

        {addPlayerMutation.isError && (
          <Text c="red" size="sm">
            Failed to add player
          </Text>
        )}

        <Divider />

        <Title order={4}>Current players</Title>
        <Stack gap="xs">
          {playerMembers.length === 0 ? (
            <Text c="dimmed" size="sm">
              No players assigned yet.
            </Text>
          ) : (
            playerMembers.map((item) => (
              <CurrentUserCard
                key={item.id}
                user={item}
                badge={item.status}
                badgeLabel={item.status}
                badgeColor="green"
                extraLines={[<AoE2InsightsLink key="aoe2insights" aoeId={item.aoe_id} />]}
                onRemove={() => removePlayerMutation.mutate(item.id)}
                removeLoading={
                  removePlayerMutation.isPending && removePlayerMutation.variables === item.id
                }
              />
            ))
          )}
        </Stack>
      </Stack>
    </CollapsibleTile>
  );
}
