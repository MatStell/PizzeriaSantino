# Pizzería Santino — Gestión interna

Proyecto React + Vite + Tailwind, conectado a **Firebase** (Authentication +
Firestore) para login y persistencia real de datos. El foco funcional está
en el **control de stock** (reposición, ajustes de inventario, recetario
editable e historial de movimientos) y en **reportes** (ventas y consumo de
ingredientes); Pedidos se mantiene simple, como tablero operativo.

## Requisitos

- Node.js 18 o superior (https://nodejs.org)
- Una cuenta gratuita de Firebase (https://console.firebase.google.com)

## 1. Crear el proyecto de Firebase

1. Entrá a https://console.firebase.google.com y creá un proyecto nuevo (podés desactivar Google Analytics, no hace falta).
2. Dentro del proyecto, andá a **Compilación > Authentication**, pestaña **Sign-in method**, y habilitá el proveedor **Correo electrónico/contraseña**.
3. En la pestaña **Users** de Authentication, hacé clic en **Add user** y creá el único usuario compartido que va a usar el personal (por ejemplo `local@pizzeriasantino.com` + una contraseña). Con login compartido no hace falta nada más: cualquiera que tenga esas credenciales entra a la app.
4. Andá a **Compilación > Firestore Database** y creá la base de datos (modo producción).
5. En la pestaña **Reglas** de Firestore, pegá esto y publicá (solo deja pasar lecturas/escrituras si hay un usuario logueado):

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

## 2. Conectar la app a tu proyecto

1. En Firebase Console, andá a **Configuración del proyecto** (ícono de engranaje) > pestaña **General** > sección **Tus apps** > agregá una app **Web** (ícono `</>`).
2. Copiá el objeto `firebaseConfig` que te muestra.
3. En la carpeta `pizzeria-dev/`, copiá `.env.example` a `.env`:

   ```bash
   cp .env.example .env
   ```

4. Completá `.env` con los valores de `firebaseConfig` (`apiKey` → `VITE_FIREBASE_API_KEY`, etc). Este archivo no se sube a git.

## 3. Cargar datos iniciales (seed)

El catálogo de productos, recetas, stock de ingredientes y algunos clientes
y pedidos de ejemplo se cargan una sola vez con un script:

1. En Firebase Console: **Configuración del proyecto > Cuentas de servicio > Generar nueva clave privada**. Se descarga un `.json`.
2. Guardá ese archivo como `serviceAccountKey.json` en la raíz de `pizzeria-dev/` (también está en `.gitignore`, nunca se sube).
3. Instalá dependencias y corré el seed:

   ```bash
   npm install
   npm run seed
   ```

Esto carga: 9 productos, sus recetas (gramos por ingrediente), 9
ingredientes con su stock inicial, 8 clientes y ~20 pedidos de ejemplo (con
su consumo de stock ya registrado en el historial). Podés correrlo de nuevo
si querés resetear los datos de muestra — vuelve a escribir los mismos
documentos.

### Catálogo real (empanadas, faina, pizzas y promos)

Con el mismo `serviceAccountKey.json` del paso anterior, `npm run seed:menu`
carga el catálogo real de la pizzería en la colección `products` (277
productos): 31 empanadas, 8 opciones de faina, 51 gustos de pizza en sus 4
tamaños (individual, grande, familiar y 1/2 familiar), 8 pizzas familiares
de varios sabores y las promociones de almuerzo / todo el día / mostrador.

El menú vive en `src/data/catalog.js`: si cambian los precios o hay un gusto
nuevo, se edita ese archivo y se vuelve a correr `npm run seed:menu` (escribe
siempre los mismos documentos por id, así que se puede repetir sin duplicar).

Además del `name`, `cat` y `price` que usan Pedidos y Stock, cada producto
guarda `code` (el código de la empanada), `flavor`, `size` y `keywords` —los
ingredientes del gusto— que son los que alimentan el buscador del modal de
pedidos.

## 4. Correr la app

```bash
npm run dev
```

Abrí la URL que muestra la terminal (por defecto http://localhost:5173) y
entrá con el usuario/contraseña que creaste en el paso 1.3.

## Estructura

```
index.html                  punto de entrada HTML
src/main.jsx                 monta React + AuthProvider
src/firebase.js               inicializa Firebase (Auth + Firestore) desde .env
src/theme.js                  tokens de diseño y formateadores (moneda, fecha)
src/constants.js               estados fijos del flujo de cocina
src/contexts/AuthContext.jsx    sesión: login/logout, usuario actual
src/hooks/useCollection.js      suscripción en tiempo real a una colección de Firestore
src/services/stock.js           reponer/ajustar stock, recetario, movimientos (transacciones)
src/services/orders.js          crear pedido (descuenta stock) y avanzar estado
src/components/Login.jsx        pantalla de login
src/components/Stock.jsx        módulo de control de stock (foco principal de la app)
src/components/ProductPicker.jsx buscador de gustos para armar el pedido
src/data/catalog.js             el menú completo (fuente de verdad de precios)
src/utils/search.js             búsqueda sin acentos por nombre, código o ingrediente
src/App.jsx                    layout, Dashboard, Pedidos, Clientes, Reportes
scripts/seed.mjs               carga de datos iniciales de demostración (una sola vez)
scripts/seedMenu.mjs           carga el catálogo real (empanadas, faina, pizzas, promos)
```

## Datos y stock: cómo funciona

- **`ingredients`**: stock actual (`kg`) y mínimo de alerta (`min`) por ingrediente. Se pueden agregar ingredientes nuevos y editar el mínimo desde la pantalla de Stock.
- **`recipes`**: gramos de cada ingrediente que consume una unidad de cada producto. Editable desde el recetario de la pantalla de Stock — cambiar una receta cambia cuánto stock se descuenta en el próximo pedido.
- **`stockMovements`**: registro de auditoría de todo cambio de stock (`compra` al reponer, `ajuste` tras un conteo manual, `consumo` al crear un pedido), con fecha, ingrediente, cantidad y nota. Es la base del historial que se ve en Stock y del gráfico de consumo en Reportes.
- Crear un pedido descuenta el stock de sus ingredientes en una **transacción** de Firestore (evita que dos pedidos simultáneos descuenten mal el stock si se usan varios dispositivos a la vez).

## Build de producción

```bash
npm run build
```

Genera la carpeta `dist/` lista para subir a cualquier hosting estático
(Vercel, Netlify, Firebase Hosting, etc). Al desplegar, configurá las mismas
variables `VITE_FIREBASE_*` como variables de entorno en el hosting elegido.
`npm run preview` sirve ese build localmente para probarlo antes de publicarlo.
