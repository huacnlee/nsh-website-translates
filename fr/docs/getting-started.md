---
title: "Premiers pas"
description: "Créez une application en Rust ou en TSX avec nsh init, exécutez-la sur iOS, Android, macOS, Windows, Linux ou le web, hébergez des modules TSX dans votre application et distribuez-les sous forme de paquets signés, ou empaquetez l'application seule."
order: 4
group: start
demo: guide-getting-started
source_hash: 57c002bb7e893547
---

# Premiers pas

Ce guide crée une application NSH, l'exécute sur les plateformes ciblées et la publie. Les applications NSH s'écrivent en Rust ou en TSX, sur le même moteur : Rust compile votre application en code natif sans machine virtuelle JavaScript, et TSX s'exécute sur QuickJS avec des mises à jour à chaud, sous forme de modules qu'une application native peut charger à l'exécution. Le guide suit d'abord une application Rust, puis la même application en TSX. Il suppose que `nsh` est installé et présent dans votre `PATH` ([Installation](./installation.md)) ; dans un checkout, utilisez `./target/debug/nsh` à la place.

> [!TIP]
> Pas de projet d'application sous la main ? Les deux premières sections n'en demandent aucun : `nsh run` affiche l'application dans une fenêtre sur votre ordinateur, dans le simulateur iOS, sur un appareil Android ou dans le navigateur. Vous pouvez vous arrêter là, ou [la packager en application autonome](#or-ship-it-as-a-standalone-app).

<a id="create-an-app"></a>

## Créer une application

Dans un terminal, `nsh init` demande dans quel langage l'application est écrite : `rust`, `ts` ou `mixed` (TSX avec un crate Rust dédié). `--template` choisit sans demander.

<a id="in-rust"></a>

### En Rust

```sh
nsh init my-app --template rust
```

`nsh init` crée le répertoire et écrit un projet Cargo :

