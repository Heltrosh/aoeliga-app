import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { tournamentKeys, userKeys } from "../../../api/queryKeys";
import { listUsers } from "../../../api/users";
import {
  createMyTournamentRegistration,
  createTournamentRegistrationForUser,
  getMyTournamentRegistration,
  getTournamentRegistrations,
  refreshAllTournamentRegistrations,
  refreshTournamentRegistration,
  reviewTournamentRegistration,
  updateMyTournamentRegistration,
  updateTournamentRegistrationSettings,
  withdrawMyTournamentRegistration,
} from "../../../api/tournaments";
import type {
  StaffTournamentRegistration,
  Tournament,
} from "../../../api/schemas/tournaments";
import type { useTournamentAccess } from "../../../hooks/useTournamentAccess";
import { useI18n } from "../../../i18n/I18nProvider";

type TournamentAccessShape = ReturnType<typeof useTournamentAccess>;

type UseSignupPageStateArgs = {
  tournament: Tournament | null | undefined;
  access: TournamentAccessShape;
  user: { id: number } | null | undefined;
};

const DEFAULT_SELF_CAPABILITIES = {
  can_create: false,
  can_edit: false,
  can_withdraw: false,
};

export function useSignupPageState({
  tournament,
  access,
  user,
}: UseSignupPageStateArgs) {
  const qc = useQueryClient();
  const { t } = useI18n();

  const slug = tournament?.slug ?? "";

  const [aoeUrl, setAoeUrl] = useState("");
  const [note, setNote] = useState("");
  const [isReRegistering, setIsReRegistering] = useState(false);

  const [reviewModal, setReviewModal] = useState<StaffTournamentRegistration | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"pending" | "approved" | "rejected">(
    "approved",
  );
  const [reviewNote, setReviewNote] = useState("");

  const [detailsModal, setDetailsModal] = useState<StaffTournamentRegistration | null>(null);

  const [settingsOpenValue, setSettingsOpenValue] = useState<boolean>(
    (tournament?.registrations_open ?? 0) === 1,
  );
  const [settingsRecentDays, setSettingsRecentDays] = useState<number | null>(
    tournament?.recent_games_days ?? null,
  );
  
  const [selfFeedback, setSelfFeedback] = useState<string | null>(null);
  const [tableFeedback, setTableFeedback] = useState<string | null>(null);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);
  const [adminRegistrationFeedback, setAdminRegistrationFeedback] = useState<string | null>(null);

  if (!tournament) {
    throw new Error("SignupPage requires tournament");
  }

  const isSignupStage = tournament.status === "signup";
  const registrationsOpen = (tournament.registrations_open ?? 0) === 1;
  const isStaff = access.canManageTournament || access.canManagePlayers;

  const canUserAccessPage =
    !!user &&
    (isSignupStage || (isStaff && tournament.status === "draft"));

  const isClosedForNormalUser =
    !!user &&
    !isStaff &&
    isSignupStage &&
    !registrationsOpen;

  const canSelfRegister = isSignupStage && registrationsOpen;

  const showSettingsSection = access.canManageTournament;
  const showRegistrationsTableSection = access.canManagePlayers;

  const selfRegistrationQuery = useQuery({
    queryKey: tournamentKeys.registrationMe(slug),
    queryFn: () => getMyTournamentRegistration(slug),
    enabled: !!slug && !!user && canUserAccessPage,
    refetchInterval: !!slug && !!user && canUserAccessPage ? 30000 : false,
    refetchIntervalInBackground: false,
  });

  const registrationsQuery = useQuery({
    queryKey: tournamentKeys.registrations(slug),
    queryFn: () => getTournamentRegistrations(slug),
    enabled: !!slug && showRegistrationsTableSection,
    refetchInterval: !!slug && showRegistrationsTableSection ? 30000 : false,
    refetchIntervalInBackground: false,
  });

  const usersQuery = useQuery({
    queryKey: userKeys.list(),
    queryFn: listUsers,
    enabled: showSettingsSection,
  });

  const users = usersQuery.data?.users ?? [];

  const selfRegistration = selfRegistrationQuery.data?.registration ?? null;
  const selfCapabilities =
    selfRegistrationQuery.data?.capabilities ?? DEFAULT_SELF_CAPABILITIES;

  const selfStatus = selfRegistration?.status ?? null;
  const canReRegister = selfStatus === "rejected" || selfStatus === "withdrawn";

  const isCreateMode = !selfRegistration || isReRegistering;
  const isEditableForm = isCreateMode || selfCapabilities.can_edit;

  const showSelfSection =
    !!user &&
    (isStaff || canSelfRegister || selfRegistrationQuery.isPending || !!selfRegistration);

  const registrations = useMemo(
    () => registrationsQuery.data?.registrations ?? [],
    [registrationsQuery.data],
  );

  const selfSectionTitle = isCreateMode
    ? t("tournament.signup.self.title.create")
    : t("tournament.signup.self.title.edit");

  useEffect(() => {
    const registration = selfRegistrationQuery.data?.registration;

    if (!registration) {
      setAoeUrl("");
      setNote("");
      setIsReRegistering(false);
      return;
    }

    setNote(registration.note ?? "");
    setAoeUrl(`https://www.aoe2companion.com/players/${registration.aoe_id}`);
    setIsReRegistering(false);
  }, [selfRegistrationQuery.data?.registration]);

  useEffect(() => {
    setSettingsOpenValue((tournament.registrations_open ?? 0) === 1);
    setSettingsRecentDays(tournament.recent_games_days ?? null);
  }, [tournament.registrations_open, tournament.recent_games_days]);

  useEffect(() => {
    if (!selfFeedback) return;

    const timeout = window.setTimeout(() => {
      setSelfFeedback(null);
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [selfFeedback]);

  useEffect(() => {
    if (!tableFeedback) return;

    const timeout = window.setTimeout(() => {
      setTableFeedback(null);
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [tableFeedback]);

  useEffect(() => {
    if (!settingsFeedback) return;

    const timeout = window.setTimeout(() => {
      setSettingsFeedback(null);
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [settingsFeedback]);

  useEffect(() => {
    if (!adminRegistrationFeedback) return;

    const timeout = window.setTimeout(() => {
      setAdminRegistrationFeedback(null);
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [adminRegistrationFeedback]);

  function openReview(item: StaffTournamentRegistration) {
    setReviewModal(item);
    setReviewStatus(item.status === "withdrawn" ? "pending" : item.status);
    setReviewNote(item.review_note ?? "");
  }

  const saveMyRegistrationMutation = useMutation({
    mutationFn: async () => {
      if (isCreateMode) {
        return createMyTournamentRegistration(slug, {
          aoe2companion_url: aoeUrl,
          note: note || null,
        });
      }

      return updateMyTournamentRegistration(slug, {
        aoe2companion_url: aoeUrl,
        note: note || null,
      });
    },
    onSuccess: async () => {
      if (!isCreateMode) {
        setSelfFeedback(t("tournament.signup.feedback.selfUpdated"));
      }

      await qc.invalidateQueries({ queryKey: tournamentKeys.registrationMe(slug) });
      await qc.invalidateQueries({ queryKey: tournamentKeys.registrations(slug) });
    },
  });

  const saveAdminRegistrationMutation = useMutation({
    mutationFn: (values: {
      user_id: number;
      aoe2companion_url: string;
      note: string | null;
    }) => createTournamentRegistrationForUser(slug, values),
    onSuccess: async () => {
      setAdminRegistrationFeedback(t("tournament.signup.feedback.playerRegistrationCreated"));
      await qc.invalidateQueries({ queryKey: tournamentKeys.registrations(slug) });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: () => withdrawMyTournamentRegistration(slug),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: tournamentKeys.registrationMe(slug) });
      await qc.invalidateQueries({ queryKey: tournamentKeys.registrations(slug) });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      targetUserId,
      status,
      review_note,
    }: {
      targetUserId: number;
      status: "pending" | "approved" | "rejected";
      review_note: string | null;
    }) =>
      reviewTournamentRegistration(slug, targetUserId, {
        status,
        review_note,
      }),
    onSuccess: async () => {
      setReviewModal(null);
      setReviewNote("");
      setTableFeedback(t("tournament.signup.feedback.reviewSaved"));
      await qc.invalidateQueries({ queryKey: tournamentKeys.registrations(slug) });
      await qc.invalidateQueries({ queryKey: tournamentKeys.registrationMe(slug) });
    },
  });

  const refreshOneMutation = useMutation({
    mutationFn: (targetUserId: number) => refreshTournamentRegistration(slug, targetUserId),
    onSuccess: async (_, targetUserId) => {
      const user = registrations.find((r) => r.user_id === targetUserId);
      const userName =
        user?.user.display_name ||
        user?.user.discord_name ||
        `#${targetUserId}`;

      setTableFeedback(
        t("tournament.signup.feedback.registrationRefreshed", { userName }),
      );

      await qc.invalidateQueries({ queryKey: tournamentKeys.registrations(slug) });
    },
  });

  const refreshAllMutation = useMutation({
    mutationFn: () => refreshAllTournamentRegistrations(slug),
    onSuccess: async () => {
      setTableFeedback(t("tournament.signup.feedback.allRegistrationsRefreshed"));
      await qc.invalidateQueries({ queryKey: tournamentKeys.registrations(slug) });
    },
  });

  const settingsMutation = useMutation({
    mutationFn: () =>
      updateTournamentRegistrationSettings(slug, {
        registrations_open: settingsOpenValue,
        recent_games_days: settingsRecentDays,
      }),
    onSuccess: async () => {
      setSettingsFeedback(t("tournament.signup.feedback.settingsSaved"));
      await qc.invalidateQueries({ queryKey: tournamentKeys.context(slug) });
      await qc.invalidateQueries({ queryKey: tournamentKeys.all });
    },
  });

  return {
    tournament,
    slug,

    isSignupStage,
    registrationsOpen,
    isStaff,
    canUserAccessPage,
    isClosedForNormalUser,
    canSelfRegister,

    showSelfSection,
    showSettingsSection,
    showRegistrationsTableSection,

    aoeUrl,
    setAoeUrl,
    note,
    setNote,

    selfRegistration,
    selfCapabilities,
    selfSectionTitle,
    selfStatus,
    canReRegister,
    isCreateMode,
    isEditableForm,
    isReRegistering,
    setIsReRegistering,

    reviewModal,
    setReviewModal,
    reviewStatus,
    setReviewStatus,
    reviewNote,
    setReviewNote,
    openReview,

    detailsModal,
    setDetailsModal,

    settingsOpenValue,
    setSettingsOpenValue,
    settingsRecentDays,
    setSettingsRecentDays,

    selfFeedback,
    tableFeedback,
    settingsFeedback,
    adminRegistrationFeedback,

    registrations,
    users,

    selfRegistrationQuery,
    registrationsQuery,
    usersQuery,

    saveMyRegistrationMutation,
    saveAdminRegistrationMutation,
    withdrawMutation,
    reviewMutation,
    refreshOneMutation,
    refreshAllMutation,
    settingsMutation,
  };
}

export type SignupPageState = ReturnType<typeof useSignupPageState>;