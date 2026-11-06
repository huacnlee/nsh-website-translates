---
title: "iOS"
description: "Exécutez des applications NSH en Rust et TSX sur iOS avec des vues UIKit, dans le simulateur ou sur des appareils, empaquetez-les en .app et .ipa, et intégrez-les dans une application iOS existante avec AppView ou NshAppView de NativeShell.xcframework."
order: 11
group: platforms
source_hash: d33e715d25f83ce4
---

# iOS

Les apps NSH s'exécutent sur iOS avec des vues UIKit et du texte CoreText, sur appareil comme dans le simulateur, à partir d'iOS 15.0. Des apps complètes s'exécutent et se packagent comme sur les autres plateformes, et une app existante peut afficher des apps NSH dans ses propres vues : une racine Rust qu'elle lie, ou du TSX qu'elle charge, y compris des packages signés qu'elle télécharge, avec les limites et les capacités qu'elle définit. Sur iOS, `os()` vaut `Os::Ios` (`platform.os` vaut `"ios"` en TSX) et les props `ios={{…}}` de TSX s'appliquent.

<a id="requirements"></a>

## Prérequis

- **Xcode** sur un Mac, avec un runtime de simulateur iOS (`xcodebuild -downloadPlatform iOS` en installe un). Voir
  [Installation](./installation.md#ios-and-mac-catalyst).
- Les apps nécessitent **iOS 15.0** ou une version ultérieure, sur iPhone et iPad.

<a id="running-an-app"></a>

## Exécuter une app

Une app Rust s'exécute depuis son répertoire, une app TSX indique son point d'entrée :

```sh
nsh run --target ios                                  # a Rust app
nsh run --target ios --device "iPhone 16 Pro"
nsh run App.tsx --target ios                          # a TSX app
```

`nsh` utilise un simulateur déjà démarré, ou démarre l'iPhone le plus récent. Pour une app Rust, il compile le runner propre à l'app avec votre crate, l'installe et affiche ses logs dans le terminal ; une modification du code Rust de la crate déclenche une nouvelle compilation et redémarre l'app. Pour une app TSX, il installe l'hôte de développement et maintient l'app à jour à chaque enregistrement, avec les logs dans le terminal. `--device` choisit un simulateur par son nom ou son UDID. Pour une boucle plus rapide sans simulateur, `nsh run --target catalyst` sur un Mac ouvre le même backend UIKit dans une fenêtre [Mac Catalyst](./getting-started.md#mac-catalyst) de la taille d'un iPhone.

## Packaging

```sh
nsh package --target ios-simulator --run      # .nsh/out/<Name>.app, installed and launched in the simulator
nsh package --target ios --sign "Apple Distribution: Example Inc (ABCDE12345)" --profile AppStore.mobileprovision
```

Depuis le répertoire d'une app Rust, l'app est le runner iOS compilé avec votre crate ; une app TSX indique son point d'entrée (`nsh package App.tsx --target ios-simulator --run`).

`--target ios` écrit un `.ipa` signé pour les appareils, TestFlight ou l'App Store. Identités de signature, profils de provisionnement et icônes : [Packaging](./packaging.md#ios-devices).

<a id="embedding-in-an-ios-app"></a>

## Intégration dans une app iOS

Une app iOS existante peut afficher des apps NSH dans sa propre interface. Une app iOS avec du code Rust lie votre crate et la crate `nsh-platform-ios` et affiche votre racine dans un `AppView` ([Intégrer une app Rust](#embedding-a-rust-app)). Une app Swift lie `NativeShell.xcframework`, un framework avec un module Swift : vous créez un `NshAppView` (un `UIView`), l'ajoutez où vous voulez dans votre hiérarchie de vues et y chargez une app TSX ou un package signé. Vos écrans natifs, votre navigation et l'app NSH coexistent dans une seule hiérarchie UIKit.

Chaque vue est un moteur indépendant ; il n'y a aucun singleton global, donc une app peut afficher plusieurs apps NSH à la fois, par exemple une par onglet.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/host-app-light.svg" alt="One host app with two NshAppView regions: each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
<img class="diagram diagram-dark" src="/diagrams/host-app-dark.svg" alt="One host app with two NshAppView regions: each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
</div>

<a id="embedding-a-rust-app"></a>

## Intégrer une app Rust

`nsh_platform_ios::AppView` est un moteur sous forme de `UIView` pour une app iOS construite avec Rust : il monte le composant racine de votre crate, sans aucune VM JavaScript.

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

La vue se redimensionne avec sa supervue. `AppView::run` remplace ce qui s'exécutait ; `AppView::load` exécute plutôt un bundle TSX (`Bundle::source`, ou `unsafe { Bundle::bytecode(bytes) }` pour un `bundle.nshc` dans le bundle de l'app). `SurfaceOptions` contient les limites, les capacités accordées, le répertoire de données et les composants natifs, comme le font ci-dessous les membres de `NshAppView` ; `AppView::set_locale`, `set_font_scale` et `set_error_handler` correspondent à `locale`, `fontScale` et `onError`. `nsh package --target ios` construit ce type d'app pour vous, avec votre racine montée.

<a id="get-the-framework"></a>

## Obtenir le framework

La distribution contient les deux variantes :

```text
dist/nsh/embed/ios/NativeShell.xcframework      release: bundles and signed packages
dist/nsh/embed/ios/NativeShellDev.xcframework   also connects to a `nsh dev` server
```

À partir d'un checkout de NSH, vous pouvez ne compiler que les frameworks :

```sh
cargo xtask ios-embed    # writes dist/nsh/embed/ios/{NativeShell,NativeShellDev}.xcframework
```

Le build par défaut produit des frameworks statiques. Pour compiler des frameworks dynamiques, utilisez :

```sh
cargo xtask ios-embed --dynamic
```

Les frameworks dynamiques donnent au runtime sa propre image de bibliothèque et sa propre table de déroulement de pile, ce qui prend en charge les apps hôtes qui lient déjà d'autres runtimes Rust. Choisissez le réglage d'intégration Xcode ci-dessous en fonction du framework que vous compilez.

Par défaut, chaque XCFramework comporte trois slices arm64 : appareils iOS, simulateur iOS (Apple silicon) et Mac Catalyst. La cible de déploiement minimale est iOS 15.0. Le module Swift est compilé avec l'évolution de bibliothèque (library evolution), de sorte que les apps compilées avec d'autres versions du compilateur Swift peuvent l'importer, et le framework lie tout ce dont il a besoin : vous n'ajoutez rien d'autre.

<a id="add-it-to-an-xcode-project"></a>

## L'ajouter à un projet Xcode

1. Faites glisser `NativeShell.xcframework` (ou `NativeShellDev.xcframework` pour les builds de développement) dans **Frameworks, Libraries, and Embedded Content** de la cible de l'app. Choisissez **Do Not Embed** pour les frameworks statiques par défaut, ou **Embed & Sign** pour les frameworks dynamiques compilés avec `--dynamic`.
2. En Swift, `import NativeShell`.
3. Dans le `Info.plist` de l'app, définissez `CADisableMinimumFrameDurationOnPhone` à `YES` : sur les iPhone ProMotion, les animations de l'app s'exécutent alors à 120 Hz, comme le défilement (les apps compilées par `nsh package` l'ont).

> [!TIP]
> Liez `NativeShellDev.xcframework` dans la configuration Debug et `NativeShell.xcframework` dans Release, afin que seuls les builds de développement puissent se connecter à un serveur de développement.

<a id="ship-a-bundle-with-the-app"></a>

## Embarquer un bundle avec l'app

Une app Swift embarque des apps TSX sous forme de bundles. Compilez l'app NSH dans un dossier et ajoutez ce dossier aux ressources de l'app comme référence de dossier nommée `nsh` :

```sh
nsh build App.tsx --release --out MyApp/nsh
```

`nsh build` écrit :

| Fichier | Contenu |
|---|---|
| `bundle.nshc` | L'app compilée en bytecode : le chargement le plus rapide. |
| `bundle.js` | La même app sous forme de source JS. |
| `bundle.js.map` | Sa source map (les stack traces pointent vers vos fichiers `.tsx`). |
| `capabilities.json` | Les [capacités](./sandbox-and-capabilities.md) que l'app déclare, lorsque `nsh.json` en a. |
| `assets/` | Les images et polices que l'app importe, à leurs chemins relatifs au point d'entrée. |

<a id="show-the-app"></a>

## Afficher l'app

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

La taille de la vue est la fenêtre de l'app : NSH met en page l'app aux dimensions de la vue, puis de nouveau à chaque changement. Un nouveau chargement remplace l'app en cours ; l'app s'arrête quand la vue est désallouée.

L'exemple complet, une app UIKit qui affiche une app NSH sous son propre en-tête natif, se trouve dans `examples/embed-ios/main.swift`.

## `NshAppView`

`NshAppView` est une sous-classe de `UIView` isolée sur le main actor.

| Membre | Description |
|---|---|
| `init(frame: CGRect = .zero, trace: Bool = false)` | Crée la vue. `trace` journalise la durée de chaque commit. `init?(coder:)` prend en charge les storyboards et les nibs. |
| `onError: ((String) -> Void)?` | Reçoit les erreurs fatales de l'app (un bundle qui ne se charge pas, des exceptions JS non interceptées, une VM arrêtée par une limite) sur le thread principal. Les erreurs sont toujours journalisées ; les builds de développement les affichent aussi par-dessus l'app. |
| `limits: NshLimits` | Les limites de la VM pour les apps chargées à partir de maintenant. |
| `grantCapabilities(_ json: String?) throws` | Le maximum que les apps chargées à partir de maintenant peuvent faire, en JSON sous la forme du `capabilities` de `nsh.json` ; `nil` accorde ce que chaque app déclare. Lance `NshError` pour un JSON invalide. |
| `locale: Locale?` | La langue et la région de l'app à la place de celles de l'utilisateur : `Intl`, `locale()` et les composants la suivent immédiatement, et les apps chargées ensuite démarrent avec elle. `nil` suit celle du système. |
| `fontScale: CGFloat?` | La taille du texte à la place de celle de Dynamic Type (1 est la valeur par défaut) : les textes et les champs de saisie sont remis en page à cette taille et `fontScale()` la lit, immédiatement et pour les apps chargées ensuite ; les longueurs gardent leur taille. `nil` suit celle du système. |
| `setThemeOverrides(_ json: String?) throws` | L'identité visuelle de l'hôte par-dessus le [thème](./tailwind.md#theme-tokens) de l'app : un fichier de thème au format du `"theme"` de `nsh.json`. Ses tokens l'emportent sur ceux de l'app portant les mêmes noms, en mode clair et en mode sombre, et les autres tokens de l'app restent. S'applique immédiatement et aux apps chargées ensuite ; `nil` rend à l'app son propre thème. Lance `NshError` pour un fichier qui ne s'analyse pas. |
| `storageDirectory: URL?` | L'endroit où les apps chargées à partir de maintenant conservent leur [stockage](../modules/nsh.md#storage) ; `nil` : `Library/Application Support/nsh/<app id>`, selon l'id propre de l'app. |
| `cacheOptions: NshCacheOptions` | L'endroit où les apps chargées à partir de maintenant conservent leurs caches, les [images qu'elles téléchargent](./images-and-assets.md#kept-on-disk), et la quantité que chacune conserve : `location` `.system` (`Library/Caches/nsh`, chaque app dans `<app id>`), `.directory(URL)` ou `.off` ; `images` `.default` (256 Mo), `.maxSize(megabytes:)` ou `.off`. |
| `loadBundle(at url: URL) throws` | Exécute un bundle écrit par `nsh build`. Les assets viennent de `assets/` à côté ; `bundle.js.map` et `capabilities.json` à côté sont lus aussi. |
| `run(_ package: NshPackage)` | Exécute un package signé vérifié (voir ci-dessous). Un package ne s'exécute qu'une fois. |
| `loadPackage(at:trust:) async throws -> NshPackage.Info` | Vérifie le package à une URL hors du thread principal, puis l'exécute. Lance une erreur indiquant pourquoi il a été refusé ; l'app en cours reste en place. |
| `connectDevServer(_ url: URL) throws` | Développement : charge depuis un serveur `nsh dev` et recharge à chaque modification. Lance une erreur avec `NativeShell.xcframework`, qui n'a pas de prise en charge du développement. |
| `register(component:_:)` | Enregistre un [composant natif](./native-components.md). |
| `params: [String: Any]` | Les paramètres de lancement des apps chargées à partir de maintenant : l'app les lit au démarrage sous la forme `host.params` ([`host`](../modules/nsh.md#host)). |
| `send(_ name: String, _ data: Any? = nil)` | Envoie un événement à l'app (`host.on(name, …)`) ; conservé jusqu'à ce qu'elle l'écoute, ou pour l'app suivante tant qu'aucune ne s'exécute. |
| `handle(_ name: String, _ handler:)` | Gère les appels (`host.call`) et les envois (`host.post`) de l'app pour `name` sur le thread principal : `{ data, reply in … }`, ou une fonction `async throws` `{ data in … }` dont le résultat répond à l'appel. |
| `removeHandler(_ name: String)` | Supprime le gestionnaire de `name` : les appels de l'app vers lui échouent immédiatement. |
| `static preferredStatusBarStyle`, `prefersStatusBarHidden`, `preferredStatusBarUpdateAnimation` | Ce que les apps en cours ont demandé (`statusBar` de leurs pages et boîtes de dialogue, valeur par défaut de `nsh.json`) : renvoyez-les depuis les overrides du view controller hôte. |

> [!IMPORTANT]
> `bundle.nshc` (bytecode) ne se charge que depuis l'intérieur du bundle de l'app. QuickJS ne valide pas le bytecode, donc du bytecode provenant d'ailleurs pourrait corrompre la mémoire : pour un fichier situé hors du bundle de l'app, chargez `bundle.js` (source JS) ou, mieux, un [package signé](./signed-packages.md).

`limits`, `grantCapabilities`, `storageDirectory` et `cacheOptions` s'appliquent à partir du prochain chargement : définissez-les avant `loadBundle` / `run`.

Chaque app conserve son stockage sous son propre id sans aucun réglage : un package signé sous l'id que le certificat de sa clé de release garantit, un bundle sous le `id` de son `nsh.json` (`app.json` à côté, écrit par `nsh build`). Définissez `storageDirectory` pour conserver les données d'une app à l'endroit choisi par l'hôte :

```swift
app.storageDirectory = FileManager.default
    .urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
    .appendingPathComponent("nsh/com.example.orders")
try app.loadBundle(at: url)
```

<a id="talking-to-the-app"></a>

## Dialoguer avec l'app

La vue et l'app qu'elle exécute dialoguent par un canal qui leur est propre ([`host`](../modules/nsh.md#host)) : des paramètres de lancement que l'app lit au démarrage, des événements de l'app hôte, et des appels et envois de l'app, avec des données JSON (des objets Foundation de ce côté). Il ne nécessite aucune vue dans l'app ni aucun composant natif.

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

Les gestionnaires s'exécutent sur le thread principal ; un appel attend sa réponse dans l'app sans bloquer aucun des deux côtés. Une réponse libérée sans avoir été donnée fait échouer l'appel, et un appel d'un nom sans gestionnaire échoue immédiatement. Les événements dont les noms ne sont pas encore écoutés par l'app sont conservés jusqu'à ce qu'elle les écoute, et les événements envoyés pendant qu'aucune app ne s'exécute (avant `loadBundle`, pendant un rechargement) vont à la suivante, de sorte qu'une notification touchée pendant le démarrage de l'app l'atteint tout de même.

<a id="theme-overrides"></a>

## Surcharges de thème

Une app intégrée dans plusieurs apps hôtes de marques différentes adopte l'identité visuelle de chaque hôte : l'hôte fournit les tokens que sa marque modifie, sous forme de fichier de thème au format du `"theme"` de `nsh.json` (`cssVars` de shadcn/ui, valeurs écrites comme en CSS). Ils l'emportent sur les tokens de l'app portant les mêmes noms ; les autres tokens de l'app restent. Donnez à un token sa valeur en mode sombre sous `dark` (un token défini uniquement sous `light` ou `theme` a cette couleur dans les deux modes) :

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

Appelez-la avant ou après le chargement : les classes comme `bg-primary` et `rounded-(--radius)` sont restylées immédiatement, et chaque app chargée ensuite démarre avec les surcharges dès sa première frame. `setThemeOverrides(nil)` rend à l'app son propre thème.

<a id="links-the-app-opens"></a>

## Liens ouverts par l'app

Les URL que l'app ouvre ([`openUrl`](../modules/nsh.md#openurl), les liens d'un `TextView` avec `links="open"`) passent d'abord par `onOpenURL`, sur le thread principal : renvoyez `true` lorsque l'app hôte a pris en charge l'URL, par exemple en la faisant passer par son propre routeur, et `false` pour que le système l'ouvre avec `UIApplication.open`. Sans `onOpenURL`, le système ouvre toutes les URL. Les URL lui parviennent après que la capacité `openUrl` de l'app les a autorisées.

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

## Limites

```swift
app.limits = NshLimits(memoryMB: 128, callBudget: 1, maxNodes: 50_000)
```

| Champ de `NshLimits` | Défaut | Signification |
|---|---|---|
| `memoryMB: UInt32?` | 256 | Tas JS en Mo. Un dépassement arrête l'app. |
| `stackKB: UInt32?` | 4096 (aussi le maximum) | Pile de l'interpréteur en Ko. Une récursion plus profonde lance une `RangeError`. |
| `loadBudget: TimeInterval?` | 10 s | Temps d'évaluation du bundle. |
| `callBudget: TimeInterval?` | 2 s | Durée de tout autre appel dans JS (un événement, un timer, une frame). Un appel qui dépasse est interrompu. |
| `maxNodes: UInt32?` | 200 000 | Nœuds que l'app peut conserver. |

`nil` conserve la valeur par défaut. Ce que fait chaque limite lorsqu'elle est atteinte : [Sandbox et capacités](./sandbox-and-capabilities.md).

<a id="capabilities"></a>

## Capacités

Une app déclare ce qu'elle peut atteindre dans son `nsh.json` ; l'app d'intégration peut accorder moins. Une requête doit être autorisée par les deux :

```swift
try app.grantCapabilities("""
{
  "network": { "hosts": ["api.example.com", "*.cdn.example.com"] },
  "webview": { "hosts": ["help.example.com"] }
}
""")
try app.loadBundle(at: url)
```

Ici, l'app ne peut pas modifier la barre d'état (pas de `statusBar`), même si son `nsh.json` le demande. Détails : [Sandbox et capacités](./sandbox-and-capabilities.md).

<a id="signed-packages"></a>

## Packages signés

Pour exécuter du code que l'app télécharge (mises à jour, mini-apps tierces), utilisez des [packages signés](./signed-packages.md) : `nsh publish` écrit un `.nshpkg` signé par une clé de release que votre clé racine a certifiée, et l'app le vérifie avant de l'exécuter.

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

Pour vérifier d'abord et exécuter plus tard, séparez les deux étapes :

```swift
let package = try await trust.openPackage(at: downloadedFile)   // verifies off the main thread
// ... decide, ask the user, ...
app.run(package)
```

| API | Description |
|---|---|
| `NshTrust(stateDirectory: URL) throws` | Ouvre ou crée le trust store. Son état (liste de révocation la plus récente, build le plus élevé accepté par app) y persiste, et les assets des packages y sont extraits. Ne fait confiance à aucune clé avant `addRoot`. Thread-safe. |
| `addRoot(_ publicKey: String) throws` | Fait confiance à une clé publique racine (en base64, le contenu d'un fichier `.pub`). Plusieurs racines peuvent être approuvées. |
| `updateRevocations(_ json: String) throws` | Applique une liste de révocation écrite par `nsh revoke`, signée par une racine approuvée et plus récente que celle que possède le store. |
| `openPackage(at: URL) async throws -> NshPackage` | Vérifie, extrait les assets et accepte le package (les builds plus anciens de cette app sont alors refusés). |
| `NshPackage.info` | `id`, `name`, `version`, `build` de l'app contenue. |
| `NshError` | L'erreur que lancent tous les appels susceptibles d'échouer ; `message` en donne la raison. |
<a id="development"></a>

## Développement

Avec `NativeShellDev.xcframework`, faites pointer la vue vers un serveur de développement plutôt que vers un bundle :

```swift
#if DEBUG
try app.connectDevServer(URL(string: "ws://127.0.0.1:8790/ws")!)
#else
try app.loadBundle(at: bundledURL)
#endif
```

Exécutez `nsh dev App.tsx` sur votre Mac. Le simulateur partage le réseau du Mac, donc `127.0.0.1` atteint le serveur ; un appareil utilise l'adresse LAN qu'affiche `nsh dev` (`devices on this network: ws://192.168.1.20:8790/ws`). Chaque enregistrement met à jour l'application sur place, les journaux apparaissent dans le terminal `nsh dev`, et les erreurs s'affichent par-dessus l'application. Voir [Serveur de développement et débogage](./dev-server-and-debugging.md).

> [!NOTE]
> Sur un appareil, la connexion à votre Mac est un trafic réseau local ordinaire via `ws://` simple et `http://` (ressources).
> iOS peut demander à l'utilisateur l'accès au réseau local, et les paramètres App Transport Security de l'application doivent l'autoriser.

<a id="notes"></a>

## Remarques

- **Threads.** `NshAppView` est isolé sur le main actor. `NshTrust`, `NshPackage` et `NshComponentContext` sont thread-safe.
  Le moteur JS s'exécute sur son propre thread ; le thread principal ne l'attend jamais.
- **Barre d'état.** Les pages et boîtes de dialogue de l'application intégrée (`statusBar`) modifient ce que renvoient `NshAppView.preferredStatusBarStyle` et les méthodes associées ;
  le view controller hôte doit les transmettre, comme dans l'exemple ci-dessus.
- **Zone sûre.** Les applications utilisent `safe_area()` en Rust, et `env(safe-area-inset-*)` dans le padding ou
  `safeAreaInsets()` de [`nsh`](../modules/nsh.md#safe-area-and-keyboard) en TSX, comme d'habitude. Un `NshAppView` placé sous votre propre en-tête reçoit les marges qui lui sont applicables, et non celles de la fenêtre.
- **Mac Catalyst.** Le même framework fonctionne dans les applications Catalyst.

<a id="see-also"></a>

## Voir aussi

- [Développer avec Rust](./rust.md)
- [Intégration dans les applications Android](./android.md)
- [Composants natifs](./native-components.md)
- [Paquets signés](./signed-packages.md)
- [Bac à sable et capacités](./sandbox-and-capabilities.md)
