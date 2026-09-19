-- =====================================================================
-- PASO 2: Convertir a un usuario en Administrador
-- =====================================================================
-- Antes de correr esto:
--   1) Ve a Authentication -> Users en el panel de Supabase.
--   2) Presiona "Add user" y crea el usuario con el correo y la
--      contraseña que tú quieras usar para entrar como administrador.
--   3) Copia ese mismo correo y pégalo abajo, reemplazando el texto
--      'admin@tuempresa.com' (entre comillas).
--   4) Pega este script completo en el SQL Editor y presiona "Run".
--
-- Puedes correr este mismo script más veces si algún día necesitas
-- convertir a otro correo en administrador.
-- =====================================================================

update public.profiles
set role = 'admin', active = true
where email = 'admin@obvio-services.com';

-- Verifica que sí quedó como administrador:
select id, full_name, email, role, active from public.profiles
where email = 'admin@obvio-services.com';
