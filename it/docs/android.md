---
title: "Android"
description: "Esegui app NSH in Rust e TSX su Android con le viste Android, su un emulatore o un dispositivo, impacchettale come .apk e incorporale in un'app Android esistente con nsh.aar e NshView."
order: 12
group: platforms
source_hash: 0e8dcab076c0aa59
---

# Android

Le app NSH girano su Android con le normali view Android e testo `StaticLayout`, da Android 9 (API 28), su `arm64-v8a`,
`armeabi-v7a` e `x86_64`. Intere app scritte in Rust e in TSX vengono eseguite e impacchettate come sulle altre piattaforme, e un'app esistente
può incorporare moduli in un `NshView` e caricare i pacchetti firmati che scarica, entro i limiti e le capability che stabilisce. Su Android, `os()` è `Os::Android` (`platform.os` è `"android"` in TSX) e si applicano le prop `android={{…}}` di TSX.

<a id="requirements"></a>

## Requisiti

- **L'Android SDK** (con `platforms;android-35`, build tools e `platform-tools`) e **un JDK**, su macOS, Windows
  o Linux. Vedi [Installazione](./installation.md#android).
- Un emulatore, oppure un dispositivo collegato tramite `adb`.

<a id="running-an-app"></a>

## Eseguire un'app

Un'app Rust si esegue dalla propria directory, un'app TSX indica il proprio entry:

```sh
nsh run --target android               # a Rust app
nsh run App.tsx --target android       # a TSX app
```

Avvia prima un emulatore o collega un dispositivo (`adb devices` li elenca; NSH usa il primo). Per un'app Rust, `nsh`
compila il `libnsh.so` dell'app insieme al tuo crate, installa l'APK e lo avvia; una modifica al codice Rust del crate lo compila
e lo installa di nuovo. Per un'app TSX, installa un APK host di sviluppo (ricompilato solo quando cambia il runtime) e
inoltra la porta del dev server con `adb reverse`, così funziona via USB senza una rete condivisa; l'app si aggiorna a ogni
salvataggio, con i log nel terminale.

## Packaging

```sh
nsh package --target android --run             # a Rust app: .nsh/out/<Name>.apk, installed and launched
nsh package App.tsx --target android --run     # a TSX app
```

L'APK di un'app Rust contiene il proprio `libnsh.so`, compilato insieme al tuo crate, la cui activity monta la root.

L'APK viene compilato con i build tools dell'SDK, senza Gradle, e firmato con la chiave di debug a meno che tu non passi un keystore
di release. Firma per la release e icone: [Packaging](./packaging.md#android).

NSH compila `libnsh.so` con allineamento ELF a 16 KB e impacchetta le librerie native non compresse su confini ZIP da 16 KB.
Un APK di release contiene `libnsh.so` senza le tabelle dei simboli e le informazioni di debug. La libreria completa si trova accanto al
runtime in `symbols/<abi>/libnsh.so` (quella di un'app Rust in `.nsh/rust/android-rust-release/symbols/<abi>/`): consegnala a
`ndk-stack` oppure caricala su Play Console come simboli di debug nativi per leggere gli stack dei crash nativi.

<a id="embedding-in-an-android-app"></a>

## Incorporare in un'app Android

Un'app Android esistente può mostrare app NSH all'interno della propria UI. Il runtime è distribuito come libreria Android, `nsh.aar`: si
crea una `com.longbridge.nsh.NshView` (una `FrameLayout`), la si aggiunge a un layout qualsiasi e vi si carica un'app TSX o un pacchetto
firmato. Un'app scritta in Rust viene distribuita su Android come l'APK che `nsh package --target android` compila. L'app NSH
viene renderizzata con le normali view Android accanto alle tue.

Ogni `NshView` è un motore indipendente con la propria VM JS; non ci sono singleton globali, quindi più istanze possono girare
contemporaneamente.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/host-app-light.svg" alt="One host app with two nsh views (NshAppView on iOS, NshView on Android): each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
<img class="diagram diagram-dark" src="/diagrams/host-app-dark.svg" alt="One host app with two nsh views (NshAppView on iOS, NshView on Android): each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
</div>

<a id="get-the-library"></a>

## Ottenere la libreria

La distribuzione contiene entrambe le varianti:

```text
dist/nsh/embed/android/nsh.aar       release: bundles and signed packages
dist/nsh/embed/android/nsh-dev.aar   also connects to a `nsh dev` server
```

L'AAR contiene il runtime Java e `libnsh.so` per `arm64-v8a`, `armeabi-v7a` e `x86_64`, con i relativi simboli: la
build Gradle dell'app li rimuove quando impacchetta l'app e conserva i simboli per i report dei crash. Dichiara il
permesso `INTERNET` e richiede **API 28** (Android 9) o successiva. Include le proprie regole R8 (`proguard.txt`), che una
build minificata applica da sola: la libreria nativa trova per nome le classi del runtime, quindi `com.longbridge.nsh`
resta invariato.

Aggiungilo al modulo dell'app, per esempio da una cartella `libs`:

```kotlin
// app/build.gradle.kts
dependencies {
    debugImplementation(files("libs/nsh-dev.aar"))
    releaseImplementation(files("libs/nsh.aar"))
}
```

<a id="ship-a-bundle-with-the-app"></a>

## Distribuire un bundle con l'app

Compila l'app TSX negli asset dell'app:

```sh
nsh build App.tsx --release --out app/src/main/assets/nsh
```

Questo scrive `bundle.nshc` (bytecode), `bundle.js` (sorgente), `bundle.js.map`, `capabilities.json` (quando `nsh.json`
dichiara [capability](./sandbox-and-capabilities.md)) e `assets/` (le immagini e i font che l'app importa).

<a id="show-the-app"></a>

## Mostrare l'app

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

In Kotlin:

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

`NshView` può anche stare dentro un layout qualsiasi, per esempio sotto la tua toolbar:

```java
LinearLayout column = new LinearLayout(this);
column.setOrientation(LinearLayout.VERTICAL);
column.addView(toolbar);
column.addView(nsh, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
setContentView(column);
```

La dimensione della view è la finestra dell'app: NSH dispone l'app alla dimensione della view e di nuovo ogni volta che questa cambia. Caricare
di nuovo sostituisce l'app in esecuzione. L'esempio completo è
`examples/embed-android/src/com/longbridge/nsh/embeddemo/MainActivity.java`.

## `NshView`

| Metodo | Descrizione |
|---|---|
| `NshView(Context context)`, `NshView(Context context, boolean trace)` | Crea una view vuota. `trace` registra nel log il tempo di ogni commit. |
| `setErrorListener(ErrorListener listener)` | Riceve gli errori fatali dell'app (errori di caricamento, eccezioni JS non gestite, una VM fermata da un limite) sul thread UI. Vengono sempre registrati nel log. |
| `setLimits(int memoryMb, int stackKb, int loadMs, int callMs, int maxNodes)` | Limiti della VM per le app caricate successivamente; 0 mantiene il valore predefinito. |
| `setGrantedCapabilities(String json)` | Il massimo che le app caricate successivamente possono fare, come JSON nella forma di `nsh.json` in `capabilities`; `null` concede ciò che ogni app dichiara. Restituisce `false` (e viene ignorato) per una concessione non valida. |
| `setLocale(Locale locale)` | La lingua e la regione dell'app al posto di quelle dell'utente: `Intl`, `locale()` e i componenti le seguono subito, e le app caricate dopo partono con esse. `null` segue quelle del sistema. |
| `setFontScale(float scale)` | La dimensione del testo al posto della dimensione dei caratteri del sistema (1 è il valore predefinito): testi e input vengono disposti di nuovo con essa e `fontScale()` la legge, subito e per le app caricate dopo; le lunghezze mantengono la loro dimensione. `0` segue quella del sistema. |
| `setThemeOverrides(String json)` | Il brand dell'host sopra il [tema](./tailwind.md#theme-tokens) dell'app: un file di tema nel formato di `"theme"` in `nsh.json`. I suoi token prevalgono su quelli dell'app con lo stesso nome, in modalità chiara e scura, mentre gli altri token dell'app restano. Si applica subito e alle app caricate dopo; `null` restituisce all'app il suo tema. Genera `IllegalArgumentException` per un file che non può essere analizzato. |
| `setStorageDirectory(File dir)` | Dove le app caricate successivamente conservano il proprio [storage](../modules/nsh.md#storage); `null`: `files/nsh/<app id>` nella directory privata dell'app, in base all'id dell'app stessa. |
| `setCacheOptions(NshCacheOptions options)` | Dove le app caricate successivamente conservano le cache, le [immagini che scaricano](./images-and-assets.md#kept-on-disk), e quanto ne conserva ciascuna. Se ne costruisce una con `NshCacheOptions.builder()`: `location(File)`, `systemLocation()` (il valore predefinito: `nsh` nella directory della cache, ogni app in `<app id>`) oppure `noDiskCache()`; `imagesMaxMegabytes(int)` (256 per impostazione predefinita) oppure `imagesOff()`. |
| `loadAssetBundle(String dir)` | Esegue `dir/bundle.nshc` dagli asset dell'APK; gli asset dell'app provengono da `dir/assets/`. Restituisce `false` se non può essere letto (segnalato anche all'error listener). |
| `loadBundleFile(File file)` | Esegue un file `bundle.js`; gli asset provengono da `assets/` accanto ad esso. Rifiuta i file `.nshc`. |
| `runPackage(NshPackage pkg)` | Esegue un pacchetto firmato verificato, sostituendo l'app in esecuzione. Un pacchetto viene eseguito una sola volta. |
| `registerComponent(String name, NshComponent.Factory factory)` | Registra un [componente nativo](./native-components.md). |
| `setParams(Object params)` | I parametri di avvio delle app caricate successivamente (un `Map` o `JSONObject`): l'app li legge all'avvio come `host.params` ([`host`](../modules/nsh.md#host)). Restituisce `false` quando non sono un oggetto JSON. |
| `send(String name, Object data)` | Invia un evento all'app (`host.on(name, …)`); viene conservato finché l'app non è in ascolto, oppure per l'app successiva finché nessuna è in esecuzione. Da qualsiasi thread; restituisce `false` dopo `destroy()`. |
| `handle(String name, HostHandler handler)` | Gestisce le chiamate (`host.call`) e i post (`host.post`) dell'app per `name` sul thread UI; `null` rimuove il gestore. Il gestore risponde tramite il proprio `NshHostReply`, una sola volta, da qualsiasi thread. |
| `connectDevServer(String url)` | Sviluppo: carica da un server `nsh dev` e ricarica a ogni modifica. Restituisce `false` con l'AAR di release. |
| `handleBack()` | Lascia che sia l'app a gestire la pressione del tasto indietro (chiude i dialog, rimuove le pagine, esegue i listener `BackHandler`); restituisce se lo ha fatto. |
| `destroy()` | Ferma l'app e chiama `destroy()` su ciascuno dei suoi componenti nativi. La view non può più essere usata. |

> [!IMPORTANT]
> Il bytecode compilato (`.nshc`) viene caricato solo dagli asset dell'APK stesso o da un pacchetto firmato. I file nello storage possono essere sostituiti,
> e QuickJS non convalida il bytecode, perciò `loadBundleFile` accetta solo sorgente JS. Il codice che l'app scarica dovrebbe
> arrivare come [pacchetto firmato](./signed-packages.md).

`setLimits`, `setGrantedCapabilities`, `setStorageDirectory` e `setCacheOptions` valgono dal caricamento successivo: chiamali prima di `loadAssetBundle` e simili.

Ogni app conserva il proprio storage sotto il proprio id senza alcuna impostazione: un pacchetto firmato sotto l'id garantito dal certificato della sua chiave di release, un bundle sotto il `id` del suo `nsh.json` (`nsh/app.json` tra gli asset dell'APK, scritto da `nsh package`). Chiama `setStorageDirectory` per conservare i dati di un'app in un luogo scelto dall'host:

```java
nsh.setStorageDirectory(new File(getFilesDir(), "nsh/com.example.orders"));
nsh.loadAssetBundle("orders");
```

<a id="talking-to-the-app"></a>

## Dialogare con l'app

La view e l'app che esegue comunicano attraverso un canale dedicato ([`host`](../modules/nsh.md#host)): parametri
di avvio che l'app legge all'avvio, eventi dall'app host, e chiamate e post dall'app, con dati JSON (map,
liste, stringhe, numeri e booleani da questo lato). Non richiede alcuna view nell'app né componenti nativi.

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

In Kotlin:

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

I gestori vengono eseguiti sul thread UI; una chiamata attende la propria risposta nell'app senza bloccare nessuno dei due lati. Una risposta che
non viene mai data fa fallire la chiamata una volta raccolta, e una chiamata con un nome senza gestore fallisce subito. Gli eventi con nomi
che l'app non ascolta ancora vengono conservati finché non lo fa, e gli eventi inviati mentre nessuna app è in esecuzione (prima di `loadAssetBundle`,
durante un reload) vanno all'app successiva.

<a id="theme-overrides"></a>

## Override del tema

Un'app incorporata in più app host con brand diversi assume il brand di ciascun host: l'host fornisce i token che il proprio brand modifica,
come file di tema nel formato di `"theme"` in `nsh.json` (`cssVars` di shadcn/ui, con valori scritti come in CSS). Prevalgono
sui token dell'app con lo stesso nome; gli altri token dell'app restano. Assegna a un token il suo valore per la modalità scura sotto `dark`
(un solo insieme sotto `light` o `theme` indica quel colore in entrambe le modalità):

```java
nsh.setThemeOverrides("{ \"cssVars\": {"
        + " \"theme\": { \"radius\": \"0.75rem\" },"
        + " \"light\": { \"primary\": \"#e11d48\", \"primary-foreground\": \"#ffffff\" },"
        + " \"dark\": { \"primary\": \"#fb7185\", \"primary-foreground\": \"#1c1917\" } } }");
nsh.loadAssetBundle("orders");
```

Chiamalo prima o dopo il caricamento: classi come `bg-primary` e `rounded-(--radius)` cambiano stile subito, e ogni app
caricata dopo parte con gli override già nel primo frame. `setThemeOverrides(null)` restituisce all'app il suo tema.

<a id="links-the-app-opens"></a>

## Link aperti dall'app

Gli URL che l'app apre ([`openUrl`](../modules/nsh.md#openurl), i link di un `TextView` con `links="open"`)
raggiungono prima il `OpenUrlHandler` della view, sul thread UI: restituisci `true` quando l'app host ha gestito l'URL, ad esempio
instradandolo attraverso il proprio router, e `false` perché il sistema lo apra con un intent `ACTION_VIEW`. Senza un
gestore il sistema apre ogni URL. Gli URL lo raggiungono dopo che la capability `openUrl` dell'app li ha consentiti.

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

## Limiti

```java
// 128 MB heap, default stack, 10 s to load, 1 s per call, 50 000 nodes
nsh.setLimits(128, 0, 10_000, 1_000, 50_000);
```

I valori predefiniti sono 256 MB di heap, 4096 KB di stack, 10 s per il caricamento, 2 s per chiamata e 200 000 nodi. Cosa fa ciascun limite
quando viene raggiunto: [Sandbox e capability](./sandbox-and-capabilities.md).

<a id="capabilities"></a>

## Capability

```java
nsh.setGrantedCapabilities(
    "{\"network\": {\"hosts\": [\"api.example.com\"]}, \"webview\": {\"hosts\": [\"help.example.com\"]}}");
nsh.loadAssetBundle("nsh");
```

Una richiesta deve essere consentita sia da ciò che l'app dichiara nel proprio `nsh.json` sia dalla concessione. Vedi
[Sandbox e capability](./sandbox-and-capabilities.md).

<a id="signed-packages"></a>

## Pacchetti firmati

Verifica i pacchetti scaricati fuori dal thread UI, poi eseguili su di esso:

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

| API | Descrizione |
|---|---|
| `new NshTrust(File stateDir)` | Apre o crea il trust store. Il suo stato (l'elenco di revoca più recente, la build più alta accettata per ogni app) vi persiste e gli asset dei pacchetti vengono estratti al suo interno. Non considera attendibile alcuna chiave finché non si chiama `addRoot`. Utilizzabile da qualsiasi thread; `close()` al termine. |
| `boolean addRoot(String publicKey)` | Considera attendibile una chiave pubblica radice (base64, il contenuto di un file `.pub`). `false` per una chiave non valida. |
| `boolean updateRevocations(String json)` | Applica un elenco di revoca da `nsh revoke`, firmato da una radice attendibile e più recente di quello dello store. |
| `NshPackage openPackage(File file) throws NshPackage.RefusedException` | Verifica, estrae gli asset e accetta il pacchetto (le build precedenti dell'app vengono da quel momento rifiutate). Lento per i pacchetti grandi: chiamalo fuori dal thread UI. |
| `NshPackage` | `appId`, `appName`, `version`, `build`; `close()` se non può essere eseguito. |

Come funzionano chiavi, certificati e revoca: [Pacchetti firmati](./signed-packages.md).

<a id="development"></a>

## Sviluppo

Con `nsh-dev.aar`:

```java
if (BuildConfig.DEBUG) {
    nsh.connectDevServer("ws://127.0.0.1:8790/ws");
} else {
    nsh.loadAssetBundle("nsh");
}
```

Esegui `nsh dev App.tsx` sul tuo computer. Per un emulatore o un dispositivo USB, inoltra la porta in modo che il `127.0.0.1`
del dispositivo raggiunga il server:

```sh
adb reverse tcp:8790 tcp:8790
```

Altrimenti usa l'indirizzo LAN che `nsh dev` stampa. Gli asset provengono dal dev server tramite HTTP semplice, perciò `nsh-dev.aar`
dichiara `android:usesCleartextTraffic="true"`, che il manifest merger applica all'app (una network security
config dell'app può sovrascriverlo). La `nsh.aar` di release non lo fa.

<a id="activity-setup"></a>

## Configurazione dell'activity

- **Tasto indietro.** `NshView` riceve da sola le pressioni del tasto indietro finché l'app le vuole (un dialog aperto, una pagina in pila, un
  listener `BackHandler`), e altrimenti le lascia all'activity. Con `android:enableOnBackInvokedCallback="true"`
  su Android 13 e successivi registra un `OnBackInvokedCallback`; altrove (Android 12 e precedenti, o con l'attributo
  disattivato) intercetta il tasto indietro prima di `onBackPressed` dell'activity, quindi prima di `OnBackPressedDispatcher` di AndroidX
  e dei callback dei fragment. Non serve alcun inoltro, né in un'activity né in un fragment. Un host che già inoltra le
  pressioni a `handleBack()` continua a funzionare: una pressione arriva all'app una sola volta.

  Per il predictive back su Android 13+, imposta `android:enableOnBackInvokedCallback="true"` su `<application>`, come fanno le
  app NSH impacchettate.
- **Tastiera.** `NshView` fa scorrere da sola gli input con il focus in modo che restino liberi dalla tastiera. Lascia `android:windowSoftInputMode` non impostato
  oppure usa `adjustResize`; con `adjustPan` è invece il sistema a spostare l'intera finestra.
- **Safe area.** La view riporta come inset solo le parti delle barre di sistema e della tastiera che la sovrappongono, quindi un
  `NshView` sotto una toolbar non riceve alcun inset superiore. Per un contenuto edge-to-edge, disegna dietro le barre di sistema e lascia che l'app usi
  il padding `env(safe-area-inset-*)` / `safeAreaInsets()` (`safe_area()` in Rust).
- **Cambi di configurazione.** Un'activity ricreata per una rotazione o un cambio di tema distrugge la view, e l'app riparte
  da zero. Per mantenerla in esecuzione, dichiara i cambiamenti che l'activity gestisce da sé; le app NSH impacchettate usano:

  ```xml
  <activity android:name=".MainActivity"
      android:configChanges="orientation|screenSize|screenLayout|smallestScreenSize|keyboard|keyboardHidden|navigation|uiMode|density|fontScale|locale|layoutDirection"
      android:windowSoftInputMode="adjustResize" />
  ```

  `NshView` segue da sola la nuova dimensione, lo schema di colori, la scala dei caratteri, la densità dello schermo e la direzione del layout; l'app mantiene
  il proprio stato. Le posizioni di scorrimento vengono ripristinate in coordinate logiche entro i nuovi limiti del contenuto. Le view sticky e
  le finestre modali aperte seguono anch'esse la nuova densità.
- **Ciclo di vita.** Chiama `destroy()` quando l'activity o il fragment ospitante termina.
<a id="see-also"></a>

## Vedi anche

- [Building with Rust](./rust.md)
- [Embedding in iOS apps](./ios.md)
- [Native components](./native-components.md)
- [Signed packages](./signed-packages.md)
- [Packaging](./packaging.md): un APK standalone senza scrivere codice Java
