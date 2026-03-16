export const en = {
  "common.cancel": "Cancel",
  "common.emptyValue": "—",

  "header.title": "CZ/SK AoE Liga", 
  
  "language.english": "English",
  "language.czech": "Czech",
  "language.language": "Language",
  "language.switch": "Switch language",

  "auth.login": "Log in",
  "auth.logout": "Log out",
  "auth.account": "Account",
  "auth.profile": "Profile (soon)",

  "landing.title.tournaments": "Tournaments",
  "landing.title.rulesets": "Rulesets",
  "landing.title.admin": "Administration",
  "landing.empty": "No tournaments available yet.",
  
  "landing.errors.loadTournaments": "Error loading tournaments",
  
  "landing.archived.sectionTitle": "Archived tournaments",
  
  "landing.tournament.actions.edit": "Edit",
  "landing.tournament.actions.delete": "Delete",
  
  "landing.deleteTournament.confirm": "Are you sure you want to delete this tournament?",
  
  "landing.createTournament.tooltip": "Create tournament",
  "landing.createTournament.title": "Create tournament",
  "landing.createTournament.actions.create": "Create",
  "landing.createTournament.errors.submitFailed": "Failed to create tournament",
  "landing.createTournament.fields.slug.label": "Slug",
  "landing.createTournament.fields.slug.placeholder": "season-1",
  "landing.createTournament.fields.slug.description": "Unique identifier used in URLs",
  "landing.createTournament.fields.name.label": "Name",
  "landing.createTournament.fields.name.placeholder": "Season 1",
  "landing.createTournament.fields.description.label": "Description",
  "landing.createTournament.fields.description.placeholder": "Optional description",
  "landing.createTournament.fields.ruleset.label": "Default ruleset",
  "landing.createTournament.fields.ruleset.placeholder": "None",
  "landing.createTournament.fields.ruleset.view": "View",
  "landing.createTournament.fields.startsAt.label": "Start date",
  "landing.createTournament.fields.startsAt.placeholder": "YYYY-MM-DD",
  "landing.createTournament.fields.endsAt.label": "End date",
  "landing.createTournament.fields.endsAt.placeholder": "YYYY-MM-DD",

  "landing.editTournament.title": "Edit tournament",
  "landing.editTournament.actions.save": "Save",
  "landing.editTournament.errors.submitFailed": "Failed to update tournament",

  "landing.editTournament.fields.name.label": "Name",
  "landing.editTournament.fields.name.placeholder": "Season 1",
  "landing.editTournament.fields.description.label": "Description",
  "landing.editTournament.fields.description.placeholder": "Optional description",
  "landing.editTournament.fields.status.label": "Status",
  "landing.editTournament.fields.ruleset.label": "Default ruleset",
  "landing.editTournament.fields.ruleset.placeholder": "Select ruleset",
  "landing.editTournament.fields.ruleset.none": "None",
  "landing.editTournament.fields.ruleset.view": "View",
  "landing.editTournament.fields.startsAt.label": "Start date",
  "landing.editTournament.fields.startsAt.placeholder": "YYYY-MM-DD",
  "landing.editTournament.fields.endsAt.label": "End date",
  "landing.editTournament.fields.endsAt.placeholder": "YYYY-MM-DD",

  "landing.createRuleset.tooltip": "Create ruleset",

  "nav.dashboard": "Dashboard",
  "nav.divisions": "Divisions",
  "nav.schedule": "Schedule",
  "nav.players": "Players",
  "nav.administration": "Administration",

  "tournament.dashboard": "Dashboard",
  "tournament.loading": "Loading...",
  "tournament.placeholder": "Tournament dashboard placeholder.",

  "tournament.status.draft": "Draft",
  "tournament.status.signup": "Signup",
  "tournament.status.active": "Active",
  "tournament.status.completed": "Completed",
  "tournament.status.archived": "Archived",

} as const;

export type TranslationKey = keyof typeof en;
export type MessagesShape = Record<TranslationKey, string>;