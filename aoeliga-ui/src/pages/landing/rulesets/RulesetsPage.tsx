import { useMemo, useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Loader,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconEye,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";

import { useAuth } from "../../../auth/AuthContext";
import { createRuleset, deleteRuleset, fetchRulesets, updateRuleset } from "../../../api/rulesets";
import { rulesetKeys } from "../../../api/queryKeys";
import type {
  CreateRulesetInput,
  RulesetListItem,
  UpdateRulesetInput,
} from "../../../api/schemas/rulesets";
import { formatStageType } from "../../../components/rulesets/rulesetDetailsHelpers";
import { DeleteRulesetModal } from "./DeleteRulesetModal";
import { ViewRulesetAdminModal } from "./ViewRulesetAdminModal";
import { RulesetEditorModal } from "./RulesetEditorModal";
import { useLandingPage } from "../../../hooks/useLandingPage";
import { useI18n } from "../../../i18n/I18nProvider";
import { getLandingNavigationAccess } from "../landingAccess";
import { LandingShell } from "../LandingShell";

type FilterMode = "all" | "editable" | "in-use" | "unused";

function formatDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
}

function getCreatorLabel(ruleset: RulesetListItem) {
  return ruleset.creator_display_name || ruleset.creator_discord_name || "Unknown";
}

function getUsageLabel(ruleset: RulesetListItem) {
  if (!ruleset.usage.is_in_use) return "Unused";

  return `${ruleset.usage.tournament_default_count} tournament defaults • ${ruleset.usage.division_count} divisions`;
}

function getStageFlowLabel(ruleset: RulesetListItem) {
  if (ruleset.summary.stages.length === 0) return "No stages";
  return ruleset.summary.stages.map((stage) => stage.name).join(" → ");
}

function getStageTypesLabel(ruleset: RulesetListItem) {
  if (ruleset.summary.stages.length === 0) return "No stage types";
  return ruleset.summary.stages
    .map((stage) => formatStageType(stage.type as any))
    .join(" • ");
}

function RulesetCard({
  ruleset,
  onView,
  onEdit,
  onDelete,
}: {
  ruleset: RulesetListItem;
  onView: (rulesetId: number) => void;
  onEdit: (rulesetId: number) => void;
  onDelete: (ruleset: RulesetListItem) => void;
}) {
  const createdDate = formatDate(ruleset.created_at);
  const actionBlockReason =
    ruleset.lifecycle.lock_reason ?? "This ruleset cannot be changed.";

  return (
    <Paper 
      withBorder 
      radius="md"
      p="md"
      style={{
        background: "rgba(17, 27, 43, 0.78)",
        borderColor: "rgba(229,154,42,0.28)",
        boxShadow: "0 0 0 1px rgba(229,154,42,0.08) inset",
      }}>
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={4}>{ruleset.name}</Title>
            <Text size="sm" c="dimmed">
              Version {ruleset.summary.version}
            </Text>
          </div>

          <Badge
            color={ruleset.usage.is_in_use ? "blue" : "gray"}
            variant="light"
          >
            {ruleset.usage.is_in_use ? "In use" : "Unused"}
          </Badge>
        </Group>

        <Stack gap={6}>
          <Text size="sm" fw={600}>
            {getStageFlowLabel(ruleset)}
          </Text>

          <Text size="sm" c="dimmed">
            {getStageTypesLabel(ruleset)}
          </Text>

          <Text size="sm" c="dimmed">
            {ruleset.summary.stage_count} stages
          </Text>
        </Stack>

        <Group gap="xs">
          <Badge variant="light" color="gold">
            {getUsageLabel(ruleset)}
          </Badge>

          {ruleset.permissions.can_edit ? (
            <Badge variant="light" color="green">
              Editable
            </Badge>
          ) : (
            <Badge variant="light" color="red">
              Read only
            </Badge>
          )}
        </Group>

        <Stack gap={4}>
          <Text size="sm">
            <Text span fw={600}>
              Owner:
            </Text>{" "}
            {getCreatorLabel(ruleset)}
          </Text>

          {createdDate ? (
            <Text size="sm" c="dimmed">
              Created {createdDate}
            </Text>
          ) : null}

          {!ruleset.permissions.can_edit && ruleset.lifecycle.lock_reason ? (
            <Text size="sm" c="dimmed">
              {ruleset.lifecycle.lock_reason}
            </Text>
          ) : null}
        </Stack>

        <Group justify="space-between" mt="xs">
          <Button
            variant="default"
            leftSection={<IconEye size={16} />}
            onClick={() => onView(ruleset.id)}
          >
            View
          </Button>

          <Group gap="xs">
            <Tooltip label={ruleset.permissions.can_edit ? "Edit ruleset" : actionBlockReason}>
              <span>
                <Button
                  variant="light"
                  color="gold"
                  leftSection={<IconPencil size={16} />}
                  disabled={!ruleset.permissions.can_edit}
                  onClick={() => onEdit(ruleset.id)}
                >
                  Edit
                </Button>
              </span>
            </Tooltip>

            <Tooltip label={ruleset.permissions.can_delete ? "Delete ruleset" : actionBlockReason}>
              <span>
                <Button
                  variant="light"
                  color="red"
                  leftSection={<IconTrash size={16} />}
                  disabled={!ruleset.permissions.can_delete}
                  onClick={() => onDelete(ruleset)}
                >
                  Delete
                </Button>
              </span>
            </Tooltip>
          </Group>
        </Group>
      </Stack>
    </Paper>
  );
}

