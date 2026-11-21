CREATE TABLE public.participants (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 username text NOT NULL UNIQUE CHECK (username = lower(btrim(username)) AND char_length(username) BETWEEN 1 AND 40 AND username ~ '^[[:alnum:]_.-]+$'),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.participants TO service_role;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.participant_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.participants(id),
 session_token_hash text NOT NULL UNIQUE CHECK (session_token_hash ~ '^[a-f0-9]{64}$'),
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT (now() + interval '365 days'),
 revoked_at timestamptz
);
GRANT ALL ON public.participant_sessions TO service_role;
ALTER TABLE public.participant_sessions ENABLE ROW LEVEL SECURITY;
CREATE INDEX participant_sessions_user_idx ON public.participant_sessions(user_id);
CREATE TABLE public.laundry_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.participants(id),
 request_id uuid NOT NULL,
 building text NOT NULL CHECK (building IN ('Building F','Building E','Building G')),
 machine_type text NOT NULL CHECK (machine_type IN ('Washer','Dryer')),
 machine_id text NOT NULL,
 issue text NOT NULL,
 custom_description text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 status text NOT NULL DEFAULT 'reported' CHECK (status IN ('reported','repaired','archived')),
 deleted_at timestamptz,
 UNIQUE(user_id, request_id),
 CHECK ((machine_type = 'Washer' AND machine_id IN ('W1(L)','W2(L)','W3(L)','W4(L)','W5(L)','W6(L)')) OR (machine_type = 'Dryer' AND machine_id IN ('D1(R)','D2(R)','D3(R)','D4(R)','D5(R)','D6(R)','D7(R)'))),
 CHECK ((machine_type = 'Washer' AND issue IN ('Did not drain/spin correctly','Detergent foam remained')) OR (machine_type = 'Dryer' AND issue IN ('Clothes remained wet','Stopped unexpectedly')) OR (issue = 'Other problem (describe it yourself)' AND char_length(btrim(custom_description)) BETWEEN 1 AND 4000))
);
GRANT SELECT, INSERT, UPDATE ON public.laundry_reports TO service_role;
ALTER TABLE public.laundry_reports ENABLE ROW LEVEL SECURITY;
CREATE INDEX laundry_reports_user_time_idx ON public.laundry_reports(user_id, created_at);
CREATE FUNCTION public.protect_report_history() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Archive reports instead of deleting historical submissions'; END IF;
 IF TG_OP = 'INSERT' THEN NEW.created_at := clock_timestamp();
 ELSIF NEW.id IS DISTINCT FROM OLD.id OR NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.created_at IS DISTINCT FROM OLD.created_at OR NEW.request_id IS DISTINCT FROM OLD.request_id THEN RAISE EXCEPTION 'Original submission identity and timestamp are immutable'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER preserve_report_history BEFORE INSERT OR UPDATE OR DELETE ON public.laundry_reports FOR EACH ROW EXECUTE FUNCTION public.protect_report_history();
CREATE VIEW public.participant_weekly_statistics WITH (security_invoker = true) AS
SELECT p.id AS user_id, p.username,
 extract(isoyear FROM r.created_at AT TIME ZONE 'Asia/Tbilisi')::int AS iso_year,
 extract(week FROM r.created_at AT TIME ZONE 'Asia/Tbilisi')::int AS iso_week,
 count(r.id)::int AS report_count
FROM public.participants p LEFT JOIN public.laundry_reports r ON r.user_id = p.id
GROUP BY p.id, p.username, iso_year, iso_week;
REVOKE ALL ON public.participant_weekly_statistics FROM anon, authenticated;
GRANT SELECT ON public.participant_weekly_statistics TO service_role;
CREATE FUNCTION public.participant_login(p_username text, p_hash text) RETURNS jsonb LANGUAGE plpgsql SET search_path = public AS $$
DECLARE participant public.participants;
BEGIN
 INSERT INTO public.participants(username) VALUES (lower(btrim(p_username))) ON CONFLICT (username) DO UPDATE SET username = excluded.username RETURNING * INTO participant;
 INSERT INTO public.participant_sessions(user_id, session_token_hash) VALUES(participant.id, p_hash);
 RETURN jsonb_build_object('id', participant.id, 'username', participant.username);
