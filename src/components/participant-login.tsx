import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Copy, UserRound } from "lucide-react";
import { Button } from "./ui/button";
import { loginParticipant } from "@/lib/participant.functions";
import { usernameSchema, type Participant } from "@/lib/participant";

export function ParticipantLogin({ onLogin, onBack }: { onLogin: (participant: Participant) => void; onBack: () => void }) {
  const login = useServerFn(loginParticipant);
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = usernameSchema.safeParse(username);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Enter a username."); return; }
    setBusy(true); setError("");
    try { onLogin(await login({ data: { username: parsed.data } })); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Unable to log in. Please try again."); }
    finally { setBusy(false); }
  }
  return <section className="screen-content" aria-labelledby="login-title">
    <div className="form-topline"><Button variant="ghost" size="touch" className="back-action" onClick={onBack} disabled={busy}><ArrowLeft />Back</Button><span className="step-label">YOUR ACCOUNT</span></div>
    <div className="login-symbol"><UserRound size={30} strokeWidth={1.6} /></div>
    <h1 id="login-title">Sign up or log in</h1>
    <p className="login-guidance">New here? Choose a username. Already submitted a report? Enter the same username to see your previous activity.</p>
    <form onSubmit={submit} noValidate>
      <div className="form-section"><label className="field-label" htmlFor="username">Username</label>
        <input className="username-input" id="username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={40} value={username} onChange={event => setUsername(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? "login-error" : undefined} disabled={busy} />
        {error && <p className="field-error" id="login-error" role="alert">{error}</p>}
      </div>
      <Button variant="report" size="touch" className="primary-action" disabled={busy} type="submit">{busy ? "Logging in…" : "Continue"}<ArrowRight /></Button>
    </form>
  </section>;
}
export function UsernameReminder({ username, onDismiss }: { username: string; onDismiss: () => void }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copyUsername() {
    try {
      await navigator.clipboard.writeText(username);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  return <aside className="username-reminder" aria-label="Save your username">
    <h2>Save your username</h2>
    <p>Use this same username next time to keep your reports together. Save it somewhere private.</p>
    <span className="username-reminder-value">{username}</span>
    <div className="username-reminder-actions">
      <Button type="button" size="sm" variant="outline" onClick={copyUsername}><Copy />{copyStatus === "copied" ? "Copied" : "Copy username"}</Button>
      <Button type="button" size="sm" variant="ghost" onClick={onDismiss}>Got it</Button>
    </div>
    {copyStatus === "copied" && <p className="username-reminder-status" role="status">Username copied.</p>}
    {copyStatus === "failed" && <p className="username-reminder-status" role="alert">Copy isn't available here. You can select the username above and copy it manually.</p>}
  </aside>;
}
