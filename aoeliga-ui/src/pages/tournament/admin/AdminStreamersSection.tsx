import { useMemo, useState } from "react";
import { Button, Divider, Stack, Text, Title } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { tournamentKeys } from "../../../api/queryKeys";
import {
  addTournamentStreamer,
  removeTournamentStreamer,
  type TournamentStreamerRow,
} from "../../../api/tournaments";
import type { UserListItem } from "../../../api/users";
import { CollapsibleTile, CurrentUserCard, SelectedUserInfo, UserPicker } from "../../../components/tournament-admin/shared";
import { useI18n } from "../../../i18n/I18nProvider";

const streamerSchema = z.object({
  user_id: z.number().int().positive(),
});

type StreamerFormValues = z.infer<typeof streamerSchema>;

export function AdminStreamersSection({
  slug,
  users,
  streamerMembers,
}: {
  slug: string;
  users: UserListItem[];
  streamerMembers: TournamentStreamerRow[];
}) {
  const queryClient = useQueryClient();
  const [selectedStreamerUser, setSelectedStreamerUser] = useState<UserListItem | null>(null);
  const { t } = useI18n();

  const streamerForm = useForm<StreamerFormValues>({
    resolver: zodResolver(streamerSchema),
    defaultValues: { user_id: 0 },
  });

  const availableUsers = useMemo(() => {
    const assignedUserIds = new Set(streamerMembers.map((member) => member.user_id));
    return users.filter((user) => !assignedUserIds.has(user.id));
  }, [streamerMembers, users]);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: tournamentKeys.streamers(slug) }),
      queryClient.invalidateQueries({ queryKey: tournamentKeys.context(slug) }),
    ]);
  };

  const addStreamerMutation = useMutation({
    mutationFn: (values: StreamerFormValues) => addTournamentStreamer(slug, values),
    onSuccess: async () => {
      setSelectedStreamerUser(null);
      streamerForm.reset({ user_id: 0 });
      await refresh();
    },
  });

  const removeStreamerMutation = useMutation({
    mutationFn: (userId: number) => removeTournamentStreamer(slug, userId),
    onSuccess: refresh,
  });

  return (
    <CollapsibleTile 
      title={t("tournament.admin.streamer.title")}
      subtitle={t("tournament.admin.streamer.description")}
      defaultOpen>
      <Stack gap="md">
        <UserPicker
          label={t("tournament.admin.common.picker")}
          users={availableUsers}
          value={selectedStreamerUser}
          onChange={(user) => {
            setSelectedStreamerUser(user);
            streamerForm.setValue("user_id", user?.id ?? 0);
          }}
          disabled={addStreamerMutation.isPending}
        />

        <Divider />

        <div>
          <Text fw={600} mb={4}>
            {t("tournament.admin.common.selected")}
          </Text>
          <SelectedUserInfo user={selectedStreamerUser} emptyText={t("tournament.admin.common.noselected")} />
        </div>

        <Button
          color="grape"
          disabled={!selectedStreamerUser}
          loading={addStreamerMutation.isPending}
          onClick={streamerForm.handleSubmit((values) => addStreamerMutation.mutate(values))}
        >
          {t("tournament.admin.streamer.addstreamer")}
        </Button>

        {addStreamerMutation.isError && (
          <Text c="red" size="sm">
            {t("tournament.admin.streamer.saveerror")}
          </Text>
        )}

        <Divider />

        <Title order={4}>{t("tournament.admin.streamer.current")}</Title>
        <Stack gap="xs">
          {streamerMembers.length === 0 ? (
            <Text c="dimmed" size="sm">
              {t("tournament.admin.streamer.nostreamers")}
            </Text>
          ) : (
            streamerMembers.map((item) => (
              <CurrentUserCard
                key={item.user_id}
                user={item}
                badge={t("tournament.admin.streamer")}
                badgeLabel={t("tournament.admin.streamer")}
                badgeColor="grape"
                onRemove={() => removeStreamerMutation.mutate(item.user_id)}
                removeLoading={
                  removeStreamerMutation.isPending && removeStreamerMutation.variables === item.user_id
                }
              />
            ))
          )}
        </Stack>
      </Stack>
    </CollapsibleTile>
  );
}
