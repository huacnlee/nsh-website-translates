---
title: "iOS"
description: "Ejecuta aplicaciones NSH en Rust y TSX en iOS con vistas de UIKit, en el simulador o en dispositivos, empaquétalas como .app y .ipa, e intégralas en una aplicación iOS existente con AppView o con NshAppView de NativeShell.xcframework."
order: 11
group: platforms
source_hash: d33e715d25f83ce4
---


# iOS

Las apps NSH se ejecutan en iOS con vistas UIKit y texto CoreText, en dispositivos y en el simulador, desde iOS 15.0. Las apps completas se ejecutan y se empaquetan igual que en las demás plataformas, y una app existente puede mostrar apps NSH en sus propias vistas: una raíz de Rust que enlaza o TSX que carga, incluidos los paquetes firmados que descarga, con los límites y las capacidades que ella establece. En iOS, `os()` es `Os::Ios` (`platform.os` es `"ios"` en TSX) y se aplican las props `ios={{…}}` de TSX.

<a id="requirements"></a>

## Requisitos

- **Xcode** en un Mac, con un runtime de simulador de iOS (`xcodebuild -downloadPlatform iOS` instala uno). Consulta
  [Instalación](./installation.md#ios-and-mac-catalyst).
- Las apps necesitan **iOS 15.0** o posterior, en iPhone y iPad.

<a id="running-an-app"></a>

## Ejecutar una app

Una app de Rust se ejecuta desde su directorio; una app TSX indica su entrada:

```sh
nsh run --target ios                                  # a Rust app
nsh run --target ios --device "iPhone 16 Pro"
nsh run App.tsx --target ios                          # a TSX app
```

`nsh` usa un simulador ya iniciado, o inicia el iPhone más reciente. Para una app de Rust, compila el runner propio de la app con tu crate, lo instala y muestra sus registros en el terminal; un cambio en el código Rust del crate lo compila de nuevo y reinicia la app. Para una app TSX, instala el host de desarrollo y mantiene la app actualizada a medida que guardas, con los registros en el terminal. `--device` elige un simulador por nombre o UDID. Para un ciclo más rápido sin simulador, `nsh run --target catalyst` en un Mac abre el mismo backend UIKit en una ventana de [Mac Catalyst](./getting-started.md#mac-catalyst) del tamaño de un iPhone.

<a id="packaging"></a>

## Empaquetado

```sh
nsh package --target ios-simulator --run      # .nsh/out/<Name>.app, installed and launched in the simulator
nsh package --target ios --sign "Apple Distribution: Example Inc (ABCDE12345)" --profile AppStore.mobileprovision
```

Desde el directorio de una app de Rust, la app es el runner de iOS compilado con tu crate; una app TSX indica su entrada
(`nsh package App.tsx --target ios-simulator --run`).

`--target ios` escribe un `.ipa` firmado para dispositivos, TestFlight o la App Store. Identidades de firma, perfiles de aprovisionamiento e iconos: [Empaquetado](./packaging.md#ios-devices).

<a id="embedding-in-an-ios-app"></a>

## Integrar en una app de iOS

Una app de iOS existente puede mostrar apps NSH dentro de su propia interfaz. Una app de iOS con código Rust enlaza tu crate y el crate `nsh-platform-ios` y muestra tu raíz en un `AppView` ([Integrar una app de Rust](#embedding-a-rust-app)). Una app de Swift enlaza `NativeShell.xcframework`, un framework con un módulo de Swift: creas un `NshAppView` (un `UIView`), lo añades en cualquier punto de tu jerarquía de vistas y cargas en él una app TSX o un paquete firmado. Tus pantallas nativas, la navegación y la app NSH conviven en una única jerarquía UIKit.

Cada vista es un motor independiente; no hay singletons globales, de modo que una app puede mostrar varias apps NSH a la vez, por ejemplo una por pestaña.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/host-app-light.svg" alt="One host app with two NshAppView regions: each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
<img class="diagram diagram-dark" src="/diagrams/host-app-dark.svg" alt="One host app with two NshAppView regions: each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
</div>

<a id="embedding-a-rust-app"></a>

## Integrar una app de Rust

`nsh_platform_ios::AppView` es un motor como `UIView` para una app de iOS creada con Rust: monta el componente raíz de tu crate, sin ninguna VM de JavaScript.

```rust
use nsh_platform_ios::{set_ui_sets, AppView, Root, SurfaceOptions};
use objc2::MainThreadMarker;
use objc2_ui_kit::UIView;

fn show(container: &UIView) -> AppView {
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let mtm = MainThreadMarker::new().expect("main thread");
    let app = AppView::new(mtm, container.bounds(), SurfaceOptions::default());
    container.addSubview(app.view());
    app.run(Root::of::<my_app::App>());
    // Keep the AppView: dropping it stops the app.
    app
}
```

La vista cambia de tamaño con su supervista. `AppView::run` sustituye lo que se estuviera ejecutando; `AppView::load` ejecuta en su lugar un bundle TSX (`Bundle::source`, o `unsafe { Bundle::bytecode(bytes) }` para un `bundle.nshc` en el bundle de la app). `SurfaceOptions` contiene los límites, las capacidades concedidas, el directorio de datos y los componentes nativos, igual que los miembros de `NshAppView` más abajo; `AppView::set_locale`, `set_font_scale` y `set_error_handler` equivalen a `locale`, `fontScale` y `onError`. `nsh package --target ios` compila por ti este tipo de app, con tu raíz montada.

<a id="get-the-framework"></a>

## Obtener el framework

La distribución contiene ambas variantes:

```text
dist/nsh/embed/ios/NativeShell.xcframework      release: bundles and signed packages
dist/nsh/embed/ios/NativeShellDev.xcframework   also connects to a `nsh dev` server
```

Desde una copia de trabajo de NSH puedes compilar solo los frameworks:

```sh
cargo xtask ios-embed    # writes dist/nsh/embed/ios/{NativeShell,NativeShellDev}.xcframework
```

La compilación por defecto produce frameworks estáticos. Para compilar frameworks dinámicos, usa:

```sh
cargo xtask ios-embed --dynamic
```

Los frameworks dinámicos dan al runtime su propia imagen de biblioteca y su propia tabla de desenrollado, lo que admite apps anfitrionas que ya enlazan otros runtimes de Rust. Elige el ajuste de incrustación de Xcode que aparece abajo según el framework que compiles.

Por defecto, cada XCFramework tiene tres slices arm64: dispositivos iOS, el simulador de iOS (Apple silicon) y Mac Catalyst. El destino de despliegue mínimo es iOS 15.0. El módulo de Swift se compila con library evolution, por lo que las apps compiladas con otras versiones del compilador de Swift pueden importarlo, y el framework enlaza todo lo que necesita: no tienes que añadir nada más.

<a id="add-it-to-an-xcode-project"></a>

## Añadirlo a un proyecto de Xcode

1. Arrastra `NativeShell.xcframework` (o `NativeShellDev.xcframework` para las compilaciones de desarrollo) a **Frameworks, Libraries, and Embedded Content** del target de la app. Elige **Do Not Embed** para los frameworks estáticos por defecto, o **Embed & Sign** para los frameworks dinámicos compilados con `--dynamic`.
2. En Swift, `import NativeShell`.
3. En el `Info.plist` de la app, establece `CADisableMinimumFrameDurationOnPhone` en `YES`: en los iPhone con ProMotion, las animaciones de la app se mueven entonces a 120 Hz, igual que el desplazamiento (las apps compiladas por `nsh package` ya lo tienen).

> [!TIP]
> Enlaza `NativeShellDev.xcframework` en la configuración Debug y `NativeShell.xcframework` en Release, para que solo las compilaciones de desarrollo puedan conectarse a un servidor de desarrollo.

<a id="ship-a-bundle-with-the-app"></a>

## Incluir un bundle con la app

Una app de Swift distribuye las apps TSX como bundles. Compila la app NSH en una carpeta y añade esa carpeta a los recursos de la app como referencia de carpeta con el nombre `nsh`:

```sh
nsh build App.tsx --release --out MyApp/nsh
```

`nsh build` escribe:

| Archivo | Contenido |
|---|---|
| `bundle.nshc` | La app compilada a bytecode: la que carga más rápido. |
| `bundle.js` | La misma app como código fuente JS. |
| `bundle.js.map` | Su source map (las trazas de pila apuntan a tus archivos `.tsx`). |
| `capabilities.json` | Las [capacidades](./sandbox-and-capabilities.md) que declara la app, cuando `nsh.json` tiene alguna. |
| `assets/` | Las imágenes y fuentes que importa la app, en sus rutas relativas a la entrada. |

<a id="show-the-app"></a>

## Mostrar la app

```swift
import NativeShell
import UIKit

final class EmbedController: UIViewController {
    private let app = NshAppView()

    override func viewDidLoad() {
        super.viewDidLoad()
        app.translatesAutoresizingMaskIntoConstraints = false
        app.onError = { message in print("nsh error: \(message)") }
        view.addSubview(app)
        NSLayoutConstraint.activate([
            app.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            app.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            app.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            app.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])

        guard let url = Bundle.main.url(forResource: "bundle", withExtension: "nshc", subdirectory: "nsh") else { return }
        do {
            try app.loadBundle(at: url)
        } catch {
            print("cannot load: \(error)")
        }
    }

    // Let the embedded app's pages and dialogs decide the status bar.
    override var preferredStatusBarStyle: UIStatusBarStyle { NshAppView.preferredStatusBarStyle }
    override var prefersStatusBarHidden: Bool { NshAppView.prefersStatusBarHidden }
    override var preferredStatusBarUpdateAnimation: UIStatusBarAnimation {
        NshAppView.preferredStatusBarUpdateAnimation
    }
}
```

El tamaño de la vista es la ventana de la app: NSH maquetea la app en los límites de la vista y vuelve a hacerlo cada vez que cambian. Cargar de nuevo sustituye la app en ejecución; la app se detiene cuando la vista se libera.

El ejemplo completo, una app UIKit que muestra una app NSH debajo de su propia cabecera nativa, es `examples/embed-ios/main.swift`.

## `NshAppView`

`NshAppView` es una subclase de `UIView` aislada al main actor.

| Miembro | Descripción |
|---|---|
| `init(frame: CGRect = .zero, trace: Bool = false)` | Crea la vista. `trace` registra el tiempo de cada commit. `init?(coder:)` admite storyboards y nibs. |
| `onError: ((String) -> Void)?` | Recibe los errores fatales de la app (un bundle que no se carga, excepciones JS no capturadas, una VM detenida por un límite) en el hilo principal. Los errores siempre se registran; las compilaciones de desarrollo además los muestran sobre la app. |
| `limits: NshLimits` | Los límites de la VM de las apps que se carguen a partir de ahora. |
| `grantCapabilities(_ json: String?) throws` | Lo máximo que pueden hacer las apps que se carguen a partir de ahora, como JSON con la forma del `capabilities` de `nsh.json`; `nil` concede lo que declara cada app. Lanza `NshError` si el JSON no es válido. |
| `locale: Locale?` | El idioma y la región de la app en lugar de los del usuario: `Intl`, `locale()` y los componentes lo siguen de inmediato, y las apps que se carguen después empiezan con él. `nil` sigue el del sistema. |
| `fontScale: CGFloat?` | El tamaño de texto en lugar del de Dynamic Type (1 es el valor por defecto): los textos y los campos de entrada se maquetean de nuevo con él y `fontScale()` lo lee, de inmediato y para las apps que se carguen después; las longitudes mantienen su tamaño. `nil` sigue el del sistema. |
| `setThemeOverrides(_ json: String?) throws` | La marca del host sobre el [tema](./tailwind.md#theme-tokens) de la app: un archivo de tema con el formato del `"theme"` de `nsh.json`. Sus tokens prevalecen sobre los de la app con los mismos nombres, en modo claro y oscuro, y los demás tokens de la app se mantienen. Se aplica de inmediato y a las apps que se carguen después; `nil` devuelve a la app su propio tema. Lanza `NshError` si el archivo no se puede analizar. |
| `storageDirectory: URL?` | Dónde guardan su [almacenamiento](../modules/nsh.md#storage) las apps que se carguen a partir de ahora; `nil`: `Library/Application Support/nsh/<app id>`, según el id propio de la app. |
| `cacheOptions: NshCacheOptions` | Dónde guardan sus cachés las apps que se carguen a partir de ahora, las [imágenes que descargan](./images-and-assets.md#kept-on-disk), y cuánto conserva cada una: `location` `.system` (`Library/Caches/nsh`, cada app en `<app id>`), `.directory(URL)` o `.off`; `images` `.default` (256 MB), `.maxSize(megabytes:)` o `.off`. |
| `loadBundle(at url: URL) throws` | Ejecuta un bundle escrito por `nsh build`. Los recursos provienen de `assets/` junto a él; también se leen `bundle.js.map` y `capabilities.json` junto a él. |
| `run(_ package: NshPackage)` | Ejecuta un paquete firmado verificado (véase más abajo). Un paquete se ejecuta una sola vez. |
| `loadPackage(at:trust:) async throws -> NshPackage.Info` | Verifica el paquete de una URL fuera del hilo principal y luego lo ejecuta. Lanza el motivo por el que fue rechazado; la app en ejecución se mantiene. |
| `connectDevServer(_ url: URL) throws` | Desarrollo: carga desde un servidor `nsh dev` y recarga con cada cambio. Lanza un error con `NativeShell.xcframework`, que no tiene soporte de desarrollo. |
| `register(component:_:)` | Registra un [componente nativo](./native-components.md). |
| `params: [String: Any]` | Los parámetros de inicio de las apps que se carguen a partir de ahora: la app los lee al arrancar como `host.params` ([`host`](../modules/nsh.md#host)). |
| `send(_ name: String, _ data: Any? = nil)` | Envía un evento a la app (`host.on(name, …)`); se conserva hasta que la app lo escucha, o para la siguiente app mientras no haya ninguna en ejecución. |
| `handle(_ name: String, _ handler:)` | Gestiona las llamadas (`host.call`) y los envíos (`host.post`) de la app a `name` en el hilo principal: `{ data, reply in … }`, o una función `async throws` `{ data in … }` cuyo resultado responde a la llamada. |
| `removeHandler(_ name: String)` | Elimina el manejador de `name`: las llamadas de la app a él fallan de inmediato. |
| `static preferredStatusBarStyle`, `prefersStatusBarHidden`, `preferredStatusBarUpdateAnimation` | Lo que han pedido las apps en ejecución (`statusBar` de sus páginas y diálogos, el valor por defecto de `nsh.json`): devuélvelos desde los overrides del view controller anfitrión. |

> [!IMPORTANT]
> `bundle.nshc` (bytecode) solo se carga desde dentro del bundle de la app. QuickJS no valida el bytecode, así que el bytecode de cualquier otro origen podría corromper la memoria: para un archivo fuera del bundle de la app, carga `bundle.js` (código fuente JS) o, mejor aún, un [paquete firmado](./signed-packages.md).

`limits`, `grantCapabilities`, `storageDirectory` y `cacheOptions` se aplican desde la siguiente carga: establécelos antes de `loadBundle` / `run`.

Cada app guarda su almacenamiento bajo su propio id sin ningún ajuste: un paquete firmado bajo el id que avala el certificado de su clave de publicación, un bundle bajo el `id` de su `nsh.json` (`app.json` junto a él, escrito por `nsh build`). Establece `storageDirectory` para guardar los datos de una app en el lugar que elija el host:

```swift
app.storageDirectory = FileManager.default
    .urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
    .appendingPathComponent("nsh/com.example.orders")
try app.loadBundle(at: url)
```

<a id="talking-to-the-app"></a>

## Comunicarse con la app

La vista y la app que ejecuta se comunican a través de un canal propio ([`host`](../modules/nsh.md#host)): parámetros de inicio que la app lee al arrancar, eventos de la app anfitriona, y llamadas y envíos de la app, con datos JSON (objetos de Foundation de este lado). No necesita ninguna vista en la app ni ningún componente nativo.

```swift
// Before loading: what the app opens first (`host.params` in TSX).
app.params = ["conversation": notification.conversationID]
try app.loadBundle(at: url)

// The app's `await host.call("user.profile", { id })`: return the answer, or throw to reject it.
app.handle("user.profile") { data in
    let id = (data as? [String: Any])?["id"] as? Int ?? 0
    let profile = try await api.profile(id: id)
    return ["id": id, "name": profile.name]
}

// A handler that answers later, from any thread, with its reply.
app.handle("photo.pick") { _, reply in
    picker.present { url in
        if let url { reply.resolve(url.absoluteString) } else { reply.reject("cancelled") }
    }
}

// The app's `host.post("analytics", …)`: no answer.
app.handle("analytics") { data, _ in analytics.log(data) }

// Later: the app hears `host.on("conversation.open", …)`.
app.send("conversation.open", ["id": tapped.conversationID])
```

Los manejadores se ejecutan en el hilo principal; una llamada espera su respuesta en la app sin bloquear ninguno de los dos lados. Una respuesta que se libera sin haberse respondido hace fallar la llamada, y una llamada a un nombre sin manejador falla de inmediato. Los eventos de nombres que la app aún no escucha se conservan hasta que lo haga, y los eventos enviados mientras no hay ninguna app en ejecución (antes de `loadBundle`, durante una recarga) pasan a la siguiente, de modo que una notificación pulsada mientras la app arranca aun así le llega.

<a id="theme-overrides"></a>

## Sustituciones del tema

Una app integrada en varias apps anfitrionas con marca propia adopta la marca de cada una: el host indica los tokens que cambia su marca, como un archivo de tema con el formato del `"theme"` de `nsh.json` (el `cssVars` de shadcn/ui, con valores tal como los escribe CSS). Prevalecen sobre los tokens de la app con los mismos nombres; los demás tokens de la app se mantienen. Da a un token su valor para modo oscuro bajo `dark` (un token definido solo bajo `light` o `theme` tiene ese color en ambos modos):

```swift
try app.setThemeOverrides("""
{ "cssVars": {
    "theme": { "radius": "0.75rem" },
    "light": { "primary": "#e11d48", "primary-foreground": "#ffffff" },
    "dark": { "primary": "#fb7185", "primary-foreground": "#1c1917" }
} }
""")
try app.loadBundle(at: url)
```

Llámalo antes o después de cargar: clases como `bg-primary` y `rounded-(--radius)` cambian de estilo de inmediato, y cada app que se cargue después empieza con las sustituciones en su primer fotograma. `setThemeOverrides(nil)` devuelve a la app su propio tema.

<a id="links-the-app-opens"></a>

## Enlaces que abre la app

Las URL que abre la app ([`openUrl`](../modules/nsh.md#openurl), los enlaces de un `TextView` con `links="open"`) llegan primero a `onOpenURL`, en el hilo principal: devuelve `true` cuando la app anfitriona gestionó la URL, por ejemplo enrutándola por su propio router, y `false` para que el sistema la abra con `UIApplication.open`. Sin `onOpenURL`, el sistema abre todas las URL. Las URL le llegan después de que la capacidad `openUrl` de la app las haya permitido.

```swift
app.onOpenURL = { url in
    // The host app's own links open in the host app.
    if url.scheme == "lb" || url.host == "longbridge.com" {
        router.open(url)
        return true
    }
    return false
}
```

<a id="limits"></a>

## Límites

```swift
app.limits = NshLimits(memoryMB: 128, callBudget: 1, maxNodes: 50_000)
```

| Campo de `NshLimits` | Valor por defecto | Significado |
|---|---|---|
| `memoryMB: UInt32?` | 256 | Heap de JS en MB. Quedarse sin memoria detiene la app. |
| `stackKB: UInt32?` | 4096 (también el máximo) | Pila del intérprete en KB. Una recursión más profunda lanza un `RangeError`. |
| `loadBudget: TimeInterval?` | 10 s | Tiempo para evaluar el bundle. |
| `callBudget: TimeInterval?` | 2 s | Tiempo de cualquier otra llamada a JS (un evento, un temporizador, un fotograma). Una llamada que se excede se interrumpe. |
| `maxNodes: UInt32?` | 200 000 | Nodos que la app puede mantener. |

`nil` mantiene el valor por defecto. Qué hace cada límite al alcanzarse: [Sandbox y capacidades](./sandbox-and-capabilities.md).

<a id="capabilities"></a>

## Capacidades

Una app declara a qué puede acceder en su `nsh.json`; la app anfitriona puede conceder menos. Una solicitud debe estar permitida por ambas:

```swift
try app.grantCapabilities("""
{
  "network": { "hosts": ["api.example.com", "*.cdn.example.com"] },
  "webview": { "hosts": ["help.example.com"] }
}
""")
try app.loadBundle(at: url)
```

Aquí la app no puede establecer la barra de estado (no hay `statusBar`), aunque su `nsh.json` lo pida. Detalles: [Sandbox y capacidades](./sandbox-and-capabilities.md).

<a id="signed-packages"></a>

## Paquetes firmados

Para ejecutar código que la app descarga (actualizaciones, mini apps de terceros), usa [paquetes firmados](./signed-packages.md): `nsh publish` escribe un `.nshpkg` firmado con una clave de publicación que tu clave raíz ha certificado, y la app lo verifica antes de ejecutarlo.

```swift
let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
let trust = try NshTrust(stateDirectory: support.appendingPathComponent("nsh"))
try trust.addRoot(rootPublicKey)   // the contents of root.pub from `nsh keygen`

Task {
    do {
        let info = try await app.loadPackage(at: downloadedFile, trust: trust)
        print("running \(info.id) \(info.version) (build \(info.build))")
    } catch {
        print("refused: \(error)")   // the running app stays
    }
}
```

Para verificar primero y ejecutar después, separa los dos pasos:

```swift
let package = try await trust.openPackage(at: downloadedFile)   // verifies off the main thread
// ... decide, ask the user, ...
app.run(package)
```

| API | Descripción |
|---|---|
| `NshTrust(stateDirectory: URL) throws` | Abre o crea el almacén de confianza. Su estado (la lista de revocación más reciente, la compilación más alta aceptada por app) persiste allí, y los recursos de los paquetes se extraen bajo él. No confía en ninguna clave hasta `addRoot`. Es seguro entre hilos. |
| `addRoot(_ publicKey: String) throws` | Confía en una clave pública raíz (base64, el contenido de un archivo `.pub`). Se puede confiar en varias raíces. |
| `updateRevocations(_ json: String) throws` | Aplica una lista de revocación escrita por `nsh revoke`, firmada por una raíz de confianza y más reciente que la que tiene el almacén. |
| `openPackage(at: URL) async throws -> NshPackage` | Verifica, extrae los recursos y acepta el paquete (a partir de entonces se rechazan las compilaciones anteriores de esa app). |
| `NshPackage.info` | `id`, `name`, `version`, `build` de la app que contiene. |
| `NshError` | El error que lanza toda llamada que puede lanzar; `message` indica el motivo. |
<a id="development"></a>

## Desarrollo

Con `NativeShellDev.xcframework`, apunta la vista a un servidor de desarrollo en lugar de a un bundle:

```swift
#if DEBUG
try app.connectDevServer(URL(string: "ws://127.0.0.1:8790/ws")!)
#else
try app.loadBundle(at: bundledURL)
#endif
```

Ejecuta `nsh dev App.tsx` en tu Mac. El simulador comparte la red del Mac, por lo que `127.0.0.1` llega al servidor; un
dispositivo usa la dirección de la red local que imprime `nsh dev` (`devices on this network: ws://192.168.1.20:8790/ws`). Cada guardado
actualiza la app en el momento, los registros aparecen en la terminal de `nsh dev` y los errores se muestran sobre la app. Consulta
[Servidor de desarrollo y depuración](./dev-server-and-debugging.md).

> [!NOTE]
> En un dispositivo, la conexión con tu Mac es tráfico de red local ordinario sobre `ws://` simple y `http://` (recursos).
> Es posible que iOS solicite al usuario acceso a la red local, y la configuración de App Transport Security de la app debe permitirlo.

<a id="notes"></a>

## Notas

- **Hilos.** `NshAppView` está aislado al actor principal. `NshTrust`, `NshPackage` y `NshComponentContext` son seguros para hilos.
  El motor de JS se ejecuta en su propio hilo; el hilo principal nunca espera por él.
- **Barra de estado.** Las páginas y los diálogos de la app embebida (`statusBar`) cambian lo que devuelven `NshAppView.preferredStatusBarStyle` y similares;
  el view controller anfitrión debe reenviarlos, como en el ejemplo anterior.
- **Área segura.** Las apps usan `safe_area()` en Rust, y `env(safe-area-inset-*)` en el padding o
  `safeAreaInsets()` de [`nsh`](../modules/nsh.md#safe-area-and-keyboard) en TSX, como de costumbre. Un `NshAppView` colocado debajo de tu propio encabezado recibe los márgenes que le corresponden, no los de la ventana.
- **Mac Catalyst.** El mismo framework funciona en apps de Catalyst.

<a id="see-also"></a>

## Véase también

- [Compilar con Rust](./rust.md)
- [Integración en apps de Android](./android.md)
- [Componentes nativos](./native-components.md)
- [Paquetes firmados](./signed-packages.md)
- [Sandbox y capacidades](./sandbox-and-capabilities.md)
