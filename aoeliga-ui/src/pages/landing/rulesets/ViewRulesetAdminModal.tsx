import { Alert, Center, Loader, Modal } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";

import { fetchRulesetById } from "../../../api/rulesets";
import { rulesetKeys } from "../../../api/queryKeys";
import { AdminRulesetDetailsView } from "./ViewRulesetAdminView";

type ViewRulesetAdminModalProps = {
  opened: boolean;
  onClose: () => void;
  rulesetId: number | null;
};

export function ViewRulesetAdminModal({
  opened,
  onClose,
  rulesetId,
}: ViewRulesetAdminModalProps) {
  const rulesetQuery = useQuery({
    queryKey: rulesetKeys.detail(rulesetId),
    queryFn: () => fetchRulesetById(rulesetId as number),
    enabled: opened && rulesetId != null,
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Ruleset details"
      centered
      size="xl"
    >
      {rulesetId == null ? (
        <Alert icon={<IconInfoCircle size={16} />} color="gray" variant="light">
          No ruleset selected.
        </Alert>
      ) : rulesetQuery.isPending ? (
        <Center py="xl">
          <Loader color="gold" />
        </Center>
      ) : rulesetQuery.isError ? (
        <Alert icon={<IconInfoCircle size={16} />} color="red" variant="light">
          Failed to load ruleset details.
        </Alert>
      ) : rulesetQuery.data ? (
        <AdminRulesetDetailsView ruleset={rulesetQuery.data} />
      ) : null}
    </Modal>
  );
}