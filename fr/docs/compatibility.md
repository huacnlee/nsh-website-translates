---
title: "Rétrocompatibilité"
description: "Comment Native Shell garantit le bon fonctionnement des applications d'une version à l'autre : ce que promet une version compatible, le registre dans nsh-compat qui conserve chaque modification, le processus de publication, et la manière d'ajouter, de renommer ou de modifier une API."
order: 22
group: delivery
source_hash: 431c24b579dd57ba
---

# Rétrocompatibilité

Les applications hôtes téléchargent les applications NSH sous forme de [paquets signés](./signed-packages.md) et les exécutent comme des plugins. Une application déjà livrée peut ne jamais être recompilée : son équipe est passée à autre chose, son code source dort dans un processus métier, et l'application hôte a mis à jour NSH selon son propre calendrier. Native Shell fait donc une promesse à chaque application : **une application compilée pour une version compatible s'exécute sur toutes les versions ultérieures, sans modification.** Une application qui cesse de fonctionner après une mise à jour de NSH est un bug de NSH.

Cette page décrit la promesse, la façon dont elle est garantie et la manière de faire évoluer NSH dans ce cadre.

<a id="what-an-app-can-rely-on"></a>

## Ce sur quoi une application peut compter

La promesse couvre tout ce que touche une application compilée :

| Élément | Pourquoi c'est important |
| --- | --- |
| Les exports de chaque module (`nsh`, `nsh/*`, `nsh/base`, les modules standard) et leurs membres | Un bundle les importe par leur nom : si un nom manque, l'application ne démarre pas. |
| `nsh:rt`, les fonctions appelées par le JSX compilé | Chaque bundle embarque la sortie du compilateur qui l'a produit. |
| Les globales (timers, `fetch`, `console`, ...) et leurs membres | Les applications les appellent par leur nom. |
| Les props des éléments, les événements et leurs payloads, les clés de style et leurs valeurs | Les applications les passent par leur nom ; une prop renommée est ignorée, et l'application se comporte alors de travers. |
| Les utilitaires et variantes Tailwind | Les classes sont résolues à l'exécution à partir des chaînes présentes dans le bundle. |
| Le comportement : valeurs par défaut, unités, payloads, ordre des callbacks | Une application s'appuie sur ce qu'elle a observé quand elle a été écrite. |
| Les déclarations TypeScript (`.nsh/types`) | Le code source d'une ancienne application passe encore la vérification de types lorsque son équipe corrige un bug. |
| Le format des paquets et leurs signatures | Un paquet signé pour une version antérieure reste vérifiable. |

Les règles qui garantissent cette promesse :

1. **Ce qu'une version a livré reste.** Aucun module, export, membre, prop, événement, clé de payload, clé de style ou valeur, utilitaire Tailwind, globale ou fonction `nsh:rt` ne disparaît.
2. **Un renommage conserve l'ancien nom** comme alias de la même implémentation, marqué `@deprecated` avec le nouveau nom, définitivement. Déplacer un export vers un autre module le conserve aussi dans l'ancien.
3. **Les types ne font que s'élargir.** Une union gagne des alternatives, une fonction gagne des surcharges ou des paramètres optionnels en fin de liste, un paramètre devient optionnel ; ce que les applications passent (props, styles, options) ne gagne que des membres optionnels. Les valeurs que lit une application évoluent de la même façon : `platform.os` gagne une plateforme, un état ou une raison gagne un cas. Un cas que l'application connaissait conserve sa valeur, et l'application gère une valeur qu'elle ne connaît pas, avec le `default` d'un `switch` :

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
4. **Le comportement est conservé.** Tout nouveau comportement est optionnel, via une nouvelle prop, option ou valeur.
5. **`nsh:rt` ne fait que croître**, chaque fonction conservant sa signature et sa signification.
6. **Les formats sont lus pour toujours.** Les paquets, certificats, listes de révocation et `app.json` des versions antérieures sont lus par les versions ultérieures ; un paquet indique le runtime minimal dont il a besoin (`nsh publish --min-runtime`).
7. **La sécurité est la seule exception.** Une capacité qui ne peut pas être sécurisée est fermée, répertoriée avec sa raison et mentionnée dans les notes de version.

