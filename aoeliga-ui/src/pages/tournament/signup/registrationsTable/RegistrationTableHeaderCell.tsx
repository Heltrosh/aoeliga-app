import {
  ActionIcon,
  Button,
  Checkbox,
  Group,
  NumberInput,
  Popover,
  Stack,
  Text,
} from "@mantine/core";
import {
  IconChevronDown,
  IconChevronUp,
  IconFilter,
  IconSelector,
} from "@tabler/icons-react";

import { useI18n } from "../../../../i18n/I18nProvider";
import { hasRange } from "./helpers";
import type { NumericRange, SortDirection, SortKey } from "./types";

function HeaderSortButton({
  label,
  sortKey,
  activeSortKey,
  direction,
  onClick,
  centered = false,
}: {
  label: string;
  sortKey: SortKey;
  activeSortKey: SortKey;
  direction: SortDirection;
  onClick: (key: SortKey) => void;
  centered?: boolean;
}) {
  const isActive = activeSortKey === sortKey;

  return (
    <Button
      variant="subtle"
      color={isActive ? "yellow" : "gray"}
      size="compact-sm"
      onClick={() => onClick(sortKey)}
      rightSection={
        isActive ? (
          direction === "asc" ? (
            <IconChevronUp size={14} />
          ) : (
            <IconChevronDown size={14} />
          )
        ) : (
          <IconSelector size={14} />
        )
      }
      styles={{
        root: {
          fontWeight: 700,
          justifyContent: centered ? "center" : "flex-start",
          width: "auto",
          minHeight: 24,
          paddingLeft: 5,
          paddingRight: 5,
        },
        inner: {
          justifyContent: centered ? "center" : "flex-start",
          gap: 2,
        },
        label: {
          whiteSpace: "nowrap",
          fontSize: "0.92rem",
          lineHeight: 1.2,
        },
        section: {
          marginLeft: 2,
        },
      }}
    >
      {label}
    </Button>
  );
}

export function NumericFilterPopover({
  label,
  range,
  onChange,
}: {
  label: string;
  range: NumericRange;
  onChange: (side: "min" | "max", value: string | number) => void;
}) {
  const { t } = useI18n();
  const active = hasRange(range);

  return (
    <Popover position="bottom" withArrow shadow="md">
      <Popover.Target>
        <ActionIcon
          size="sm"
          variant="subtle"
          color={active ? "yellow" : "gray"}
          aria-label={t("tournament.signup.table.filter.aria", { label })}
        >
          <IconFilter size={13} />
        </ActionIcon>
      </Popover.Target>

      <Popover.Dropdown>
        <Stack gap="xs">
          <Text fw={600} size="sm">
            {label}
          </Text>

          <Group gap="xs" align="flex-end" wrap="nowrap">
            <NumberInput
              placeholder={t("tournament.signup.table.filter.min")}
              value={range.min ?? undefined}
              onChange={(value) => onChange("min", value)}
              allowDecimal={false}
              w={80}
            />

            <Text size="sm" c="dimmed" pb={8}>
              –
            </Text>

            <NumberInput
              placeholder={t("tournament.signup.table.filter.max")}
              value={range.max ?? undefined}
              onChange={(value) => onChange("max", value)}
              allowDecimal={false}
              w={80}
            />
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}

export function StatusFilterPopover({
  values,
  onChange,
}: {
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const { t } = useI18n();
  const active = values.length > 0;
  const options = [
    { value: "pending", label: t("tournament.signup.status.pending") },
    { value: "approved", label: t("tournament.signup.status.approved") },
    { value: "rejected", label: t("tournament.signup.status.rejected") },
    { value: "withdrawn", label: t("tournament.signup.status.withdrawn") },
  ];

  const toggle = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((item) => item !== value));
    } else {
      onChange([...values, value]);
    }
  };

  return (
    <Popover position="bottom" withArrow shadow="md">
      <Popover.Target>
        <ActionIcon
          size="sm"
          variant="subtle"
          color={active ? "yellow" : "gray"}
          aria-label={t("tournament.signup.table.filter.statusAria")}
        >
          <IconFilter size={13} />
        </ActionIcon>
      </Popover.Target>

      <Popover.Dropdown>
        <Stack gap="xs">
          <Text fw={600} size="sm">
            {t("tournament.signup.table.columns.status")}
          </Text>

          {options.map((status) => (
            <Checkbox
              key={status.value}
              label={status.label}
              checked={values.includes(status.value)}
              onChange={() => toggle(status.value)}
            />
          ))}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}

export function RegistrationTableHeaderCell({
  label,
  sortKey,
  activeSortKey,
  direction,
  onSort,
  centered = false,
  filter,
}: {
  label: string;
  sortKey?: SortKey;
  activeSortKey: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
  centered?: boolean;
  filter?: React.ReactNode;
}) {
  return (
    <Group
      gap={2}
      justify={centered ? "center" : "flex-start"}
      wrap="nowrap"
      align="center"
    >
      {sortKey ? (
        <HeaderSortButton
          label={label}
          sortKey={sortKey}
          activeSortKey={activeSortKey}
          direction={direction}
          onClick={onSort}
          centered={centered}
        />
      ) : (
        <Text
          fw={700}
          fz="0.92rem"
          ta={centered ? "center" : "left"}
          lh={1.2}
        >
          {label}
        </Text>
      )}

      {filter}
    </Group>
  );
}