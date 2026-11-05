---
title: "Développement local avec LayerFS"
description: "Utilisez l'essai Linux de LayerFS du dépôt Native Shell pour capturer les sorties de build de Cargo, créer une copie (fork) d'un espace de travail et vérifier la réutilisation des snapshots."
order: 61.5
group: tools
source_hash: 827ff94d53cb27ed
---

Le dépôt de Native Shell inclut un workflow LayerFS local pour tester des espaces de travail de build réutilisables. Il importe une arborescence source commitée, exécute Cargo dans une Sandbox Linux, enregistre les fichiers obtenus, puis relance les tests depuis un fork de cet état enregistré. L'édition du code source et les commits Git se font dans votre checkout NSH existant.

> [!IMPORTANT]
> Ce workflow nécessite Docker Engine et FUSE sous Linux. Docker exécute le processus de contrôle et la Sandbox ; FUSE monte l'espace de travail dans la Sandbox. Sous macOS, la commande de développement prépare ce déploiement Linux via un moteur Docker local tel qu'OrbStack.

<a id="what-the-snapshot-saves"></a>

## Ce que le snapshot enregistre

LayerFS enregistre une arborescence de fichiers : fichiers source, métadonnées Git, fichiers ignorés et artefacts de build créés dans l'espace de travail. Un fork part d'une arborescence enregistrée et consigne ses propres modifications. Plusieurs tâches peuvent ainsi partir du même état déjà compilé tout en gardant leurs changements séparés.

Dans l'essai local de NSH, la première branche exécute les tests de `nsh-package` et enregistre `target/` ainsi qu'un fichier témoin ignoré. La deuxième branche part de ce commit, vérifie ces fichiers et relance les tests hors ligne. Une troisième branche part de l'état source d'origine et vérifie l'isolation.

| Phase | Ce qui se passe |
| --- | --- |
| Initialisation | Importer un export du commit `HEAD` du checkout et un nouveau répertoire `.git` |
| Build | Créer un fork d'un espace de travail et exécuter `cargo +1.98.1 test --locked -p nsh-package` |
| Commit | Enregistrer le `target/` généré et le fichier témoin dans l'historique LayerFS |
| Réutilisation | Créer un fork de la branche enregistrée, la monter et relancer les tests avec `--offline` |
| Vérification | Lire l'historique des commits et vérifier que la branche source d'origine reste propre |

Chaque invocation crée un nouveau Store et exécute cette séquence complète. La réutilisation du snapshot a lieu entre les branches de cette invocation. Le bénéfice à mesurer dans cet essai est le coût pour obtenir un autre espace de travail utilisable et testé, temps de montage, de commit et de démontage compris.

<a id="prepare-the-development-environment"></a>

## Préparer l'environnement de développement

