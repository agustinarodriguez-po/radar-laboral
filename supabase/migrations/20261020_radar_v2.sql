-- Radar Laboral 2.0 · esquema independiente, no modifica otros proyectos.
-- Migración aplicada en Supabase radar-laboral; archivada aquí para trazabilidad.
CREATE TABLE IF NOT EXISTS public.radar_job_pipeline (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
 stage text NOT NULL DEFAULT 'saved' CHECK (stage IN ('saved','reviewing','ready','applied','interview','offer','rejected','archived')),
 note text NOT NULL DEFAULT '' CHECK (char_length(note)<=1200),
 user_reported_applied_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,job_id)
);
CREATE INDEX IF NOT EXISTS radar_pipeline_stage_date ON public.radar_job_pipeline(user_id,stage,updated_at DESC);
ALTER TABLE public.radar_job_pipeline ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS radar_pipeline_owner ON public.radar_job_pipeline;
CREATE POLICY radar_pipeline_owner ON public.radar_job_pipeline FOR ALL TO authenticated
 USING (user_id=(SELECT auth.uid()) AND EXISTS(SELECT 1 FROM public.jobs j WHERE j.id=job_id AND j.user_id=(SELECT auth.uid())))
 WITH CHECK (user_id=(SELECT auth.uid()) AND EXISTS(SELECT 1 FROM public.jobs j WHERE j.id=job_id AND j.user_id=(SELECT auth.uid()) AND j.language_status='confirmed'));
REVOKE ALL ON public.radar_job_pipeline FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.radar_job_pipeline TO authenticated;

CREATE TABLE IF NOT EXISTS public.radar_automation_settings (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 preparation_enabled boolean NOT NULL DEFAULT false,
 daily_limit integer NOT NULL DEFAULT 3 CHECK (daily_limit BETWEEN 1 AND 10),
 language text NOT NULL DEFAULT 'es' CHECK (language='es'),
 individual_approval_required boolean NOT NULL DEFAULT true CHECK (individual_approval_required=true),
 auto_send_enabled boolean NOT NULL DEFAULT false CHECK (auto_send_enabled=false),
 authorized_provider_codes text[] NOT NULL DEFAULT '{}'::text[] CHECK (cardinality(authorized_provider_codes)=0),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.radar_automation_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS radar_automation_owner ON public.radar_automation_settings;
CREATE POLICY radar_automation_owner ON public.radar_automation_settings FOR ALL TO authenticated
 USING (user_id=(SELECT auth.uid()))
 WITH CHECK (user_id=(SELECT auth.uid()));
REVOKE ALL ON public.radar_automation_settings FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.radar_automation_settings TO authenticated;

-- Aprobaciones: validar usuario, CV propio, URL original, idioma español y geografía no excluida.
DROP POLICY IF EXISTS radar_approvals_owner ON public.application_approvals;
CREATE POLICY radar_approvals_owner ON public.application_approvals FOR ALL TO authenticated
 USING (user_id=(SELECT auth.uid()))
 WITH CHECK (
  user_id=(SELECT auth.uid())
  AND EXISTS(
   SELECT 1 FROM public.jobs j WHERE j.id=application_approvals.job_id
   AND j.user_id=(SELECT auth.uid()) AND j.original_url=application_approvals.original_url
   AND j.language_status='confirmed' AND j.geography_status<>'excluded'
  )
  AND EXISTS(
   SELECT 1 FROM public.cv_files c WHERE c.id=application_approvals.cv_id
   AND c.user_id=(SELECT auth.uid())
  )
 );
