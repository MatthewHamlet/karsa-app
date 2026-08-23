alter table public.profiles
  add column if not exists phone             text,
  add column if not exists date_of_birth     date,
  add column if not exists address           text,
  add column if not exists emergency_contact text,
  add column if not exists theme             text not null default 'system',
  add column if not exists text_scale        text not null default 'medium',
  add column if not exists reduce_motion     boolean not null default false,
  add column if not exists language          text not null default 'id';

alter table public.profiles drop constraint if exists profiles_theme_check;
alter table public.profiles
  add constraint profiles_theme_check check (theme in ('system', 'light', 'dark'));

alter table public.profiles drop constraint if exists profiles_text_scale_check;
alter table public.profiles
  add constraint profiles_text_scale_check check (text_scale in ('small', 'medium', 'large'));

alter table public.profiles drop constraint if exists profiles_language_check;
alter table public.profiles
  add constraint profiles_language_check check (language in ('id', 'en'));

notify pgrst, 'reload schema';