export default function RulesetsPage() {
  const { user } = useAuth();
  const { tournamentsQuery } = useLandingPage();
  const { t } = useI18n();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [viewRulesetId, setViewRulesetId] = useState<number | null>(null);
  const [editRulesetId, setEditRulesetId] = useState<number | null>(null);
  const [createOpened, setCreateOpened] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RulesetListItem | null>(null);

  const tournaments = tournamentsQuery.data?.tournaments ?? [];
  const { canSeeRulesets, canSeeAdmin } = getLandingNavigationAccess(
    user,
    tournaments,
  );

  const rulesetsQuery = useQuery({
    queryKey: rulesetKeys.list(),
    queryFn: fetchRulesets,
    enabled: canSeeRulesets,
  });

  const createRulesetMutation = useMutation({
    mutationFn: (input: CreateRulesetInput) => createRuleset(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: rulesetKeys.all });
    },
  });

  const updateRulesetMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: number;
      input: UpdateRulesetInput;
    }) => updateRuleset(id, input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: rulesetKeys.all });
    },
  });

  const deleteRulesetMutation = useMutation({
    mutationFn: (id: number) => deleteRuleset(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: rulesetKeys.all });
    },
  });

  const filteredRulesets = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return (rulesetsQuery.data ?? []).filter((ruleset) => {
      const matchesSearch =
        needle.length === 0 ||
        ruleset.name.toLowerCase().includes(needle) ||
        (ruleset.creator_display_name ?? "").toLowerCase().includes(needle) ||
        (ruleset.creator_discord_name ?? "").toLowerCase().includes(needle);

      if (!matchesSearch) return false;

      switch (filter) {
        case "editable":
          return ruleset.permissions.can_edit;
        case "in-use":
          return ruleset.usage.is_in_use;
        case "unused":
          return !ruleset.usage.is_in_use;
        default:
          return true;
      }
    });
  }, [rulesetsQuery.data, search, filter]);

  if (!tournamentsQuery.isLoading && !canSeeRulesets) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <LandingShell
        section="rulesets"
        title={t("landing.title.rulesets")}
        canSeeRulesets={canSeeRulesets}
        canSeeAdmin={canSeeAdmin}
        rightSlot={
          <Tooltip label={t("landing.createRuleset.tooltip")} position="bottom">
            <ActionIcon
              size="lg"
              radius="xl"
              variant="filled"
              color="gold"
              onClick={() => setCreateOpened(true)}
            >
              <IconPlus size={18} />
            </ActionIcon>
          </Tooltip>
        }
      >
        {tournamentsQuery.isLoading || rulesetsQuery.isLoading ? (
          <Loader />
        ) : (
          <Stack gap="md">
            <Paper 
              withBorder 
              radius="md" 
              p="md"
              style={{
                background: "rgba(17, 27, 43, 0.78)",
                borderColor: "rgba(229,154,42,0.28)",
                boxShadow: "0 0 0 1px rgba(229,154,42,0.08) inset",
              }}>
              <Group align="flex-end" grow>
                <TextInput
                  label="Search"
                  placeholder="Search by ruleset or owner"
                  value={search}
                  onChange={(event) => setSearch(event.currentTarget.value)}
                  leftSection={<IconSearch size={16} />}
                />

                <div>
                  <Text size="sm" fw={500} mb={6}>
                    Filter
                  </Text>
                  <SegmentedControl
                    fullWidth
                    value={filter}
                    onChange={(value) => setFilter(value as FilterMode)}
                    data={[
                      { label: "All", value: "all" },
                      { label: "Editable by me", value: "editable" },
                      { label: "In use", value: "in-use" },
                      { label: "Unused", value: "unused" },
                    ]}
                  />
                </div>
              </Group>
            </Paper>

            {rulesetsQuery.isError ? (
              <Paper 
                withBorder 
                radius="md"
                p="xl"
                style={{
                  background: "rgba(17, 27, 43, 0.78)",
                  borderColor: "rgba(229,154,42,0.28)",
                  boxShadow: "0 0 0 1px rgba(229,154,42,0.08) inset",
              }}>
                <Text c="red">Failed to load rulesets.</Text>
              </Paper>
            ) : filteredRulesets.length === 0 ? (
              <Paper 
                withBorder
                radius="md"
                p="xl"
                style={{
                  background: "rgba(17, 27, 43, 0.78)",
                  borderColor: "rgba(229,154,42,0.28)",
                  boxShadow: "0 0 0 1px rgba(229,154,42,0.08) inset",
                }}>
                <Stack gap="xs">
                  <Title order={4}>No rulesets found</Title>
                  <Text c="dimmed">
                    Try changing the search or filter, or create a new ruleset.
                  </Text>
                </Stack>
              </Paper>
            ) : (
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                {filteredRulesets.map((ruleset) => (
                  <RulesetCard
                    key={ruleset.id}
                    ruleset={ruleset}
                    onView={setViewRulesetId}
                    onEdit={setEditRulesetId}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </SimpleGrid>
            )}
          </Stack>
        )}
      </LandingShell>

      <ViewRulesetAdminModal
        opened={viewRulesetId != null}
        onClose={() => setViewRulesetId(null)}
        rulesetId={viewRulesetId}
      />

      <RulesetEditorModal
        opened={createOpened}
        onClose={() => setCreateOpened(false)}
        rulesetId={null}
        creating={createRulesetMutation.isPending}
        updating={false}
        onCreate={async (input) => {
          await createRulesetMutation.mutateAsync(input);
        }}
        onUpdate={async () => undefined}
      />

      <RulesetEditorModal
        opened={editRulesetId != null}
        onClose={() => setEditRulesetId(null)}
        rulesetId={editRulesetId}
        creating={false}
        updating={updateRulesetMutation.isPending}
        onCreate={async () => undefined}
        onUpdate={async (id, input) => {
          await updateRulesetMutation.mutateAsync({ id, input });
        }}
      />

      <DeleteRulesetModal
        opened={deleteTarget != null}
        onClose={() => setDeleteTarget(null)}
        ruleset={deleteTarget}
        deleting={deleteRulesetMutation.isPending}
        onConfirm={async (rulesetId) => {
          await deleteRulesetMutation.mutateAsync(rulesetId);
        }}
      />
    </>
  );
}