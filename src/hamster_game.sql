-- PrimeVest Hamster Arena: isolated virtual game economy.
-- Run this entire script in Supabase SQL Editor.
-- These coins are NOT wallet funds and cannot be withdrawn.

create table if not exists public.hamster_game (
  user_id uuid primary key references auth.users(id) on delete cascade,
  coins bigint not null default 0 check (coins >= 0),
  energy integer not null default 1000 check (energy >= 0),
  max_energy integer not null default 1000,
  tap_power integer not null default 1,
  profit_per_hour bigint not null default 0,
  last_energy_at timestamptz not null default now(),
  last_profit_at timestamptz not null default now(),
  daily_streak integer not null default 0,
  last_daily_claim date,
  turbo_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hamster_daily_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  game_day date not null default current_date,
  taps integer not null default 0,
  upgrades integer not null default 0,
  boosts integer not null default 0,
  combo_attempted boolean not null default false,
  combo_claimed boolean not null default false,
  claimed_tasks text[] not null default '{}',
  primary key (user_id, game_day)
);

alter table public.hamster_game enable row level security;
alter table public.hamster_daily_progress enable row level security;
drop policy if exists "Users can read own hamster game" on public.hamster_game;
create policy "Users can read own hamster game" on public.hamster_game
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can read own hamster progress" on public.hamster_daily_progress;
create policy "Users can read own hamster progress" on public.hamster_daily_progress
  for select to authenticated using (auth.uid() = user_id);
revoke insert, update, delete on public.hamster_game from anon, authenticated;
revoke insert, update, delete on public.hamster_daily_progress from anon, authenticated;
grant select on public.hamster_game, public.hamster_daily_progress to authenticated;

create or replace function public.hamster_ensure_state()
returns public.hamster_game
language plpgsql security definer set search_path = public
as $$
declare s public.hamster_game;
begin
  if auth.uid() is null then raise exception 'Please log in.'; end if;
  insert into public.hamster_game(user_id) values (auth.uid())
  on conflict (user_id) do nothing;
  insert into public.hamster_daily_progress(user_id, game_day) values (auth.uid(), current_date)
  on conflict (user_id, game_day) do nothing;
  select * into s from public.hamster_game where user_id = auth.uid() for update;

  -- Regenerate energy at 1 point/second and cap offline profit at 3 hours.
  update public.hamster_game
  set energy = least(max_energy, energy + greatest(0, floor(extract(epoch from (now() - last_energy_at)))::int)),
      last_energy_at = now(),
      coins = coins + least(3::bigint * profit_per_hour,
        greatest(0::bigint, floor(extract(epoch from (now() - last_profit_at)) / 3600)::bigint) * profit_per_hour),
      last_profit_at = now(),
      updated_at = now()
  where user_id = auth.uid();
  select * into s from public.hamster_game where user_id = auth.uid();
  return s;
end;
$$;

create or replace function public.hamster_get_state()
returns jsonb language plpgsql security definer set search_path = public
as $$
declare s public.hamster_game; p public.hamster_daily_progress; tasks jsonb;
declare combo integer;
begin
  s := public.hamster_ensure_state();
  select * into p from public.hamster_daily_progress where user_id = auth.uid() and game_day = current_date;
  tasks := jsonb_build_object(
    'tap_100', jsonb_build_object('ready', p.taps >= 100, 'claimed', 'tap_100' = any(p.claimed_tasks)),
    'upgrade_once', jsonb_build_object('ready', p.upgrades >= 1, 'claimed', 'upgrade_once' = any(p.claimed_tasks)),
    'boost_once', jsonb_build_object('ready', p.boosts >= 1, 'claimed', 'boost_once' = any(p.claimed_tasks))
  );
  combo := 100 + ((current_date - date '2025-01-01') % 900);
  return jsonb_build_object(
    'coins', s.coins, 'energy', s.energy, 'max_energy', s.max_energy,
    'tap_power', s.tap_power, 'profit_per_hour', s.profit_per_hour,
    'daily_streak', s.daily_streak, 'last_daily_claim', s.last_daily_claim,
    'today', current_date, 'turbo_until', s.turbo_until,
    'league', case when s.coins >= 1000000 then 'Diamond' when s.coins >= 250000 then 'Gold' when s.coins >= 50000 then 'Silver' else 'Bronze' end,
    'tap_upgrade_cost', 100 * power(2, greatest(0, s.tap_power - 1))::bigint,
    'energy_upgrade_cost', 1000 * greatest(1, (s.max_energy / 500))::bigint,
    'profit_upgrade_cost', 2500 * greatest(1, (s.profit_per_hour / 100 + 1))::bigint,
    'tasks', tasks, 'combo_claimed', p.combo_claimed
  );
end;
$$;

create or replace function public.hamster_tap(p_count integer default 1)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare s public.hamster_game; n integer; earned bigint;
begin
  s := public.hamster_ensure_state();
  n := least(10, greatest(1, coalesce(p_count, 1)));
  n := least(n, s.energy);
  if n <= 0 then return jsonb_build_object('error', 'No energy. Wait for it to regenerate.'); end if;
  earned := n * s.tap_power * case when s.turbo_until > now() then 2 else 1 end;
  update public.hamster_game set energy = energy - n, coins = coins + earned, updated_at = now()
    where user_id = auth.uid();
  update public.hamster_daily_progress set taps = taps + n
    where user_id = auth.uid() and game_day = current_date;
  return jsonb_build_object('message', '+' || earned || ' game coins earned.');
end;
$$;

