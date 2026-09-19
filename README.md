# Validador de Boletos de Bus

Aplicación web para validar boletos de bus escaneando un código QR desde
un celular Android (funciona en el navegador Chrome, sin instalar nada).

No necesitas saber programar para ponerla en funcionamiento: solo tienes
que seguir los pasos de este documento, en orden.

---

## Lo que vas a necesitar

- Una cuenta gratuita en [supabase.com](https://supabase.com) (aquí vivirá tu base de datos).
- Una cuenta gratuita en [netlify.com](https://www.netlify.com) (aquí vivirá tu aplicación).
- Una cuenta en [github.com](https://github.com) (es el paso intermedio para conectar los dos anteriores).

---

## PARTE 1 — Crear la base de datos en Supabase

1. Entra a [supabase.com](https://supabase.com), crea una cuenta y luego un proyecto nuevo.
   Ponle el nombre que quieras (por ejemplo "boletos-bus") y espera un par de minutos
   a que Supabase termine de crearlo.
2. En el menú de la izquierda, entra a **SQL Editor**.
3. Abre el archivo `sql/01_schema.sql` de esta carpeta, copia **todo** su contenido y
   pégalo en el editor de Supabase. Presiona el botón **Run**.
   - Esto crea automáticamente todas las tablas, las reglas de seguridad y las
     funciones que necesita la aplicación. No necesitas tocar nada más aquí.
4. Ahora crea tu usuario administrador:
   - En el menú de la izquierda entra a **Authentication → Users**.
   - Presiona **Add user** y escribe el correo y la contraseña con la que
     quieres entrar como administrador. Guarda.
5. Abre el archivo `sql/02_crear_admin.sql`, cambia el correo de ejemplo por el
   correo que acabas de usar en el paso anterior, copia todo el contenido y
   pégalo de nuevo en el **SQL Editor**. Presiona **Run**.
   - Este paso convierte a ese usuario en administrador dentro de la aplicación.
6. Por último, copia dos datos que vas a necesitar más adelante:
   - Ve a **Project Settings → API**.
   - Copia el valor de **Project URL**.
   - Copia el valor de **anon public key** (a veces aparece como "Publishable key").
   - Guárdalos en un bloc de notas, los usarás en la Parte 3.

No necesitas crear ningún "bucket" de almacenamiento: esta aplicación no
guarda imágenes ni archivos, solo datos de boletos y viajes.

---

## PARTE 2 — Subir el código a GitHub

Netlify necesita "compilar" la aplicación antes de publicarla, así que el
código debe pasar primero por GitHub.

1. Entra a [github.com](https://github.com) y crea un repositorio nuevo (puede ser privado).
2. Sube todos los archivos de esta carpeta a ese repositorio (puedes arrastrarlos
   desde la página web de GitHub con el botón "Add file → Upload files", o usar
   GitHub Desktop si prefieres una aplicación con ventanas).

---

## PARTE 3 — Publicar en Netlify

1. Entra a [netlify.com](https://www.netlify.com) y crea una cuenta (puedes usar tu cuenta de GitHub).
2. Presiona **Add new site → Import an existing project**.
3. Elige GitHub y selecciona el repositorio que subiste en la Parte 2.
4. Netlify va a detectar automáticamente que es un proyecto Vite; deja los
   valores que proponga (comando `npm run build`, carpeta `dist`).
5. Antes de darle a publicar, ve a **Site settings → Environment variables** y
   agrega dos variables, usando los datos que copiaste en la Parte 1:
   - `VITE_SUPABASE_URL` → pega aquí tu Project URL.
   - `VITE_SUPABASE_ANON_KEY` → pega aquí tu anon public key.
6. Presiona **Deploy site**. Espera unos minutos.
7. Cuando termine, Netlify te dará un enlace (algo como `tu-proyecto.netlify.app`).
   Ese es el link de tu aplicación.

---

## PARTE 4 — Primer uso

1. Abre el enlace de Netlify en tu computadora o celular y entra a `/login`.
2. Ingresa con el correo y la contraseña que creaste como administrador
   en la Parte 1. Llegarás al **panel de administrador**.
3. Sigue este orden dentro de la aplicación:
   1. Crea una **ruta** (origen y destino).
   2. Crea un **bus** (con su placa).
   3. Crea un **viaje**, eligiendo la ruta, el bus y las fechas.
   4. Pide a tu operador que entre al enlace desde su celular y se **registre**
      en `/registro`. Su cuenta quedará pendiente.
   5. En **Usuarios**, actívalo.
   6. Entra al **detalle del viaje** y márcalo como asignado a ese operador.
   7. Registra al **pasajero** y emítele su **boleto**; ahí verás el código QR
      para imprimir o mostrar.
   8. Cuando sea la hora, pon el viaje en estado **Activo**.
   9. El operador entra a "Escanear" desde su celular y ya puede validar boletos.

---

## Resumen rápido (para tenerlo a la mano)

**En Supabase:**
1. Crear proyecto.
2. Pegar y ejecutar `sql/01_schema.sql` en el SQL Editor.
3. Crear el usuario administrador en Authentication → Users.
4. Editar el correo dentro de `sql/02_crear_admin.sql`, pegarlo y ejecutarlo.
5. Copiar el Project URL y el anon public key.

**En Netlify:**
1. Subir el código a GitHub.
2. Importar el repositorio en Netlify.
3. Agregar las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. Publicar.

No se necesita CLI, Edge Functions, ni tocar el Table Editor manualmente.