END; $$;
REVOKE ALL ON FUNCTION public.participant_login(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.participant_login(text,text) TO service_role;
CREATE FUNCTION public.participant_identity(p_hash text) RETURNS jsonb LANGUAGE plpgsql SET search_path = public AS $$
DECLARE participant public.participants; session_id uuid;
BEGIN
 SELECT p.*, s.id INTO participant.id, participant.username, participant.created_at, session_id FROM public.participant_sessions s JOIN public.participants p ON p.id = s.user_id WHERE s.session_token_hash = p_hash AND s.revoked_at IS NULL AND s.expires_at > now() FOR UPDATE OF s;
 IF session_id IS NULL THEN RETURN NULL; END IF;
 UPDATE public.participant_sessions SET expires_at = now() + interval '365 days' WHERE id = session_id;
 RETURN jsonb_build_object('id', participant.id, 'username', participant.username);
END; $$;
REVOKE ALL ON FUNCTION public.participant_identity(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.participant_identity(text) TO service_role;
CREATE FUNCTION public.submit_participant_report(p_hash text,p_request_id uuid,p_building text,p_type text,p_machine text,p_issue text,p_description text) RETURNS jsonb LANGUAGE plpgsql SET search_path = public AS $$
DECLARE participant_id uuid; result public.laundry_reports;
BEGIN
 SELECT s.user_id INTO participant_id FROM public.participant_sessions s WHERE s.session_token_hash = p_hash AND s.revoked_at IS NULL AND s.expires_at > now() FOR UPDATE;
 IF participant_id IS NULL THEN RAISE EXCEPTION 'Session expired'; END IF;
 INSERT INTO public.laundry_reports(user_id,request_id,building,machine_type,machine_id,issue,custom_description) VALUES(participant_id,p_request_id,p_building,p_type,p_machine,p_issue,p_description) ON CONFLICT(user_id,request_id) DO NOTHING RETURNING * INTO result;
 IF result.id IS NULL THEN SELECT * INTO result FROM public.laundry_reports WHERE user_id = participant_id AND request_id = p_request_id; END IF;
 RETURN to_jsonb(result);
END; $$;
REVOKE ALL ON FUNCTION public.submit_participant_report(text,uuid,text,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_participant_report(text,uuid,text,text,text,text,text) TO service_role;
CREATE FUNCTION public.participant_activity(p_hash text) RETURNS jsonb LANGUAGE plpgsql SET search_path = public AS $$
DECLARE participant_id uuid; result jsonb;
BEGIN
 SELECT s.user_id INTO participant_id FROM public.participant_sessions s WHERE s.session_token_hash = p_hash AND s.revoked_at IS NULL AND s.expires_at > now();
 IF participant_id IS NULL THEN RAISE EXCEPTION 'Session expired'; END IF;
 SELECT jsonb_build_object('currentWeek',extract(week FROM now() AT TIME ZONE 'Asia/Tbilisi')::int,'currentYear',extract(isoyear FROM now() AT TIME ZONE 'Asia/Tbilisi')::int,'currentCount',coalesce(sum(report_count) FILTER (WHERE iso_year = extract(isoyear FROM now() AT TIME ZONE 'Asia/Tbilisi') AND iso_week = extract(week FROM now() AT TIME ZONE 'Asia/Tbilisi')),0),'total',coalesce(sum(report_count),0),'weeks',coalesce(jsonb_agg(jsonb_build_object('iso_year',iso_year,'iso_week',iso_week,'report_count',report_count) ORDER BY iso_year DESC,iso_week DESC) FILTER (WHERE iso_year IS NOT NULL),'[]'::jsonb)) INTO result FROM public.participant_weekly_statistics WHERE user_id = participant_id;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.participant_activity(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.participant_activity(text) TO service_role;