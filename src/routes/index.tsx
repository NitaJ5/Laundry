import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  Info,
  WashingMachine,
  Wind,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LaundryIllustration } from "@/components/laundry-illustration";
import { ParticipantLogin, UsernameReminder } from "@/components/participant-login";
import { ParticipantActivity } from "@/components/participant-activity";
import {
  checkParticipant,
  logoutParticipant,
  saveParticipantReport,
} from "@/lib/participant.functions";
import type { SavedReport } from "@/lib/participant";
import {
  buildings,
  changeMachineType,
  issues,
  machines,
  otherProblem,
  validateReport,
  type MachineType,
  type ReportSelection,
} from "@/lib/laundry-report";
import { captureEvent } from "@/lib/posthog";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KIU Laundry · Report a Problem" },
      {
        name: "description",
        content:
          "Report KIU dormitory laundry problems and track your weekly campus experiment activity with username-only login.",
      },
      { property: "og:title", content: "KIU Laundry · Report a Problem" },
      {
        property: "og:description",
        content: "KIU campus laundry reporting and individual weekly experiment activity.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const emptySelection: ReportSelection = {
  building: "",
  type: "",
  machine: "",
  issue: "",
  customDescription: "",
};
function Index() {
  const [screen, setScreen] = useState<"start" | "checking" | "login" | "form" | "confirmation">(
    "start",
  );
  const queryClient = useQueryClient();
  const check = useServerFn(checkParticipant);
  const logout = useServerFn(logoutParticipant);
  const save = useServerFn(saveParticipantReport);
  const identity = useQuery({
    queryKey: ["participant"],
    queryFn: () => check(),
    retry: false,
    staleTime: 0,
  });
  const participant = identity.data ?? null;
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showUsernameReminder, setShowUsernameReminder] = useState(false);
  const [showStatisticsOnForm, setShowStatisticsOnForm] = useState(false);
  const requestId = useRef<string | null>(null);
  const [selection, setSelection] = useState<ReportSelection>(emptySelection);
  const [attempted, setAttempted] = useState(false);
  const [report, setReport] = useState<SavedReport | null>(null);
  const errors = attempted
    ? validateReport(selection)
    : { building: "", type: "", machine: "", issue: "", customDescription: "" };
  useEffect(() => {
    if (screen === "checking" && identity.isSuccess) setScreen(participant ? "form" : "login");
  }, [screen, identity.isSuccess, participant]);
  function beginReport() {
    setSaveError("");
    setScreen(identity.isSuccess ? (participant ? "form" : "login") : "checking");
  }
  function reset() {
    setSelection(emptySelection);
    setAttempted(false);
    setReport(null);
    requestId.current = null;
    setSaveError("");
    setShowUsernameReminder(false);
    setShowStatisticsOnForm(false);
    setScreen("start");
  }
  async function signOut() {
    setBusy(true);
    setSaveError("");
    try {
      await queryClient.cancelQueries();
      await logout();
      queryClient.clear();
      queryClient.setQueryData(["participant"], null);
      reset();
      setScreen("login");
    } catch {
      setSaveError("Unable to log out. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setAttempted(true);
    if (Object.values(validateReport(selection)).some(Boolean) || !selection.type) return;
    if (!participant) {
      setScreen("login");
      return;
    }
    requestId.current ??= crypto.randomUUID();
    setBusy(true);
    setSaveError("");
    try {
      const result = await save({
        data: { ...selection, type: selection.type, requestId: requestId.current },
      });

      setReport(result);

      captureEvent("student_submitted_problem_report", {
        participant_id: result.userId,
        report_id: result.id,
        building: result.building,
        machine_type: result.type,
        machine_id: result.machine,
        submitted_at: result.submittedAt,
      });

      await queryClient.invalidateQueries({ queryKey: ["participant-activity", participant.id] });
      setScreen("confirmation");
      window.scrollTo({ top: 0 });
    } catch (failure) {
      setSaveError(
        failure instanceof Error
          ? failure.message
          : "Your report could not be saved. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  function chooseType(type: MachineType) {
    setSelection(changeMachineType(selection, type));
  }
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand">
          <img src="/kiu-laundry-logo.svg" alt="KIU Laundry" className="brand-logo" />
          <span className="brand-caption">DORMITORY LIFE</span>
        </div>
        {participant ? (
          <div className="account-controls">
            <span className="account-username">{participant.username}</span>
            <Button variant="ghost" onClick={signOut} disabled={busy}>
              Log out
            </Button>
          </div>
        ) : (
          <span className="prototype-badge">
            <span />
            Campus study
          </span>
        )}
      </header>
      <main className={`report-main screen-${screen}`}>
        {saveError && (
          <p className="field-error" role="alert">
            {saveError}
          </p>
        )}
        {screen === "checking" && (
          <section className="screen-content">
            <p role="status">Checking your session…</p>
            {identity.isError && (
              <>
                <p role="alert">Unable to check your session.</p>
                <Button variant="report" size="touch" onClick={() => identity.refetch()}>
                  Try again
                </Button>
              </>
            )}
          </section>
        )}
        {screen === "login" && (
          <ParticipantLogin
            onBack={() => setScreen("start")}
            onLogin={(user) => {
              queryClient.setQueryData(["participant"], user);
              setShowUsernameReminder(true);
              setShowStatisticsOnForm(false);
              setScreen("form");
            }}
          />
        )}
        {screen === "start" && (
          <section className="screen-content" aria-labelledby="start-title">
            <div className="eyebrow">A LITTLE CARE FOR SHARED SPACES</div>
            <h1 id="start-title">Report a Problem</h1>
            <p className="intro">
              Laundry didn’t go as expected?
              <br />
              Share the problem you experienced.
            </p>
            <div className="illustration-band">
              <LaundryIllustration />
            </div>
            <Button variant="report" size="touch" className="primary-action" onClick={beginReport}>
              Report a Problem
              <ArrowRight />
            </Button>
            <div className="context-note">
              <Info size={19} />
              <p>
                Reports describe students’ experiences.
                <br />
                They are not verified machine diagnostics.
              </p>
            </div>
            <div className="simulation-note">
              <span className="note-line" />
              Campus study · No guaranteed maintenance response.
              <span className="note-line" />
            </div>
            {participant && <ParticipantActivity participant={participant} />}
          </section>
        )}
        {screen === "form" && (
          <section className="screen-content" aria-labelledby="form-title">
            <div className="form-topline">
              <Button
                variant="ghost"
                size="touch"
                className="back-action"
                onClick={() => setScreen("start")}
              >
                <ArrowLeft />
                Back
              </Button>
              <span className="step-label">REPORT DETAILS</span>
            </div>
            <h1 id="form-title">Report a Problem</h1>
            <p className="intro form-intro">What happened with your machine?</p>
            {showUsernameReminder && participant && (
              <UsernameReminder
                username={participant.username}
                onDismiss={() => setShowUsernameReminder(false)}
              />
            )}
            {participant && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="touch"
                  className="w-full mt-5"
                  aria-expanded={showStatisticsOnForm}
                  aria-controls="form-statistics"
                  onClick={() => setShowStatisticsOnForm((visible) => !visible)}
                >
                  {showStatisticsOnForm ? "Hide my statistics" : "View my statistics"}
                </Button>
                {showStatisticsOnForm && (
                  <div id="form-statistics">
                    <ParticipantActivity participant={participant} />
                  </div>
                )}
              </>
            )}
            <form onSubmit={submit} noValidate>
              <fieldset disabled={busy} className="report-fields">
                <div className="form-section">
                  <label className="field-label" htmlFor="building">
                    <span className="field-number">01</span>Building
                  </label>
                  <select
                    id="building"
                    required
                    value={selection.building}
                    aria-invalid={Boolean(errors.building)}
                    aria-describedby={errors.building ? "building-error" : undefined}
                    onChange={(e) => setSelection({ ...selection, building: e.target.value })}
                  >
                    <option value="">Select a building</option>
                    {buildings.map((building) => (
                      <option key={building} value={building}>
                        {building}
                      </option>
                    ))}
                  </select>
                  {errors.building && (
                    <p id="building-error" className="field-error" role="alert">
                      {errors.building}
                    </p>
                  )}
                </div>
                <fieldset className="form-section">
                  <legend>
                    <span className="field-number">02</span>Machine type
                  </legend>
                  <div className="type-options">
                    {(["Washer", "Dryer"] as const).map((type) => (
                      <Button
                        key={type}
                        type="button"
                        variant="choice"
                        size="touch"
                        className="type-option"
                        aria-pressed={selection.type === type}
                        onClick={() => chooseType(type)}
                      >
                        {type === "Washer" ? <WashingMachine /> : <Wind />}
                        <span>
                          {type}
                          <span className="type-abbreviation">
                            {type === "Washer" ? "WM" : "DR"}
                          </span>
                        </span>
                        {selection.type === type && <Check className="type-check" />}
                      </Button>
                    ))}
                  </div>
                  {errors.type && (
                    <p className="field-error" role="alert">
                      {errors.type}
                    </p>
                  )}
                </fieldset>
                <div className="form-section">
                  <label className="field-label" htmlFor="machine">
                    <span className="field-number">03</span>Machine
                  </label>
                  <select
                    id="machine"
                    value={selection.machine}
                    aria-invalid={Boolean(errors.machine)}
                    aria-describedby="machine-note machine-error"
                    onChange={(e) => setSelection({ ...selection, machine: e.target.value })}
                  >
                    <option value="">Select a machine</option>
                    {selection.type &&
                      machines[selection.type].map((id) => (
                        <option key={id} value={id}>
                          {id}
                        </option>
                      ))}
                  </select>
                  <p id="machine-note" className="field-help">
                    Washing machines from the left and dryers from the right.
                  </p>
                  {errors.machine && (
                    <p id="machine-error" className="field-error" role="alert">
                      {errors.machine}
                    </p>
                  )}
                </div>
                <fieldset className="form-section">
                  <legend>
                    <span className="field-number">04</span>Problem experienced
                  </legend>
                  {selection.type ? (
                    <div className="issue-options">
                      {[...issues[selection.type], otherProblem].map((issue) => (
                        <label className="issue-option" key={issue}>
                          <input
                            type="radio"
                            name="issue"
                            value={issue}
                            checked={selection.issue === issue}
                            onChange={() => setSelection({ ...selection, issue })}
                          />
                          <span>{issue}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="issue-empty">No machine type selected</p>
                  )}
                  {errors.issue && (
                    <p className="field-error" role="alert">
                      {errors.issue}
                    </p>
                  )}
                  {selection.issue === otherProblem && (
                    <div className="custom-problem">
                      <label className="field-label" htmlFor="custom-description">
                        Describe the problem
                      </label>
                      <textarea
                        id="custom-description"
                        rows={4}
                        required
                        placeholder="Describe what happened with the machine..."
                        value={selection.customDescription}
                        aria-invalid={Boolean(errors.customDescription)}
                        aria-describedby={
                          errors.customDescription ? "description-error" : undefined
                        }
                        onChange={(e) =>
                          setSelection({ ...selection, customDescription: e.target.value })
                        }
                      />
                      {errors.customDescription && (
                        <p id="description-error" className="field-error" role="alert">
                          {errors.customDescription}
                        </p>
                      )}
                    </div>
                  )}
                </fieldset>
              </fieldset>
              <Button
                variant="report"
                size="touch"
                type="submit"
                className="primary-action"
                disabled={busy}
              >
                {busy ? "Submitting…" : "Submit report"}
                <ArrowRight />
              </Button>
              <p className="form-disclaimer">Campus study — no guaranteed maintenance response.</p>
            </form>
          </section>
        )}
        {screen === "confirmation" && report && (
          <section className="screen-content confirmation" aria-labelledby="confirmation-title">
            <div className="confirmation-symbol">
              <CircleCheck size={45} strokeWidth={1.6} />
            </div>
            <div className="eyebrow">CAMPUS STUDY</div>
            <h1 id="confirmation-title">Report submitted</h1>
            <p className="intro">Your report has been saved.</p>
            <dl className="report-summary">
              <div>
                <dt>Building</dt>
                <dd>{report.building}</dd>
              </div>
              <div>
                <dt>Machine type</dt>
                <dd>{report.type}</dd>
              </div>
              <div>
                <dt>Machine</dt>
                <dd>
                  <span className="machine-tag">{report.machine}</span>
                </dd>
              </div>
              <div>
                <dt>Problem experienced</dt>
                <dd>
                  {report.issue === otherProblem ? report.customDescription.trim() : report.issue}
                </dd>
              </div>
              <div>
                <dt>Submission time</dt>
                <dd>
                  <time dateTime={report.submittedAt}>
                    {new Date(report.submittedAt).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      timeZoneName: "short",
                      timeZone: "Asia/Tbilisi",
                    })}
                  </time>
                </dd>
              </div>
            </dl>
            <div className="confirmation-notice">
              <Info size={20} />
              <p>Your report is recorded for the campus study. It does not guarantee repair.</p>
            </div>
            <Button variant="report" size="touch" className="primary-action" onClick={reset}>
              Back to start
              <ArrowRight />
            </Button>
            {participant && <ParticipantActivity participant={participant} />}
          </section>
        )}
      </main>
      <footer className="site-footer">
        <span>KIU DORMITORY</span>
        <span>Student reporting · Campus study</span>
      </footer>
    </div>
  );
}
