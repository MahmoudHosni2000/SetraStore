-- Function for regular users to delete their own account
CREATE OR REPLACE FUNCTION delete_own_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated permissions to access auth.users
AS $$
BEGIN
  -- Delete the user from auth.users (this triggers cascade delete to profiles)
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Function for admins to delete any user account
CREATE OR REPLACE FUNCTION delete_user_by_admin(target_user_id uuid)
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
    -- Delete the target user from auth.users
    DELETE FROM auth.users WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Only admins can delete other users';
  END IF;
END;
$$;
