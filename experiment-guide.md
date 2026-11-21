# Campus experiment implementation

## What changed
The original opening screen still comes first. Clicking **Report a Problem** checks the session and opens username sign-up/log-in only when needed. Returning participants proceed directly to the existing building, machine-type, machine and problem form. Successful reports are now saved, rather than simulated. The previous prototype had no database or stored reports to migrate; existing building and machine choices were preserved. No report-editing or machine-status interface existed, so none was replaced or added.

## Identification and persistence
Participants have a permanent UUID and a unique lowercased username. One username form creates or retrieves the same participant atomically. There are no passwords, emails, social sign-ins or identity verification. **Anyone who knows a username can enter that account.** This is identification for the controlled experiment, not secure personal authentication; do not use these accounts for sensitive personal data or administrator privileges.

Cookies contain a cryptographically random 256-bit token, marked HttpOnly, Path=/ and SameSite=Lax, Secure on HTTPS, with a 365-day lifetime. Only its SHA-256 hash is stored in the database. Session validation checks revocation and server-side expiry and renews valid sessions for another 365 days. Logout revokes the session and clears its cookie, without deleting participant or report history. The session is checked without showing the username screen until its result is known.

## Tables and access
- `participants`: UUID, normalized username and creation time.
- `participant_sessions`: participant UUID, hashed token, creation, expiration and revocation times.
- `laundry_reports`: report UUID, participant UUID, request UUID, building, machine type/identifier, issue/custom description, original server timestamp, status and optional archive time.

All three tables enable RLS with no direct browser access. Server-only functions validate the custom session hash before returning activity or creating a report. Report submission resolves participant identity inside the database transaction, never from a browser-supplied user ID. Database constraints retain the allowed machine/problem combinations. Retrying a request UUID returns its original report; a separate new report gets a new request UUID. Failed submissions create no rows. The original prototype had no duplicate-machine prevention rule.

Original identity, request ID and timestamp cannot be edited. Hard deletion is blocked by a trigger; archive with `deleted_at`/`status` instead. Editing details, repairing or archiving a machine report does not remove it from counts.

## Weekly counts
`participant_weekly_statistics` derives counts from report timestamps using PostgreSQL ISO year/week extraction after converting to `Asia/Tbilisi`. Weeks begin Monday at 00:00 Georgia time. Counts are grouped independently by participant UUID and ISO week-year; no counters are reset. `participant_activity` returns only the session participant's current-week total, all-time total and historical weeks. The student's activity section includes their UUID.

## Administrator data access
There is deliberately **no public all-participant endpoint** and no administrator privilege attached to a guessable username. Use privileged Lovable Cloud database management access to inspect `participant_weekly_statistics`, or ask Lovable to retrieve/export the weekly statistics. The restricted view includes participants with no submissions (null ISO year/week and a zero count), so they are not lost from the experiment roster.

The analysis query is:
```sql
SELECT user_id, username, iso_year, iso_week, report_count
FROM public.participant_weekly_statistics
ORDER BY username, iso_year, iso_week;
```

With an approved privileged database connection, export precisely these statistics:
```sql
COPY (
  SELECT user_id, username, iso_year, iso_week, report_count
  FROM public.participant_weekly_statistics
  ORDER BY username, iso_year, iso_week
) TO STDOUT WITH CSV HEADER;
```
Do not grant this view to anonymous or ordinary authenticated clients. It is also readable through the project's restricted database read/export tools; no student session is sufficient to retrieve everyone's data.

## Deployment
Publish the updated app to deploy the new server functions and Cloud bindings. No password/email/OAuth configuration is needed. Cookies are first-party on the published HTTPS website; use the same domain on subsequent visits. Domain changes, cleared cookies and expired/revoked sessions require username entry again. Embedded previews can block SameSite=Lax third-party cookies; open the published site directly for the campus experiment rather than weakening cookie security. Local verification does not establish production cookie persistence: test browser close/reopen on the published domain after publishing.