La promesse commence à la première version enregistrée comme compatible et vaut pour toujours, quel que soit le numéro de version. Entre deux versions, une API que seul `main` possède peut encore changer.

<a id="how-it-is-enforced"></a>

## Comment elle est garantie

Ce que les versions ont figé se trouve dans son propre dépôt, [longbridge/nsh-compat](https://github.com/longbridge/nsh-compat), séparé du code de NSH. Une modification de NSH est exécutée contre ce dépôt et ne peut pas le modifier : une pull request qui renomme une API ne peut pas, en même temps, réécrire l'enregistrement de cette API.

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

Chaque pull request vers NSH exécute les vérifications de `nsh-compat` sur son checkout (le workflow **Compat**, ou `cargo xtask compat` en local) :

| Vérification | Ce qui est validé |
| --- | --- |
| `checkout_apps_run` | Les applications de `tests/compat/`, compilées par ce checkout, font ce que disent leurs scripts, et chaque partie de l'API qu'un script prétend vérifier est réellement vérifiée. |
| `nothing_released_is_removed` | Tout ce que chaque version enregistrée proposait (exports, membres et leurs natures, déclarations, classes Tailwind et ce qu'elles définissent) est toujours proposé, à l'identique ou élargi. |
| `released_apps_run` | Les applications compilées par chaque version enregistrée, telles que son compilateur les a produites, démarrent sur ce runtime et font ce que disent leurs scripts. |

La première vérification teste l'API en cours d'écriture ; les deux autres protègent chaque version enregistrée. Le renommage d'une API déjà livrée échoue ainsi :

```
v0.2.0: runtime [nsh] Platform: removed
Keep it: a rename keeps the old name as a @deprecated alias of the new one, a type only widens.
```

`nsh-compat` est relu par les mainteneurs de NSH, et sa propre CI l'exécute contre `main` de NSH.

<a id="the-release-flow"></a>

## Le processus de publication

1. **Développer.** Une API arrive sur `main` avec un cas dans `tests/compat/` dont le script la vérifie. Tant qu'aucune version ne l'a enregistrée, elle peut être renommée ou remodelée ; le cas évolue avec elle.
2. **Enregistrer.** À la publication, `cargo xtask compat record <version>` écrit `releases/v<version>/` dans un checkout de `nsh-compat` : la surface que la version propose et chaque application de `tests/compat/` compilée par son compilateur, avec leurs scripts. Il n'enregistre qu'une API dont chaque partie est vérifiée par un script.
3. **Figer.** L'enregistrement est fusionné par une pull request de `nsh-compat`. À partir de là, chaque modification de NSH y est soumise, ainsi qu'à tous les enregistrements précédents.

<a id="developing-within-the-promise"></a>

## Développer dans le cadre de la promesse

<a id="adding-an-api"></a>

### Ajouter une API

Chaque nouvel export, globale, prop, événement ou clé de style s'accompagne d'un cas :

1. Écrivez un module `tests/compat/cases/<domain>/<case>.tsx` dont l'export par défaut est un composant qui utilise l'API et affiche son résultat. Les domaines sont `base`, `core`, `events`, `layout`, `paint`, `props`, `modules` et `web`, ainsi que `android`, `macos` et `browser` pour ce que décide une plateforme ou un réglage de `nsh.json`.
2. Ajoutez-le au `App.tsx` du domaine, qui affiche un cas à la fois.
3. Ajoutez les étapes au `script.txt` du domaine : `tap id:case-<case>`, puis les étapes qui vérifient ce que fait l'API, et une étape `covers <item>` pour chaque partie qu'elle ajoute.
4. Exécutez `cargo xtask compat` (`NSH_COMPAT_APP=<domain>` exécute un seul domaine).

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

Une étape `covers` est vérifiée : l'application doit utiliser l'élément et, pour une prop, un événement ou une clé de style, le retirer de l'application compilée doit faire échouer une étape du script. Les éléments sont nommés `[<module>] <export>`, `[globals] <name>`, `[props] <name>`, `[events] <name>`, `[styles] <name>`, ceux propres à un composant sous la forme `[props] <Component>.<name>`, et les props d'une plateforme sous la forme `ios.<name>`, `android.<name>`, `desktop.<name>`, `web.<name>`.

<a id="renaming-or-moving-an-api"></a>

### Renommer ou déplacer une API

Ajoutez le nouveau nom et conservez l'ancien comme alias de la même implémentation, déclaré `@deprecated` avec le nouveau nom. Mettez à jour le cas et son script avec le nouveau nom. Une API qu'aucune version n'a encore enregistrée est simplement renommée.

<a id="changing-a-type"></a>

### Modifier un type

Élargissez-le : davantage d'alternatives dans une union, davantage de surcharges, des paramètres optionnels en fin de liste, de nouveaux membres optionnels dans ce que les applications passent. Une union que les applications lisent gagne des membres de la même façon, chaque nouveau membre correspondant à un nouveau cas. Les noms des paramètres peuvent changer librement ; leur nombre, leur caractère optionnel et leurs types restent.

<a id="changing-behavior"></a>

### Modifier un comportement

Conservez l'ancien comportement et ajoutez le nouveau derrière une nouvelle prop, option ou valeur. Une correction de bug qui change ce que voit une application qui fonctionne est aussi un changement de comportement : placez-la derrière une option, ou assurez-vous qu'aucune application ne peut s'appuyer sur l'ancien résultat. Donnez au comportement une étape dans un cas, afin qu'il reste tel quel.

<a id="changing-the-compiler"></a>

### Modifier le compilateur

Rien de plus : les applications de chaque version restent telles que le compilateur de cette version les a produites, et les cas sont compilés à neuf par le vôtre. Les fonctions qu'il émet dans les bundles (`nsh:rt`) ne font que croître.

<a id="closing-an-api-for-security"></a>

### Fermer une API pour des raisons de sécurité

Une pull request de `nsh-compat` ajoute l'entrée à son `closed.txt` avec la raison (`<entry> -- <reason>`, l'entrée telle que la vérification la rapporte), et est fusionnée en premier ; la modification de NSH qui retire l'API passe ensuite. Les notes de version en expliquent la raison.

## Scripts

Un `script.txt` contient une étape par ligne. Étapes qui agissent : `tap <selector>`, `type <selector> <text>`, `key <selector> <key>`, `scroll <selector> <x> <y>`, `touch start|move|end|cancel`, `event <selector> <onEvent>
[<key>=<value>...]`, `wait <ms>`, `keyboard <height> <duration>`, `pixelratio <ratio>`. Étapes qui vérifient : `expect <text>`, `absent <text>`, `frame <selector> <x> <y> <width> <height>`, `origin`, `prop` / `noprop`, `style` / `nostyle`, `listens`, `state`, `statusbar`, `log <text>`. Les premières lignes peuvent définir l'écran : `viewport <w> <h>`, `platform <os> [desktop]`, `fontscale <scale>`. Un sélecteur est `id:<testID>`, `label:<label>`, `text:<text>` ou `span:<text>` ; les props et les styles s'écrivent comme les écrivent les applications (`style id:card backgroundColor #3366ffff`). `NSH_COMPAT_DUMP=1` affiche ce que chaque étape ajoute à l'écran et en retire, pour aider à écrire un script.

<a id="commands"></a>

## Commandes

```sh
cargo xtask compat                      # the checks against this checkout
NSH_COMPAT_APP=props cargo xtask compat -v
cargo xtask compat record 0.2.0         # at a release: record it in nsh-compat, then open a pull request there
```

`cargo xtask compat` conserve un checkout de `nsh-compat` dans `target/nsh-compat/` et le met à jour à chaque exécution ; un checkout contenant ses propres modifications est utilisé tel quel, ce qui permet de tester une modification des vérifications contre NSH avant sa pull request.
