# Acceptance verification

## Updated form verification — 21 November 2026

Chromium checks at 523 × 876 and 1280 × 1800 passed: Building F / Dryer / D2(R) / Clothes remained wet, Building G / Washer / W6(L) / multiline custom description, empty-form validation, empty custom-description validation, machine-type resets, Back navigation, and Back to start clearing selections. Confirmations displayed the building, type, position-labelled ID, selected problem or custom text, and submission timestamp. No horizontal overflow or browser runtime errors were detected. All 18 automated tests passed; the latest preview build was OK. These changes have not been published.

## Original prototype verification

Tested on 21 November 2026 with Chromium at 390 × 844, 320 × 740, and desktop 1280 × 1800.

- Start → Report a Problem → Dryer → D2 → Clothes remained wet → Submit report reaches confirmation.
- Confirmation preserves Dryer, D2, Clothes remained wet, and a real submission timestamp displayed with seconds and time zone.
- Empty submission stays on the form and shows selection errors.
- Machine and issue start empty; choosing Dryer does not preselect D2 or an issue.
- Switching machine type clears machine and issue to prevent incompatible selections.
- Back and Back to start navigate within exactly three screens; restarting clears the simulated report.
- No horizontal overflow at either tested phone width.
- Browser reported no runtime errors; all nine automated tests passed.
- No accounts, persistence, machine statuses, report browsing, maintenance promises, or other excluded features are implemented.

No acceptance deviations found. The automated browser check initially used an incomplete accessible label for the machine selector; correcting the test selector allowed the complete flow to pass without changing application behavior.

The frozen facilitator script is not displayed in the interface. Human discovery and the 90-second usability criterion remain for participant testing; automated checks do not establish a human usability pass.

Publication requested for https://screenshot-to-scene-3966.lovable.app. Deployment completion has not been verified.