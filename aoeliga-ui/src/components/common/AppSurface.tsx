import { Paper, type PaperProps } from "@mantine/core";
import { type MouseEventHandler, type ReactNode } from "react";

type AppSurfaceProps = PaperProps & {
  children?: ReactNode;
  interactive?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
};

export function AppSurface({
  children,
  interactive,
  style,
  ...props
}: AppSurfaceProps) {
  return (
    <Paper
      radius="lg"
      withBorder
      {...props}
      style={{
        background: "rgba(21, 31, 40, 0.64)",
        borderColor: "rgba(229,154,42,0.22)",
        boxShadow:
          "0 0 0 1px rgba(229,154,42,0.06) inset, 0 8px 24px rgba(0,0,0,0.14)",
        backdropFilter: "blur(6px)",
        transition: interactive
          ? "transform 120ms ease, box-shadow 120ms ease"
          : undefined,
        cursor: interactive ? "pointer" : undefined,
        ...style,
      }}
      onMouseEnter={
        interactive
          ? (e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow =
                "0 0 0 1px rgba(229,154,42,0.12) inset, 0 12px 32px rgba(0,0,0,0.2)";
            }
          : undefined
      }
      onMouseLeave={
        interactive
          ? (e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 0 0 1px rgba(229,154,42,0.06) inset, 0 8px 24px rgba(0,0,0,0.14)";
            }
          : undefined
      }
    >
      {children}
    </Paper>
  );
}