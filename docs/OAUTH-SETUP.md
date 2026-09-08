# Autorización de Google Calendar — pasos manuales

Instrucciones exactas para crear el cliente OAuth y obtener el
`refresh_token` de la cuenta organizadora. **Todo esto lo ejecuta una
persona, una sola vez, desde su computador.** El Worker desplegado no
participa de este flujo: no hay ruta pública de callback ni botón "Conectar
con Google", a propósito.

Cuentas involucradas:

| Rol | Cuenta |
| --- | --- |
| Organizadora / dueña de los calendarios / OAuth | `agenda.evolution.demo@gmail.com` |
| Barbero Demo 1 → `BARBER_A_CALENDAR_ID` (Leonardo) | `cannibalchild123@gmail.com` |
| Barbero Demo 2 → `BARBER_B_CALENDAR_ID` (Vicente) | `caballero.sepulveda.nicolas@gmail.com` |
| Administradora | `nicolas.caballero.sepulveda@gmail.com` |

> No se usa cuenta de servicio: son cuentas Gmail personales, sin Workspace,
> así que no existe delegación a nivel de dominio. Como ambos calendarios
> pertenecen a la misma cuenta organizadora, **un solo `refresh_token`
> cubre los dos** — no hace falta autorizar barbero por barbero.

---

## 1. Proyecto y API en Google Cloud Console

Con la sesión iniciada en **`agenda.evolution.demo@gmail.com`**:

1. Entra a <https://console.cloud.google.com/> y crea un proyecto nuevo
   (por ejemplo `evolution-studio-booking`).
2. Ve a **APIs y servicios → Biblioteca**, busca **Google Calendar API** y
   pulsa **Habilitar**.

## 2. Pantalla de consentimiento

3. **APIs y servicios → Pantalla de consentimiento de OAuth**.
4. Tipo de usuario: **Externo**. Completa nombre de la app, correo de
   asistencia y correo de contacto del desarrollador.
5. En **Permisos**, agrega el scope `https://www.googleapis.com/auth/calendar`.
6. En **Usuarios de prueba**, agrega `agenda.evolution.demo@gmail.com`.
   Sin esto la autorización será rechazada mientras el proyecto esté en
   estado "Testing".

> **Limitación aceptada para el piloto:** con el proyecto en "Testing", el
> `refresh_token` caduca a los 7 días. Cuando eso pase, basta con volver a
> correr la utilidad del paso 5. Publicar el proyecto elimina el límite y se
> resuelve antes de producción, no ahora.

## 3. Cliente OAuth de escritorio

7. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente
   de OAuth**.
8. Tipo de aplicación: **Aplicación de escritorio** (no "Aplicación web").
9. Copia el **ID de cliente** y el **secreto de cliente**.

> La utilidad escucha en `http://127.0.0.1:8976/callback`. Los clientes de
> escritorio aceptan cualquier puerto de loopback, así que no hay que
> registrar esa URL en la consola.

## 4. Completar `.dev.vars`

10. Si todavía no existe, copia la plantilla:

    ```bash
    cp .dev.vars.example .dev.vars
    ```

11. Reemplaza `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` con los valores
    del paso 9, y los `*_CALENDAR_ID` / `*_EMAIL` con los datos reales.

`.dev.vars` está ignorado por Git (`.gitignore:12`) y hay un test
(`tests/test_secrets_hygiene.py`) que falla si alguna credencial real
aparece en un archivo versionado.

## 5. Obtener el `refresh_token`

12. Desde la raíz del repositorio:

    ```bash
    node scripts/oauth-setup.mjs
    ```

13. Se abre el navegador. **Inicia sesión con
    `agenda.evolution.demo@gmail.com`** (no con la cuenta administradora).
14. Google mostrará el aviso "Google no ha verificado esta aplicación":
    **Configuración avanzada → Ir a (nombre de la app)**. Es esperado
    mientras el proyecto esté en "Testing".
15. Acepta el permiso de Google Calendar.

La utilidad escribe `GOOGLE_REFRESH_TOKEN` directamente en `.dev.vars` y
**no lo imprime en pantalla** a propósito.

Si Google no devuelve `refresh_token`, es porque la cuenta ya había
autorizado la app antes. Revoca el acceso en
<https://myaccount.google.com/permissions> y repite el paso 12.

## 6. Antes de la prueba integral

