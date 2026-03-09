import React from "react";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { theme } from "../theme";
import { AuthProvider } from "../auth/AuthContext";
import { I18nProvider } from "../i18n/I18nProvider";
import { TournamentHeaderProvider } from "../tournament/TournamentHeaderContext";

const queryClient = new QueryClient();

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Notifications />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <I18nProvider>
            <TournamentHeaderProvider>{children}</TournamentHeaderProvider>
          </I18nProvider>
        </AuthProvider>
      </QueryClientProvider>
    </MantineProvider>
  );
}