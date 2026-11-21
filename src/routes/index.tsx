import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, CircleCheck, Info, WashingMachine, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LaundryIllustration } from "@/components/laundry-illustration";
import { issues, machines, simulateReport, validateReport, type MachineType, type ReportSelection, type SimulatedReport } from "@/lib/laundry-report";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "KIU Laundry · Report a Problem" },
    { name: "description", content: "A three-screen KIU dormitory laundry reporting prototype. All submissions are simulations, not maintenance requests." },
    { property: "og:title", content: "KIU Laundry · Report a Problem" },
    { property: "og:description", content: "A student laundry-problem reporting prototype for usability testing." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

const emptySelection: ReportSelection = { type: "", machine: "", issue: "" };
function Index() {
  const [screen, setScreen] = useState<"start" | "form" | "confirmation">("start");
  const [selection, setSelection] = useState<ReportSelection>(emptySelection);
  const [attempted, setAttempted] = useState(false);
  const [report, setReport] = useState<SimulatedReport | null>(null);
  const errors = attempted ? validateReport(selection) : { type: "", machine: "", issue: "" };
  function reset() {
    setSelection(emptySelection);
    setAttempted(false);
    setReport(null);
    setScreen("start");
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    setAttempted(true);
    const result = simulateReport(selection);
    if (!result) return;
    setReport(result);
    setScreen("confirmation");
    window.scrollTo({ top: 0 });
  }
  function chooseType(type: MachineType) {
    setSelection({ type, machine: "", issue: "" });
  }
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand"><span className="brand-mark"><WashingMachine size={23} strokeWidth={1.8} /></span><span><strong>KIU <span className="brand-light">Laundry</span></strong><span className="brand-caption">DORMITORY LIFE</span></span></div>
        <span className="prototype-badge"><span />Prototype</span>
      </header>
      <main className={`report-main screen-${screen}`}>
        {screen === "start" && <section className="screen-content" aria-labelledby="start-title">
          <div className="eyebrow">A LITTLE CARE FOR SHARED SPACES</div>
          <h1 id="start-title">Report a Problem</h1>
          <p className="intro">Laundry didn’t go as expected?<br />Share the problem you experienced.</p>
          <div className="illustration-band"><LaundryIllustration /></div>
          <Button variant="report" size="touch" className="primary-action" onClick={() => setScreen("form")}>Report a Problem<ArrowRight /></Button>
          <div className="context-note"><Info size={19} /><p>Reports describe students’ experiences.<br />They are not verified machine diagnostics.</p></div>
          <div className="simulation-note"><span className="note-line" />A prototype only. No real maintenance requests.<span className="note-line" /></div>
        </section>}
        {screen === "form" && <section className="screen-content" aria-labelledby="form-title">
          <div className="form-topline"><Button variant="ghost" size="touch" className="back-action" onClick={() => setScreen("start")}><ArrowLeft />Back</Button><span className="step-label">REPORT DETAILS</span></div>
          <h1 id="form-title">Report a Problem</h1>
          <p className="intro form-intro">What happened with your machine?</p>
          <form onSubmit={submit} noValidate>
            <fieldset className="form-section"><legend><span className="field-number">01</span>Machine type</legend>
              <div className="type-options">{(["Washer", "Dryer"] as const).map(type => <Button key={type} type="button" variant="choice" size="touch" className="type-option" aria-pressed={selection.type === type} onClick={() => chooseType(type)}>{type === "Washer" ? <WashingMachine /> : <Wind />}{type}{selection.type === type && <Check className="type-check" />}</Button>)}</div>
              {errors.type && <p className="field-error" role="alert">{errors.type}</p>}
            </fieldset>
            <div className="form-section"><label className="field-label" htmlFor="machine"><span className="field-number">02</span>Machine</label>
              <select id="machine" value={selection.machine} aria-invalid={Boolean(errors.machine)} aria-describedby="machine-note machine-error" onChange={e => setSelection({ ...selection, machine: e.target.value })}>
                <option value="">Select a machine</option>{selection.type && machines[selection.type].map(id => <option key={id} value={id}>{id}</option>)}
              </select>
              <p id="machine-note" className="field-help">All machine IDs are simulated, prototype-only labels.</p>
              {errors.machine && <p id="machine-error" className="field-error" role="alert">{errors.machine}</p>}
            </div>
            <fieldset className="form-section"><legend><span className="field-number">03</span>Problem experienced</legend>
              {selection.type ? <div className="issue-options">{issues[selection.type].map(issue => <label className="issue-option" key={issue}><input type="radio" name="issue" value={issue} checked={selection.issue === issue} onChange={() => setSelection({ ...selection, issue })} /><span>{issue}</span></label>)}</div> : <p className="issue-empty">No machine type selected</p>}
              {errors.issue && <p className="field-error" role="alert">{errors.issue}</p>}
            </fieldset>
            <Button variant="report" size="touch" type="submit" className="primary-action">Submit report<ArrowRight /></Button>
            <p className="form-disclaimer">Prototype simulation — not a real maintenance request.</p>
          </form>
        </section>}
        {screen === "confirmation" && report && <section className="screen-content confirmation" aria-labelledby="confirmation-title">
          <div className="confirmation-symbol"><CircleCheck size={45} strokeWidth={1.6} /></div>
          <div className="eyebrow">PROTOTYPE SIMULATION</div>
          <h1 id="confirmation-title">Report submitted</h1>
          <p className="intro">Your simulated report is complete.</p>
          <dl className="report-summary"><div><dt>Machine</dt><dd>{report.type} <span className="machine-tag">{report.machine}</span></dd></div><div><dt>Problem experienced</dt><dd>{report.issue}</dd></div><div><dt>Submission time</dt><dd><time dateTime={report.submittedAt.toISOString()}>{report.submittedAt.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short" })}</time></dd></div></dl>
          <div className="confirmation-notice"><Info size={20} /><p>This is a prototype simulation, not a real maintenance request. It does not guarantee repair.</p></div>
          <Button variant="report" size="touch" className="primary-action" onClick={reset}>Back to start<ArrowRight /></Button>
        </section>}
      </main>
      <footer className="site-footer"><span>KIU DORMITORY</span><span>Student reporting · Prototype</span></footer>
    </div>
  );
}
