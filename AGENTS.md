<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Keep the opening, username entry, report form, and confirmation as index-route UI states; report records are durable while navigation remains unchanged.
- Keep building and machine options, machine-type resets, and predefined/custom problem validation in the browser-safe laundry-report module; the server submission schema reuses those rules.
- Define visual styles and semantic color tokens in src/styles.css; shared Button variants supply accessible touch controls.
- Custom experiment participants use server-validated hashed cookie sessions, not Cloud Auth; all participant tables and RPCs deny browser roles, and privileged access is confined to session-scoped server functions.
- Derive weekly counts in SQL from immutable original report timestamps; database triggers prevent history loss and request UUIDs make retries idempotent.
- Provide all-participant analysis through a service-only SQL view and privileged Cloud access, never through username-gated admin endpoints.
