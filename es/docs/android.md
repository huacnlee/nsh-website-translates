---
title: "Android"
description: "Ejecuta apps NSH en Rust y TSX en Android con vistas de Android, en un emulador o en un dispositivo, empaquétalas como un .apk e intégralas en una app de Android existente con nsh.aar y NshView."
order: 12
group: platforms
source_hash: 0e8dcab076c0aa59
---


# Android

Las apps NSH se ejecutan en Android con vistas Android normales y texto `StaticLayout`, desde Android 9 (API 28), en `arm64-v8a`,
`armeabi-v7a` y `x86_64`. Las apps completas escritas en Rust y en TSX se ejecutan y se empaquetan igual que en las demás plataformas, y una app existente
puede incrustar módulos en un `NshView` y cargar paquetes firmados que descargue, con los límites y las capacidades que ella establezca. En Android, `os()` es `Os::Android` (`platform.os` es `"android"` en TSX) y las props `android={{…}}` de TSX se aplican.

<a id="requirements"></a>

## Requisitos

- **El Android SDK** (con `platforms;android-35`, build tools y `platform-tools`) y **un JDK**, en macOS, Windows
  o Linux. Consulta [Instalación](./installation.md#android).
- Un emulador, o un dispositivo conectado por `adb`.

<a id="running-an-app"></a>

## Ejecutar una app

Una app Rust se ejecuta desde su directorio; una app TSX indica su punto de entrada:

```sh
nsh run --target android               # a Rust app
nsh run App.tsx --target android       # a TSX app
```

Inicia antes un emulador o conecta un dispositivo (`adb devices` los lista; NSH usa el primero). Para una app Rust, `nsh`
compila el `libnsh.so` de la app con tu crate, instala el APK y lo inicia; un cambio en el código Rust del crate lo compila
e instala de nuevo. Para una app TSX, instala un APK host de desarrollo (que se recompila solo cuando cambia el runtime) y
reenvía el puerto del servidor de desarrollo con `adb reverse`, de modo que funciona por USB sin una red compartida; la app se actualiza a medida que
guardas, con los logs en la terminal.

<a id="packaging"></a>

## Empaquetado

```sh
nsh package --target android --run             # a Rust app: .nsh/out/<Name>.apk, installed and launched
nsh package App.tsx --target android --run     # a TSX app
```

El APK de una app Rust contiene su propio `libnsh.so`, compilado con tu crate, cuya activity monta la raíz.

El APK se compila con las build tools del SDK, sin Gradle, y se firma con la clave de depuración a menos que pases un keystore
de release. Firma para release e iconos: [Empaquetado](./packaging.md#android).

NSH compila `libnsh.so` con alineación ELF de 16 KB y empaqueta las bibliotecas nativas sin comprimir en límites ZIP de 16 KB.
Un APK de release incluye `libnsh.so` sin sus tablas de símbolos ni información de depuración. La biblioteca completa se encuentra junto al
runtime en `symbols/<abi>/libnsh.so` (la de una app Rust, en `.nsh/rust/android-rust-release/symbols/<abi>/`): entrégala a
`ndk-stack` o súbela a Play Console como símbolos de depuración nativos para leer las pilas de fallos nativos.

<a id="embedding-in-an-android-app"></a>

## Incrustar en una app Android

Una app Android existente puede mostrar apps NSH dentro de su propia UI. El runtime se distribuye como una biblioteca Android, `nsh.aar`: creas
un `com.longbridge.nsh.NshView` (un `FrameLayout`), lo añades a cualquier layout y cargas en él una app TSX o un paquete firmado. Una app escrita en Rust se distribuye en Android como el APK que compila `nsh package --target android`. La app NSH
se renderiza con vistas Android normales junto a las tuyas.

Cada `NshView` es un motor independiente con su propia VM de JS; no hay singletons globales, así que varios pueden ejecutarse a la
vez.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/host-app-light.svg" alt="One host app with two nsh views (NshAppView on iOS, NshView on Android): each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
<img class="diagram diagram-dark" src="/diagrams/host-app-dark.svg" alt="One host app with two nsh views (NshAppView on iOS, NshView on Android): each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
</div>

<a id="get-the-library"></a>

## Obtener la biblioteca

La distribución contiene ambas variantes:

```text
dist/nsh/embed/android/nsh.aar       release: bundles and signed packages
dist/nsh/embed/android/nsh-dev.aar   also connects to a `nsh dev` server
```

El AAR contiene el runtime de Java y `libnsh.so` para `arm64-v8a`, `armeabi-v7a` y `x86_64`, con sus símbolos: la
compilación Gradle de la app los elimina al empaquetarla y conserva los símbolos para sus informes de fallos. Declara el
permiso `INTERNET` y requiere **API 28** (Android 9) o superior. Incluye sus reglas R8 (`proguard.txt`), que una
compilación minificada aplica por sí sola: la biblioteca nativa encuentra las clases del runtime por nombre, por lo que `com.longbridge.nsh`
se mantiene tal cual.

Añádelo al módulo de la app, por ejemplo desde una carpeta `libs`:

```kotlin
// app/build.gradle.kts
dependencies {
    debugImplementation(files("libs/nsh-dev.aar"))
    releaseImplementation(files("libs/nsh.aar"))
}
```

<a id="ship-a-bundle-with-the-app"></a>

## Incluir un bundle con la app

Compila la app TSX en los assets de la app:

```sh
nsh build App.tsx --release --out app/src/main/assets/nsh
```

Esto escribe `bundle.nshc` (bytecode), `bundle.js` (código fuente), `bundle.js.map`, `capabilities.json` (cuando `nsh.json`
declara [capacidades](./sandbox-and-capabilities.md)) y `assets/` (las imágenes y fuentes que importa la app).

<a id="show-the-app"></a>

## Mostrar la app

```java
import android.app.Activity;
import android.os.Bundle;
import android.util.Log;
import com.longbridge.nsh.NshView;

public final class MainActivity extends Activity {
    private NshView nsh;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        nsh = new NshView(this);
        nsh.setErrorListener(message -> Log.e("nsh", message));
        setContentView(nsh);
        nsh.loadAssetBundle("nsh");   // runs assets/nsh/bundle.nshc
    }

    @Override
    protected void onDestroy() {
        nsh.destroy();
        super.onDestroy();
    }
}
```

En Kotlin:

```kotlin
class MainActivity : Activity() {
    private lateinit var nsh: NshView

    override fun onCreate(state: Bundle?) {
        super.onCreate(state)
        nsh = NshView(this)
        nsh.setErrorListener { message -> Log.e("nsh", message) }
        setContentView(nsh)
        nsh.loadAssetBundle("nsh")
    }

    override fun onDestroy() {
        nsh.destroy()
        super.onDestroy()
    }
}
```

`NshView` también puede colocarse dentro de cualquier layout, por ejemplo debajo de tu propia barra de herramientas:

```java
LinearLayout column = new LinearLayout(this);
column.setOrientation(LinearLayout.VERTICAL);
column.addView(toolbar);
column.addView(nsh, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
setContentView(column);
```

El tamaño de la vista es la ventana de la app: NSH distribuye la app según el tamaño de la vista y de nuevo cada vez que cambia. Cargar
otra vez reemplaza la app en ejecución. El ejemplo completo está en
`examples/embed-android/src/com/longbridge/nsh/embeddemo/MainActivity.java`.

## `NshView`

| Método | Descripción |
|---|---|
| `NshView(Context context)`, `NshView(Context context, boolean trace)` | Crea una vista vacía. `trace` registra en el log el tiempo de cada commit. |
| `setErrorListener(ErrorListener listener)` | Recibe los errores fatales de la app (fallos de carga, excepciones JS no capturadas, una VM detenida por un límite) en el hilo de la UI. Siempre se registran en el log. |
| `setLimits(int memoryMb, int stackKb, int loadMs, int callMs, int maxNodes)` | Límites de la VM de las apps que se carguen a continuación; 0 mantiene el valor por defecto. |
| `setGrantedCapabilities(String json)` | Lo máximo que pueden hacer las apps que se carguen a continuación, como JSON con el formato de `nsh.json` de `capabilities`; `null` concede lo que declara cada app. Devuelve `false` (y se ignora) si la concesión no es válida. |
| `setLocale(Locale locale)` | El idioma y la región de la app en lugar de los del usuario: `Intl`, `locale()` y los componentes lo siguen de inmediato, y las apps que se carguen después arrancan con él. `null` sigue el del sistema. |
| `setFontScale(float scale)` | El tamaño de texto en lugar del tamaño de fuente del sistema (1 es el valor por defecto): los textos y los inputs se vuelven a distribuir con él y `fontScale()` lo lee, de inmediato y para las apps que se carguen después; las longitudes conservan su tamaño. `0` sigue el del sistema. |
| `setThemeOverrides(String json)` | La marca del host sobre el [tema](./tailwind.md#theme-tokens) de la app: un archivo de tema con el formato de `nsh.json` de `"theme"`. Sus tokens prevalecen sobre los de la app con el mismo nombre, en modo claro y oscuro, y los demás de la app se conservan. Se aplica de inmediato y a las apps que se carguen después; `null` devuelve a la app su propio tema. Lanza `IllegalArgumentException` si el archivo no se puede analizar. |
| `setStorageDirectory(File dir)` | Dónde guardan su [almacenamiento](../modules/nsh.md#storage) las apps que se carguen a continuación; `null`: `files/nsh/<app id>` en el directorio privado de la app, según el id propio de la app. |
| `setCacheOptions(NshCacheOptions options)` | Dónde guardan las apps que se carguen a continuación sus cachés, las [imágenes que descargan](./images-and-assets.md#kept-on-disk), y cuánto conserva cada una. Se construye con `NshCacheOptions.builder()`: `location(File)`, `systemLocation()` (el valor por defecto: `nsh` en el directorio de caché, cada app en `<app id>`) o `noDiskCache()`; `imagesMaxMegabytes(int)` (256 por defecto) o `imagesOff()`. |
| `loadAssetBundle(String dir)` | Ejecuta `dir/bundle.nshc` desde los assets del APK; los assets de la app provienen de `dir/assets/`. Devuelve `false` si no se puede leer (también se notifica al listener de errores). |
| `loadBundleFile(File file)` | Ejecuta un archivo `bundle.js`; los assets provienen de `assets/` junto a él. Rechaza los archivos `.nshc`. |
| `runPackage(NshPackage pkg)` | Ejecuta un paquete firmado verificado, reemplazando la app en ejecución. Un paquete se ejecuta una sola vez. |
| `registerComponent(String name, NshComponent.Factory factory)` | Registra un [componente nativo](./native-components.md). |
| `setParams(Object params)` | Los parámetros de lanzamiento de las apps que se carguen a continuación (un `Map` o `JSONObject`): la app los lee al iniciar como `host.params` ([`host`](../modules/nsh.md#host)). Devuelve `false` cuando no son un objeto JSON. |
| `send(String name, Object data)` | Envía un evento a la app (`host.on(name, …)`); se conserva hasta que lo escucha, o para la siguiente app mientras no se ejecute ninguna. Desde cualquier hilo; devuelve `false` después de `destroy()`. |
| `handle(String name, HostHandler handler)` | Gestiona las llamadas (`host.call`) y los posts (`host.post`) de la app a `name` en el hilo de la UI; `null` elimina el handler. El handler responde a través de su `NshHostReply`, una sola vez, desde cualquier hilo. |
| `connectDevServer(String url)` | Desarrollo: carga desde un servidor `nsh dev` y recarga en cada cambio. Devuelve `false` con el AAR de release. |
| `handleBack()` | Permite que la app gestione una pulsación de retroceso (cierra diálogos, quita páginas, ejecuta listeners `BackHandler`); devuelve si lo hizo. |
| `destroy()` | Detiene la app y llama a `destroy()` en cada uno de sus componentes nativos. La vista ya no se puede usar. |

> [!IMPORTANT]
> El bytecode compilado (`.nshc`) solo se carga desde los assets del propio APK o desde un paquete firmado. Los archivos en el almacenamiento pueden reemplazarse,
> y QuickJS no valida el bytecode, por lo que `loadBundleFile` acepta únicamente código fuente JS. El código que la app descarga debería
> llegar como un [paquete firmado](./signed-packages.md).

`setLimits`, `setGrantedCapabilities`, `setStorageDirectory` y `setCacheOptions` se aplican a partir de la siguiente carga: llámalos antes de `loadAssetBundle` y similares.

Cada app conserva su almacenamiento bajo su propio id sin ninguna configuración: un paquete firmado bajo el id que avala el certificado de su clave de release, un bundle bajo el `id` de su `nsh.json` (`nsh/app.json` entre los assets del APK, escrito por `nsh package`). Llama a `setStorageDirectory` para mantener los datos de una app en un lugar que elija el host:

```java
nsh.setStorageDirectory(new File(getFilesDir(), "nsh/com.example.orders"));
nsh.loadAssetBundle("orders");
```

<a id="talking-to-the-app"></a>

## Comunicarse con la app

La vista y la app que ejecuta se comunican mediante un canal propio ([`host`](../modules/nsh.md#host)): parámetros de lanzamiento que la app lee al iniciar, eventos de la app host, y llamadas y posts de la app, con datos JSON (maps,
listas, strings, números y booleanos de este lado). No necesita ninguna vista en la app ni ningún componente nativo.

```java
// Before loading: what the app opens first (`host.params` in TSX).
nsh.setParams(Map.of("conversation", intent.getStringExtra("conversation")));
nsh.loadAssetBundle("nsh");

// The app's `await host.call("user.profile", { id })`, on the UI thread.
nsh.handle("user.profile", (data, reply) -> {
    Object id = ((Map<?, ?>) data).get("id");
    api.profile(id, profile -> reply.resolve(Map.of("id", id, "name", profile.name)),
            error -> reply.reject(error.getMessage()));
});

// The app's `host.post("analytics", …)`: no answer.
nsh.handle("analytics", (data, reply) -> analytics.log(data));

// Later: the app hears `host.on("conversation.open", …)`.
nsh.send("conversation.open", Map.of("id", tappedConversation));
```

En Kotlin:

```kotlin
nsh.handle("user.profile") { data, reply ->
    val id = (data as Map<*, *>)["id"]
    lifecycleScope.launch {
        runCatching { api.profile(id) }
            .onSuccess { reply.resolve(mapOf("id" to id, "name" to it.name)) }
            .onFailure { reply.reject(it.message ?: "failed") }
    }
}
```

Los handlers se ejecutan en el hilo de la UI; una llamada espera su respuesta en la app sin bloquear ninguno de los lados. Una respuesta que
nunca se da hace fallar la llamada una vez recolectada, y una llamada con un nombre sin handler falla de inmediato. Los eventos con nombres
que la app todavía no escucha se conservan hasta que lo haga, y los eventos enviados mientras no se ejecuta ninguna app (antes de `loadAssetBundle`,
durante una recarga) van a la siguiente.

<a id="theme-overrides"></a>

## Sobrescritura del tema

Una app incrustada en varias apps host con marca propia adopta la marca de cada host: el host proporciona los tokens que cambia su marca,
como un archivo de tema con el formato de `nsh.json` de `"theme"` (`cssVars` de shadcn/ui, con valores tal como los escribe CSS). Prevalecen
sobre los tokens de la app con el mismo nombre; los demás tokens de la app se conservan. Asigna a un token su valor de modo oscuro en `dark`
(un valor definido solo en `light` o `theme` es ese color en ambos modos):

```java
nsh.setThemeOverrides("{ \"cssVars\": {"
        + " \"theme\": { \"radius\": \"0.75rem\" },"
        + " \"light\": { \"primary\": \"#e11d48\", \"primary-foreground\": \"#ffffff\" },"
        + " \"dark\": { \"primary\": \"#fb7185\", \"primary-foreground\": \"#1c1917\" } } }");
nsh.loadAssetBundle("orders");
```

Llámalo antes o después de cargar: clases como `bg-primary` y `rounded-(--radius)` se vuelven a estilizar de inmediato, y cada app
que se cargue después arranca con las sobrescrituras en su primer frame. `setThemeOverrides(null)` devuelve a la app su propio tema.

<a id="links-the-app-opens"></a>

## Enlaces que abre la app

Las URL que abre la app ([`openUrl`](../modules/nsh.md#openurl), los enlaces de un `TextView` con `links="open"`)
llegan primero al `OpenUrlHandler` de la vista, en el hilo de la UI: devuelve `true` cuando la app host gestionó la URL, por ejemplo
enrutándola por su propio router, y `false` para que el sistema la abra con un intent `ACTION_VIEW`. Sin un
handler, el sistema abre todas las URL. Las URL le llegan después de que la capacidad `openUrl` de la app las haya permitido.

```java
nsh.setOpenUrlHandler(url -> {
    Uri uri = Uri.parse(url);
    // The host app's own links open in the host app.
    if ("lb".equals(uri.getScheme()) || "longbridge.com".equals(uri.getHost())) {
        router.open(uri);
        return true;
    }
    return false;
});
```

<a id="limits"></a>

## Límites

```java
// 128 MB heap, default stack, 10 s to load, 1 s per call, 50 000 nodes
nsh.setLimits(128, 0, 10_000, 1_000, 50_000);
```

Los valores por defecto son un heap de 256 MB, una pila de 4096 KB, 10 s para cargar, 2 s por llamada y 200 000 nodos. Qué hace cada límite
cuando se alcanza: [Sandbox y capacidades](./sandbox-and-capabilities.md).

<a id="capabilities"></a>

## Capacidades

```java
nsh.setGrantedCapabilities(
    "{\"network\": {\"hosts\": [\"api.example.com\"]}, \"webview\": {\"hosts\": [\"help.example.com\"]}}");
nsh.loadAssetBundle("nsh");
```

Una solicitud debe estar permitida tanto por lo que la app declara en su `nsh.json` como por la concesión. Consulta
[Sandbox y capacidades](./sandbox-and-capabilities.md).

<a id="signed-packages"></a>

## Paquetes firmados

Verifica los paquetes descargados fuera del hilo de la UI y luego ejecútalos en él:

```java
NshTrust trust = new NshTrust(new File(getFilesDir(), "nsh"));
trust.addRoot(rootPublicKey);   // the contents of root.pub from `nsh keygen`

executor.execute(() -> {
    try {
        NshPackage pkg = trust.openPackage(downloadedFile);
        runOnUiThread(() -> nsh.runPackage(pkg));
    } catch (NshPackage.RefusedException e) {
        Log.w("nsh", "refused: " + e.getMessage());   // the running app stays
    }
});
```

| API | Descripción |
|---|---|
| `new NshTrust(File stateDir)` | Abre o crea el almacén de confianza. Su estado (la lista de revocación más reciente, la build más alta aceptada por app) persiste allí y los assets de los paquetes se extraen bajo él. No confía en ninguna clave hasta `addRoot`. Se puede usar desde cualquier hilo; `close()` al terminar. |
| `boolean addRoot(String publicKey)` | Confía en una clave pública raíz (base64, el contenido de un archivo `.pub`). `false` si la clave no es válida. |
| `boolean updateRevocations(String json)` | Aplica una lista de revocación de `nsh revoke`, firmada por una raíz de confianza y más reciente que la del almacén. |
| `NshPackage openPackage(File file) throws NshPackage.RefusedException` | Verifica, extrae los assets y acepta el paquete (a partir de ese momento se rechazan las builds anteriores de la app). Lento para paquetes grandes: llámalo fuera del hilo de la UI. |
| `NshPackage` | `appId`, `appName`, `version`, `build`; `close()` si no se va a ejecutar. |

Cómo funcionan las claves, los certificados y la revocación: [Paquetes firmados](./signed-packages.md).

<a id="development"></a>

## Desarrollo

Con `nsh-dev.aar`:

```java
if (BuildConfig.DEBUG) {
    nsh.connectDevServer("ws://127.0.0.1:8790/ws");
} else {
    nsh.loadAssetBundle("nsh");
}
```

Ejecuta `nsh dev App.tsx` en tu computadora. Para un emulador o un dispositivo USB, reenvía el puerto para que el `127.0.0.1` propio del dispositivo
llegue al servidor:

```sh
adb reverse tcp:8790 tcp:8790
```

De lo contrario, usa la dirección LAN que imprime `nsh dev`. Los assets provienen del servidor de desarrollo por HTTP sin cifrar, por lo que `nsh-dev.aar`
declara `android:usesCleartextTraffic="true"`, que el manifest merger aplica a la app (una network security
config de la app puede sobrescribirlo). El `nsh.aar` de release no lo hace.

<a id="activity-setup"></a>

## Configuración de la Activity

- **Botón de retroceso.** `NshView` recibe por sí mismo las pulsaciones de retroceso mientras la app las quiere (un diálogo abierto, una página apilada, un
  listener `BackHandler`), y las deja a la activity en caso contrario. Con `android:enableOnBackInvokedCallback="true"`
  en Android 13 y posteriores registra un `OnBackInvokedCallback`; en el resto (Android 12 y anteriores, o con el atributo
  desactivado) toma la tecla de retroceso antes del `onBackPressed` de la activity, es decir, antes del `OnBackPressedDispatcher` de AndroidX
  y de los callbacks de los fragments. No hace falta reenviar nada, ni en una activity ni en un fragment. Un host que ya reenvía
  las pulsaciones a `handleBack()` sigue funcionando: una pulsación llega a la app una sola vez.

  Para el retroceso predictivo en Android 13+, define `android:enableOnBackInvokedCallback="true"` en el `<application>`, como hacen las
  apps NSH empaquetadas.
- **Teclado.** `NshView` desplaza por sí mismo los inputs con foco para dejarlos libres del teclado. Deja `android:windowSoftInputMode` sin definir
  o usa `adjustResize`; con `adjustPan` el sistema mueve en su lugar toda la ventana.
- **Área segura.** La vista reporta como insets solo las partes de las barras del sistema y del teclado que la solapan, de modo que un
  `NshView` debajo de una barra de herramientas no recibe inset superior. Para contenido de borde a borde, dibuja detrás de las barras del sistema y deja que la app use
  el padding `env(safe-area-inset-*)` / `safeAreaInsets()` (`safe_area()` en Rust).
- **Cambios de configuración.** Una activity recreada por una rotación o un cambio de tema destruye la vista, y la app arranca
  de nuevo desde cero. Para mantenerla en ejecución, declara los cambios que la activity gestiona por sí misma; las apps NSH empaquetadas usan:

  ```xml
  <activity android:name=".MainActivity"
      android:configChanges="orientation|screenSize|screenLayout|smallestScreenSize|keyboard|keyboardHidden|navigation|uiMode|density|fontScale|locale|layoutDirection"
      android:windowSoftInputMode="adjustResize" />
  ```

  `NshView` sigue por sí mismo el nuevo tamaño, esquema de color, escala de fuente, densidad de pantalla y dirección del layout; la app conserva
  su estado. Las posiciones de scroll se restauran en coordenadas lógicas dentro de los nuevos límites del contenido. Las vistas sticky y
  las ventanas modales abiertas también siguen la nueva densidad.
- **Ciclo de vida.** Llama a `destroy()` cuando la activity o el fragment que aloja la vista desaparezca.
<a id="see-also"></a>

## Véase también

- [Compilar con Rust](./rust.md)
- [Integración en aplicaciones de iOS](./ios.md)
- [Native components](./native-components.md)
- [Paquetes firmados](./signed-packages.md)
- [Empaquetado](./packaging.md): un APK independiente sin escribir nada de Java
