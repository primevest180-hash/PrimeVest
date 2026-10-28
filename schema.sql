-- ============ EXTENSIONS ============
create extension if not exists pgcrypto;

-- ============ PROFILES ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  phone text,
  avatar_url text,
  referral_code text unique,
  referred_by uuid references public.profiles(id),
  role text default 'user',
  created_at timestamptz default now()
);

-- ============ WALLETS ============
create table if not exists public.wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  available numeric default 0,
  invested numeric default 0,
  earnings numeric default 0,
  total numeric generated always as (available + invested + earnings) stored,
  updated_at timestamptz default now()
);

-- ============ TRANSACTIONS ============
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null,
  amount numeric not null,
  status text default 'pending',
  reference text unique,
  meta jsonb default '{}',
  created_at timestamptz default now()
);

-- ============ PLANS ============
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text,
  risk text,
  min_amount numeric default 7500,
  expected_return numeric default 0,
  active boolean default true
);

insert into public.plans (name, type, risk, min_amount, expected_return) values
('Growth Portfolio','Stocks & ETFs','Moderate',7500,14.2),
('Income Portfolio','Bonds & Dividends','Low',7500,8.7),
('Real Estate','REITs','Moderate',7500,11.9),
('Crypto Index','Digital Assets','High',7500,18.5)
on conflict do nothing;

-- ============ INVESTMENTS ============
create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  plan_id uuid references public.plans(id),
  amount numeric not null,
  growth numeric default 0,
  status text default 'active',
  started_at timestamptz default now()
);

-- ============ WITHDRAWALS ============
create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  amount numeric not null,
  bank_name text,
  bank_code text,
  account_number text,
  account_name text,
  status text default 'pending',
  reference text unique,
  created_at timestamptz default now()
);

-- ============ REFERRALS ============
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid references public.profiles(id),
  referred_id uuid references public.profiles(id),
  reward numeric default 1000,
  status text default 'pending',
  created_at timestamptz default now()
);

-- ============ NOTIFICATIONS ============
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text,
  message text,
  type text default 'info',
  read boolean default false,
  created_at timestamptz default now()
);

-- ============ PUSH SUBSCRIPTIONS ============
create table if not exists public.push_subs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  endpoint text,
  keys jsonb,
  created_at timestamptz default now()
);

-- ============ AUTO PROFILE + WALLET ON SIGNUP ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  new_code text;
  ref_id uuid;
begin
  new_code := 'PV' || substr(md5(random()::text), 1, 8);

  -- referral code applied if provided
  if new.raw_user_meta_data->>'ref' is not null and new.raw_user_meta_data->>'ref' <> '' then
    select id into ref_id from public.profiles where referral_code = new.raw_user_meta_data->>'ref' limit 1;
  end if;

  insert into public.profiles (id, name, email, referral_code, referred_by)
  values (new.id, new.raw_user_meta_data->>'name', new.email, new_code, ref_id);

  insert into public.wallets (user_id) values (new.id);

  if ref_id is not null then
    insert into public.referrals (referrer_id, referred_id)
    values (ref_id, new.id);
  end if;

  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============ RLS ============
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.transactions enable row level security;
alter table public.investments enable row level security;
alter table public.withdrawals enable row level security;
alter table public.referrals enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subs enable row level security;
alter table public.plans enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all using (auth.uid() = id);

drop policy if exists "own wallet" on public.wallets;
create policy "own wallet" on public.wallets for select using (auth.uid() = user_id);

drop policy if exists "own txns" on public.transactions;
create policy "own txns" on public.transactions for select using (auth.uid() = user_id);

drop policy if exists "own invests" on public.investments;
create policy "own invests" on public.investments for select using (auth.uid() = user_id);

drop policy if exists "own withdrawals" on public.withdrawals;
create policy "own withdrawals" on public.withdrawals for all using (auth.uid() = user_id);

drop policy if exists "own referrals" on public.referrals;
create policy "own referrals" on public.referrals for select using (auth.uid() = referrer_id or auth.uid() = referred_id);

drop policy if exists "own notifs" on public.notifications;
create policy "own notifs" on public.notifications for all using (auth.uid() = user_id);

drop policy if exists "own push" on public.push_subs;
create policy "own push" on public.push_subs for all using (auth.uid() = user_id);

drop policy if exists "plans public read" on public.plans;
create policy "plans public read" on public.plans for select using (true);