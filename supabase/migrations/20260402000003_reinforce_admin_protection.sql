-- Prevent administrators from deleting their own accounts
CREATE OR REPLACE FUNCTION delete_own_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin_user boolean;
BEGIN
  -- Check if the caller is an admin
  SELECT is_admin INTO is_admin_user FROM public.profiles WHERE id = auth.uid();
  
  IF is_admin_user THEN
    RAISE EXCEPTION 'Admin accounts cannot be deleted';
  ELSE
    -- Delete the user from auth.users
    DELETE FROM auth.users WHERE id = auth.uid();
  END IF;
END;
$$;

-- Prevent administrators from deleting other administrator accounts
CREATE OR REPLACE FUNCTION delete_user_by_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_is_admin boolean;
  target_is_admin boolean;
BEGIN
  -- Check if the caller is an admin
  SELECT is_admin INTO caller_is_admin FROM public.profiles WHERE id = auth.uid();
  
  -- Check if the target is an admin
  SELECT is_admin INTO target_is_admin FROM public.profiles WHERE id = target_user_id;
  
  IF NOT caller_is_admin THEN
    RAISE EXCEPTION 'Only admins can delete other users';
  ELSIF target_is_admin THEN
    RAISE EXCEPTION 'Admin accounts cannot be deleted';
  ELSE
    -- Delete the target user from auth.users
    DELETE FROM auth.users WHERE id = target_user_id;
  END IF;
END;
$$;
