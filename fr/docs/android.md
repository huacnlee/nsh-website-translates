---
title: "Android"
description: "Exécutez des applications NSH en Rust et TSX sur Android avec des vues Android, sur un émulateur ou un appareil, empaquetez-les en .apk et intégrez-les dans une application Android existante avec nsh.aar et NshView."
order: 12
group: platforms
source_hash: 0e8dcab076c0aa59
---

# Android

Les applications NSH s'exécutent sur Android avec des vues Android ordinaires et du texte `StaticLayout`, à partir d'Android 9 (API 28), sur `arm64-v8a`,
`armeabi-v7a` et `x86_64`. Des applications entières écrites en Rust et en TSX s'exécutent et se packagent comme sur les autres plateformes, et une application existante
peut embarquer des modules dans un `NshView` et charger les packages signés qu'elle télécharge, dans les limites et avec les capabilities qu'elle définit. Sur Android, `os()` vaut `Os::Android` (`platform.os` vaut `"android"` en TSX) et les props `android={{…}}` de TSX s'appliquent.

<a id="requirements"></a>

## Prérequis

- **Le SDK Android** (avec `platforms;android-35`, les build tools et `platform-tools`) et **un JDK**, sur macOS, Windows
  ou Linux. Voir [Installation](./installation.md#android).
- Un émulateur, ou un appareil connecté via `adb`.

<a id="running-an-app"></a>

## Exécuter une application

Une application Rust s'exécute depuis son répertoire, une application TSX indique son point d'entrée :

```sh
nsh run --target android               # a Rust app
nsh run App.tsx --target android       # a TSX app
```

Démarrez d'abord un émulateur ou connectez un appareil (`adb devices` les liste ; NSH utilise le premier). Pour une application Rust, `nsh`
compile le `libnsh.so` de l'application avec votre crate, installe l'APK et le démarre ; une modification du code Rust de la crate le recompile
et le réinstalle. Pour une application TSX, il installe un APK hôte de développement (recompilé uniquement lorsque le runtime change) et
redirige le port du serveur de développement avec `adb reverse`, ce qui fonctionne par USB sans réseau partagé ; l'application se met à jour dès
que vous enregistrez, avec les logs dans le terminal.

## Packaging

```sh
nsh package --target android --run             # a Rust app: .nsh/out/<Name>.apk, installed and launched
nsh package App.tsx --target android --run     # a TSX app
```

L'APK d'une application Rust contient son propre `libnsh.so`, compilé avec votre crate, dont l'activité monte la racine.

L'APK est construit avec les build tools du SDK, sans Gradle, et signé avec la clé de debug sauf si vous fournissez un keystore
de release. Signature de release et icônes : [Packaging](./packaging.md#android).

NSH compile `libnsh.so` avec un alignement ELF de 16 Ko et package les bibliothèques natives non compressées sur des frontières ZIP de 16 Ko.
Un APK de release embarque `libnsh.so` sans ses tables de symboles ni ses informations de debug. La bibliothèque complète se trouve à côté du
runtime dans `symbols/<abi>/libnsh.so` (celle d'une application Rust dans `.nsh/rust/android-rust-release/symbols/<abi>/`) : donnez-la à
`ndk-stack` ou envoyez-la à Play Console comme symboles de debug natifs pour lire les stacks de crash natifs.

<a id="embedding-in-an-android-app"></a>

## Embarquer dans une application Android

Une application Android existante peut afficher des applications NSH dans sa propre interface. Le runtime est fourni sous forme de bibliothèque Android, `nsh.aar` : vous
créez un `com.longbridge.nsh.NshView` (un `FrameLayout`), l'ajoutez à n'importe quel layout et y chargez une application TSX ou un package
signé. Une application écrite en Rust est livrée sur Android sous la forme de l'APK que `nsh package --target android` construit. L'application NSH
s'affiche avec des vues Android ordinaires, à côté des vôtres.

Chaque `NshView` est un moteur indépendant avec sa propre VM JS ; il n'y a aucun singleton global, donc plusieurs peuvent s'exécuter
en même temps.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/host-app-light.svg" alt="One host app with two nsh views (NshAppView on iOS, NshView on Android): each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
<img class="diagram diagram-dark" src="/diagrams/host-app-dark.svg" alt="One host app with two nsh views (NshAppView on iOS, NshView on Android): each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
</div>

<a id="get-the-library"></a>

## Obtenir la bibliothèque

La distribution contient les deux variantes :

```text
dist/nsh/embed/android/nsh.aar       release: bundles and signed packages
dist/nsh/embed/android/nsh-dev.aar   also connects to a `nsh dev` server
```

L'AAR contient le runtime Java et `libnsh.so` pour `arm64-v8a`, `armeabi-v7a` et `x86_64`, avec leurs symboles : le
build Gradle de l'application les retire lors du packaging et conserve les symboles pour ses rapports de crash. Il déclare la
permission `INTERNET` et requiert l'**API 28** (Android 9) ou plus récente. Il embarque ses règles R8 (`proguard.txt`), qu'un
build minifié applique automatiquement : la bibliothèque native retrouve les classes du runtime par leur nom, donc `com.longbridge.nsh`
reste inchangé.

Ajoutez-le au module de l'application, par exemple depuis un dossier `libs` :

```kotlin
// app/build.gradle.kts
dependencies {
    debugImplementation(files("libs/nsh-dev.aar"))
    releaseImplementation(files("libs/nsh.aar"))
}
```

<a id="ship-a-bundle-with-the-app"></a>

## Livrer un bundle avec l'application

Compilez l'application TSX dans les assets de l'application :

```sh
nsh build App.tsx --release --out app/src/main/assets/nsh
```

Cela écrit `bundle.nshc` (bytecode), `bundle.js` (source), `bundle.js.map`, `capabilities.json` (lorsque `nsh.json`
déclare des [capabilities](./sandbox-and-capabilities.md)) et `assets/` (les images et les polices que l'application importe).

<a id="show-the-app"></a>

## Afficher l'application

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

En Kotlin :

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

`NshView` peut aussi se placer dans n'importe quel layout, par exemple sous votre propre barre d'outils :

```java
LinearLayout column = new LinearLayout(this);
column.setOrientation(LinearLayout.VERTICAL);
column.addView(toolbar);
column.addView(nsh, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
setContentView(column);
```

La taille de la vue est celle de la fenêtre de l'application : NSH met en page l'application à la taille de la vue, puis à nouveau à chaque changement. Charger
de nouveau remplace l'application en cours. L'exemple complet se trouve dans
`examples/embed-android/src/com/longbridge/nsh/embeddemo/MainActivity.java`.

## `NshView`

| Méthode | Description |
|---|---|
| `NshView(Context context)`, `NshView(Context context, boolean trace)` | Crée une vue vide. `trace` journalise la durée de chaque commit. |
| `setErrorListener(ErrorListener listener)` | Reçoit les erreurs fatales de l'application (échecs de chargement, exceptions JS non interceptées, VM arrêtée par une limite) sur le thread UI. Elles sont toujours journalisées. |
| `setLimits(int memoryMb, int stackKb, int loadMs, int callMs, int maxNodes)` | Limites de la VM des applications chargées ensuite ; 0 conserve la valeur par défaut. |
| `setGrantedCapabilities(String json)` | Le maximum que les applications chargées ensuite peuvent faire, en JSON sous la forme du `capabilities` de `nsh.json` ; `null` accorde ce que chaque application déclare. Renvoie `false` (et est ignoré) pour une autorisation invalide. |
| `setLocale(Locale locale)` | La langue et la région de l'application à la place de celles de l'utilisateur : `Intl`, `locale()` et les composants les suivent immédiatement, et les applications chargées ensuite démarrent avec elles. `null` suit celles du système. |
| `setFontScale(float scale)` | La taille du texte à la place de la taille de police du système (1 est la valeur par défaut) : les textes et les champs de saisie sont remis en page à cette taille et `fontScale()` la lit, immédiatement et pour les applications chargées ensuite ; les longueurs gardent leur taille. `0` suit celle du système. |
| `setThemeOverrides(String json)` | L'identité de marque de l'hôte par-dessus le [thème](./tailwind.md#theme-tokens) de l'application : un fichier de thème au format du `"theme"` de `nsh.json`. Ses tokens l'emportent sur ceux de l'application portant les mêmes noms, en mode clair et en mode sombre, et les autres tokens de l'application sont conservés. S'applique immédiatement et aux applications chargées ensuite ; `null` rend à l'application son propre thème. Lève `IllegalArgumentException` pour un fichier qui ne peut pas être analysé. |
| `setStorageDirectory(File dir)` | L'emplacement où les applications chargées ensuite conservent leur [stockage](../modules/nsh.md#storage) ; `null` : `files/nsh/<app id>` dans le répertoire privé de l'application, selon l'identifiant propre de l'application. |
| `setCacheOptions(NshCacheOptions options)` | L'emplacement où les applications chargées ensuite conservent leurs caches, les [images qu'elles téléchargent](./images-and-assets.md#kept-on-disk), et la quantité conservée par chacune. Construisez-en un avec `NshCacheOptions.builder()` : `location(File)`, `systemLocation()` (la valeur par défaut : `nsh` dans le répertoire de cache, chaque application dans `<app id>`) ou `noDiskCache()` ; `imagesMaxMegabytes(int)` (256 par défaut) ou `imagesOff()`. |
| `loadAssetBundle(String dir)` | Exécute `dir/bundle.nshc` depuis les assets de l'APK ; les assets de l'application proviennent de `dir/assets/`. Renvoie `false` s'il ne peut pas être lu (également signalé à l'error listener). |
| `loadBundleFile(File file)` | Exécute un fichier `bundle.js` ; les assets proviennent de `assets/` à côté. Refuse les fichiers `.nshc`. |
| `runPackage(NshPackage pkg)` | Exécute un package signé vérifié, en remplaçant l'application en cours. Un package ne s'exécute qu'une fois. |
| `registerComponent(String name, NshComponent.Factory factory)` | Enregistre un [composant natif](./native-components.md). |
| `setParams(Object params)` | Les paramètres de lancement des applications chargées ensuite (un `Map` ou `JSONObject`) : l'application les lit au démarrage sous la forme `host.params` ([`host`](../modules/nsh.md#host)). Renvoie `false` lorsqu'ils ne forment pas un objet JSON. |
| `send(String name, Object data)` | Envoie un événement à l'application (`host.on(name, …)`) ; conservé jusqu'à ce qu'elle l'écoute, ou pour la prochaine application tant qu'aucune ne s'exécute. Depuis n'importe quel thread ; renvoie `false` après `destroy()`. |
| `handle(String name, HostHandler handler)` | Gère les appels (`host.call`) et les posts (`host.post`) de l'application pour `name` sur le thread UI ; `null` supprime le gestionnaire. Le gestionnaire répond via son `NshHostReply`, une seule fois, depuis n'importe quel thread. |
| `connectDevServer(String url)` | Développement : charge depuis un serveur `nsh dev` et recharge à chaque modification. Renvoie `false` avec l'AAR de release. |
| `handleBack()` | Laisse l'application gérer un appui sur le bouton retour (ferme les boîtes de dialogue, dépile les pages, exécute les listeners `BackHandler`) ; indique si elle l'a fait. |
| `destroy()` | Arrête l'application et appelle `destroy()` sur chacun de ses composants natifs. La vue ne peut plus être utilisée. |

> [!IMPORTANT]
> Le bytecode compilé (`.nshc`) ne se charge que depuis les assets de l'APK lui-même ou depuis un package signé. Les fichiers du stockage peuvent être remplacés,
> et QuickJS ne valide pas le bytecode, donc `loadBundleFile` n'accepte que du source JS. Le code que l'application télécharge doit
> arriver sous forme de [package signé](./signed-packages.md).

`setLimits`, `setGrantedCapabilities`, `setStorageDirectory` et `setCacheOptions` s'appliquent à partir du prochain chargement : appelez-les avant `loadAssetBundle` et les méthodes similaires.

Chaque application conserve son stockage sous son propre identifiant sans aucun réglage : un package signé sous l'identifiant que le certificat de sa clé de release garantit, un bundle sous le `id` de son `nsh.json` (`nsh/app.json` parmi les assets de l'APK, écrit par `nsh package`). Appelez `setStorageDirectory` pour conserver les données d'une application à un emplacement choisi par l'hôte :

```java
nsh.setStorageDirectory(new File(getFilesDir(), "nsh/com.example.orders"));
nsh.loadAssetBundle("orders");
```

<a id="talking-to-the-app"></a>

## Dialoguer avec l'application

La vue et l'application qu'elle exécute communiquent par un canal qui leur est propre ([`host`](../modules/nsh.md#host)) : des paramètres de lancement
que l'application lit au démarrage, des événements de l'application hôte, et des appels et des posts de l'application, avec des données JSON (maps,
listes, chaînes, nombres et booléens de ce côté). Il ne nécessite aucune vue dans l'application ni aucun composant natif.

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

En Kotlin :

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

Les gestionnaires s'exécutent sur le thread UI ; un appel attend sa réponse dans l'application sans bloquer aucun des deux côtés. Une réponse qui
n'est jamais donnée fait échouer l'appel une fois qu'elle est collectée, et un appel dont le nom n'a aucun gestionnaire échoue immédiatement. Les événements dont les noms
ne sont pas encore écoutés par l'application sont conservés jusqu'à ce qu'elle les écoute, et les événements envoyés alors qu'aucune application ne s'exécute (avant `loadAssetBundle`,
pendant un rechargement) vont à la suivante.
<a id="theme-overrides"></a>

## Surcharges de thème

Une application embarquée dans plusieurs applications hôtes de marques différentes adopte la marque de chaque hôte : l'hôte fournit les tokens que sa marque modifie,
sous forme de fichier de thème au format du `"theme"` de `nsh.json` (le `cssVars` de shadcn/ui, avec des valeurs écrites comme en CSS). Ils l'emportent
sur les tokens de l'application portant les mêmes noms ; les autres tokens de l'application sont conservés. Donnez à un token sa valeur en mode sombre sous `dark`
(une seule valeur définie sous `light` ou `theme` correspond à cette couleur dans les deux modes) :

```java
nsh.setThemeOverrides("{ \"cssVars\": {"
        + " \"theme\": { \"radius\": \"0.75rem\" },"
        + " \"light\": { \"primary\": \"#e11d48\", \"primary-foreground\": \"#ffffff\" },"
        + " \"dark\": { \"primary\": \"#fb7185\", \"primary-foreground\": \"#1c1917\" } } }");
nsh.loadAssetBundle("orders");
```

Appelez-le avant ou après le chargement : les classes comme `bg-primary` et `rounded-(--radius)` changent de style immédiatement, et chaque application
chargée ensuite démarre avec les surcharges dès sa première frame. `setThemeOverrides(null)` rend à l'application son propre thème.

<a id="links-the-app-opens"></a>

## Liens ouverts par l'application

Les URL que l'application ouvre ([`openUrl`](../modules/nsh.md#openurl), les liens d'un `TextView` avec `links="open"`)
parviennent d'abord au `OpenUrlHandler` de la vue, sur le thread UI : renvoyez `true` lorsque l'application hôte a géré l'URL, par exemple en
la faisant passer par son propre routeur, et `false` pour que le système l'ouvre avec un intent `ACTION_VIEW`. Sans
gestionnaire, le système ouvre chaque URL. Les URL lui parviennent après que la capability `openUrl` de l'application les a autorisées.

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

## Limites

```java
// 128 MB heap, default stack, 10 s to load, 1 s per call, 50 000 nodes
nsh.setLimits(128, 0, 10_000, 1_000, 50_000);
```

Les valeurs par défaut sont un heap de 256 Mo, une stack de 4096 Ko, 10 s pour le chargement, 2 s par appel et 200 000 nœuds. Ce que fait chaque limite
lorsqu'elle est atteinte : [Sandbox et capabilities](./sandbox-and-capabilities.md).

## Capabilities

```java
nsh.setGrantedCapabilities(
    "{\"network\": {\"hosts\": [\"api.example.com\"]}, \"webview\": {\"hosts\": [\"help.example.com\"]}}");
nsh.loadAssetBundle("nsh");
```

Une demande doit être autorisée à la fois par ce que l'application déclare dans son `nsh.json` et par l'autorisation accordée. Voir
[Sandbox et capabilities](./sandbox-and-capabilities.md).

<a id="signed-packages"></a>

## Packages signés

Vérifiez les packages téléchargés en dehors du thread UI, puis exécutez-les sur celui-ci :

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

| API | Description |
|---|---|
| `new NshTrust(File stateDir)` | Ouvre ou crée le trust store. Son état (la liste de révocation la plus récente, le build le plus élevé accepté par application) y persiste et les assets des packages y sont extraits. Ne fait confiance à aucune clé avant `addRoot`. Utilisable depuis n'importe quel thread ; `close()` une fois terminé. |
| `boolean addRoot(String publicKey)` | Fait confiance à une clé publique racine (en base64, le contenu d'un fichier `.pub`). `false` pour une clé invalide. |
| `boolean updateRevocations(String json)` | Applique une liste de révocation depuis `nsh revoke`, signée par une racine de confiance et plus récente que celle du store. |
| `NshPackage openPackage(File file) throws NshPackage.RefusedException` | Vérifie, extrait les assets et accepte le package (les builds plus anciens de l'application sont alors refusés). Lent pour les gros packages : appelez-le en dehors du thread UI. |
| `NshPackage` | `appId`, `appName`, `version`, `build` ; `close()` s'il ne peut pas s'exécuter. |

Fonctionnement des clés, des certificats et de la révocation : [Packages signés](./signed-packages.md).

<a id="development"></a>

## Développement

Avec `nsh-dev.aar` :

```java
if (BuildConfig.DEBUG) {
    nsh.connectDevServer("ws://127.0.0.1:8790/ws");
} else {
    nsh.loadAssetBundle("nsh");
}
```

Exécutez `nsh dev App.tsx` sur votre ordinateur. Pour un émulateur ou un appareil USB, redirigez le port afin que le
`127.0.0.1` propre à l'appareil atteigne le serveur :

```sh
adb reverse tcp:8790 tcp:8790
```

Sinon, utilisez l'adresse LAN qu'affiche `nsh dev`. Les assets proviennent du serveur de développement en HTTP simple, donc `nsh-dev.aar`
déclare `android:usesCleartextTraffic="true"`, que le manifest merger applique à l'application (une configuration de sécurité réseau
de l'application peut le remplacer). Le `nsh.aar` de release ne le fait pas.

<a id="activity-setup"></a>

## Configuration de l'activity

- **Bouton retour.** `NshView` reçoit lui-même les appuis sur retour tant que l'application les souhaite (une boîte de dialogue ouverte, une page empilée, un
  listener `BackHandler`), et les laisse à l'activity dans le cas contraire. Avec `android:enableOnBackInvokedCallback="true"`
  sur Android 13 et versions ultérieures, il enregistre un `OnBackInvokedCallback` ; ailleurs (Android 12 et versions antérieures, ou attribut
  désactivé), il prend la touche retour avant le `onBackPressed` de l'activity, donc avant le `OnBackPressedDispatcher` d'AndroidX
  et les callbacks des fragments. Aucune redirection n'est nécessaire, dans une activity comme dans un fragment. Un hôte qui redirige déjà
  les appuis vers `handleBack()` continue de fonctionner : un appui n'atteint l'application qu'une seule fois.

  Pour le retour prédictif sur Android 13+, définissez `android:enableOnBackInvokedCallback="true"` sur le `<application>`, comme le font
  les applications NSH packagées.
- **Clavier.** `NshView` fait défiler lui-même les champs de saisie ayant le focus pour les dégager du clavier. Laissez `android:windowSoftInputMode` non défini
  ou utilisez `adjustResize` ; avec `adjustPan`, le système déplace plutôt toute la fenêtre.
- **Safe area.** La vue ne signale comme insets que les parties des barres système et du clavier qui la recouvrent, donc un
  `NshView` placé sous une barre d'outils n'obtient aucun inset supérieur. Pour un contenu bord à bord, dessinez derrière les barres système et laissez l'application utiliser
  le padding `env(safe-area-inset-*)` / `safeAreaInsets()` (`safe_area()` en Rust).
- **Changements de configuration.** Une activity recréée lors d'une rotation ou d'un changement de thème détruit la vue, et l'application repart
  de zéro. Pour la garder en cours d'exécution, déclarez les changements que l'activity gère elle-même ; les applications NSH packagées utilisent :

  ```xml
  <activity android:name=".MainActivity"
      android:configChanges="orientation|screenSize|screenLayout|smallestScreenSize|keyboard|keyboardHidden|navigation|uiMode|density|fontScale|locale|layoutDirection"
      android:windowSoftInputMode="adjustResize" />
  ```

  `NshView` suit lui-même la nouvelle taille, le schéma de couleurs, l'échelle de police, la densité d'affichage et le sens de mise en page ; l'application conserve
  son état. Les positions de défilement sont restaurées en coordonnées logiques dans les nouvelles limites du contenu. Les vues sticky et
  les fenêtres modales ouvertes suivent aussi la nouvelle densité.
- **Cycle de vie.** Appelez `destroy()` lorsque l'activity ou le fragment hôte disparaît.
<a id="see-also"></a>

## Voir aussi

- [Développer avec Rust](./rust.md)
- [Intégrer dans des applications iOS](./ios.md)
- [Composants natifs](./native-components.md)
- [Paquets signés](./signed-packages.md)
- [Packaging](./packaging.md) : un APK autonome sans écrire une seule ligne de Java
