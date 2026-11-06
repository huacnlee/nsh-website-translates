---
title: "Android"
description: "Führen Sie Rust- und TSX-NSH-Apps auf Android mit Android Views auf einem Emulator oder einem Gerät aus, verpacken Sie sie als .apk und binden Sie sie mit nsh.aar und NshView in eine bestehende Android-App ein."
order: 12
group: platforms
source_hash: 0e8dcab076c0aa59
---


# Android

NSH-Apps laufen auf Android mit gewöhnlichen Android-Views und `StaticLayout`-Text, ab Android 9 (API 28), auf `arm64-v8a`, `armeabi-v7a` und `x86_64`. Ganze Apps in Rust und in TSX laufen und werden verpackt wie auf den anderen Plattformen. Eine bestehende App kann Module in einer `NshView` einbetten und signierte Pakete laden, die sie herunterlädt, innerhalb von Limits und Capabilities, die sie selbst festlegt. Unter Android ist `os()` `Os::Android` (`platform.os` ist `"android"` in TSX), und die `android={{…}}`-Props von TSX gelten.

<a id="requirements"></a>

## Voraussetzungen

- **Das Android SDK** (mit `platforms;android-35`, Build-Tools und `platform-tools`) und **ein JDK**, unter macOS, Windows
  oder Linux. Siehe [Installation](./installation.md#android).
- Ein Emulator oder ein Gerät, das über `adb` verbunden ist.

<a id="running-an-app"></a>

## Eine App ausführen

Eine Rust-App wird aus ihrem Verzeichnis ausgeführt, bei einer TSX-App gibst du den Einstiegspunkt an:

```sh
nsh run --target android               # a Rust app
nsh run App.tsx --target android       # a TSX app
```

Starte zuerst einen Emulator oder verbinde ein Gerät (`adb devices` listet sie auf; NSH verwendet das erste). Bei einer Rust-App baut `nsh` die `libnsh.so` der App mit deinem Crate, installiert das APK und startet es; eine Änderung am Rust-Code des Crates baut und installiert es erneut. Bei einer TSX-App installiert es ein Development-Host-APK (wird nur neu gebaut, wenn sich die Runtime ändert) und leitet den Port des Dev-Servers mit `adb reverse` weiter, sodass es über USB ohne gemeinsames Netzwerk funktioniert; die App aktualisiert sich beim Speichern, die Logs erscheinen im Terminal.

<a id="packaging"></a>

## Verpacken

```sh
nsh package --target android --run             # a Rust app: .nsh/out/<Name>.apk, installed and launched
nsh package App.tsx --target android --run     # a TSX app
```

Das APK einer Rust-App enthält ihre eigene `libnsh.so`, gebaut mit deinem Crate, deren Activity das Root einhängt.

Das APK wird mit den Build-Tools des SDK ohne Gradle gebaut und mit dem Debug-Schlüssel signiert, sofern du keinen Release-Keystore angibst. Signieren für Release und Icons: [Packaging](./packaging.md#android).

NSH baut `libnsh.so` mit 16-KB-ELF-Alignment und verpackt die unkomprimierten nativen Bibliotheken an 16-KB-ZIP-Grenzen. Ein Release-APK enthält `libnsh.so` ohne Symboltabellen und Debug-Informationen. Die vollständige Bibliothek liegt neben der Runtime in `symbols/<abi>/libnsh.so` (bei einer Rust-App in `.nsh/rust/android-rust-release/symbols/<abi>/`): Gib sie an `ndk-stack` weiter oder lade sie als native Debug-Symbole in die Play Console hoch, um native Crash-Stacks zu lesen.

<a id="embedding-in-an-android-app"></a>

## In eine Android-App einbetten

Eine bestehende Android-App kann NSH-Apps in ihrer eigenen UI anzeigen. Die Runtime wird als Android-Bibliothek ausgeliefert, `nsh.aar`: Du erstellst eine `com.longbridge.nsh.NshView` (eine `FrameLayout`), fügst sie einem beliebigen Layout hinzu und lädst eine TSX-App oder ein signiertes Paket hinein. Eine in Rust geschriebene App wird unter Android als das APK ausgeliefert, das `nsh package --target android` baut. Die NSH-App wird mit gewöhnlichen Android-Views neben deinen eigenen gerendert.

Jede `NshView` ist eine eigenständige Engine mit eigener JS-VM; es gibt keine globalen Singletons, daher können mehrere gleichzeitig laufen.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/host-app-light.svg" alt="One host app with two nsh views (NshAppView on iOS, NshView on Android): each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
<img class="diagram diagram-dark" src="/diagrams/host-app-dark.svg" alt="One host app with two nsh views (NshAppView on iOS, NshView on Android): each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
</div>

<a id="get-the-library"></a>

## Die Bibliothek beziehen

Die Distribution enthält beide Varianten:

```text
dist/nsh/embed/android/nsh.aar       release: bundles and signed packages
dist/nsh/embed/android/nsh-dev.aar   also connects to a `nsh dev` server
```

Das AAR enthält die Java-Runtime und `libnsh.so` für `arm64-v8a`, `armeabi-v7a` und `x86_64`, mit ihren Symbolen: Der Gradle-Build der App entfernt sie beim Verpacken der App und behält die Symbole für Crash-Reports. Es deklariert die Berechtigung `INTERNET` und benötigt **API 28** (Android 9) oder neuer. Es bringt seine R8-Regeln mit (`proguard.txt`), die ein minifizierter Build selbstständig anwendet: Die native Bibliothek findet die Klassen der Runtime über ihren Namen, daher bleibt `com.longbridge.nsh` unverändert.

Füge es dem App-Modul hinzu, zum Beispiel aus einem Ordner `libs`:

```kotlin
// app/build.gradle.kts
dependencies {
    debugImplementation(files("libs/nsh-dev.aar"))
    releaseImplementation(files("libs/nsh.aar"))
}
```

<a id="ship-a-bundle-with-the-app"></a>

## Ein Bundle mit der App ausliefern

Baue die TSX-App in die Assets der App:

```sh
nsh build App.tsx --release --out app/src/main/assets/nsh
```

Dies schreibt `bundle.nshc` (Bytecode), `bundle.js` (Quelltext), `bundle.js.map`, `capabilities.json` (wenn `nsh.json` [Capabilities](./sandbox-and-capabilities.md) deklariert) und `assets/` (die Bilder und Schriften, die die App importiert).

<a id="show-the-app"></a>

## Die App anzeigen

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

`NshView` kann auch in einem beliebigen Layout sitzen, zum Beispiel unterhalb deiner eigenen Toolbar:

```java
LinearLayout column = new LinearLayout(this);
column.setOrientation(LinearLayout.VERTICAL);
column.addView(toolbar);
column.addView(nsh, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
setContentView(column);
```

Die Größe der View ist das Fenster der App: NSH legt die App in der Größe der View aus und erneut bei jeder Änderung. Erneutes Laden ersetzt die laufende App. Das vollständige Beispiel ist `examples/embed-android/src/com/longbridge/nsh/embeddemo/MainActivity.java`.

## `NshView`

| Methode | Beschreibung |
|---|---|
| `NshView(Context context)`, `NshView(Context context, boolean trace)` | Erstellt eine leere View. `trace` protokolliert die Zeit jedes Commits. |
| `setErrorListener(ErrorListener listener)` | Empfängt fatale App-Fehler (Ladefehler, nicht abgefangene JS-Exceptions, eine durch ein Limit gestoppte VM) im UI-Thread. Sie werden immer protokolliert. |
| `setLimits(int memoryMb, int stackKb, int loadMs, int callMs, int maxNodes)` | VM-Limits der als Nächstes geladenen Apps; 0 behält einen Standardwert. |
| `setGrantedCapabilities(String json)` | Das Maximum, das die als Nächstes geladenen Apps tun dürfen, als JSON in der Form von `nsh.json` `capabilities`; `null` gewährt, was jede App deklariert. Gibt `false` zurück (und wird ignoriert) bei einem ungültigen Grant. |
| `setLocale(Locale locale)` | Sprache und Region der App anstelle derer des Benutzers: `Intl`, `locale()` und die Komponenten folgen ihr sofort, und später geladene Apps starten damit. `null` folgt der des Systems. |
| `setFontScale(float scale)` | Die Textgröße anstelle der Schriftgröße des Systems (1 ist der Standard): Texte und Eingaben werden damit neu ausgelegt und `fontScale()` liest sie, sofort und für später geladene Apps; Längen behalten ihre Größe. `0` folgt der des Systems. |
| `setThemeOverrides(String json)` | Die Marke des Hosts über dem [Theme](./tailwind.md#theme-tokens) der App: eine Theme-Datei im Format von `nsh.json` `"theme"`. Ihre Tokens haben Vorrang vor den gleichnamigen Tokens der App, im hellen und im dunklen Modus, und die übrigen Tokens der App bleiben bestehen. Wirkt sofort und auf später geladene Apps; `null` gibt der App ihr eigenes Theme zurück. Wirft `IllegalArgumentException` bei einer Datei, die sich nicht parsen lässt. |
| `setStorageDirectory(File dir)` | Wo die als Nächstes geladenen Apps ihren [Storage](../modules/nsh.md#storage) ablegen; `null`: `files/nsh/<app id>` im privaten Verzeichnis der App, nach der eigenen ID der App. |
| `setCacheOptions(NshCacheOptions options)` | Wo die als Nächstes geladenen Apps ihre Caches und die [Bilder, die sie herunterladen](./images-and-assets.md#kept-on-disk), ablegen und wie viel jede behält. Erstelle eines mit `NshCacheOptions.builder()`: `location(File)`, `systemLocation()` (der Standard: `nsh` im Cache-Verzeichnis, jede App in `<app id>`) oder `noDiskCache()`; `imagesMaxMegabytes(int)` (standardmäßig 256) oder `imagesOff()`. |
| `loadAssetBundle(String dir)` | Führt `dir/bundle.nshc` aus den Assets des APK aus; App-Assets stammen aus `dir/assets/`. Gibt `false` zurück, wenn es nicht gelesen werden kann (wird auch dem Error-Listener gemeldet). |
| `loadBundleFile(File file)` | Führt eine `bundle.js`-Datei aus; Assets stammen aus `assets/` daneben. Weist `.nshc`-Dateien ab. |
| `runPackage(NshPackage pkg)` | Führt ein verifiziertes signiertes Paket aus und ersetzt die laufende App. Ein Paket läuft nur einmal. |
| `registerComponent(String name, NshComponent.Factory factory)` | Registriert eine [native Komponente](./native-components.md). |
| `setParams(Object params)` | Die Startparameter der als Nächstes geladenen Apps (ein `Map` oder `JSONObject`): Die App liest sie beim Start als `host.params` ([`host`](../modules/nsh.md#host)). Gibt `false` zurück, wenn sie kein JSON-Objekt sind. |
| `send(String name, Object data)` | Sendet ein Event an die App (`host.on(name, …)`); wird aufbewahrt, bis sie zuhört, oder für die nächste App, solange keine läuft. Beliebiger Thread; gibt `false` nach `destroy()` zurück. |
| `handle(String name, HostHandler handler)` | Behandelt die Calls (`host.call`) und Posts (`host.post`) der App an `name` im UI-Thread; `null` entfernt den Handler. Der Handler antwortet über sein `NshHostReply`, einmal, aus einem beliebigen Thread. |
| `connectDevServer(String url)` | Entwicklung: lädt von einem `nsh dev`-Server und lädt bei jeder Änderung neu. Gibt `false` mit dem Release-AAR zurück. |
| `handleBack()` | Lässt die App einen Zurück-Druck behandeln (schließt Dialoge, entfernt Seiten, führt `BackHandler`-Listener aus); gibt zurück, ob sie es getan hat. |
| `destroy()` | Stoppt die App und ruft `destroy()` für jede ihrer nativen Komponenten auf. Die View kann danach nicht mehr verwendet werden. |

> [!IMPORTANT]
> Kompilierter Bytecode (`.nshc`) wird nur aus den eigenen Assets des APK oder aus einem signierten Paket geladen. Dateien im Speicher können ausgetauscht werden, und QuickJS validiert Bytecode nicht, daher akzeptiert `loadBundleFile` nur JS-Quelltext. Code, den die App herunterlädt, sollte als [signiertes Paket](./signed-packages.md) kommen.

`setLimits`, `setGrantedCapabilities`, `setStorageDirectory` und `setCacheOptions` gelten ab dem nächsten Laden: Rufe sie vor `loadAssetBundle` und Verwandten auf.

Jede App legt ihren Storage ohne Einstellung unter ihrer eigenen ID ab: ein signiertes Paket unter der ID, für die das Zertifikat seines Release-Schlüssels bürgt, ein Bundle unter dem `id` seines `nsh.json` (`nsh/app.json` unter den Assets des APK, geschrieben von `nsh package`). Rufe `setStorageDirectory` auf, um die Daten einer App an einem vom Host gewählten Ort abzulegen:

```java
nsh.setStorageDirectory(new File(getFilesDir(), "nsh/com.example.orders"));
nsh.loadAssetBundle("orders");
```

<a id="talking-to-the-app"></a>

## Mit der App kommunizieren

Die View und die App, die sie ausführt, kommunizieren über einen eigenen Kanal ([`host`](../modules/nsh.md#host)): Startparameter, die die App beim Start liest, Events der Host-App sowie Calls und Posts der App, mit JSON-Daten (auf dieser Seite Maps, Listen, Strings, Zahlen und Booleans). Es braucht keine View in der App und keine native Komponente.

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

Handler laufen im UI-Thread; ein Call wartet auf seine Antwort in der App, ohne eine der beiden Seiten zu blockieren. Eine Antwort, die nie gegeben wird, lässt den Call fehlschlagen, sobald sie eingesammelt wird, und ein Call mit einem Namen ohne Handler schlägt sofort fehl. Events mit Namen, auf die die App noch nicht hört, werden aufbewahrt, bis sie es tut, und Events, die gesendet werden, während keine App läuft (vor `loadAssetBundle`, während eines Reloads), gehen an die nächste.

<a id="theme-overrides"></a>

## Theme-Überschreibungen

Eine App, die in mehrere Host-Apps mit eigener Marke eingebettet ist, übernimmt jeweils die Marke des Hosts: Der Host gibt die Tokens an, die seine Marke ändert, als Theme-Datei im Format von `nsh.json` `"theme"` (`cssVars` von shadcn/ui, Werte so, wie CSS sie schreibt). Sie haben Vorrang vor den gleichnamigen Tokens der App; die übrigen Tokens der App bleiben bestehen. Gib einem Token seinen Dark-Mode-Wert unter `dark` an (ein Wert, der nur unter `light` oder `theme` gesetzt ist, gilt als diese Farbe in beiden Modi):

```java
nsh.setThemeOverrides("{ \"cssVars\": {"
        + " \"theme\": { \"radius\": \"0.75rem\" },"
        + " \"light\": { \"primary\": \"#e11d48\", \"primary-foreground\": \"#ffffff\" },"
        + " \"dark\": { \"primary\": \"#fb7185\", \"primary-foreground\": \"#1c1917\" } } }");
nsh.loadAssetBundle("orders");
```

Rufe es vor oder nach dem Laden auf: Klassen wie `bg-primary` und `rounded-(--radius)` ändern ihr Aussehen sofort, und jede später geladene App startet mit den Überschreibungen in ihrem ersten Frame. `setThemeOverrides(null)` gibt der App ihr eigenes Theme zurück.

<a id="links-the-app-opens"></a>

## Links, die die App öffnet

Die URLs, die die App öffnet ([`openUrl`](../modules/nsh.md#openurl), die Links eines `TextView` mit `links="open"`), erreichen zuerst den `OpenUrlHandler` der View, im UI-Thread: Gib `true` zurück, wenn die Host-App die URL behandelt hat, etwa indem sie sie über ihren eigenen Router geleitet hat, und `false`, damit das System sie mit einem `ACTION_VIEW`-Intent öffnet. Ohne Handler öffnet das System jede URL. URLs erreichen ihn, nachdem die Capability `openUrl` der App sie erlaubt hat.

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

## Limits

```java
// 128 MB heap, default stack, 10 s to load, 1 s per call, 50 000 nodes
nsh.setLimits(128, 0, 10_000, 1_000, 50_000);
```

Die Standardwerte sind 256 MB Heap, 4096 KB Stack, 10 s zum Laden, 2 s pro Call und 200 000 Nodes. Was jedes Limit bewirkt, wenn es erreicht wird: [Sandbox and capabilities](./sandbox-and-capabilities.md).

## Capabilities

```java
nsh.setGrantedCapabilities(
    "{\"network\": {\"hosts\": [\"api.example.com\"]}, \"webview\": {\"hosts\": [\"help.example.com\"]}}");
nsh.loadAssetBundle("nsh");
```

Eine Anfrage muss sowohl durch das erlaubt sein, was die App in ihrem `nsh.json` deklariert, als auch durch den Grant. Siehe [Sandbox and capabilities](./sandbox-and-capabilities.md).

<a id="signed-packages"></a>

## Signierte Pakete

Verifiziere heruntergeladene Pakete außerhalb des UI-Threads und führe sie dann in diesem aus:

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

| API | Beschreibung |
|---|---|
| `new NshTrust(File stateDir)` | Öffnet oder erstellt den Trust Store. Sein Zustand (neueste Sperrliste, höchster akzeptierter Build pro App) wird dort gespeichert, und die Assets der Pakete werden darunter extrahiert. Vertraut keinem Schlüssel, bis `addRoot`. Aus jedem Thread nutzbar; `close()`, wenn fertig. |
| `boolean addRoot(String publicKey)` | Vertraut einem öffentlichen Root-Schlüssel (Base64, der Inhalt einer `.pub`-Datei). `false` bei einem ungültigen Schlüssel. |
| `boolean updateRevocations(String json)` | Wendet eine Sperrliste aus `nsh revoke` an, signiert von einem vertrauenswürdigen Root und neuer als die des Stores. |
| `NshPackage openPackage(File file) throws NshPackage.RefusedException` | Verifiziert, extrahiert die Assets und akzeptiert das Paket (ältere Builds der App werden von da an abgelehnt). Langsam bei großen Paketen: Rufe es außerhalb des UI-Threads auf. |
| `NshPackage` | `appId`, `appName`, `version`, `build`; `close()`, wenn es nicht läuft. |

Wie Schlüssel, Zertifikate und Sperrung funktionieren: [Signed packages](./signed-packages.md).

<a id="development"></a>

## Entwicklung

Mit `nsh-dev.aar`:

```java
if (BuildConfig.DEBUG) {
    nsh.connectDevServer("ws://127.0.0.1:8790/ws");
} else {
    nsh.loadAssetBundle("nsh");
}
```

Führe `nsh dev App.tsx` auf deinem Computer aus. Leite bei einem Emulator oder einem USB-Gerät den Port weiter, damit das eigene `127.0.0.1` des Geräts den Server erreicht:

```sh
adb reverse tcp:8790 tcp:8790
```

Verwende andernfalls die LAN-Adresse, die `nsh dev` ausgibt. Assets kommen vom Dev-Server über einfaches HTTP, daher deklariert `nsh-dev.aar` `android:usesCleartextTraffic="true"`, was der Manifest-Merger auf die App anwendet (eine Network-Security-Config der App kann es überschreiben). Das Release-`nsh.aar` tut dies nicht.

<a id="activity-setup"></a>

## Activity-Einrichtung

- **Zurück-Taste.** `NshView` erhält Zurück-Drücke selbstständig, solange die App sie braucht (ein offener Dialog, eine gepushte Seite, ein `BackHandler`-Listener), und überlässt sie sonst der Activity. Mit `android:enableOnBackInvokedCallback="true"` unter Android 13 und neuer registriert es einen `OnBackInvokedCallback`; anderswo (Android 12 und älter, oder das Attribut ist aus) nimmt es die Zurück-Taste vor dem `onBackPressed` der Activity entgegen, also vor `OnBackPressedDispatcher` von AndroidX und den Callbacks der Fragments. Es ist keine Weiterleitung nötig, weder in einer Activity noch in einem Fragment. Ein Host, der Drücke bereits an `handleBack()` weiterleitet, funktioniert weiterhin: Ein Druck geht nur einmal an die App.

  Für Predictive Back unter Android 13+ setze `android:enableOnBackInvokedCallback="true"` auf dem `<application>`, wie es verpackte NSH-Apps tun.
- **Tastatur.** `NshView` scrollt fokussierte Eingaben selbst frei von der Tastatur. Lass `android:windowSoftInputMode` ungesetzt oder verwende `adjustResize`; mit `adjustPan` verschiebt stattdessen das System das gesamte Fenster.
- **Safe Area.** Die View meldet als Insets nur die Teile der Systemleisten und der Tastatur, die sie überlappen, sodass ein `NshView` unterhalb einer Toolbar keinen oberen Inset erhält. Für Edge-to-Edge-Inhalte zeichne hinter die Systemleisten und lass die App `env(safe-area-inset-*)`-Padding / `safeAreaInsets()` (`safe_area()` in Rust) verwenden.
- **Konfigurationsänderungen.** Eine Activity, die bei Rotation oder Theme-Wechsel neu erstellt wird, zerstört die View, und die App startet von vorn. Damit sie weiterläuft, deklariere die Änderungen, die die Activity selbst behandelt; verpackte NSH-Apps verwenden:

  ```xml
  <activity android:name=".MainActivity"
      android:configChanges="orientation|screenSize|screenLayout|smallestScreenSize|keyboard|keyboardHidden|navigation|uiMode|density|fontScale|locale|layoutDirection"
      android:windowSoftInputMode="adjustResize" />
  ```

  `NshView` folgt der neuen Größe, dem Farbschema, der Schriftskalierung, der Display-Dichte und der Layoutrichtung selbstständig; die App behält ihren State. Scroll-Positionen werden in logischen Koordinaten innerhalb der neuen Inhaltsgrenzen wiederhergestellt. Sticky Views und offene modale Fenster folgen ebenfalls der neuen Dichte.
- **Lifecycle.** Rufe `destroy()` auf, wenn die hostende Activity oder das Fragment verschwindet.
<a id="see-also"></a>

## Siehe auch

- [Building with Rust](./rust.md)
- [Embedding in iOS apps](./ios.md)
- [Native components](./native-components.md)
- [Signed packages](./signed-packages.md)
- [Packaging](./packaging.md): ein eigenständiges APK, ohne Java schreiben zu müssen