create or replace function public.hamster_upgrade(p_kind text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare s public.hamster_game; cost bigint;
begin
  s := public.hamster_ensure_state();
  if p_kind = 'tap' then cost := 100 * power(2, greatest(0, s.tap_power - 1))::bigint;
  elsif p_kind = 'energy' then cost := 1000 * greatest(1, (s.max_energy / 500))::bigint;
  elsif p_kind = 'profit' then cost := 2500 * greatest(1, (s.profit_per_hour / 100 + 1))::bigint;
  else return jsonb_build_object('error', 'Unknown upgrade.'); end if;
  if s.coins < cost then return jsonb_build_object('error', 'Not enough game coins.'); end if;
  if p_kind = 'tap' then update public.hamster_game set coins = coins-cost, tap_power = tap_power+1 where user_id=auth.uid();
  elsif p_kind = 'energy' then update public.hamster_game set coins = coins-cost, max_energy = max_energy+500, energy = least(max_energy+500, energy+500) where user_id=auth.uid();
  else update public.hamster_game set coins = coins-cost, profit_per_hour = profit_per_hour+100 where user_id=auth.uid(); end if;
  update public.hamster_daily_progress set upgrades = upgrades+1 where user_id=auth.uid() and game_day=current_date;
  return jsonb_build_object('message', 'Upgrade purchased successfully.');
end;
$$;

create or replace function public.hamster_boost(p_kind text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare s public.hamster_game; cost bigint;
begin
  s := public.hamster_ensure_state();
  if p_kind = 'refill' then
    cost := 2000;
    if s.energy >= s.max_energy then return jsonb_build_object('error', 'Your energy is already full.'); end if;
    if s.coins < cost then return jsonb_build_object('error', 'Not enough game coins.'); end if;
    update public.hamster_game set coins=coins-cost, energy=max_energy where user_id=auth.uid();
  elsif p_kind = 'turbo' then
    cost := 3000;
    if s.coins < cost then return jsonb_build_object('error', 'Not enough game coins.'); end if;
    update public.hamster_game set coins=coins-cost, turbo_until=greatest(coalesce(turbo_until, now()), now()) + interval '60 seconds' where user_id=auth.uid();
  else return jsonb_build_object('error', 'Unknown boost.'); end if;
  update public.hamster_daily_progress set boosts=boosts+1 where user_id=auth.uid() and game_day=current_date;
  return jsonb_build_object('message', 'Boost activated.');
end;
$$;

create or replace function public.hamster_claim_daily()
returns jsonb language plpgsql security definer set search_path = public
as $$
declare s public.hamster_game; reward bigint := 1000; streak integer;
begin
  s := public.hamster_ensure_state();
  if s.last_daily_claim = current_date then return jsonb_build_object('error', 'Daily reward already claimed.'); end if;
  streak := case when s.last_daily_claim = current_date - 1 then s.daily_streak + 1 else 1 end;
  reward := least(1000 + (streak-1)*250, 5000);
  update public.hamster_game set coins=coins+reward, daily_streak=streak, last_daily_claim=current_date where user_id=auth.uid();
  return jsonb_build_object('message', 'Daily reward: ' || reward || ' game coins.');
end;
$$;

create or replace function public.hamster_claim_task(p_task text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare p public.hamster_daily_progress; reward bigint;
begin
  perform public.hamster_ensure_state();
  select * into p from public.hamster_daily_progress where user_id=auth.uid() and game_day=current_date for update;
  if p_task = any(p.claimed_tasks) then return jsonb_build_object('error','Mission already claimed.'); end if;
  if p_task='tap_100' and p.taps>=100 then reward:=1000;
  elsif p_task='upgrade_once' and p.upgrades>=1 then reward:=1500;
  elsif p_task='boost_once' and p.boosts>=1 then reward:=500;
  else return jsonb_build_object('error','Mission is not complete yet.'); end if;
  update public.hamster_daily_progress set claimed_tasks=array_append(claimed_tasks,p_task)
    where user_id=auth.uid() and game_day=current_date;
  update public.hamster_game set coins=coins+reward where user_id=auth.uid();
  return jsonb_build_object('message','Mission reward: ' || reward || ' game coins.');
end;
$$;

create or replace function public.hamster_claim_combo(p_code text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare p public.hamster_daily_progress; answer text;
begin
  perform public.hamster_ensure_state();
  select * into p from public.hamster_daily_progress where user_id=auth.uid() and game_day=current_date for update;
  if p.combo_attempted then return jsonb_build_object('error','You have already used today’s combo attempt.'); end if;
  answer := (100 + ((current_date - date '2025-01-01') % 900))::text;
  update public.hamster_daily_progress set combo_attempted=true, combo_claimed=(p_code=answer)
    where user_id=auth.uid() and game_day=current_date;
  if p_code=answer then
    update public.hamster_game set coins=coins+5000 where user_id=auth.uid();
    return jsonb_build_object('message','Correct combo! 5,000 game coins added.');
  end if;
  return jsonb_build_object('error','Incorrect combo. Try again tomorrow.');
end;
$$;

create or replace function public.hamster_leaderboard()
returns table(user_id uuid, username text, coins bigint)
language sql security definer set search_path = public
as $$
  select g.user_id, coalesce(pr.username, 'Player')::text, g.coins
  from public.hamster_game g
  left join public.profiles pr on pr.id=g.user_id
  order by g.coins desc
  limit 10;
$$;

grant execute on function public.hamster_get_state() to authenticated;
grant execute on function public.hamster_tap(integer) to authenticated;
grant execute on function public.hamster_upgrade(text) to authenticated;
grant execute on function public.hamster_boost(text) to authenticated;
grant execute on function public.hamster_claim_daily() to authenticated;
grant execute on function public.hamster_claim_task(text) to authenticated;
grant execute on function public.hamster_claim_combo(text) to authenticated;
grant execute on function public.hamster_leaderboard() to authenticated;
