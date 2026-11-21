import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getParticipantActivity } from "@/lib/participant.functions";
import type { Participant } from "@/lib/participant";
import { Button } from "./ui/button";

export function ParticipantActivity({ participant }: { participant: Participant }) {
  const fetchActivity = useServerFn(getParticipantActivity);
  const activity = useQuery({ queryKey: ["participant-activity", participant.id], queryFn: () => fetchActivity(), staleTime: 0, refetchOnWindowFocus: true });
  return <section className="participant-activity" aria-labelledby="activity-title">
    <h2 id="activity-title">Your reporting activity</h2>
    {activity.isPending ? <p role="status">Loading activity…</p> : activity.isError ? <><p role="alert">Unable to load activity.</p><Button variant="ghost" onClick={() => activity.refetch()}>Try again</Button></> : <>
      <div className="activity-totals"><div><strong>{activity.data.currentCount}</strong><span>This week</span></div><div><strong>{activity.data.total}</strong><span>All-time reports</span></div></div>
      <details><summary>Weekly history</summary><table><thead><tr><th scope="col">ISO week</th><th scope="col">Reports</th></tr></thead><tbody>{activity.data.weeks.map(week => <tr key={`${week.iso_year}-${week.iso_week}`}><td>{week.iso_year} W{week.iso_week}</td><td>{week.report_count}</td></tr>)}</tbody></table>{activity.data.weeks.length === 0 && <p>No reports yet.</p>}</details>
    </>}
  </section>;
}