- [ ] La cuenta administradora (`nicolas.caballero.sepulveda@gmail.com`)
      confirma que **ve ambos calendarios compartidos** en su Google
      Calendar, con permiso para modificar eventos y ver detalles.
      *(Pendiente de verificar.)*
- [ ] `npx wrangler dev` levanta y `/api/config` responde.
- [ ] `/api/availability` devuelve horarios reales de cada calendario.

## 7. Cuando toque desplegar (todavía no)

Cada paso de abajo requiere autorización previa. Nada de esto se ejecuta
como parte de la configuración de OAuth.

### Por qué NO se cargan los secretos uno por uno

El subcomando `secret put` de Wrangler **crea una versión del Worker y la
despliega de inmediato**. Cargar los ocho secretos así produciría ocho
versiones y ocho despliegues, y los siete primeros quedarían sirviendo
tráfico con secretos incompletos — es decir, rotos.

Los ocho se cargan **juntos, en una sola versión que no recibe tráfico**.

### Preview URLs deshabilitadas

`wrangler.jsonc` declara `"preview_urls": false`. Sin eso, `versions upload`
genera una URL de preview **pública** por cada versión: con `workers.dev`
habilitado en la cuenta y el campo omitido, Wrangler 4.44+ hace que ese
valor por defecto siga al de `workers.dev`. La versión quedaría accesible
desde Internet con los ocho secretos cargados y conectada a Google Calendar,
antes de cualquier despliegue. "No desplegada" no equivale a "no accesible".

### Flujo autorizado

1. **Autenticar el CLI.** El MCP de Cloudflare y la sesión de Wrangler son
   almacenes de credenciales distintos: autenticar uno no autentica el otro.

   ```bash
   npx wrangler login
   npx wrangler whoami --json
   ```

   Verifica que la cuenta y el Account ID sean los esperados. El subdominio
   `workers.dev` se comprueba desde **Workers y Pages** en el panel de
   Cloudflare. Si algo no calza, `npx wrangler logout` y detenerse.

2. **Derivar un archivo temporal** con exactamente las ocho claves
   (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`,
   `BARBER_A_CALENDAR_ID`, `BARBER_B_CALENDAR_ID`, `BARBER_A_EMAIL`,
   `BARBER_B_EMAIL`, `OWNER_EMAIL`), fuera del repositorio, con permisos
   `600`, sin comentarios y sin imprimir valores.

   No se usa `.dev.vars` directamente: además de los ocho secretos contiene
   `MIN_ADVANCE_MIN`, que ya es una var pública declarada en
   `wrangler.jsonc`. Subirla también como secreto duplicaría ese binding.

   `BUSINESS_TIMEZONE` también es una var pública de `wrangler.jsonc`, pero
   no es una clave de `.dev.vars`.

3. **Crear una única versión no desplegada:**

   ```bash
   npm run build:cloudflare
   npx wrangler versions upload --secrets-file <archivo-temporal> --strict
   ```

   `--strict` aborta la subida si hay cambios remotos en conflicto, en vez
   de sobrescribirlos en silencio.

   La primera vez esto **crea el Worker remoto**, que hasta entonces no
   existe. Crea la versión, pero **no** la despliega ni le envía tráfico.
   `secrets.required` en `wrangler.jsonc` hace que el comando falle con la
   lista de los que falten, en vez de subir una versión incompleta.

4. **Inspección read-only**, antes de decidir nada:

   ```bash
   npx wrangler versions list --json
   npx wrangler deployments list --json
   npx wrangler versions view <VERSION-ID> --json
   ```

   Comprobar: una sola versión; ningún deployment activo; los ocho secretos
   presentes **por nombre** (tipo `secret_text`, sin valores); los bindings
   `ASSETS`, `BUSINESS_TIMEZONE` y `MIN_ADVANCE_MIN`; cero rutas
   personalizadas; DNS y Sites sin cambios.

5. **Borrar el archivo temporal**, solo después de confirmar que la versión
   quedó con los ocho secretos. Se regenera desde `.dev.vars` si hace falta.

6. **Desplegar — requiere autorización explícita e independiente:**

   ```bash
   npx wrangler versions deploy <VERSION-ID>
   ```

   Este es el único paso que activa tráfico. No forma parte del anterior.

`BUSINESS_TIMEZONE` y `MIN_ADVANCE_MIN` no son secretos: son vars públicas y
ya están declaradas en `wrangler.jsonc`.
