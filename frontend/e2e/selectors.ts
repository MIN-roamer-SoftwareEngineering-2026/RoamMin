/**
 * Single place to update selectors.
 *
 * The app currently ships zero data-testid attributes and is bilingual, so the
 * tests pin the UI language to English (see fixtures/auth set up) and match on
 * placeholder text / roles. When 王婧菱 adds `data-testid`s, only this file
 * needs to change.
 */
export const sel = {
  login: {
    email: 'input[type="email"]',
    password: 'input[type="password"]',
    // The login button has no type="submit" attribute, so match the form button.
    submit: "form button",
  },
  myHome: {
    createDisclosure: "details.create-disclosure > summary",
    createForm: "form.compact-create-form",
    tripName: 'form.compact-create-form input[placeholder="Trip name"]',
    // Destination is now a combobox (destination picker), not a plain
    // placeholder-based input.
    destination: 'form.compact-create-form input[role="combobox"]',
    destinationOption: '#home-destination-options [role="option"]',
    dateInputs: 'form.compact-create-form input[type="date"]',
    // The form now also has a "Use Fuzhou example itinerary" secondary button,
    // so target the primary action explicitly.
    createSubmit: "form.compact-create-form button.button-primary",
    tripCard: "article.social-item",
    joinedTab: "#tab-joined",
  },
  invite: {
    openButton: "Invite members",
    // Scope to the invite panel: the page also has a global "Find a user" input
    // with the same placeholder.
    search: '.invite-panel input[placeholder="Enter a username"]',
    resultRow: ".invite-panel .search-results li",
    inviteButton: "Invite",
    memberList: ".invite-panel .member-list",
  },
} as const;
