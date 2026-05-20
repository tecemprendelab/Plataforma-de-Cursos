-- rls_auto_enable es SECURITY DEFINER expuesta a PUBLIC.
-- Revocar de anon/authenticated para que no sea callable vía PostgREST.
revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;
