---
title: "Sandbox et capacités"
description: "Les limites sous lesquelles s'exécute chaque application NSH (mémoire, temps, nœuds), le durcissement du langage dans les builds de release, et les capacités déclarées dans nsh.json et accordées par les applications hôtes."
order: 21
group: delivery
source_hash: 4659e6a8ee8e724e
---

# Sandbox et capacités

Une app écrite en Rust est du code natif compilé dans l'app qui la distribue, comme le reste de cette app, et elle s'exécute avec sa confiance. Ses appels aux services de NSH (`fetch`, images, web views, barre d'état) passent par les mêmes contrôles natifs que ceux de TSX, selon ce qu'un hôte accorde. Le TSX et le JavaScript qu'une app exécute, qu'ils soient les siens ou ceux d'un [package signé](./signed-packages.md) qu'elle télécharge, tournent dans une VM QuickJS par vue, et tout ce qu'ils peuvent faire en dehors de cette VM passe par le runtime natif de NSH. Il devient ainsi possible d'exécuter du code que vous n'avez pas écrit, comme des mini apps tierces ou des mises à jour téléchargées, selon des règles que l'app hôte contrôle :

- Les **limites** bornent la mémoire, le temps et les ressources natives qu'une app peut utiliser.
- Le **durcissement** supprime, dans les builds de release, les moyens de transformer des chaînes en code.
- Les **capacités** listent ce qu'une app peut atteindre : les hôtes depuis lesquels elle peut faire des requêtes fetch, les pages qu'une web view peut afficher, la possibilité de modifier la barre d'état. L'app les déclare ; une app hôte peut en accorder moins.

Un bundle ne contient que le code de l'app : le graphe réactif, le moteur de rendu et chaque module importé par l'app sont natifs. Rien en JS n'est donc approuvé, et chaque limite et chaque contrôle sont appliqués en Rust ; aucun code JS ne peut être modifié par une app pour les contourner.

<a id="limits"></a>

## Limites

Les limites bornent une VM : elles s'appliquent à TSX et à JavaScript. Une app intégrée dans une autre app s'exécute selon des limites que décide son app hôte. Une app autonome (empaquetée avec `nsh package`, y compris pour le web, ou lancée avec `nsh run`) est votre propre code, tout comme une app native : elle utilise la mémoire et le temps que l'appareil lui donne, et sa pile d'interpréteur de 4096 Ko transforme une récursion trop profonde en une `RangeError` que l'app peut intercepter.

Une app intégrée a les limites suivantes :

| Limite | Valeur par défaut | Quand elle est atteinte |
|---|---|---|
| Tas JS | 256 Mo | La VM s'arrête. |
| Pile de l'interpréteur | 4096 Ko (aussi le maximum) | Une récursion trop profonde lève une `RangeError`, que l'app peut intercepter. |
| Temps d'évaluation du bundle | 10 s | L'évaluation est interrompue. |
| Temps de tout autre appel dans JS | 2 s | L'appel est interrompu ; l'app continue. |
| Nœuds conservés | 200 000 | La VM s'arrête. |
| Changements simultanés (opérations en file d'attente) | 8 000 000 de valeurs | La VM s'arrête. |
| Opérations dans un dessin de canvas | 1 000 000 | La VM s'arrête. |

**Le temps est budgété par appel, pas par app.** Un « appel » est une chose que le runtime demande à JS d'effectuer : traiter un événement (y compris le rendu qu'il provoque), lier une ligne de liste, exécuter un timer, exécuter les callbacks `requestAnimationFrame` d'une frame, vider la file des microtâches. Une app qui tourne longtemps n'accumule jamais de temps vers une limite ; seul un appel isolé qui ne retourne pas à temps est interrompu. Les appels imbriqués dans un autre partagent le budget de l'appel externe.

Un appel interrompu se termine par une exception qu'aucun `catch` ne peut absorber, et l'erreur est signalée avec le budget qui a été dépassé :

```text
the script was interrupted: a call into JS exceeded its budget of 2000 ms
```

La VM continue de tourner : l'événement, le timer ou la frame suivant s'exécute normalement.

**Manquer de mémoire ou dépasser un quota arrête la VM.** L'erreur est signalée une seule fois (au gestionnaire d'erreurs de l'app hôte, et par-dessus l'app dans les builds de développement), plus aucun JS ne s'exécute ensuite, et les vues restent en l'état. Les quotas de nœuds et d'opérations existent parce que les vues natives et les changements en file d'attente vivent dans la mémoire native, que la limite du tas JS ne couvre pas : sans eux, une app pourrait épuiser la mémoire de l'appareil via l'UI.

