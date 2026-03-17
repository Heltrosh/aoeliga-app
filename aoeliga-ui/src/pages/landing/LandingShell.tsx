import type { ReactNode } from "react";
import {
  Box,
  Button,
  Container,
  Group,
  Stack,
  Title,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";

import { useI18n } from "../../i18n/I18nProvider";
import classes from "./LandingShell.module.css";

export type LandingSection = "tournaments" | "rulesets" | "admin";

type LandingShellProps = {
  section: LandingSection;
  canSeeRulesets: boolean;
  canSeeAdmin: boolean;
  title?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
};

type NavItem = {
  value: LandingSection;
  label: string;
};

function LandingSectionSwitcher({
  section,
  items,
}: {
  section: LandingSection;
  items: NavItem[];
}) {
  const nav = useNavigate();

  return (
    <Group justify="center" mb="xs">
      <Box
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: 4,
          borderRadius: 999,
          background: "rgba(21, 31, 40, 0.64)",
          border: "1px solid rgba(229,154,42,0.22)",
          boxShadow:
            "0 0 0 1px rgba(229,154,42,0.06) inset, 0 8px 24px rgba(0,0,0,0.14)",
          backdropFilter: "blur(6px)",
        }}
      >
        {items.map((item) => {
          const active = item.value === section;

          return (
            <Button
              key={item.value}
              variant="subtle"
              radius="xl"
              size="sm"
              className={classes.switcherButton}
              data-active={active ? "true" : "false"}
              onClick={() => {
                if (item.value === "tournaments") nav("/");
                else if (item.value === "rulesets") nav("/rulesets");
                else if (item.value === "admin") nav("/admin");
              }}
              styles={{
                root: {
                  height: 24,
                  paddingInline: 10,
                  background: active
                    ? "rgba(229,154,42,0.09)"
                    : "transparent",
                  border: active
                    ? "1px solid rgba(229,154,42,0.26)"
                    : "1px solid transparent",
                  boxShadow: active
                    ? "0 0 0 1px rgba(229,154,42,0.08) inset, 0 4px 12px rgba(0,0,0,0.10)"
                    : "none",
                  color: active
                    ? "#ffd7a3"
                    : "rgba(255,255,255,0.92)",
                  fontWeight: 700,
                },
                label: {
                  color: "inherit",
                },
              }}
            >
              {item.label}
            </Button>
          );
        })}
      </Box>
    </Group>
  );
}

export function LandingShell({
  section,
  canSeeRulesets,
  canSeeAdmin,
  title,
  rightSlot,
  children,
}: LandingShellProps) {
  const { t } = useI18n();

  const items: NavItem[] = [
    { value: "tournaments", label: t("landing.title.tournaments") },
    ...(canSeeRulesets
      ? [{ value: "rulesets" as const, label: t("landing.title.rulesets") }]
      : []),
    ...(canSeeAdmin
      ? [{ value: "admin" as const, label: t("landing.title.admin") }]
      : []),
  ];

  return (
    <Container size="lg" py="md">
      <Stack gap="md">
        {items.length > 1 && (
          <LandingSectionSwitcher section={section} items={items} />
        )}

        <Group justify="space-between" align="center" mb="xs">
          <Title order={1}>{title ?? t("landing.title.tournaments")}</Title>
          {rightSlot}
        </Group>

        {children}
      </Stack>
    </Container>
  );
}