Utilisez un checkout du [dépôt NSH](https://github.com/longbridge/nsh) avec :

- Un moteur Docker Linux local avec ext4, XFS ou Btrfs pour son volume Store, fonctionnant sous Linux ou via un environnement macOS tel qu'OrbStack.
- Docker Engine exposant l'API 1.54 ou plus récente ; la configuration locale vérifiée utilise Engine 29.7.2.
- `/dev/fuse`, avec Docker autorisé à exposer ce périphérique et `CAP_SYS_ADMIN` à la Sandbox.
- Git et Python 3.12 ou plus récent ; sous Linux, rustup et un compilateur C/C++.
- Un accès réseau pour récupérer la source LayerFS épinglée, les dépendances Cargo et l'image d'exécution.

L'essai compile LayerFS **1.0.0**, épinglé au commit source `2aaf2552ce21154928b9f9c83582e41a637f5910`. Son image d'exécution fournit Rust 1.98.1, Node et clang pour les processus Linux. Le [guide du SDK en amont](https://github.com/Ephemeral-AI-Lab/layerfs/blob/v1.0.0/sdk/js/README.md) décrit le cycle de vie du Store et de la Sandbox.

Exécutez ces commandes depuis la racine du checkout NSH :

```sh
./scripts/layerfs prepare
./scripts/layerfs smoke
./scripts/layerfs status
```

L'exécutable sélectionne Python 3.12 ou plus récent, y compris l'installation de Homebrew sous macOS, et détecte le socket à partir du contexte Docker actif. Utilisez `--docker-socket PATH` pour sélectionner explicitement un socket local.

`prepare` vérifie l'API Docker, installe Rust 1.85.1 et compile le daemon épinglé, l'addon Node et l'image d'exécution. Sous macOS, ces éléments sont préparés dans un conteneur de build Linux temporaire. La commande réutilise le registre Cargo habituel et `target/`, y compris un paramètre `CARGO_TARGET_DIR` existant. L'identifiant exact de l'image d'exécution et le chemin du daemon sont consignés dans `.nsh/layerfs/deployment.json`. `status` vérifie les artefacts de build et l'image enregistrés, et affiche le dernier résultat de validation.

`smoke` crée `.nsh/layerfs/nsh-<id>/input` à partir du **`HEAD` commité** du checkout, puis importe cette entrée dans un nouveau Store. Pour inclure des modifications de source, commitez-les sur votre branche de travail avant de l'exécuter. L'entrée générée démarre avec un nouveau dépôt Git et obtient ses artefacts de build dans la Sandbox.

Le processus de contrôle ouvre le Store dans un volume Docker local nommé. Le daemon de la Sandbox ouvre le même Store et monte la vue du système de fichiers de la branche ; Cargo s'exécute dans cet espace de travail monté. Votre checkout habituel reste l'endroit où vous éditez et commitez les modifications de source.

<a id="read-the-result"></a>

## Lire le résultat

La commande affiche le répertoire des reçus et le nom du volume Store. Ouvrez le `result.json` généré pour consulter `"ok": true` et la durée de chaque phase. Le même répertoire contient `settings.json`, qui identifie le commit source et l'image, et `trace.jsonl`, qui consigne les appels au SDK.

La validation locale a exécuté 22 tests de package dans chacune des phases de build et de réutilisation. La phase initiale de build et de test incluait les téléchargements de dépendances ; la phase hors ligne a utilisé le `target/` enregistré et le registre Cargo de la même Sandbox. Pour évaluer l'intérêt de ce workflow, comparez le cycle complet avec des builds Cargo ordinaires sur votre propre charge de travail.

Utilisez des systèmes d'exploitation, des architectures, des toolchains et des dépendances identiques lorsque vous réutilisez un état déjà compilé. La charge de travail de ce guide est la suite de tests Linux `nsh-package` ; les vérifications de l'UI de plateforme utilisent leurs environnements de plateforme respectifs ([Tests](./testing-and-trace.md)).

<a id="keep-useful-work-and-manage-the-store"></a>

## Conserver le travail utile et gérer le Store

Conservez les modifications de source dans Git et soumettez-les via des pull requests. L'essai utilise le profil de Store **Disposable** de LayerFS pour un historique d'espace de travail reconstructible. Conservez séparément les reçus utiles lorsque vous enregistrez des mesures.

L'entrée générée désactive la maintenance automatique de Git pendant son commit initial, ce qui garde la base d'objets stable pendant que LayerFS l'importe. Les vérifications de statut Git dans l'essai utilisent `--no-optional-locks` afin que la lecture du statut préserve l'index d'origine. Pour des scripts personnalisés, terminez les processus d'écriture en arrière-plan avant d'importer ou de commiter une arborescence.

Les Sandboxes démontées avec succès s'arrêtent après le délai d'inactivité de LayerFS. Chaque essai conserve son volume Store ; gérez ce volume précis et ses conteneurs à l'aide des identifiants du reçu. Une opération en échec conserve son état enregistré pour le diagnostic. La [référence pour les mainteneurs](../../docs/dev/layerfs.md) couvre les scripts, les reçus et le nettoyage des ressources.
