alter table public.assistant_threads
  alter column patient_id drop not null;

notify pgrst, 'reload schema';
