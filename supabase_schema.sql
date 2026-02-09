-- Create table for message templates
create table if not exists public.internal_message_templates (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  content text not null,
  is_public boolean default true,
  created_by uuid references auth.users(id) default auth.uid()
);

-- Set up Row Level Security (RLS)
alter table public.internal_message_templates enable row level security;

-- Create policies
create policy "Templates are viewable by everyone"
  on public.internal_message_templates for select
  using (true);

create policy "Users can insert their own templates"
  on public.internal_message_templates for insert
  with check (auth.uid() = created_by);

create policy "Users can update their own templates"
  on public.internal_message_templates for update
  using (auth.uid() = created_by);

create policy "Users can delete their own templates"
  on public.internal_message_templates for delete
  using (auth.uid() = created_by);