| Fichier | Rôle |
|---|---|
| `src/lib.rs` | L'application : son composant racine, son état et ses gestionnaires |
| `src/main.rs` | Monte la même racine sur macOS, Windows ou Linux pour `cargo run` |
| `Cargo.toml` | Le crate, qui dépend de `nsh-core` et `nsh-base` à la version de la CLI |
| `nsh.json` | Le nom, l'id, la version et le numéro de build de l'application, son crate (`"rust": "."`) et son composant racine (`"root": "App"`) ([Structure du projet](./project-structure.md#nshjson)) |
| `App.test.tsx` | Le test de la racine, en TypeScript (`nsh test`), avec `tsconfig.json` et `.nsh/types` pour votre éditeur |
| `README.md` | Comment lancer, tester et packager l'application, et comment ajouter plus tard une entrée TSX |
| `.gitignore` | Ignore `.nsh/` et `target/` |

Le développement Rust nécessite une toolchain Rust ([rustup](https://rustup.rs)) ; les commandes `nsh` compilent les runners de l'application à partir des crates de NSH sur crates.io, à la version de la CLI.

<a id="in-tsx"></a>

### En TSX

```sh
nsh init my-app --template ts
```

Une application TSX est constituée d'un ou plusieurs fichiers `.tsx` avec une entrée : ce que `nsh run` exécute, et ce qu'une application hôte charge comme module.

| Fichier | Rôle |
|---|---|
| `App.tsx` | Le module d'entrée : rend l'application avec `mount` |
| `App.test.tsx` | Son test (`nsh test`) |
| `nsh.json` | Le nom, l'id, la version et le numéro de build de l'application ([Structure du projet](./project-structure.md#nshjson)) |
| `tsconfig.json` | Étend `.nsh/tsconfig.json`, les réglages TypeScript de NSH, qui résolvent `nsh` vers les déclarations de `.nsh/types` |
| `.gitignore` | Ignore `.nsh/` et `target/` |
| `.nsh/types/` | Déclarations générées de chaque module NSH, pour votre éditeur |

Les fichiers déjà existants sont conservés, vous pouvez donc l'exécuter dans un répertoire qui en contient certains ; une application Rust est créée dans un nouveau répertoire.

Dans les deux cas, le nom affiché est par défaut celui du répertoire ; passez `--name "My App"` pour en choisir un autre. L'id devient `com.example.<name>` : modifiez-le dans `nsh.json` avant de publier. `nsh init my-app --template mixed` crée une application TSX qui est aussi un crate Rust (`Cargo.toml` et `src/lib.rs` à côté de `App.tsx`), dont le composant, le module et la classe `App.tsx` importe ([Développer avec Rust](./rust.md)).

<a id="the-root-component"></a>

### Le composant racine

Les deux modèles produisent la même application, un compteur :

```rust tabs
// src/lib.rs
use nsh_base::theme;
use nsh_core::prelude::*;

/// The crate's UI set: what a TSX entry may import from `my-app/native`.
#[native_module("my-app/native")]
fn native(registry: &mut Registry) {
    registry.register::<App>();
}

/// The application's root component.
#[component]
pub fn App() -> impl IntoElement {
    let count = signal(0_u32);
    view()
        .flex_1()
        .bg(move || theme().background)
        .text_color(move || theme().foreground)
        .child(
            view()
                .flex_1()
                .p_safe_area()
                .child(
                    view()
                        .flex_1()
                        .items_center()
                        .justify_center()
                        .gap_4()
                        .child(text(move || format!("Count: {}", count.get())).text_size(px(28.0)))
                        .child(
                            view()
                                .px_5()
                                .py_3()
                                .rounded(px(10.0))
                                .bg(move || theme().primary)
                                .active(|s| s.opacity(0.6))
                                .on_press(move || count.update(|value| *value += 1))
                                .child(
                                    text("Tap")
                                        .text_size(px(17.0))
                                        .text_color(move || theme().primary_foreground),
                                ),
                        ),
                ),
        )
}
```

```tsx tabs
// App.tsx
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View class="flex-1 items-center justify-center gap-4 bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <Text class="text-3xl font-semibold text-foreground">{count()}</Text>
      <View
        onPress={() => count.update((c) => c + 1)}
        role="button"
        class="rounded-(--radius) bg-primary px-5 py-3 active:bg-primary/90"
      >
        <Text class="text-lg text-primary-foreground">Tap</Text>
      </View>
    </View>
  );
}

mount(App);
```

En Rust :

- **`use nsh_core::prelude::*`** apporte les primitives (`view()`, `text()`, `scroll()`, `input()`, `image()`, ...), les [signaux](./reactivity.md) et les méthodes de style typées (`.p_safe_area()` ajoute à une vue un padding égal à la [zone de sécurité](../elements/safe-area.md)) ; **`nsh_base`** contient les composants de base sans style (`button()`, le clavier, les boîtes de dialogue) et `theme()`, les couleurs et les rayons avec lesquels les composants de l'application dessinent ([Thème](./rust.md#theme)).
- **`#[component] pub fn App()`** est un composant : une fonction qui s'exécute **une seule fois** et renvoie ses éléments. Le `"root": "App"` de `nsh.json` le nomme, et `nsh run` le monte. `signal(0_u32)` crée une valeur qui change au fil du temps.
- **`text(move || format!(…, count.get()))`** lie le texte au signal : quand `count` change, NSH réexécute cette closure et met à jour ce seul texte, rien d'autre. Les styles acceptent des closures de la même façon : `.bg(move || theme().primary)` suit le thème en mode sombre.
- **`.on_press(..)`** fait répondre la vue aux appuis ; `.active(|s| s.opacity(0.6))` est son style pendant l'appui, appliqué nativement. Le bouton appartient à l'application : NSH fournit les primitives et les capacités, et l'application dessine son UI à partir de celles-ci.
- **`.px_5()`, `.rounded(px(10.0))`, `.gap_4()`** sont des méthodes de style typées nommées comme les utilitaires de Tailwind, en points (`px`). La mise en page repose sur flexbox, et les enfants s'empilent en colonne par défaut ([Mise en page](./layout.md)).
- **`#[native_module("my-app/native")]`** nomme ce qu'une entrée TSX peut importer depuis le crate, pour le moment où vous ajoutez des écrans TSX par-dessus ([Développer avec Rust](./rust.md#extending-a-rust-app-with-tsx)).

En TSX :

- **`import { mount, signal, Text, View } from "nsh"`** : `nsh` est le module cœur : signaux, `mount`, les autres primitives réactives et les éléments hôtes. Il est servi par le runtime natif, et non inclus dans le bundle. **`nsh/base`** contient les composants de base, comme `nsh_base` en Rust.
- **`function App()`** est un composant qui s'exécute **une seule fois**. **`{count()}`** lit le signal dans le JSX : le compilateur voit un appel et fait suivre le signal à ce texte.
- **`<View onPress>`** est une vue native qui réagit aux appuis ; les classes `active:` sont son style pendant l'appui. `View`, `Text`, `Image`, `Scroll` et les autres [éléments hôtes](../elements/index.md) sont importés depuis `nsh` (`Input` depuis `nsh/base`) ; seuls `If` et `Each` n'ont pas besoin d'import.
- **`class`** accepte des classes [Tailwind](./tailwind.md) ; `style={{ … }}` accepte un objet de propriétés de style en camelCase, avec des nombres en points. `bg-background`, `bg-primary`, `text-primary-foreground` et `rounded-(--radius)` désignent les tokens du thème de l'application ([Tokens de thème](./tailwind.md#theme-tokens)) : ils suivent le mode sombre d'eux-mêmes, et `"theme"` dans `nsh.json` les restyle.
- **`mount(App)`** rend le composant dans la surface de l'application.

> [!IMPORTANT]
> Le texte s'affiche dans un élément texte : `text(..)` en Rust, `<Text>` en TSX. En TSX, du texte écrit directement dans un `<View>` (`<View>Hello</View>`) est une erreur de build qui le désigne, et une chaîne qu'une expression y place (`<View>{name}</View>`) est signalée dans le log.

<a id="develop-it"></a>

## Développer

<a id="run-it"></a>

### Lancer l'application

`nsh run` compile l'application, la lance et recompile pendant que vous éditez ; les logs de l'application apparaissent dans le terminal. Donnez-lui le répertoire de l'application : il exécute la racine d'une application Rust, ou le `App.tsx` d'une application TSX (`nsh run my-app/App.tsx` désigne une autre entrée).

Pour une application Rust, `nsh run` compile le runner propre à l'application pour la cible, avec votre crate et la racine montée et sans QuickJS, puis le démarre ; une modification du code Rust le recompile et redémarre l'application. `cargo run` dans le répertoire de l'application démarre la même racine directement sur le backend desktop. Pour une application TSX, `nsh run` démarre un serveur de dev et un hôte de développement qui charge l'application depuis celui-ci, et patche l'application en cours d'exécution à chaque sauvegarde.

Sans `--target`, `nsh run` utilise la machine sur laquelle vous êtes : une fenêtre AppKit sur macOS, une fenêtre Win32 sur Windows et une fenêtre GTK sur Linux. Choisissez une autre plateforme avec `--target` :

| Cible | Commande | S'exécute depuis |
|---|---|---|
| Simulateur iOS | `nsh run my-app --target ios` | macOS avec Xcode |
| Android | `nsh run my-app --target android` | macOS, Windows, Linux |
| macOS (AppKit) | `nsh run my-app` | macOS (par défaut) |
| Windows | `nsh run my-app` | Windows (par défaut) |
| Linux (GTK 4) | `nsh run my-app` | Linux (par défaut) |
| Web | `nsh run my-app --target web` | macOS, Windows, Linux |
| Mac Catalyst | `nsh run my-app --target catalyst` | macOS |

<a id="ios-simulator"></a>

#### Simulateur iOS

```sh
nsh run my-app --target ios
nsh run my-app --target ios --device "iPhone 16 Pro"
```

`nsh` utilise un simulateur déjà démarré, ou démarre l'iPhone le plus récent si aucun n'est en cours, et y installe l'application (le runner d'une application Rust, ou l'hôte de développement). `--device` choisit un simulateur par nom ou par UDID.

#### Android

```sh
nsh run my-app --target android
```

Démarrez d'abord un émulateur ou connectez un appareil (`adb devices` les liste ; NSH utilise le premier). `nsh` y installe l'application : le `libnsh.so` propre à une application Rust, ou un APK d'hôte de développement (recompilé uniquement quand le runtime change) dont le port du serveur de dev est redirigé vers l'appareil avec `adb reverse`, ce qui fonctionne par USB sans réseau partagé.

#### macOS (AppKit)

```sh
nsh run my-app --target macos
```

L'application s'ouvre comme une application Mac de bureau (AppKit, dans une fenêtre redimensionnable), avec la souris, le trackpad et le clavier comme entrées à la place du toucher. Elle nécessite macOS 14 ou ultérieur ; voir [macOS](./macos.md).

<a id="windows-default-on-windows"></a>

#### Windows (par défaut sur Windows)

```sh
nsh run my-app
```

L'application s'ouvre dans une fenêtre de bureau (1200×800 points), avec la souris, le pavé tactile, le tactile et le clavier comme entrées. Elle nécessite Windows 10 1809 ou ultérieur ; voir [Windows](./windows.md).

<a id="linux-default-on-linux"></a>

#### Linux (par défaut sur Linux)

```sh
nsh run my-app
```

L'application s'ouvre dans une fenêtre GTK (390×844 points). Elle nécessite GTK 4.14 ou ultérieur ; voir [Linux](./linux.md).

#### Web

```sh
nsh run my-app --target web
```

`nsh` affiche l'adresse de la page ; ouvrez-la dans un navigateur. Une application Rust s'exécute en WebAssembly avec votre crate, et la page ouverte charge d'elle-même le nouveau build après une modification ; voir [Web](./web.md).

#### Mac Catalyst

```sh
nsh run my-app --target catalyst
```

L'application s'ouvre dans une fenêtre de la taille d'un iPhone (390×844 points) sur votre Mac. C'est le moyen le plus rapide de voir une application comme l'affiche un téléphone : aucun simulateur à démarrer. Elle utilise UIKit comme iOS, donc ce que vous voyez est ce qu'affiche un iPhone, hormis les comportements propres au Mac comme le défilement à la molette. Pour l'application Mac elle-même, utilisez `--target macos`.

<a id="edit-it"></a>

### La modifier

Laissez `nsh run` en cours d'exécution et changez le libellé du bouton :

```rust tabs
text("Add one")
    .text_size(px(17.0))
    .text_color(move || theme().primary_foreground)
```

```tsx tabs
<Text style={{ color: "white", fontSize: 17 }}>Add one</Text>
```

Enregistrez. Une application Rust est recompilée et redémarre avec le nouveau libellé ; le compteur repart de zéro. Une application TSX reçoit une mise à jour à chaud : la CLI recompile et envoie un patch, et l'hôte réexécute le module modifié et ne re-rend que les composants dont le code a changé. Ici, c'est `App`, qui possède le signal `count`, donc le compteur repart lui aussi de zéro.

Des morceaux d'UI peuvent passer dans des composants à part, ou dans de simples fonctions qui renvoient des éléments :

```rust tabs
/// The app's button: a view that answers presses.
fn tap_button(on_press: impl Fn() + 'static) -> impl IntoElement {
    view()
        .p_3()
        .rounded(px(10.0))
        .bg(move || theme().primary)
        .active(|s| s.opacity(0.6))
        .on_press(on_press)
        .child(text("Tap").text_size(px(17.0)).text_color(move || theme().primary_foreground))
}

// In App: .child(tap_button(move || count.update(|value| *value += 1)))
```

```tsx tabs
function TapButton(props: { onPress: () => void }) {
  return (
    <View onPress={props.onPress} activeStyle={{ opacity: 0.6 }} style={{ padding: 12, borderRadius: 10, backgroundColor: "#0969da" }}>
      <Text style={{ color: "white", fontSize: 17 }}>Tap</Text>
    </View>
  );
}

// In App: <TapButton onPress={() => count.update((c) => c + 1)} />
```

En TSX, l'état survit quand vous modifiez un composant qui ne le possède pas : appuyez plusieurs fois, puis changez la couleur de `TapButton`, et le bouton se met à jour tandis que le compteur reste. Le remplacement à chaud fonctionne par composant de premier niveau : une fonction dont le nom commence par une majuscule et dont le corps contient du JSX. Un composant est re-rendu quand son propre code change, ou quand le code du module situé en dehors des composants change (une constante qu'il utilise, un helper). Si une modification ne peut pas être appliquée en place (par exemple, elle importe un module NSH que l'application en cours n'avait pas encore importé, ou elle change les capacités de `nsh.json`), l'hôte recharge toute l'application.

<a id="errors"></a>

#### Erreurs

Une erreur de compilation Rust est affichée dans le terminal avec la sortie de cargo, et `nsh run` recompile à la sauvegarde suivante. Une erreur de build TSX est affichée dans le terminal et montrée sur l'appareil sous forme d'overlay rouge indiquant le fichier, la ligne et la colonne ; l'application continue d'exécuter le dernier build valide. L'overlay disparaît au build réussi suivant (touchez-le pour le fermer plus tôt). Une exception levée à l'exécution est montrée de la même façon, avec sa pile ramenée à votre source `.tsx`.

<a id="host-it-in-your-app"></a>

## L'héberger dans votre application

Une application native affiche NSH dans une vue qui lui est propre : `NshAppView` (un `UIView`) sur iOS, `NshView` (un `View` Android) sur Android, `AppView` sur macOS, Windows, Linux et dans les applications GPUI. Placez-la comme n'importe quelle autre vue, sur n'importe quel écran, autant de fois que nécessaire.

Une racine Rust fait partie du build de l'application : l'application lie votre crate et monte la racine avec `AppSource::Rust` sur le `AppView` de macOS, Windows, Linux, GPUI et iOS ([Développer avec Rust](./rust.md#an-app-written-in-rust)). Une application TSX est un module que la vue charge : pendant le développement depuis le serveur de dev, en release depuis un bundle compilé ou un package signé téléchargé. Les sections ci-dessous chargent des modules TSX.

### iOS

Liez `NativeShellDev.xcframework` en Debug et `NativeShell.xcframework` en Release ([Intégration dans les applications iOS](./ios.md)), puis :

```swift
import NativeShell

let app = NshAppView()
app.onError = { message in print("nsh error: \(message)") }
view.addSubview(app)   // and constrain it like any view

#if DEBUG
try app.connectDevServer(URL(string: "ws://127.0.0.1:8790/ws")!)   // `nsh dev my-app` on your Mac
#else
try app.loadBundle(at: Bundle.main.url(forResource: "bundle", withExtension: "nshc", subdirectory: "nsh")!)
#endif
```

`nsh dev my-app` sert le module à l'application et pousse chaque sauvegarde, comme le fait `nsh run` avec son propre hôte. Pour le build de release, `nsh build my-app --release --out MyApp/nsh` écrit le bundle dans un dossier que vous ajoutez aux ressources de l'application.

### Android

Ajoutez `nsh-dev.aar` pour les builds debug et `nsh.aar` pour les builds release ([Intégration dans les applications Android](./android.md)), puis :

```kotlin
val nsh = NshView(this)
nsh.setErrorListener { message -> Log.e("nsh", message) }
setContentView(nsh)   // or add it to any layout

if (BuildConfig.DEBUG) {
    nsh.connectDevServer("ws://127.0.0.1:8790/ws")   // with `adb reverse tcp:8790 tcp:8790`
} else {
    nsh.loadAssetBundle("nsh")   // assets/nsh, from `nsh build my-app --release --out app/src/main/assets/nsh`
}
```

<a id="macos-windows-and-linux"></a>

### macOS, Windows et Linux

Les applications de bureau écrites en Rust intègrent NSH avec `AppView`, depuis les crates `nsh-platform-macos`, `nsh-platform-windows`, `nsh-platform-linux` et `nsh-platform-gpui` : une `NSView`, une fenêtre enfant, un widget GTK ou une vue GPUI qui monte une racine Rust ou charge un bundle compilé. Voir [macOS](./macos.md#embedding-in-a-mac-app), [Windows](./windows.md#embedding-in-a-win32-app), [Linux](./linux.md#embedding-in-a-gtk-app) et [GPUI](./gpui.md), ainsi que [Plateformes](./platforms.md#embed-in-a-native-app) pour tous les hôtes côte à côte.

<a id="what-the-module-may-do"></a>

### Ce que le module peut faire

Sur iOS et Android, l'hôte décide avant le chargement de ce qu'un module peut faire : `grantCapabilities` définit les hôtes réseau et les autres capacités auxquels il peut accéder, et des limites plafonnent sa mémoire, son temps d'appel et son nombre de nœuds ([Sandbox et capacités](./sandbox-and-capabilities.md)). Pour donner à vos modules vos propres vues natives (une carte, un graphique, un composant de design system), enregistrez-les comme [composants natifs](./native-components.md).

<a id="ship-updates-as-signed-packages"></a>

## Publier des mises à jour sous forme de packages signés

Un module TSX que l'application télécharge après la publication prend la forme d'un package signé. Créez une clé racine une fois et gardez-la hors ligne, certifiez une clé de release avec elle, puis publiez :

```sh
nsh keygen keys/root && nsh keygen keys/release
nsh certify --root keys/root.secret --key keys/release.pub --apps 'com.example.*' -o keys/release.cert
nsh publish my-app --key keys/release.secret --cert keys/release.cert --build 2
```

L'application fait confiance à la clé publique de la racine et charge ce qu'elle télécharge ; NSH vérifie la signature, le certificat et la liste de révocation avant d'exécuter quoi que ce soit :

```swift
let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
let trust = try NshTrust(stateDirectory: support.appendingPathComponent("nsh"))
try trust.addRoot(rootPublicKey)   // the contents of keys/root.pub
let info = try await app.loadPackage(at: downloadedFile, trust: trust)
```

Android suit le même flux avec `NshTrust` et `NshPackage`. Hébergement, distribution et révocation en détail : [Packages signés](./signed-packages.md).
<a id="or-ship-it-as-a-standalone-app"></a>

## Ou le livrer comme application autonome

`nsh package` construit une application installable, en Rust ou en TSX, sans projet Xcode ni build Gradle à maintenir de votre côté :

```sh
nsh package my-app --target ios-simulator --run
nsh package my-app --target android
nsh package my-app --target macos
nsh package my-app --target linux
nsh package my-app --target windows
nsh package my-app --target web
```

Une application Rust est empaquetée avec son propre runner, construit à partir de votre crate et des crates de NSH, avec sa racine montée ; une application TSX l'est avec le runtime précompilé. Options, signature et icônes : [Packaging](./packaging.md).

<a id="try-it-in-the-terminal"></a>

## Essayer dans le terminal

`nsh test` exécute une application en mode headless, sans appareil ni fenêtre. À partir du `nsh.json` d'une application Rust ou du point d'entrée d'une application TSX, il ouvre l'application, la laisse s'exécuter et affiche ce qu'elle monte ; avec `--trace`, il affiche aussi les opérations de vues natives et la durée de chaque commit ([Testing](./testing-and-trace.md)) :

```sh
nsh test my-app/nsh.json --trace     # a Rust app's root
nsh test my-app/App.tsx --trace      # a TSX app's entry
```

À partir d'un répertoire, il exécute les tests de l'application : le `App.test.tsx` de chaque modèle ouvre l'application, appuie sur son bouton et vérifie ce qu'elle affiche (`nsh test my-app`). Celui d'une application Rust ouvre sa racine (`open(".")`) ; elle peut aussi être testée dans `cargo test` avec `nsh_testing::Headless` ([Building with Rust](./rust.md#testing)).

<a id="next-steps"></a>

## Étapes suivantes

- [Building with Rust](./rust.md) : les applications Rust, leur thème, et TSX par-dessus un crate Rust.
- [JSX and components](./jsx-and-components.md) et [Reactivity](./reactivity.md) : composants et signaux, en Rust et en TSX.
- [Platforms](./platforms.md) : ce que prend en charge chaque plateforme, et sa propre page ([iOS](./ios.md), [Android](./android.md), [macOS](./macos.md), [Windows](./windows.md), [Linux](./linux.md)).
- [Signed packages](./signed-packages.md) et [Sandbox and capabilities](./sandbox-and-capabilities.md) : la distribution et ce que les modules sont autorisés à faire.
- [Project structure](./project-structure.md) : ce qui va dans `nsh.json`, les assets, les fichiers.
