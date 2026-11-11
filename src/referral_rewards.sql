-- PrimeVest referral reward function
-- A successful referral means a new profile row was created with
-- profiles.referred_by equal to the inviter's profiles.referral_code.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_earnings numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_paid_count integer NOT NULL DEFAULT 0;

-- Older code paid ₦1,000 per referral. Preserve those historical payments
-- by treating each ₦1,000 already recorded as one previously paid referral.
UPDATE public.profiles
SET referral_paid_count = floor(COALESCE(referral_earnings, 0) / 1000)::integer
WHERE referral_paid_count = 0
  AND COALESCE(referral_earnings, 0) >= 1000;

-- Give existing accounts a referral code if they do not already have one.
UPDATE public.profiles
SET referral_code = 'PV' || upper(substr(replace(id::text, '-', ''), 1, 12))
WHERE referral_code IS NULL OR btrim(referral_code) = '';


-- Ensure every new profile has a shareable referral code and that a signup's
-- ?ref=CODE value is saved into profiles.referred_by. This is done server-side
-- so a browser cannot award itself a referral by editing its own profile.
CREATE OR REPLACE FUNCTION public.primevest_apply_referral_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_ref text;
  v_inviter_code text;
BEGIN
  SELECT raw_user_meta_data ->> 'ref'
    INTO v_ref
  FROM auth.users
  WHERE id = NEW.id;

  IF v_ref IS NOT NULL AND btrim(v_ref) <> '' THEN
    SELECT referral_code
      INTO v_inviter_code
    FROM public.profiles
    WHERE lower(referral_code) = lower(btrim(v_ref))
      AND id <> NEW.id
    LIMIT 1;
  END IF;

  UPDATE public.profiles
  SET referral_code = COALESCE(
        NULLIF(btrim(NEW.referral_code), ''),
        'PV' || upper(substr(replace(NEW.id::text, '-', ''), 1, 12))
      ),
      referred_by = COALESCE(NEW.referred_by, v_inviter_code)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS primevest_apply_referral_metadata ON public.profiles;
CREATE TRIGGER primevest_apply_referral_metadata
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.primevest_apply_referral_metadata();

CREATE OR REPLACE FUNCTION public.claim_referral_rewards()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_referral_code text;
  v_referral_count integer := 0;
  v_already_paid numeric := 0;
  v_paid_count integer := 0;
  v_reward numeric := 0;
  v_wallet_available numeric;
  v_wallet_total numeric;
  v_wallet_earnings numeric;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'You must be logged in to claim referral rewards.';
  END IF;

  -- Lock the inviter's profile so simultaneous clicks cannot pay twice.
  SELECT referral_code, COALESCE(referral_earnings, 0), COALESCE(referral_paid_count, 0)
    INTO v_referral_code, v_already_paid, v_paid_count
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_referral_code IS NULL OR btrim(v_referral_code) = '' THEN
    RAISE EXCEPTION 'Your referral code is not available yet.';
  END IF;

  SELECT COUNT(*)::integer
    INTO v_referral_count
  FROM public.profiles
  WHERE referred_by = v_referral_code;

  -- First successful referral: ₦1,000. Each later referral: ₦200.
  -- Keep prior payouts intact; only pay referrals not previously paid.
  IF v_referral_count > v_paid_count THEN
    IF v_paid_count = 0 THEN
      v_reward := 1000 + ((v_referral_count - 1) * 200);
    ELSE
      v_reward := (v_referral_count - v_paid_count) * 200;
    END IF;
  END IF;

  IF v_reward <= 0 THEN
    RETURN jsonb_build_object('amount', 0, 'referrals', v_referral_count);
  END IF;

  SELECT available, total, earnings
    INTO v_wallet_available, v_wallet_total, v_wallet_earnings
  FROM public.wallets
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found for this account.';
  END IF;

  UPDATE public.wallets
  SET available = COALESCE(v_wallet_available, 0) + v_reward,
      total = COALESCE(v_wallet_total, 0) + v_reward,
      earnings = COALESCE(v_wallet_earnings, 0) + v_reward
  WHERE user_id = v_user_id;

  UPDATE public.profiles
  SET referral_earnings = COALESCE(v_already_paid, 0) + v_reward,
      referral_paid_count = v_referral_count
  WHERE id = v_user_id;

  INSERT INTO public.transactions (user_id, type, amount, status, reference)
  VALUES (
    v_user_id,
    'referral_bonus',
    v_reward,
    'success',
    'REFERRAL-' || gen_random_uuid()::text
  );

  RETURN jsonb_build_object('amount', v_reward, 'referrals', v_referral_count);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_referral_rewards() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_referral_rewards() TO authenticated;