> [!TIP]
> Ces limites sont généreuses pour des apps normales. Si vous atteignez le budget de 2 s par appel, le travail est de toute façon trop long pour un seul événement : il gèlerait les mises à jour de l'app pendant tout ce temps. Découpez-le avec `setTimeout`, ou sortez-le du gestionnaire d'événement.

Les apps hôtes définissent les limites par vue : `NshAppView.limits` sur [iOS](./ios.md#limits), `NshView.setLimits` sur [Android](./android.md#limits), `AppOptions::limits` / `AppView::set_limits` dans une [app GPUI](./gpui.md#embedding-in-a-gpui-app). Elles s'appliquent à partir du prochain chargement.

Pour voir en développement ce que fait une app TSX dans les limites d'une app hôte, lancez-la avec [`--limits`](./cli.md#nsh-run) : `nsh run App.tsx --limits` utilise les valeurs par défaut ci-dessus, et `nsh run --limits memory=128MB,call=500ms` définit ces deux limites comme le ferait une app hôte, les autres gardant leurs valeurs par défaut.

<a id="hardening"></a>

## Durcissement

Les builds de release (tout ce qui n'est pas chargé depuis un serveur de développement) sont durcis au chargement :

- `eval` est supprimé, et les constructeurs `Function`, `AsyncFunction`, `GeneratorFunction` et `AsyncGeneratorFunction` lèvent une exception. NSH n'exécute aucun code fabriqué à partir de chaînes :

  ```text
  TypeError: the Function constructor is disabled: nsh runs no code from strings (development builds allow it)
  ```

- Les prototypes partagés par tous les modules (`Object`, `Array`, `Function`, `String`, `Number`, `Promise`, `Map`, les tableaux typés et le reste) sont gelés, de sorte qu'un module (ou une bibliothèque) ne peut pas modifier `Array.prototype` pour tous les autres. `Error.prototype` reste modifiable, afin que les sous-classes d'erreur puissent définir `this.name`.

Geler les prototypes casserait normalement un schéma courant, la « faute d'override » (override mistake) : assigner `Sub.prototype.constructor = Sub` ou `obj.toString = …` lève une exception lorsque la propriété héritée est gelée. NSH transforme les membres couramment redéfinis (`constructor`, `toString`, `valueOf`, `toJSON`, ...) en accesseurs dont le setter définit la propriété sur l'objet auquel on assigne, de sorte que ce code (et les bibliothèques comme axios qui l'utilisent) continue de fonctionner.

Les bundles servis par `nsh dev` / `nsh run` (avec ou sans `--release`) ne sont pas durcis, ce qui vous permet de déboguer avec `eval`. Testez le comportement de release avec `nsh test` (qui durcit) ou avec un build empaqueté avant de livrer du code qui repose sur du code dynamique.

<a id="capabilities"></a>

## Capacités

Une app déclare ce qu'elle peut atteindre en dehors de sa VM dans `nsh.json` :

```json
{
  "name": "Quotes",
  "id": "com.example.quotes",
  "version": "1.0.0",
  "build": 3,
  "capabilities": {
    "network": {
      "hosts": ["api.example.com", "*.cdn.example.com"],
      "http": [{ "host": "quotes.example.com", "methods": ["GET"], "pathPrefix": "/v1/" }],
      "sockets": ["feed.example.com:7000"]
    },
    "webview": { "hosts": ["*.example.com"], "input": true },
    "statusBar": true,
    "clipboard": true,
    "picker": true,
    "speech": true,
    "host": ["getUserInfo", "bridge.*"],
    "openUrl": { "schemes": ["https", "mailto"] }
  }
}
```

**Une app sans `"capabilities"` peut tout faire** : une app autonome appartient à son développeur, et rien n'est restreint. Les sockets TCP bruts sont accordés nommément dans toutes les apps, via `network.sockets`, et les fonctions de l'hôte via `host`. **Une app avec `"capabilities"` ne peut faire que ce qu'elle liste** : tout le reste est refusé. Les clés inconnues sont des erreurs de build, de sorte qu'une faute de frappe est détectée à la compilation au lieu de devenir une permission manquante à l'exécution. Un [package signé](./signed-packages.md#packages-from-newer-versions-of-nsh) issu d'un NSH plus récent peut déclarer des capacités qu'un runtime plus ancien ne connaît pas : elles n'y sont pas accordées.

### `network`

Couvre `fetch` (y compris chaque redirection), les WebSockets, les images distantes (`<Image>`, `placeholder`, images de canvas, `Image.getSize` / `Image.prefetch`), les sources vidéo et les sockets TCP bruts (`net.connect`).

| Clé | Type | Description |
|---|---|---|
| `hosts` | `string[]` | Hôtes que l'app peut atteindre avec n'importe quelle méthode et n'importe quel schéma (`http`, `https`, `ws`, `wss`). |
| `http` | `object[]` | Autorisations plus fines : un hôte, restreint par l'une des clés ci-dessous. |
| `http[].host` | `string` | L'hôte ou le motif d'hôte (obligatoire). |
| `http[].methods` | `string[]` | Méthodes autorisées, comme `["GET", "HEAD"]`. Absent : toutes. |
| `http[].schemes` | `string[]` | Schémas autorisés (`scheme` : un seul, sous forme de chaîne). Absent : n'importe lequel parmi `http`, `https`, `ws`, `wss`. |
| `http[].port` | `number` | Le port ; une URL sans port prend celui par défaut de son schéma (443 pour `https`). Absent : tous. |
| `http[].paths` | `string[]` | Chemins exacts, comme `["/v1/quote"]` (la requête ne fait pas partie du chemin). |
| `http[].pathPrefixes` | `string[]` | Préfixes de chemin couvrant des segments entiers : `/v1` couvre `/v1` et `/v1/quote`, `/v1/` ce qui le suit. `pathPrefix` (un seul, sous forme de chaîne) et `path_prefixes` se lisent de la même façon. |
| `sockets` | `string[]` | Destinations TCP brutes pour [`net.connect`](../modules/standard-modules.md), chacune un `"host:port"` exact (`"[::1]:9000"` pour IPv6). |

Une règle `http` couvre tous les chemins lorsqu'elle ne liste ni `paths` ni `pathPrefixes`, et, avec les deux, un chemin correspondant à l'un ou à l'autre.

Les motifs d'hôte sont `*` (n'importe quel hôte), `*.example.com` (n'importe quel sous-domaine de `example.com`, mais pas `example.com` lui-même) ou un nom d'hôte exact. La correspondance ignore la casse et le port. L'hôte est pris après le dernier `@`, de sorte que `https://api.example.com@evil.io/` est vérifié comme `evil.io`.

Une négociation WebSocket est un GET HTTP : `ws://` est vérifié comme `http://` et `wss://` comme `https://`, si bien que les autorisations `http` et hosts qui permettent un GET de l'URL permettent le WebSocket. Un socket brut dépasse toutes les règles HTTP, c'est pourquoi `sockets` liste chaque hôte et chaque port exactement, et seul `sockets` les accorde.

Les URI `asset:` (les fichiers propres de l'app) sont toujours autorisées ; les images et les vidéos peuvent aussi utiliser des URI `data:` et des chemins relatifs.

### `webview`

| Clé | Type | Description |
|---|---|---|
| `hosts` | `string[]` | Hôtes qu'une [web view](./web-view-and-video.md) peut afficher et vers lesquels elle peut naviguer (`http` et `https`). Sans `webview`, l'app ne peut afficher aucune page web. |
| `input` | `boolean` | La ref d'une web view peut donner à sa page une saisie de confiance ([`sendInput`](./web-view-and-video.md#input-as-the-users-own)). Jamais accordée si elle n'est pas déclarée, y compris pour une app sans `"capabilities"`. |

Les navigations de premier niveau à l'intérieur de la web view sont elles aussi vérifiées, par le délégué de navigation de la plateforme, avant leur chargement. Les sous-ressources de la page elle-même (ses scripts, images, XHR) relèvent du contenu web et ne sont pas vérifiées. `about:blank` et le HTML en ligne (`html`) exigent seulement que les web views soient accordées : `"webview": { "hosts": [] }` les autorise sans autoriser aucune page distante.

`input` est distinct de `hosts` parce que la saisie de confiance porte une activation utilisateur, que `injectJavaScript` n'obtient jamais : la page peut alors ouvrir des fenêtres, écrire dans le presse-papiers, ouvrir le panneau de fichiers du système, lancer WebAuthn ou des demandes de permission, et appuyer sur tout bouton qui vérifie `isTrusted`. Sans elle, le cœur abandonne `sendInput` et journalise la clé à ajouter.

### `statusBar`

`"statusBar": true` permet à l'app de modifier la barre d'état (le `statusBar` des pages et des dialogues dans [`nsh/base`](../modules/nsh-base.md#status-bar), et la valeur par défaut de `"statusBar"` pour `nsh.json`).

### `clipboard`

`"clipboard": true` permet à l'app de lire et d'écrire dans le presse-papiers du système ([`Clipboard`](../modules/nsh.md#clipboard)). Copier depuis le menu d'édition d'un texte sélectionnable est un acte propre à l'utilisateur et ne nécessite aucune capacité.

### `picker`

`"picker": true` permet à l'app d'afficher le sélecteur de photos du système ([`Picker`](../modules/nsh.md#picker)) : l'utilisateur choisit ce qui parvient à l'app.

### `speech`

`"speech": true` permet à l'app de reconnaître ce que dit l'utilisateur ([`Speech`](../modules/nsh.md#speech)) : le microphone et le moteur de reconnaissance vocale du système, dont la transcription parvient à l'app. Le système demande tout de même une fois à l'utilisateur.

### `openUrl`

Permet à l'app d'ouvrir des URL en dehors d'elle ([`openUrl`](../modules/nsh.md#openurl), les liens d'un `TextView` avec `links="open"`) : `"openUrl": true` pour tous les schémas, `"openUrl": { "schemes": ["https", "mailto"] }` pour les schémas listés. Une URL dont le schéma n'est pas accordé est rejetée avec `ERR_ACCESS_DENIED` (`permission` `"openUrl"`, `resource` l'URL). Les URL qui exécuteraient du code ou atteindraient les données propres de l'app (`javascript:`, `data:`, `file:`, ...) ne sont jamais ouvertes, quelle que soit la capacité.

<a id="storage"></a>

### Stockage

Chaque app peut conserver ses propres données sur l'appareil avec [`Storage`](../modules/nsh.md#storage), sans capacité : le stockage ne contient que les données de cette app, et l'app qui l'embarque décide où elles sont conservées.

### `host`

`host` liste les fonctions de l'app embarquant NSH que `host.call(name, args)` de `nsh` peut appeler : des noms exacts (`"getUserInfo"`) ou des préfixes se terminant par `*` (`"bridge.*"` correspond à `bridge.call` et `bridge.share`). `"host": true` autorise toutes les fonctions. Une fonction non listée est refusée, y compris dans une app sans `"capabilities"` : les fonctions de l'hôte ne sont jamais accordées par défaut, et compiler une app qui importe `host` depuis `nsh` sans `host` avertit que chaque appel sera refusé. Les noms comptent de 1 à 128 caractères parmi `A`–`Z`, `a`–`z`, `0`–`9`, `_`, `.`, `:` et `-`, sans `..` ; l'appel de tout autre nom est refusé avant que les autorisations ne soient lues. Terminez un préfixe par un séparateur (`"bridge.*"`) : `"bridge*"` correspond aussi à `bridgeAdmin`. Les événements de l'hôte (`host.on(event, listener)`) parviennent aux listeners de l'app tels que l'hôte les envoie.

```ts
import { host } from "nsh";

if (host.available()) {
  const user = await host.call("getUserInfo");
  const stop = host.on("loginChanged", (payload) => console.log(payload));
  stop();
}
```

`host.available()` est vrai sur les plateformes qui embarquent un hôte ; ailleurs, `host.call` est rejeté avec `code` `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"`.
<a id="what-a-refusal-looks-like"></a>

### Ce à quoi ressemble un refus

| Requête | Résultat |
|---|---|
| `fetch` | La promesse est rejetée avec un `TypeError`, comme toute requête échouée, dont le `code` est `ERR_ACCESS_DENIED`, `permission` `"network"` et `resource` l'URL (celle de la requête, ou celle de la redirection) ; la requête n'atteint jamais le réseau. |
| `Image.getSize`, `Image.prefetch` | La promesse est rejetée avec `ERR_ACCESS_DENIED`, `permission` `"network"` et `resource` l'URL ; l'image n'est jamais demandée. |
| Image distante, source vidéo, source de web view ou `html` | Rien n'est affiché, et le `onError` de l'élément le signale avec `code` `"ERR_ACCESS_DENIED"`. La navigation d'une web view vers un hôte non autorisé est annulée et signalée de la même manière. |
| Changement de la barre d'état, image de canvas | Rien ne change et rien n'est dessiné ; le refus est consigné dans les logs. |
| Presse-papiers | Chaque fonction de `Clipboard` est rejetée avec `ERR_ACCESS_DENIED`, `permission` `"clipboard"` et `resource` `""` ; le presse-papiers du système n'est jamais touché. |
| Sélecteur | `pickImages` n'affiche rien et est rejetée avec `ERR_ACCESS_DENIED`, `permission` `"picker"` et `resource` `""`. |
| Parole | `Speech.start` lève `ERR_ACCESS_DENIED`, `permission` `"speech"` et `resource` `""` ; le microphone reste éteint. |
| `openUrl` | La promesse est rejetée avec `ERR_ACCESS_DENIED`, `permission` `"openUrl"` et `resource` l'URL ; rien ne s'ouvre. |
| Appel à l'hôte | `host.call` est rejetée avec `ERR_ACCESS_DENIED`, `permission` `"host"` et `resource` le nom de la fonction (`host.post` la lève) ; l'appel n'atteint jamais l'hôte. |
| Fichiers (`fs/promises`) | La promesse est rejetée avec `ERR_ACCESS_DENIED`, `permission` `"fs"` et `resource` le chemin ; le disque n'est jamais touché. |
| Processus (`process`) | `run` est rejetée, et `spawn` et `exit` lèvent une erreur, avec `ERR_ACCESS_DENIED`, `permission` `"process"` et `resource` la commande (`"exit"` pour `exit`) ; aucun processus enfant ne démarre. |
| Socket TCP (`net.connect`) | La promesse est rejetée avec `ERR_ACCESS_DENIED`, `permission` `"network"` et `resource` le `"host:port"`, avant toute résolution DNS. |
| WebSocket | Le `connect` du module `websocket` est rejeté avec `ERR_ACCESS_DENIED`, `permission` `"network"` et `resource` l'URL ; le `WebSocket` global déclenche `error` puis `close` (code 1006), comme le fait une connexion qui échoue. |

Les erreurs des [modules standard](../modules/standard-modules.md#failures) portent `code` `"ERR_ACCESS_DENIED"`, afin qu'une app distingue un refus d'une opération échouée, et leurs `permission` et `resource` nomment la capacité et ce qui était demandé. Les modules de [`nsh`](../modules/nsh.md) refusent de la même manière : leurs promesses sont rejetées avec `ERR_ACCESS_DENIED`, `permission` et `resource` (`fetch` avec un `TypeError`, la classe de toute requête échouée).

```ts
import { Clipboard } from "nsh";

try {
  await Clipboard.writeText(link);
} catch (error) {
  if (error.code !== "ERR_ACCESS_DENIED") throw error;
  console.warn(`${error.permission} is not granted`); // "clipboard"
}
```

Les composants Rust reçoivent les mêmes refus dans les termes de Rust : une lecture refusée du presse-papiers répond ce que répond un presse-papiers vide, une sélection refusée ne renvoie aucun fichier, un `open_url` refusé `false` et un `fetch` refusé un `Err` avec le message.

Chaque refus est consigné une seule fois, en indiquant quelle clé ajouter :

```text
fetch GET https://evil.example.org/x is not granted: add `evil.example.org` to capabilities.network in nsh.json
```

Les redirections sont suivies par NSH, et non par la pile HTTP de la plateforme, si bien que chaque saut est vérifié par rapport aux capacités. (Un corps de requête en flux n'est pas envoyé deux fois, donc une redirection `307` / `308` d'un envoi en flux échoue.)

<a id="where-capabilities-travel"></a>

### Où voyagent les capacités

La déclaration accompagne l'app partout où elle va :

- `nsh build` et `nsh package` l'écrivent à côté du bundle sous le nom `capabilities.json` ;
- `nsh publish` la place dans l'en-tête du [paquet signé](./signed-packages.md), couverte par la signature ;
- `nsh dev` l'envoie à chaque build, si bien que le développement applique les mêmes règles. Modifier `capabilities` recharge l'app au lieu de la patcher à chaud.

<a id="grants-what-a-host-app-allows"></a>

## Autorisations accordées : ce que permet une app hôte

Une app hôte qui embarque NSH peut accorder **au plus** certaines capacités, sous la même forme JSON :

```rust
// iOS, in Rust (nsh_platform_ios::AppView)
let grant = nsh_engine::Capabilities::from_json(&serde_json::json!({
    "network": { "hosts": ["api.example.com"] }
}))?;
app.set_granted_capabilities(Some(grant));
```

```swift
// iOS
try app.grantCapabilities(#"{ "network": { "hosts": ["api.example.com"] } }"#)
```

```java
// Android
nsh.setGrantedCapabilities("{ \"network\": { \"hosts\": [\"api.example.com\"] } }");
```

Une requête doit être autorisée **à la fois** par la déclaration de l'app et par l'autorisation de l'hôte. Avec l'autorisation ci-dessus, une app qui déclare `"hosts": ["*"]` ne peut toujours atteindre que `api.example.com`, et ne peut ni afficher de pages web ni modifier la barre d'état. Sans autorisation (`nil` / `null`, le comportement par défaut), ce que chaque app déclare s'applique.

Les autorisations s'appliquent à partir du prochain chargement. Une configuration typique pour des mini-apps tierces : n'accorder à chacune que son propre hôte d'API, l'exécuter à partir d'un [paquet signé](./signed-packages.md) dont vous avez examiné la déclaration, et conserver les limites par défaut ou les abaisser.

> [!WARNING]
> Les [composants natifs](./native-components.md) que l'app hôte enregistre sont le code propre de l'hôte : les capacités ne s'y appliquent pas. N'enregistrez que des composants sûrs pour toutes les apps que la vue peut exécuter.

<a id="summary"></a>

## Résumé

| Couche | Appliquée par | Définie par |
|---|---|---|
| Limites (tas, pile, temps, nœuds) | le runtime, par VM | l'app hôte, par vue (apps embarquées) |
| Durcissement | le runtime, au chargement | toujours actif hors développement |
| Capacités | le runtime (fetch, images, vidéo, web views, barre d'état, fichiers, processus, sockets) | l'app (`nsh.json`) et l'app hôte (autorisation) |
| Intégrité du code | vérification de la signature | `nsh publish` ; les racines de confiance de l'app hôte |

<a id="see-also"></a>

## Voir aussi

- [Paquets signés](./signed-packages.md)
- [Réseau](./networking.md)
- [Intégration dans des apps iOS](./ios.md), [Intégration dans des apps Android](./android.md)
