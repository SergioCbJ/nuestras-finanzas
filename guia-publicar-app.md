# Guía: publicar "Nuestras Finanzas" con enlace público y gratis

Esta guía te lleva paso a paso desde cero hasta tener la app en una dirección
web (algo como `https://tu-usuario.github.io/nuestras-finanzas/`) que
funciona para ti y para Carmen sin que ninguno de los dos tenga que iniciar
sesión en nada de Claude. Coste: **0 €**, mientras los dos sigáis usándola
como personas normales apuntando sus gastos (las cuotas gratuitas están
pensadas para muchísimo más tráfico del que dos personas van a generar
jamás).

Usamos dos servicios gratuitos, cada uno para una cosa:

- **Firebase** (de Google) — guarda los datos (movimientos, saldo...) y los
  sincroniza en vivo entre los dos. Es gratis sin necesidad de tarjeta.
- **GitHub Pages** — aloja el archivo de la app y le da el enlace público.
  También gratis, también sin tarjeta.

Al final del documento tienes el archivo `index.html` ya preparado; solo
tienes que pegarle unos datos y subirlo.

> **¿Ya la tenías publicada y solo vienes a por las novedades?** Esta
> versión añade buscador y filtros en Movimientos, edición de movimientos,
> gastos/ingresos recurrentes, presupuestos por categoría con avisos, y
> modo app instalable sin conexión. Ve directo a: **Parte 1, paso 5**
> (hay que ampliar las reglas de Firestore con dos líneas nuevas) y
> **Parte 3, paso 13** (ahora se suben 5 archivos en vez de 1). El resto
> de la guía no cambia — no hace falta crear nada de nuevo ni tocar el
> enlace.

---

## Parte 1 — Crear la base de datos gratuita (Firebase)

1. Entra en **[console.firebase.google.com](https://console.firebase.google.com)**
   e inicia sesión con una cuenta de Google (puede ser tu Gmail de siempre).
2. Pulsa **Crear un proyecto** (o "Add project"). Ponle un nombre, por
   ejemplo `nuestras-finanzas`. Si te pregunta por Google Analytics,
   desactívalo — no lo necesitamos. Pulsa **Crear proyecto** y espera a que
   termine.
3. Dentro del proyecto, busca en el menú de la izquierda algo llamado
   **Firestore Database** (puede aparecer bajo un grupo como "Compilación"
   o "Bases de datos y almacenamiento", según la versión del panel). Entra
   y pulsa **Crear base de datos**.
4. Elige una ubicación (si te deja elegir, cualquiera de Europa como
   `eur3` está bien) y pulsa siguiente. Cuando te pregunte por el modo de
   reglas de seguridad, elige **modo de prueba** ("test mode") — en el
   siguiente paso vamos a sustituir esas reglas por las nuestras, así que
   esta elección inicial no importa mucho.
5. Ya dentro de Firestore, ve a la pestaña **Reglas** ("Rules"). Borra todo
   el contenido y pega esto exactamente:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /movimientos/{id} {
         allow read, write: if true;
       }
       match /liquidaciones/{id} {
         allow read, write: if true;
       }
       match /recurrentes/{id} {
         allow read, write: if true;
       }
       match /presupuestos/{id} {
         allow read, write: if true;
       }
       match /meta/{id} {
         allow read, write: if true;
       }
     }
   }
   ```

   Pulsa **Publicar**. Esto dice "cualquiera puede leer y escribir estas
   carpetas de datos, y nada más" — es decir, el mismo trato de
   confianza que ya elegisteis al no poner contraseña: quien tenga el
   enlace, entra. Si más adelante quieres una capa extra de protección
   (por ejemplo, un PIN compartido), dímelo y te lo añado.

   > **Si ya tenías la app funcionando y solo actualizas:** vuelve a esta
   > pantalla de Reglas en tu proyecto de Firebase ya existente y sustituye
   > lo que haya por el bloque de arriba (ahora incluye `recurrentes` y
   > `presupuestos`, que antes no existían). Sin este paso, los gastos
   > recurrentes y los presupuestos no se podrán guardar.

6. Vuelve a la pantalla principal del proyecto (icono de engranaje ⚙️
   arriba a la izquierda → **Configuración del proyecto**). Baja hasta
   **Tus apps** y pulsa el icono `</>` (Web) para añadir una app web.
7. Ponle un nombre (por ejemplo `app`). **No marques** la casilla de
   configurar Firebase Hosting — no la necesitamos, vamos a usar GitHub
   Pages. Pulsa **Registrar app**.
8. Firebase te muestra un bloque de código con algo así:

   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "nuestras-finanzas-xxxx.firebaseapp.com",
     projectId: "nuestras-finanzas-xxxx",
     storageBucket: "nuestras-finanzas-xxxx.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```

   **Copia esos seis valores** (o deja la pestaña abierta) — los necesitas
   en el siguiente paso. No son secretos: es normal y seguro que aparezcan
   en el código de la página (identifican el proyecto, no dan acceso por
   sí solos — el acceso real lo controlan las reglas del paso 5).

## Parte 2 — Pegar tu configuración en el archivo de la app

9. Abre el archivo `index.html` que te he enviado con un editor de texto
   sencillo (en Windows, Notepad vale; en Mac, TextEdit en modo texto
   plano).
10. Busca el bloque cerca del principio que dice:

    ```js
    const firebaseConfig = {
      apiKey: "PEGA_AQUI_apiKey",
      authDomain: "PEGA_AQUI_authDomain",
      projectId: "PEGA_AQUI_projectId",
      storageBucket: "PEGA_AQUI_storageBucket",
      messagingSenderId: "PEGA_AQUI_messagingSenderId",
      appId: "PEGA_AQUI_appId"
    };
    ```

    Sustituye cada `"PEGA_AQUI_..."` por el valor correspondiente que
    copiaste en el paso 8 (manteniendo las comillas). Guarda el archivo
    sin cambiar su nombre (`index.html`).

