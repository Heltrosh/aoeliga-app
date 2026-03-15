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
          background: "rgba(10, 18, 32, 0.82)",
          border: "1px solid rgba(229, 154, 42, 0.18)",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.18)",
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
                    height: 28,
                    paddingInline: 10,
                    background: active
                      ? "rgba(229,154,42,0.10)"
                      : "transparent",
                    border: active
                      ? "1px solid rgba(229,154,42,0.28)"
                      : "1px solid transparent",
                    boxShadow: active
                      ? "0 0 6px rgba(229,154,42,0.15)"
                      : "none",
                    color: active
                      ? "#ffd7a3"
                      : "rgba(255,255,255,0.9)",
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
    ...(canSeeRulesets ? [{ value: "rulesets" as const, label: t("landing.title.rulesets") }] : []),
    ...(canSeeAdmin ? [{ value: "admin" as const, label: t("landing.title.admin") }] : []),
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