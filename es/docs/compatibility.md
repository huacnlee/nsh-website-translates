---
title: "Compatibilidad hacia atrás"
description: "Cómo Native Shell mantiene las aplicaciones funcionando entre versiones: qué promete una versión compatible, el registro en nsh-compat que contiene cada cambio en ella, el flujo de publicación y cómo añadir, renombrar o cambiar una API."
order: 22
group: delivery
source_hash: 431c24b579dd57ba
---


# Compatibilidad hacia atrás

Las apps host descargan las apps NSH como [paquetes firmados](./signed-packages.md) y las ejecutan como plugins, y una app ya publicada puede no volver a compilarse nunca: su equipo pasó a otra cosa, su código fuente está dentro de un proceso de negocio y la app host actualizó NSH según su propio calendario. Por eso Native Shell mantiene una promesa a cada app: **una app compilada para una versión compatible se ejecuta sin cambios en todas las versiones posteriores.** Una app que deja de funcionar tras una actualización de NSH es un error de NSH.

Esta página describe la promesa, cómo se hace cumplir y cómo cambiar NSH sin romperla.

<a id="what-an-app-can-rely-on"></a>

## En qué puede confiar una app

La promesa cubre todo lo que toca una app compilada:

| Parte | Por qué importa |
| --- | --- |
| Las exportaciones de cada módulo (`nsh`, `nsh/*`, `nsh/base`, los módulos estándar) y sus miembros | Un bundle las importa por nombre: si falta un nombre, la app no arranca. |
| `nsh:rt`, las funciones a las que llama el JSX compilado | Cada bundle lleva la salida del compilador que lo construyó. |
| Los globales (temporizadores, `fetch`, `console`, ...) y sus miembros | Las apps los llaman por nombre. |
| Props de elementos, eventos y sus payloads, claves de estilo y sus valores | Las apps los pasan por nombre; una prop renombrada se ignora, así que la app funciona mal. |
| Utilidades y variantes de Tailwind | Las clases se resuelven en tiempo de ejecución a partir de las cadenas del bundle. |
| Comportamiento: valores por defecto, unidades, payloads, el orden de los callbacks | Una app depende de lo que vio cuando se escribió. |
| Las declaraciones de TypeScript (`.nsh/types`) | El código fuente de una app antigua sigue pasando la comprobación de tipos cuando su equipo corrige un error. |
| El formato de paquete y sus firmas | Un paquete firmado para una versión anterior sigue verificándose. |

Las reglas que lo garantizan:

1. **Lo que una versión publicó se queda.** Ningún módulo, exportación, miembro, prop, evento, clave de payload, clave de estilo o valor, utilidad de Tailwind, global o función de `nsh:rt` desaparece.
2. **Un cambio de nombre conserva el nombre antiguo** como alias de la misma implementación, marcado con `@deprecated` y el nombre nuevo, para siempre. Mover una exportación a otro módulo también la conserva en el antiguo.
3. **Los tipos solo se amplían.** Una unión gana alternativas, una función gana sobrecargas o parámetros opcionales al final, un parámetro pasa a ser opcional; lo que las apps pasan (props, estilos, opciones) solo gana miembros opcionales. Los valores que lee una app crecen del mismo modo: `platform.os` gana una plataforma, un estado o un motivo gana un caso. Un caso que la app ya vio conserva su valor, y la app gestiona un valor que no conoce, con el `default` de un `switch`:

   ```tsx
   switch (platform.os) {
     case "ios":
     case "android":
       return <MobileLayout />;
     default:
       // The desktops, the web, and platforms NSH adds later.
       return <WideLayout />;
   }
   ```
4. **El comportamiento se conserva.** El comportamiento nuevo es opcional (opt-in), mediante una nueva prop, opción o valor.
5. **`nsh:rt` solo crece**, y cada función mantiene su firma y su significado.
6. **Los formatos se leen para siempre.** Los paquetes, certificados, listas de revocación y `app.json` de versiones anteriores los leen las versiones posteriores; un paquete indica el runtime mínimo que necesita (`nsh publish --min-runtime`).
7. **La seguridad es la única excepción.** Una capacidad que no se puede mantener segura se cierra, se lista con su motivo y se nombra en las notas de la versión.