## Parte 3 — Publicar el archivo (GitHub Pages)

11. Entra en **[github.com](https://github.com)** y crea una cuenta
    gratuita si no tienes (Sign up, con tu email).
12. Pulsa el botón verde **New** (o el `+` de arriba a la derecha →
    "New repository") para crear un repositorio nuevo. Ponle un nombre
    (por ejemplo `nuestras-finanzas`), déjalo como **Public**, no marques
    ninguna otra opción, y pulsa **Create repository**.

    > Que el repositorio sea "público" solo significa que el *código* de
    > la app es visible si alguien busca en GitHub — vuestros datos
    > (movimientos, importes...) no están ahí, viven en Firebase y no
    > aparecen en este repositorio en ningún momento.

13. Dentro del repositorio recién creado, pulsa **Add file → Upload
    files**, y arrastra los **5 archivos** que te he enviado a la vez:
    `index.html` (ya editado con tu configuración), `manifest.json`,
    `sw.js`, `icon-192.png` e `icon-512.png`. Pulsa **Commit changes**
    abajo. (Los tres últimos son los que hacen que la app se pueda
    "instalar" en el móvil y funcione sin conexión — sin ellos la app
    sigue funcionando igual, solo que sin esa parte.)
14. Ve a la pestaña **Settings** del repositorio → en el menú lateral,
    **Pages**. En "Source" elige **Deploy from a branch**, rama `main`,
    carpeta `/ (root)`, y pulsa **Save**.
15. Espera uno o dos minutos y recarga esa misma página de Settings → Pages.
    Arriba te aparecerá la dirección pública, algo como:

    `https://tu-usuario.github.io/nuestras-finanzas/`

    Esa es la única dirección que necesitáis a partir de ahora.

## Parte 4 — Probarla

16. Abre esa dirección tú primero, elige **Sergio**, y comprueba que salen
    los movimientos históricos (la primera visita los importa
    automáticamente, igual que hacía la versión anterior).
17. Pásale el mismo enlace a Carmen — lo abre, elige **Carmen**, y ya está:
    sin usuario de Claude, sin contraseña, sin permisos que pedir.
## Parte 5 — Instalarla como app en el móvil (opcional)

Esto solo funciona una vez la app ya está publicada en su enlace de
`https://...github.io/...` (Partes 1 a 4 hechas) — no funciona abriendo el
archivo directamente desde el ordenador. Los pasos cambian según el
teléfono:

**Android (Chrome):**
1. Abre el enlace de la app en Chrome.
2. Toca los tres puntos (⋮) arriba a la derecha.
3. Toca **Instalar aplicación** (a veces Chrome ya te lo sugiere solo,
   con un aviso o un icono de instalar en la barra de direcciones).
4. Confirma en el aviso que aparece.
5. El icono queda en tu pantalla de inicio / cajón de apps, como cualquier
   otra app.

**iPhone / iPad (tiene que ser desde Safari, no desde Chrome):**
1. Abre el enlace de la app en **Safari**.
2. Toca el icono de compartir (el cuadrado con la flecha hacia arriba),
   abajo en el centro de la pantalla.
3. Baja en la lista de opciones y toca **Añadir a pantalla de inicio**.
4. Puedes ajustar el nombre que verás bajo el icono; toca **Añadir**
   arriba a la derecha.
5. El icono queda en tu pantalla de inicio. Ábrela desde ahí (no desde
   Safari) para que se abra a pantalla completa, sin la barra del
   navegador.

Una vez instalada, la primera vez que la abras necesita conexión (para
traer los datos), pero después puedes añadir, editar o borrar movimientos
sin cobertura: se guardan en el móvil y se sincronizan solos en cuanto
recuperas señal.

---

## Si más adelante quiero cambiar algo de la app

Dímelo y te preparo los archivos actualizados con el cambio ya hecho.
Solo tienes que repetir el paso 13 (**Add file → Upload files**) en el
mismo repositorio para sustituir lo que cambie — el enlace no cambia, y
los datos tampoco se tocan (viven en Firebase, no en los archivos). Si el
cambio añade alguna colección de datos nueva te lo diré explícitamente,
porque además de subir el archivo hay que ampliar las reglas de
Firestore (paso 5) — como ha pasado con esta actualización.

## Resumen de costes

| Servicio | Qué guarda | Coste |
|---|---|---|
| Firebase (plan Spark) | Los datos: movimientos, liquidaciones | 0 €, hasta 50.000 lecturas y 20.000 escrituras **al día** — vosotros dos apuntando gastos a mano no os acercaréis ni de lejos |
| GitHub Pages | El archivo de la app y el enlace público | 0 €, sin límite de tiempo |

Si algún día esto creciera muchísimo (no va a pasar con un uso normal de
dos personas), Firebase pasaría a cobrar solo por lo que exceda esas
cuotas — nunca de golpe ni sin aviso.

---
Sources (Firebase/GitHub Pages, consultadas hoy):
- [Firebase Pricing](https://firebase.google.com/pricing)
- [Cloud Firestore quickstart](https://firebase.google.com/docs/firestore/quickstart)
- [Add Firebase to your JavaScript project](https://firebase.google.com/docs/web/setup)
- [Firebase API keys — are they safe to expose?](https://firebase.google.com/docs/projects/api-keys)
- [GitHub Pages quickstart](https://docs.github.com/en/pages/quickstart)
