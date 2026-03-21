import type { MessagesShape } from "./en";

export const cs = {

  // Globals
  "common.cancel": "Zrušit",
  "common.save": "Uložit",
  "common.create": "Vytvořit",
  "common.emptyValue": "—",
  "common.pageAccessDenied": "Na tuto stránku nemáš přístup.",
  "common.note": "Poznámka",
  "common.currentStatus": "Aktuální stav",

  "collapsibletile.collapse": "Sbalit {{title}}",
  "collapsibletile.expand": "Rozbalit {{title}}",

  "userpicker.selectUser": "Vyber uživatele",
  "userpicker.noUsers": "Žádní uživatelé nenalezeni",
  "userpicker.selected": "Vybraný uživatel",
  "userpicker.noselected" : "Žádný vybraný uživatel",

  // Header
  "header.title": "CZ/SK AoE Liga",

  "language.english": "Angličtina",
  "language.czech": "Čeština",
  "language.language": "Jazyk",
  "language.switch": "Změnit jazyk",

  "auth.login": "Přihlásit se",
  "auth.logout": "Odhlásit se",
  "auth.account": "Účet",
  "auth.profile": "Profil (brzy)",

  //Landing globals
  "landing.title.tournaments": "Turnaje",
  "landing.title.rulesets": "Rulesety",
  "landing.title.admin": "Administrace",

  //Landing tournaments
  "landing.empty": "Zatím nejsou k dispozici žádné turnaje.",

  "landing.errors.loadTournaments": "Nepodařilo se načíst turnaje",
  
  "landing.archived.sectionTitle": "Archivované turnaje",
  "landing.archived.collapse": "Sbalit archivované turnaje",
  "landing.archived.expand": "Rozbalit archivované turnaje",

  "landing.tournament.actions.edit": "Upravit",
  "landing.tournament.actions.delete": "Smazat",

  "landing.deleteTournament.confirm": "Opravdu chcete tento turnaj smazat?",

  "landing.modal.fields.name.label": "Název",
  "landing.modal.fields.name.placeholder": "Sezóna 1",
  "landing.modal.fields.description.label": "Popis",
  "landing.modal.fields.description.placeholder": "Volitelný popis",
  "landing.modal.fields.ruleset.label": "Výchozí ruleset",
  "landing.modal.fields.ruleset.none": "Žádný",
  "landing.modal.fields.ruleset.view": "Zobrazit",
  "landing.modal.fields.startsAt.label": "Datum začátku",
  "landing.modal.fields.startsAt.placeholder": "RRRR-MM-DD",
  "landing.modal.fields.endsAt.label": "Datum konce",
  "landing.modal.fields.endsAt.placeholder": "RRRR-MM-DD",

  "landing.createTournament.tooltip": "Vytvořit turnaj",
  "landing.createTournament.title": "Vytvořit turnaj",
  "landing.createTournament.errors.submitFailed": "Nepodařilo se vytvořit turnaj",
  "landing.createTournament.fields.slug.label": "Slug",
  "landing.createTournament.fields.slug.placeholder": "sezona-1",
  "landing.createTournament.fields.slug.description": "Unikátní identifikátor používaný v URL",

  "landing.editTournament.title": "Upravit turnaj",
  "landing.editTournament.errors.submitFailed": "Nepodařilo se upravit turnaj",
  "landing.editTournament.fields.status.label": "Stav",

  // Landing rulesets
  "landing.createRuleset.tooltip": "Vytvořit ruleset",

  // Landing admin dashboard
  "landing.admin.users.title": "Moderace uživatelů",
  "landing.admin.users.description": "Zabanuj/odbanuj uživatele, přidej/odeber adminy",
  "landing.admin.users.error": "Nepodařilo se načíst uživatele.",
  "landing.admin.users.back": "Zpět k administraci",
  "landing.admin.users.search": "Vyhledat",
  "landing.admin.users.search.placeholder": "Vyhledej podle Discord jména nebo Přezdívky",
  "landing.admin.users.table.user": "Uživatel",
  "landing.admin.users.table.discord": "Discord",
  "landing.admin.users.table.status": "Stav",
  "landing.admin.users.table.admin": "Admin",
  "landing.admin.users.table.reason": "Důvod",
  "landing.admin.users.table.lastlogin": "Poslední přihlášení",
  "landing.admin.users.table.action": "Akce",
  "landing.admin.users.table.banned": "Zabanovaný",
  "landing.admin.users.table.active": "Aktivní",
  "landing.admin.users.table.removeadmin": "Odebrat admin práva",
  "landing.admin.users.table.addadmin": "Přidat admin práva",
  "landing.admin.users.table.unban": "Odbanovat uživatele",
  "landing.admin.users.table.ban": "Zabanovat uživatele",
  "landing.admin.users.ban.reason.title": "Důvod banu",
  "landing.admin.users.ban.reason.placeholder": "Volitelná poznámka viditelná pro adminy",

  // Tournament globals
  "tournament.status.draft": "Návrh",
  "tournament.status.signup": "Registrace",
  "tournament.status.active": "Aktivní",
  "tournament.status.completed": "Ukončený",
  "tournament.status.archived": "Archivovaný",

  "tournament.nav.dashboard": "Přehled",
  "tournament.nav.divisions": "Divize",
  "tournament.nav.schedule": "Rozpis",
  "tournament.nav.players": "Hráči",
  "tournament.nav.signup": "Registrace",
  "tournament.nav.administration": "Administrace",

  "tournament.dashboard": "Přehled",
  "tournament.loading": "Načítání...",
  "tournament.placeholder": "Ukázkový přehled turnaje.",

  // Tournament Signup page
  "tournament.signup.pageTitle": "Registrace",
  "tournament.signup.pageDescription.user": "Registruj se do {{tournament}} a spravuj svoji registraci.",
  "tournament.signup.pageDescription.staff": "Registruj se do {{tournament}} a spravuj registrace.",

  "tournament.signup.closed.message": "Registrace do tohoto turnaje jsou momentálně uzavřené.",
  "tournament.signup.closed.contact": "Pokud máš otázky ohledně registrací, kontaktuj administrátory turnaje.",

  "tournament.signup.status.pending": "Čekající",
  "tournament.signup.status.approved": "Schválená",
  "tournament.signup.status.rejected": "Zamítnutá",
  "tournament.signup.status.withdrawn": "Stažená",

  "tournament.signup.actions.signup": "Registrovat se",
  "tournament.signup.actions.saveChanges": "Uložit změny",
  "tournament.signup.actions.withdraw": "Stáhnout registraci",
  "tournament.signup.actions.registerAgain": "Registrovat se znovu",

  "tournament.signup.fields.url.label": "URL AoE2Companion profilu",
  "tournament.signup.fields.url.placeholder": "https://www.aoe2companion.com/players/2047125",
  "tournament.signup.fields.note.placeholder": "Volitelná poznámka pro organizátory",

  "tournament.signup.errors.saveFailed": "Při ukládání registrace se něco pokazilo.",
  "tournament.signup.errors.createFailed": "Při vytváření registrace se něco pokazilo.",
  "tournament.signup.errors.invalidUrl": "Zadej platnou URL AoE2Companion hráče.",
  "tournament.signup.errors.profileNotFound": "Profil na AoE2Companion nebyl nalezen.",
  "tournament.signup.errors.registrationsClosed": "Registrace jsou momentálně uzavřené.",
  "tournament.signup.errors.alreadyRegistered": "Tento hráč už je do turnaje zaregistrovaný.",

  "tournament.signup.feedback.selfUpdated": "Tvoje registrace byla upravena.",
  "tournament.signup.feedback.playerRegistrationCreated": "Registrace hráče byla vytvořena.",
  "tournament.signup.feedback.reviewSaved": "Zkontrolování registrace bylo uloženo.",
  "tournament.signup.feedback.registrationRefreshed": "Registrace uživatele {{userName}} byla aktualizována.",
  "tournament.signup.feedback.allRegistrationsRefreshed": "Všechny registrace byly aktualizovány.",
  "tournament.signup.feedback.settingsSaved": "Nastavení registrací bylo uloženo.",

  "tournament.signup.self.title.create": "Registrace",
  "tournament.signup.self.title.edit": "Tvoje registrace",
  "tournament.signup.self.subtitle.create": "Odešli svoji registraci do tohoto turnaje.",
  "tournament.signup.self.subtitle.edit": "Zobraz a spravuj svoji aktuální registraci do turnaje.",
  "tournament.signup.self.closedEdit": "Když jsou registrace uzavřené, registraci není možné upravovat.",
  "tournament.signup.self.aoeProfile": "AoE2 profil:",
  "tournament.signup.self.statusMessage.approved": "Tvoje registrace byla schválena.",
  "tournament.signup.self.statusMessage.rejected": "Tvoje registrace byla zamítnuta.",
  "tournament.signup.self.statusMessage.withdrawn": "Svoji registraci jsi stáhl.",

  "tournament.signup.admin.title": "Zaregistrovat hráče",
  "tournament.signup.admin.subtitle": "Zaregistruj hráče jeho jménem.",
  "tournament.signup.admin.registerPlayer": "Zaregistrovat hráče",

  "tournament.signup.settings.title": "Nastavení registrací",
  "tournament.signup.settings.subtitle": "Nastav dostupnost registrací do turnaje a související požadavky.",
  "tournament.signup.settings.status.open": "Otevřené",
  "tournament.signup.settings.status.closed": "Uzavřené",
  "tournament.signup.settings.chooseState": "Vyber požadovaný stav níže a potom ho ulož.",
  "tournament.signup.settings.recentGamesDays": "Počet dní pro nedávné hry",
  "tournament.signup.settings.openRegistrations": "Otevřít registrace",
  "tournament.signup.settings.closeRegistrations": "Uzavřít registrace",
  "tournament.signup.settings.selectedState": "Vybraný stav: {{state}}",
  "tournament.signup.settings.unsavedChange": "(neuložená změna)",
  "tournament.signup.settings.currentWindow": "• aktuální okno nedávných her je {{days}} dní",
  "tournament.signup.settings.save": "Uložit nastavení",

  "tournament.signup.table.title": "Registrace",
  "tournament.signup.table.subtitle": "Reviduj, aktualizuj a prohlížej registrace do turnaje.",
  "tournament.signup.table.columnsButton": "Sloupce",
  "tournament.signup.table.columnsButtonCount": "Sloupce ({{count}})",
  "tournament.signup.table.clearFilters": "Vymazat filtry",
  "tournament.signup.table.refreshAll": "Aktualizovat vše",
  "tournament.signup.table.loadFailed": "Nepodařilo se načíst registrace.",
  "tournament.signup.table.showing": "Zobrazeno {{shown}} z {{total}} registrací.",

  "tournament.signup.table.columns.user": "Uživatel",
  "tournament.signup.table.columns.aoe": "AoE2 Profil",
  "tournament.signup.table.columns.signup1v1": "Reg 1v1",
  "tournament.signup.table.columns.signupMax": "Reg max",
  "tournament.signup.table.columns.signupTeam": "Reg team",
  "tournament.signup.table.columns.signupTeamMax": "Reg team max",
  "tournament.signup.table.columns.current1v1": "1v1",
  "tournament.signup.table.columns.currentMax": "Max",
  "tournament.signup.table.columns.currentTeam": "Team",
  "tournament.signup.table.columns.currentTeamMax": "Team max",
  "tournament.signup.table.columns.games": "Hry",
  "tournament.signup.table.columns.recent": "Nedávné hry",
  "tournament.signup.table.columns.status": "Stav",
  "tournament.signup.table.columns.details": "Detail",
  "tournament.signup.table.columns.actions": "Akce",

  "tournament.signup.table.filter.aria": "Filtrovat {{label}}",
  "tournament.signup.table.filter.statusAria": "Filtrovat stav",
  "tournament.signup.table.filter.min": "Min",
  "tournament.signup.table.filter.max": "Max",

  "tournament.signup.table.tooltip.details": "Detail",
  "tournament.signup.table.tooltip.review": "Revidovat",
  "tournament.signup.table.tooltip.refresh": "Aktualizovat",

  "tournament.signup.review.title": "Revidovat registraci",
  "tournament.signup.review.approve": "Schválit",
  "tournament.signup.review.reject": "Zamítnout",
  "tournament.signup.review.note": "Poznámka z revizi",
  "tournament.signup.review.save": "Uložit revizi",

  "tournament.signup.details.title": "Detail registrace",
  "tournament.signup.details.user": "Uživatel:",
  "tournament.signup.details.discord": "Discord:",
  "tournament.signup.details.aoe": "AoE2:",
  "tournament.signup.details.note": "Poznámka:",
  "tournament.signup.details.status": "Stav:",
  "tournament.signup.details.submitted": "Odesláno:",
  "tournament.signup.details.updated": "Upraveno:",
  "tournament.signup.details.reviewedAt": "Vyhodnoceno:",
  "tournament.signup.details.reviewedBy": "Vyhodnotil:",
  "tournament.signup.details.reviewNote": "Poznámka k vyhodnocení:",

  // Tournament Admin page
  "tournament.admin.noslug": "Chybí turnajový slug.",
  "tournament.admin.description": "Spravuj administrátory, streamery a hráče pro {{name}}",
  "tournament.admin.description.fallback": "tento turnaj",

  "tournament.admin.common.remove": "Odebrat {{badge}}a z turnaje",
  
  "tournament.admin.staff.title": "Admini & Moderátoři",
  "tournament.admin.staff.description": "Přiřazuj a odebírej turnajové administrační role",
  "tournament.admin.staff.addadmin": "Přidat jako admina",
  "tournament.admin.staff.addmoderator": "Přidat jako moderátora",
  "tournament.admin.staff.save": "Uložit přiřazení role",
  "tournament.admin.staff.saveerror": "Nepodařilo se přidat admina/moderátora",
  "tournament.admin.staff.current": "Aktuální administrátoři",
  "tournament.admin.staff.nostaff": "Žádní přiřazení administrátoři.",
  "tournament.admin.staff.admin": "Admin",
  "tournament.admin.staff.moderator": "Moderátor",

  "tournament.admin.streamer.title": "Streameři",
  "tournament.admin.streamer.description": "Přiřazuj a odebírej turnajové streamery",
  "tournament.admin.streamer.addstreamer": "Přidat jako streamera",
  "tournament.admin.streamer.saveerror": "Nepodařilo se přidat streamera",
  "tournament.admin.streamer.current": "Aktuální streameři",
  "tournament.admin.streamer": "Streamer",
  "tournament.admin.streamer.nostreamers": "Žádní přiřazení streameři.",
  
} satisfies MessagesShape;