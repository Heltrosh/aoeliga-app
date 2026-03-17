import { Paper, type PaperProps } from "@mantine/core";
import {
  type MouseEventHandler,
  type ReactNode,
} from "react";

type AppSurfaceVariant = "panel" | "card";

type AppSurfaceProps = PaperProps & {
  children?: ReactNode;
  interactive?: boolean;
  variant?: AppSurfaceVariant;
  onClick?: MouseEventHandler<HTMLDivElement>;
  onMouseEnter?: MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: MouseEventHandler<HTMLDivElement>;
};

const SURFACE_BASE = {
  background: "rgba(21, 31, 40, 0.64)",
  borderColor: "rgba(229,154,42,0.22)",
};

const SURFACE_STYLES: Record<
  AppSurfaceVariant,
  {
    background: string;
    borderColor: string;
    boxShadow: string;
    hoverBoxShadow: string;
  }
> = {
  panel: {
    ...SURFACE_BASE,
    boxShadow:
      "0 0 0 1px rgba(229,154,42,0.06) inset, 0 8px 24px rgba(0,0,0,0.14)",
    hoverBoxShadow:
      "0 0 0 1px rgba(229,154,42,0.12) inset, 0 12px 32px rgba(0,0,0,0.20)",
  },
  card: {
    ...SURFACE_BASE,
    boxShadow:
      "0 0 0 1px rgba(229,154,42,0.05) inset, 0 8px 20px rgba(0,0,0,0.12)",
    hoverBoxShadow:
      "0 0 0 1px rgba(229,154,42,0.10) inset, 0 12px 28px rgba(0,0,0,0.18)",
  },
};

export function AppSurface({
  children,
  interactive,
  variant = "panel",
  style,
  onMouseEnter,
  onMouseLeave,
  ...props
}: AppSurfaceProps) {
  const tokens = SURFACE_STYLES[variant];

  const handleMouseEnter: MouseEventHandler<HTMLDivElement> = (event) => {
    if (interactive) {
      event.currentTarget.style.transform = "translateY(-1px)";
      event.currentTarget.style.boxShadow = tokens.hoverBoxShadow;
    }

    onMouseEnter?.(event);
  };

  const handleMouseLeave: MouseEventHandler<HTMLDivElement> = (event) => {
    if (interactive) {
      event.currentTarget.style.transform = "translateY(0)";
      event.currentTarget.style.boxShadow = tokens.boxShadow;
    }

    onMouseLeave?.(event);
  };

  return (
    <Paper
      radius="lg"
      withBorder
      {...props}
      style={{
        background: tokens.background,
        borderColor: tokens.borderColor,
        boxShadow: tokens.boxShadow,
        backdropFilter: "blur(6px)",
        transition: interactive
          ? "transform 120ms ease, box-shadow 120ms ease"
          : undefined,
        cursor: interactive ? "pointer" : undefined,
        ...style,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </Paper>
  );
}