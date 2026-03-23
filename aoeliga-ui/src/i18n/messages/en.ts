export const en = {
  
  // Globals
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.create": "Create",
  "common.emptyValue": "—",
  "common.pageAccessDenied": "You have no access to this page.",
  "common.note": "Note",
  "common.currentStatus": "Current status",
  
  "collapsibletile.collapse": "Collapse {{title}}",
  "collapsibletile.expand": "Expand {{title}}",

  "userpicker.selectUser": "Select user",
  "userpicker.noUsers":"No users found",  
  "userpicker.selected": "Selected user",
  "userpicker.noselected" : "No user selected",

  // Header
  "header.title": "CZ/SK AoE Liga", 
  
  "language.english": "English",
  "language.czech": "Czech",
  "language.language": "Language",
  "language.switch": "Switch language",

  "auth.login": "Log in",
  "auth.logout": "Log out",
  "auth.account": "Account",
  "auth.profile": "Profile (soon)",

  // Landing globals
  "landing.title.tournaments": "Tournaments",
  "landing.title.rulesets": "Rulesets",
  "landing.title.admin": "Administration",
  
  // Landing tournaments
  "landing.empty": "No tournaments available yet.",
  
  "landing.errors.loadTournaments": "Error loading tournaments",
  
  "landing.archived.sectionTitle": "Archived tournaments",
  "landing.archived.collapse": "Collapse archived tournaments",
  "landing.archived.expand": "Expand archived tournaments",
  
  "landing.tournament.actions.edit": "Edit",
  "landing.tournament.actions.delete": "Delete",
  
  "landing.deleteTournament.confirm": "Are you sure you want to delete this tournament?",
  
  "landing.modal.fields.name.label": "Name",
  "landing.modal.fields.name.placeholder": "Season 1",
  "landing.modal.fields.description.label": "Description",
  "landing.modal.fields.description.placeholder": "Optional description",
  "landing.modal.fields.ruleset.label": "Default ruleset",
  "landing.modal.fields.ruleset.none": "None",
  "landing.modal.fields.ruleset.view": "View",
  "landing.modal.fields.startsAt.label": "Start date",
  "landing.modal.fields.startsAt.placeholder": "YYYY-MM-DD",
  "landing.modal.fields.endsAt.label": "End date",
  "landing.modal.fields.endsAt.placeholder": "YYYY-MM-DD",
  
  "landing.createTournament.tooltip": "Create tournament",
  "landing.createTournament.title": "Create tournament",
  "landing.createTournament.errors.submitFailed": "Failed to create tournament",
  "landing.createTournament.fields.slug.label": "Slug",
  "landing.createTournament.fields.slug.placeholder": "season-1",
  "landing.createTournament.fields.slug.description": "Unique identifier used in URLs",

  "landing.editTournament.title": "Edit tournament",
  "landing.editTournament.errors.submitFailed": "Failed to update tournament",

  "landing.editTournament.fields.status.label": "Status",

  // Landing rulesets
  "landing.createRuleset.tooltip": "Create ruleset",

  // Landing admin dashboard
  "landing.admin.users.title": "User moderation",
  "landing.admin.users.description": "Ban or unban users, add or remove admins",
  "landing.admin.users.error": "Failed to load users.",
  "landing.admin.users.back": "Back to administration",
  "landing.admin.users.search": "Search",
  "landing.admin.users.search.placeholder": "Search by Discord or Display name",
  "landing.admin.users.table.user": "User",
  "landing.admin.users.table.discord": "Discord",
  "landing.admin.users.table.status": "Status",
  "landing.admin.users.table.admin": "Admin",
  "landing.admin.users.table.reason": "Reason",
  "landing.admin.users.table.lastlogin": "Last login",
  "landing.admin.users.table.action": "Action",
  "landing.admin.users.table.banned": "Banned",
  "landing.admin.users.table.active": "Active",
  "landing.admin.users.table.removeadmin": "Remove admin privileges",
  "landing.admin.users.table.addadmin": "Add admin privileges",
  "landing.admin.users.table.unban": "Unban user",
  "landing.admin.users.table.ban": "Ban user",
  "landing.admin.users.ban.reason.title": "Ban reason",
  "landing.admin.users.ban.reason.placeholder": "Optional note shown to admins",

  // Tournament globals
  "tournament.status.draft": "Draft",
  "tournament.status.signup": "Signup",
  "tournament.status.active": "Active",
  "tournament.status.completed": "Completed",
  "tournament.status.archived": "Archived",

  "tournament.nav.dashboard": "Dashboard",
  "tournament.nav.divisions": "Divisions",
  "tournament.nav.schedule": "Schedule",
  "tournament.nav.players": "Players",
  "tournament.nav.signup": "Signup",
  "tournament.nav.administration": "Administration",

  "tournament.dashboard": "Dashboard",
  "tournament.loading": "Loading...",
  "tournament.placeholder": "Tournament dashboard placeholder.",
  
  // Tournament Signup page
  "tournament.signup.pageTitle": "Signup",
  "tournament.signup.pageDescription.user": "Sign up for {{tournament}} and manage your registration.",
  "tournament.signup.pageDescription.staff": "Sign up for {{tournament}} and manage registrations.",

  "tournament.signup.closed.message": "Registrations for this tournament are currently closed.",
  "tournament.signup.closed.contact": "Contact tournament administrators if you have any questions about signups.",

  "tournament.signup.status.pending": "Pending",
  "tournament.signup.status.approved": "Approved",
  "tournament.signup.status.rejected": "Rejected",
  "tournament.signup.status.withdrawn": "Withdrawn",

  "tournament.signup.actions.signup": "Sign up",
  "tournament.signup.actions.saveChanges": "Save changes",
  "tournament.signup.actions.withdraw": "Withdraw",
  "tournament.signup.actions.registerAgain": "Sign up again",

  "tournament.signup.fields.url.label": "AoE2Companion profile URL",
  "tournament.signup.fields.url.placeholder": "https://www.aoe2companion.com/players/2047125",
  "tournament.signup.fields.note.placeholder": "Optional note for tournament staff",

  "tournament.signup.errors.saveFailed": "Something went wrong while saving the registration.",
  "tournament.signup.errors.createFailed": "Something went wrong while creating the registration.",
  "tournament.signup.errors.invalidUrl": "Enter a valid AoE2Companion player URL.",
  "tournament.signup.errors.profileNotFound": "The AoE2Companion profile could not be found.",
  "tournament.signup.errors.registrationsClosed": "Registrations are currently closed.",
  "tournament.signup.errors.alreadyRegistered": "This player is already registered for the tournament.",

  "tournament.signup.feedback.selfUpdated": "Your registration has been updated.",
  "tournament.signup.feedback.playerRegistrationCreated": "Player registration created.",
  "tournament.signup.feedback.reviewSaved": "Registration review saved.",
  "tournament.signup.feedback.registrationRefreshed": "Registration of user {{userName}} refreshed.",
  "tournament.signup.feedback.allRegistrationsRefreshed": "All registrations refreshed.",
  "tournament.signup.feedback.settingsSaved": "Registration settings saved.",

  "tournament.signup.self.title.create": "Sign up",
  "tournament.signup.self.title.edit": "Your registration",
  "tournament.signup.self.subtitle.create": "Submit your registration for this tournament.",
  "tournament.signup.self.subtitle.edit": "View and manage your current tournament registration.",
  "tournament.signup.self.closedEdit": "It is not possible to edit your registration when registrations are closed.",
  "tournament.signup.self.aoeProfile": "AoE2 profile:",
  "tournament.signup.self.statusMessage.approved": "Your registration has been approved.",
  "tournament.signup.self.statusMessage.rejected": "Your registration has been rejected.",
  "tournament.signup.self.statusMessage.withdrawn": "You have withdrawn your registration.",

  "tournament.signup.admin.title": "Sign up player",
  "tournament.signup.admin.subtitle": "Sign up a player on their behalf.",
  "tournament.signup.admin.registerPlayer": "Sign up player",

  "tournament.signup.settings.title": "Signup settings",
  "tournament.signup.settings.subtitle": "Configure tournament signup availability and requirements.",
  "tournament.signup.settings.status.open": "Open",
  "tournament.signup.settings.status.closed": "Closed",
  "tournament.signup.settings.chooseState": "Choose the desired state below, then save it.",
  "tournament.signup.settings.recentGamesDays": "Recent games days",
  "tournament.signup.settings.openRegistrations": "Open signups",
  "tournament.signup.settings.closeRegistrations": "Close signups",
  "tournament.signup.settings.selectedState": "Selected state: {{state}}",
  "tournament.signup.settings.unsavedChange": "(unsaved change)",
  "tournament.signup.settings.currentWindow": "• current recent games window {{days}} days",
  "tournament.signup.settings.save": "Save settings",

  "tournament.signup.table.title": "Registrations",
  "tournament.signup.table.subtitle": "Review, refresh and inspect tournament registrations.",
  "tournament.signup.table.columnsButton": "Columns",
  "tournament.signup.table.columnsButtonCount": "Columns ({{count}})",
  "tournament.signup.table.clearFilters": "Clear filters",
  "tournament.signup.table.refreshAll": "Refresh all",
  "tournament.signup.table.loadFailed": "Failed to load registrations.",
  "tournament.signup.table.showing": "Showing {{shown}} of {{total}} registrations.",

  "tournament.signup.table.columns.user": "User",
  "tournament.signup.table.columns.aoe": "AoE2 Profile",
  "tournament.signup.table.columns.signup1v1": "Signup 1v1",
  "tournament.signup.table.columns.signupMax": "Signup Max",
  "tournament.signup.table.columns.signupTeam": "Signup Team",
  "tournament.signup.table.columns.signupTeamMax": "Signup Team Max",
  "tournament.signup.table.columns.current1v1": "1v1",
  "tournament.signup.table.columns.currentMax": "Max",
  "tournament.signup.table.columns.currentTeam": "Team",
  "tournament.signup.table.columns.currentTeamMax": "Team Max",
  "tournament.signup.table.columns.games": "Games",
  "tournament.signup.table.columns.recent": "Recent Games",
  "tournament.signup.table.columns.status": "Status",
  "tournament.signup.table.columns.details": "Details",
  "tournament.signup.table.columns.actions": "Actions",

  "tournament.signup.table.filter.aria": "Filter {{label}}",
  "tournament.signup.table.filter.statusAria": "Filter status",
  "tournament.signup.table.filter.min": "Min",
  "tournament.signup.table.filter.max": "Max",

  "tournament.signup.table.tooltip.details": "Details",
  "tournament.signup.table.tooltip.review": "Review",
  "tournament.signup.table.tooltip.refresh": "Refresh",

  "tournament.signup.review.title": "Review registration",
  "tournament.signup.review.approve": "Approve",
  "tournament.signup.review.reject": "Reject",
  "tournament.signup.review.note": "Review note",
  "tournament.signup.review.save": "Save review",

  "tournament.signup.details.title": "Registration details",
  "tournament.signup.details.user": "User:",
  "tournament.signup.details.discord": "Discord:",
  "tournament.signup.details.aoe": "AoE2:",
  "tournament.signup.details.note": "Note:",
  "tournament.signup.details.status": "Status:",
  "tournament.signup.details.submitted": "Submitted:",
  "tournament.signup.details.updated": "Updated:",
  "tournament.signup.details.reviewedAt": "Reviewed at:",
  "tournament.signup.details.reviewedBy": "Reviewed by:",
  "tournament.signup.details.reviewNote": "Review note:",

  // Tournament Admin page
  "tournament.admin.noslug": "Tournament slug is missing.",
  "tournament.admin.description": "Manage staff and players for {{name}}",
  "tournament.admin.description.fallback": "this tournament",

  "tournament.admin.common.remove": "Remove {{badge}} from tournament",
  
  "tournament.admin.staff.title": "Admins & Moderators",
  "tournament.admin.staff.description": "Assign and remove tournament admin roles",
  "tournament.admin.staff.addadmin": "Add as admin",
  "tournament.admin.staff.addmoderator": "Add as moderator",
  "tournament.admin.staff.save": "Save role assignment",
  "tournament.admin.staff.saveerror": "Failed to add admin/moderator",
  "tournament.admin.staff.current": "Current staff",
  "tournament.admin.staff.nostaff": "No staff assigned yet.",
  "tournament.admin.staff.admin": "Admin",
  "tournament.admin.staff.moderator": "Moderator",

  "tournament.admin.streamer.title": "Streamers",
  "tournament.admin.streamer.description": "Assign and remove tournament streamers",
  "tournament.admin.streamer.addstreamer": "Add as streamer",
  "tournament.admin.streamer.saveerror": "Failed to add streamer",
  "tournament.admin.streamer.current": "Current streamers",
  "tournament.admin.streamer": "Streamer",
  "tournament.admin.streamer.nostreamers": "No streamers assigned yet",

} as const;

export type TranslationKey = keyof typeof en;
export type MessagesShape = Record<TranslationKey, string>;