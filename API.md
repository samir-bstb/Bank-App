# Bank App — API Reference

> **Base URL:** `http://localhost:3000` (desarrollo) — reemplazar con la URL de producción al hacer deploy.

## Tabla de contenidos

- [Autenticación](#autenticación)
- [Formato de errores](#formato-de-errores)
- [Rutas públicas](#rutas-públicas)
  - [POST /api/auth/register](#post-apiauthregister)
  - [POST /api/auth/login](#post-apiauthlogin)
  - [GET /api/health](#get-apihealth)
- [Rutas protegidas](#rutas-protegidas)
  - [GET /api/users/me](#get-apiusersme)
  - [GET /api/accounts](#get-apiaccounts)
  - [GET /api/accounts/:id](#get-apiaccountsid)
  - [GET /api/transactions](#get-apitransactions)
  - [POST /api/transactions/transfer](#post-apitransactionstransfer)
  - [GET /api/logs](#get-apilogs)
- [Seguridad](#seguridad)
- [Modelo de datos](#modelo-de-datos)

---

## Autenticación

Las rutas protegidas requieren un **Bearer token** en el header `Authorization`.

```
Authorization: Bearer <token>
```

El token se obtiene al registrarse (`/api/auth/register`) o al iniciar sesión (`/api/auth/login`). Es un JWT firmado por Supabase Auth con una vigencia de **1 hora**.

### Estructura del JWT

El payload del token contiene los siguientes campos relevantes:

```json
{
  "sub": "uuid-del-usuario",
  "app_metadata": {
    "role": "client"
  },
  "user_metadata": {
    "username": "alice"
  },
  "exp": 1234567890
}
```

| Campo | Descripción |
| --- | --- |
| `sub` | UUID del usuario — se usa como identificador en todas las operaciones |
| `app_metadata.role` | Rol del usuario: `client` o `admin` |
| `user_metadata.username` | Nombre de usuario |
| `exp` | Expiración del token (Unix timestamp) |

> El token expira en **1 hora**. Cuando expire, el cliente debe llamar a `/api/auth/login` para obtener uno nuevo.

---

## Formato de errores

Todas las respuestas de error siguen el mismo formato:

```json
{
  "error": "error_code",
  "detail": "descripción opcional"
}
```

| Campo | Descripción |
| --- | --- |
| `error` | Código de error en `snake_case` — estable entre versiones |
| `detail` | Mensaje legible, presente solo en algunos errores de validación |

---

## Rutas públicas

No requieren token de autenticación.

---

### POST /api/auth/register

Crea una nueva cuenta de usuario y devuelve un token de sesión listo para usar.

**Request body**

```json
{
  "username": "string",
  "password": "string"
}
```

| Campo | Requerido | Reglas |
| --- | --- | --- |
| `username` | Sí | 3–30 caracteres, solo letras, números y guión bajo |
| `password` | Sí | Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un dígito |

**Respuesta exitosa — `201 Created`**

```json
{
  "token": "eyJ...",
  "user": {
    "id": "1a32ad5d-336e-4648-a391-4cd026371a57",
    "username": "alice",
    "role": "client"
  }
}
```

**Errores posibles**

| Código HTTP | `error` | Causa |
| --- | --- | --- |
| `400` | `username_and_password_required` | Falta alguno de los dos campos |
| `400` | `invalid_username` | El username no cumple el formato |
| `400` | `weak_password` | La contraseña no cumple los requisitos |
| `409` | `username_taken` | El username ya está registrado |
| `500` | `registration_failed` | Error interno al crear el usuario |

---

### POST /api/auth/login

Inicia sesión con un usuario existente.

**Request body**

```json
{
  "username": "string",
  "password": "string"
}
```

**Respuesta exitosa — `200 OK`**

```json
{
  "token": "eyJ...",
  "user": {
    "id": "1a32ad5d-336e-4648-a391-4cd026371a57",
    "username": "alice",
    "role": "client"
  }
}
```

**Errores posibles**

| Código HTTP | `error` | Causa |
| --- | --- | --- |
| `400` | `username_and_password_required` | Falta alguno de los dos campos |
| `401` | `invalid_credentials` | Usuario no existe o contraseña incorrecta |
| `403` | `account_blocked` | La cuenta fue bloqueada por demasiados intentos fallidos |

> **Seguridad:** después de **5 intentos fallidos consecutivos** la cuenta queda bloqueada (`is_blocked = true`) y ya no se puede iniciar sesión aunque se proporcione la contraseña correcta. El contador se resetea a 0 en cada login exitoso. El desbloqueo debe hacerse a nivel de administración.

---

### GET /api/health

Verifica que el servidor esté activo.

**Respuesta — `200 OK`**

```json
{ "status": "ok" }
```

---

## Rutas protegidas

Todas requieren el header:

```
Authorization: Bearer <token>
```

Si el token falta, expiró o es inválido, la respuesta será:

| Código HTTP | `error` | Causa |
| --- | --- | --- |
| `401` | `unauthorized` | No se envió el header `Authorization` |
| `401` | `invalid_token` | El token es inválido o expiró |

---

### GET /api/users/me

Devuelve el perfil del usuario autenticado.

**Respuesta exitosa — `200 OK`**

```json
{
  "user": {
    "id": "1a32ad5d-336e-4648-a391-4cd026371a57",
    "username": "alice",
    "role": "client",
    "created_at": "2026-06-01T00:00:00Z"
  }
}
```

**Errores posibles**

| Código HTTP | `error` | Causa |
| --- | --- | --- |
| `404` | `user_not_found` | El usuario del token no existe en la base de datos |

---

### GET /api/accounts

Devuelve las cuentas bancarias activas del usuario autenticado.

**Respuesta exitosa — `200 OK`**

```json
{
  "accounts": [
    {
      "id": "b1a2c3d4-...",
      "user_id": "1a32ad5d-...",
      "account_number": "1000000000000001",
      "balance": 5000.00,
      "is_active": true,
      "created_at": "2026-06-01T00:00:00Z"
    }
  ]
}
```

> Si el usuario no tiene cuentas activas, `accounts` es un array vacío `[]`.

**Errores posibles**

| Código HTTP | `error` | Causa |
| --- | --- | --- |
| `500` | `failed_to_fetch_accounts` | Error interno al consultar la base de datos |

---

### GET /api/accounts/:id

Devuelve el detalle de una cuenta específica del usuario autenticado.

**Parámetro de ruta**

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `id` | UUID | ID de la cuenta |

**Respuesta exitosa — `200 OK`**

```json
{
  "account": {
    "id": "b1a2c3d4-...",
    "user_id": "1a32ad5d-...",
    "account_number": "1000000000000001",
    "balance": 5000.00,
    "is_active": true,
    "created_at": "2026-06-01T00:00:00Z"
  }
}
```

**Errores posibles**

| Código HTTP | `error` | Causa |
| --- | --- | --- |
| `404` | `account_not_found` | La cuenta no existe o pertenece a otro usuario |

> Un usuario solo puede ver sus propias cuentas. Si intenta acceder a la cuenta de otro usuario, recibirá `404` (no `403`) para no revelar si la cuenta existe.

---

### GET /api/transactions

Devuelve el historial de movimientos de una cuenta, ordenados del más reciente al más antiguo.

**Query parameters**

| Parámetro | Requerido | Descripción |
| --- | --- | --- |
| `account_id` | Sí | UUID de la cuenta a consultar |

**Ejemplo**

```
GET /api/transactions?account_id=b1a2c3d4-...
```

**Respuesta exitosa — `200 OK`**

```json
{
  "transactions": [
    {
      "id": "c1d2e3f4-...",
      "sender_account_id": "b1a2c3d4-...",
      "receiver_account_id": "e5f6a7b8-...",
      "amount": 200.00,
      "status": "completed",
      "created_at": "2026-06-01T12:00:00Z"
    }
  ]
}
```

> El listado incluye tanto las transferencias **enviadas** como las **recibidas** por la cuenta indicada.

**Errores posibles**

| Código HTTP | `error` | Causa |
| --- | --- | --- |
| `400` | `account_id_required` | No se envió el query param `account_id` |
| `404` | `account_not_found` | La cuenta no existe o no pertenece al usuario |
| `500` | `failed_to_fetch_transactions` | Error interno |

---

### POST /api/transactions/transfer

Ejecuta una transferencia de fondos entre dos cuentas. La operación es **atómica** (ACID): si cualquier paso falla, ningún saldo cambia.

**Request body**

```json
{
  "sender_account_id": "b1a2c3d4-...",
  "receiver_account_id": "e5f6a7b8-...",
  "amount": 200.00
}
```

| Campo | Requerido | Descripción |
| --- | --- | --- |
| `sender_account_id` | Sí | UUID de la cuenta que envía (debe pertenecer al usuario autenticado) |
| `receiver_account_id` | Sí | UUID de la cuenta que recibe (puede ser de cualquier usuario) |
| `amount` | Sí | Monto a transferir — número positivo mayor a 0 |

**Respuesta exitosa — `201 Created`**

```json
{
  "transaction_id": "c1d2e3f4-...",
  "status": "completed",
  "amount": 200.00
}
```

**Errores posibles**

| Código HTTP | `error` | Causa |
| --- | --- | --- |
| `400` | `missing_required_fields` | Falta alguno de los tres campos |
| `400` | `invalid_amount` | El monto no es un número o es menor o igual a 0 |
| `404` | `sender_account_not_found` | La cuenta emisora no existe o no pertenece al usuario |
| `404` | `receiver_account_not_found` | La cuenta receptora no existe o está inactiva |
| `422` | `insufficient_funds` | El saldo de la cuenta emisora es menor al monto solicitado |
| `422` | `self_transfer_not_allowed` | `sender_account_id` y `receiver_account_id` son iguales |
| `500` | `transfer_failed` | Error interno durante la transacción |

---

### GET /api/logs

Devuelve el historial de eventos de auditoría.

- Un usuario con rol `client` solo ve sus propios logs.
- Un usuario con rol `admin` puede ver los logs de cualquier usuario usando el query param `user_id`.

**Query parameters (solo para admin)**

| Parámetro | Requerido | Descripción |
| --- | --- | --- |
| `user_id` | No | UUID del usuario cuyos logs se quieren filtrar |

**Ejemplo (admin filtrando un usuario)**

```
GET /api/logs?user_id=1a32ad5d-...
```

**Respuesta exitosa — `200 OK`**

```json
{
  "logs": [
    {
      "id": "d1e2f3a4-...",
      "user_id": "1a32ad5d-...",
      "event_type": "login_success",
      "description": "User alice logged in",
      "created_at": "2026-06-01T12:00:00Z"
    }
  ]
}
```

**Tipos de eventos registrados (`event_type`)**

| Evento | Cuándo se genera |
| --- | --- |
| `register` | Registro de un nuevo usuario |
| `login_success` | Inicio de sesión exitoso |
| `login_failed` | Intento de inicio de sesión con contraseña incorrecta |
| `login_blocked` | Intento de login sobre una cuenta bloqueada |
| `transfer` | Transferencia completada |

**Errores posibles**

| Código HTTP | `error` | Causa |
| --- | --- | --- |
| `500` | `failed_to_fetch_logs` | Error interno al consultar la base de datos |

---

## Seguridad

### Bloqueo de cuenta

| Condición | Comportamiento |
| --- | --- |
| Contraseña incorrecta | Se incrementa `failed_attempts` en 1 |
| `failed_attempts >= 5` | La cuenta queda bloqueada (`is_blocked = true`) |
| Login exitoso | `failed_attempts` se resetea a 0 |
| Cuenta bloqueada | Cualquier intento de login devuelve `403 account_blocked` |

El desbloqueo de una cuenta bloqueada debe realizarse directamente en la base de datos o a través de un panel de administración (no existe endpoint público para ello).

### Aislamiento de datos

Cada endpoint protegido verifica que los recursos solicitados pertenezcan al usuario del token. Intentar acceder a recursos de otro usuario devuelve `404` en lugar de `403` para no exponer información de existencia.

### Transferencias ACID

La función `transfer_funds` en PostgreSQL bloquea ambas cuentas con `SELECT FOR UPDATE` en orden ascendente de UUID antes de modificar cualquier saldo, garantizando que dos transferencias concurrentes en sentidos opuestos no produzcan deadlocks ni inconsistencias.

---

## Modelo de datos

### users

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `id` | uuid | PK — mismo UUID que `auth.users.id` |
| `username` | varchar | Único, 3–30 caracteres |
| `role` | varchar | `admin` o `client` |
| `failed_attempts` | int | Intentos fallidos consecutivos de login |
| `is_blocked` | bool | `true` si la cuenta está bloqueada |
| `created_at` | timestamp | Fecha de creación |

### accounts

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `id` | uuid | PK |
| `user_id` | uuid | FK → users.id (unique: 1 cuenta por usuario) |
| `account_number` | char(16) | Número de cuenta — exactamente 16 dígitos |
| `balance` | numeric | Saldo actual |
| `is_active` | bool | `false` = cuenta cerrada, no aparece en listados |
| `created_at` | timestamp | Fecha de creación |

### transactions

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `id` | uuid | PK |
| `sender_account_id` | uuid | FK → accounts.id |
| `receiver_account_id` | uuid | FK → accounts.id |
| `amount` | numeric | Monto transferido |
| `status` | varchar | `completed` (único valor posible actualmente) |
| `created_at` | timestamp | Fecha de la transacción |

### logs

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `id` | uuid | PK |
| `user_id` | uuid | FK → users.id |
| `event_type` | varchar | Tipo de evento (ver tabla de eventos) |
| `description` | text | Descripción legible del evento |
| `created_at` | timestamp | Fecha del evento |