La promesa empieza en la primera versión registrada como compatible y se mantiene para siempre, sea cual sea el número de versión. Entre versiones, una API que solo tiene `main` aún puede cambiar.

<a id="how-it-is-enforced"></a>

## Cómo se hace cumplir

Lo que las versiones congelaron vive en su propio repositorio, [longbridge/nsh-compat](https://github.com/longbridge/nsh-compat), separado del código de NSH. Un cambio en NSH se ejecuta contra él y no puede editarlo: un pull request que renombra una API no puede reescribir también el registro de esa API.

```
nsh                                       nsh-compat
├─ crates/          the code              ├─ releases/v<version>/   one per compatible release, never changed
└─ tests/compat/    apps that test the    │  ├─ runtime.txt         every export, global and nsh:rt function
   ├─ cases/        API being written     │  ├─ types/              the declarations apps build against
   └─ examples/                           │  ├─ tailwind.txt        every Tailwind class and what it sets
                                          │  └─ apps/               the test apps as that release built them
                                          ├─ closed.txt             security closures, each with its reason
                                          └─ src/                   the checks
```

Cada pull request a NSH ejecuta las comprobaciones de `nsh-compat` contra su checkout (el workflow **Compat**, o `cargo xtask compat` en local):

| Comprobación | Qué la supera |
| --- | --- |
| `checkout_apps_run` | Las apps de `tests/compat/`, compiladas por este checkout, hacen lo que dicen sus scripts, y cada parte de la API que un script afirma comprobar se comprueba realmente. |
| `nothing_released_is_removed` | Todo lo que ofrecía cada versión registrada (exportaciones, miembros y sus tipos, declaraciones, clases de Tailwind y lo que establecen) se sigue ofreciendo, igual o ampliado. |
| `released_apps_run` | Las apps que compiló cada versión registrada, tal como las compiló su compilador, arrancan en este runtime y hacen lo que dicen sus scripts. |

La primera comprobación prueba la API que se está escribiendo; las otras dos sostienen cada versión que se registró. El cambio de nombre de una API publicada falla así:

```
v0.2.0: runtime [nsh] Platform: removed
Keep it: a rename keeps the old name as a @deprecated alias of the new one, a type only widens.
```

`nsh-compat` lo revisan los maintainers de NSH, y su propio CI lo ejecuta contra `main` de NSH.

<a id="the-release-flow"></a>

## El flujo de lanzamiento

1. **Desarrollar.** Una API llega a `main` con un caso en `tests/compat/` cuyo script la comprueba. Hasta que una versión la registra, puede renombrarse o remodelarse; el caso cambia con ella.
2. **Registrar.** En una versión, `cargo xtask compat record <version>` escribe `releases/v<version>/` en un checkout de `nsh-compat`: la superficie que ofrece la versión y cada app de `tests/compat/` compilada por su compilador, con sus scripts. Solo registra una API cuyas partes comprueba todas un script.
3. **Congelar.** El registro se fusiona mediante un pull request de `nsh-compat`. Desde entonces, cada cambio de NSH se contrasta con él, junto con todos los registros anteriores.

<a id="developing-within-the-promise"></a>

## Desarrollar dentro de la promesa

<a id="adding-an-api"></a>

### Añadir una API

Cada nueva exportación, global, prop, evento o clave de estilo viene con un caso:

1. Escribe un módulo `tests/compat/cases/<domain>/<case>.tsx` cuya exportación por defecto sea un componente que use la API y muestre su resultado. Los dominios son `base`, `core`, `events`, `layout`, `paint`, `props`, `modules` y `web`, además de `android`, `macos` y `browser` para lo que decide una plataforma o un ajuste de `nsh.json`.
2. Añádelo al `App.tsx` del dominio, que muestra un caso cada vez.
3. Añade los pasos al `script.txt` del dominio: `tap id:case-<case>`, luego los pasos que comprueban lo que hace la API, y un paso `covers <item>` por cada parte que añade.
4. Ejecuta `cargo xtask compat` (`NSH_COMPAT_APP=<domain>` ejecuta un dominio).

```txt
# props-media-video
tap id:case-props-media-video
prop id:clip src https://example.com/clip.mp4
prop id:clip paused true
tap id:play
prop id:clip paused false
covers [props] src
covers [props] paused
```

Un paso `covers` se verifica: la app debe usar el elemento y, para una prop, un evento o una clave de estilo, quitarlo de la app compilada debe hacer fallar un paso del script. Los elementos se nombran `[<module>] <export>`, `[globals] <name>`, `[props] <name>`, `[events] <name>`, `[styles] <name>`, los propios de un componente como `[props] <Component>.<name>`, y las props de una plataforma como `ios.<name>`, `android.<name>`, `desktop.<name>`, `web.<name>`.

<a id="renaming-or-moving-an-api"></a>

### Renombrar o mover una API

Añade el nombre nuevo y conserva el antiguo como alias de la misma implementación, declarado `@deprecated` con el nombre nuevo. Actualiza el caso y su script al nombre nuevo. Una API que ninguna versión ha registrado todavía simplemente se renombra.

<a id="changing-a-type"></a>

### Cambiar un tipo

Amplíalo: más alternativas en una unión, más sobrecargas, parámetros opcionales al final, nuevos miembros opcionales de lo que las apps pasan. Una unión que las apps leen gana miembros del mismo modo, cada nuevo miembro para un caso nuevo. Los nombres de los parámetros pueden cambiar libremente; su número, su opcionalidad y sus tipos se mantienen.

<a id="changing-behavior"></a>

### Cambiar el comportamiento

Conserva el comportamiento antiguo y añade el nuevo detrás de una nueva prop, opción o valor. Una corrección de error que cambia lo que ve una app que funciona también es un cambio de comportamiento: ponla detrás de un opt-in, o asegúrate de que ninguna app pueda depender del resultado antiguo. Da al comportamiento un paso en un caso, para que se mantenga tal como está.

<a id="changing-the-compiler"></a>

### Cambiar el compilador

Nada adicional: las apps de cada versión se quedan tal como las compiló el compilador de esa versión, y los casos los compila de nuevo el tuyo. Las funciones que emite en los bundles (`nsh:rt`) solo crecen.

<a id="closing-an-api-for-security"></a>

### Cerrar una API por seguridad

Un pull request de `nsh-compat` añade la entrada a su `closed.txt` con el motivo (`<entry> -- <reason>`, la entrada tal como la informa la comprobación), y se integra primero; después, el cambio de NSH que elimina la API lo supera. Las notas de la versión explican por qué.

## Scripts

Un `script.txt` es un paso por línea. Pasos que actúan: `tap <selector>`, `type <selector> <text>`, `key <selector> <key>`, `scroll <selector> <x> <y>`, `touch start|move|end|cancel`, `event <selector> <onEvent>
[<key>=<value>...]`, `wait <ms>`, `keyboard <height> <duration>`, `pixelratio <ratio>`. Pasos que comprueban: `expect <text>`, `absent <text>`, `frame <selector> <x> <y> <width> <height>`, `origin`, `prop` / `noprop`, `style` / `nostyle`, `listens`, `state`, `statusbar`, `log <text>`. Las primeras líneas pueden configurar la pantalla: `viewport <w> <h>`, `platform <os> [desktop]`, `fontscale <scale>`. Un selector es `id:<testID>`, `label:<label>`, `text:<text>` o `span:<text>`; las props y los estilos se escriben como los escriben las apps (`style id:card backgroundColor #3366ffff`). `NSH_COMPAT_DUMP=1` imprime lo que cada paso añade a la pantalla y lo que quita de ella, para ayudar a escribir un script.

<a id="commands"></a>

## Comandos

```sh
cargo xtask compat                      # the checks against this checkout
NSH_COMPAT_APP=props cargo xtask compat -v
cargo xtask compat record 0.2.0         # at a release: record it in nsh-compat, then open a pull request there
```

`cargo xtask compat` mantiene un checkout de `nsh-compat` en `target/nsh-compat/` y lo actualiza en cada ejecución; uno con cambios propios se usa tal cual, de modo que un cambio en las comprobaciones se puede probar contra NSH antes de su pull request.
