---
title: "Objectifs et principes de conception"
description: "Les objectifs de Native Shell : des vues et des interactions natives, un design propre à l'application, des composants partagés, et Rust et TSX sur un seul moteur."
order: 1.5
group: start
source_hash: bad49295450504d6
---

Native Shell fournit des vues et des interactions natives sur iOS, Android, macOS, Windows, Linux et le web. L'application possède son design visuel. Un seul modèle de composants sert les applications complètes, les fonctionnalités intégrées et l'interface livrée dynamiquement.

<a id="native-foundations-app-owned-design"></a>

## Fondations natives, design propre à l'application

NSH s'appuie sur les vues, le texte et l'infrastructure d'entrée de chaque plateforme, et adapte l'interaction à l'appareil : navigation au clavier, entrée au pointeur et au toucher, édition de texte, défilement et accessibilité ([Introduction](./index.md#what-native-means)).

L'application définit les couleurs, la typographie, l'espacement, les formes, le retour visuel des états et les animations. Un écran de paramètres peut suivre l'identité de marque de l'application sur iOS et Android, tandis que la saisie et la navigation suivent les conventions de chaque appareil. Les designers affinent ce langage visuel au moyen des styles et des parties de composants.

Une vue native constitue la base du rendu. Un contrôle au style du système est un choix visuel et comportemental particulier. Les contrôles courants de NSH exposent un comportement partagé et des parties personnalisables, afin que les applications puissent construire leurs propres design systems.

<a id="native-integration-in-practice"></a>

## L'intégration native en pratique

Les fondations natives comprennent le rendu, les animations pilotées par les images, l'entrée et la sémantique d'accessibilité. Sur iOS et Android, [Input](../elements/input.md) utilise les champs de texte de la plateforme : celle-ci gère l'édition, les menus de sélection, les méthodes de saisie et les services de saisie automatique pris en charge. L'application décrit le champ via `autoComplete`, par exemple `current-password` ou `postal-code`, et le système fournit les suggestions disponibles selon ses réglages et ses services ([Formulaires et clavier](./forms-and-keyboard.md)). Personnaliser le style du champ reste compatible avec le maintien de cette intégration système.

Il s'agit d'une distinction architecturale par rapport au dessin d'un champ de texte entièrement dans un moteur de rendu personnalisé : un tel moteur doit fournir sa propre intégration avec l'édition système et les services d'accessibilité, alors que NSH utilise les contrôles de texte de la plateforme là où son backend les fournit. La documentation de chaque backend définit son intégration, y compris l'éditeur propre à NSH sous Windows et le backend d'intégration GPUI ([Plateformes](./platforms.md)).

La séparation entre le comportement des composants et leur design visuel dans [GPUI Kit](https://gpui-kit.com) inspire les couches de NSH. NSH prolonge ce principe en s'appuyant sur l'infrastructure de vues et d'entrée de la plateforme. L'intégration native et le design propre à l'application fonctionnent ensemble dans tout ce modèle.

<a id="one-component-model-across-platforms"></a>

## Un seul modèle de composants sur toutes les plateformes

Un interrupteur a le même sens sur un téléphone, un ordinateur de bureau et le web. [`nsh/base`](../modules/nsh-base.md) fournit l'état, la gestion des entrées, le focus et l'accessibilité ; l'application stylise la piste, le curseur et les états du [Switch](../elements/switch.md). Les boutons, cases à cocher et boutons radio suivent le même principe.

| Responsabilité | Emplacement | Exemple |
|---|---|---|
| Rendu, mise en page, réactivité et environnement | `nsh-core`, `nsh` et modules d'exécution | Vues, texte, signaux, styles |
| Comportement partagé et structure accessible | `nsh-base`, importé sous le nom `nsh/base` en TSX | `Button`, `Checkbox`, `Switch`, `Tabs` |
| Design visuel et composants stylisés | L'application ou une bibliothèque communautaire | Contrôles de marque, cartes, lignes de formulaire |
| Capacités propres à une plateforme | `nsh/mobile`, `nsh/desktop` | Barre de navigation mobile, contrôles de fenêtre de bureau |

Les contrôles courants ont un seul emplacement multiplateforme dans `nsh/base`. Les modules de plateforme sont délimités par leur objectif et leur sémantique propre à la plateforme. [`TabBar`](../modules/nsh-mobile.md#tabbar) sert la navigation mobile de premier niveau ; [`Tabs`](../elements/tabs.md) permet de basculer entre des contenus à onglets sur toutes les plateformes. Leurs rôles sont distincts. `nsh/mobile` accepte les capacités dont la sémantique d'interaction est propre au mobile ; les différences d'apparence, de taille, de teinte ou d'animation d'un contrôle courant relèvent de son composant partagé et du style de l'application. Une notification ou un toast jouant un rôle partagé doit d'abord être conçu autour d'un contrat multiplateforme unique, la présentation étant adaptée en interne.

Un composant partagé peut adapter son interaction en interne : un menu s'ouvre en popup sur un ordinateur de bureau et en feuille (sheet) sur un téléphone, tandis que l'application utilise une seule API et fournit son apparence. Les présentations gérées par le système, comme les en-têtes de navigation et les alertes, suivent les règles de présentation documentées de la plateforme. Les applications peuvent exposer leurs propres composants et services natifs via les [interfaces d'intégration](./native-components.md).

<a id="the-unstyled-foundation-and-the-component-library-layer"></a>

## La fondation sans style et la couche de bibliothèque de composants

NSH possède les primitives et la fondation sans style (`nsh-core` et `nsh-base`). Les applications et les bibliothèques tierces possèdent la couche stylisée de bibliothèque de composants, le rôle que joue `gpui-component` dans [GPUI Kit](https://gpui-kit.com). Cette répartition donne à chaque produit le contrôle de son langage visuel tout en réutilisant les parties difficiles de l'implémentation des composants.

L'expérience qui motive ce choix vient de [GPUI Kit](https://gpui-kit.com). Ses composants stylisés sont nés d'un travail sur Longbridge Pro. À mesure que les applications réclamaient des designs de plus en plus différents, la pression de personnalisation a poussé les utilisateurs à forker les composants. L'extraction de la fondation partagée dans `gpui-base` a rendu le comportement réutilisable d'un design à l'autre. Les composants stylisés restent utiles comme référence de design et pour les applications dont les besoins entrent dans leur surface de personnalisation ; la fondation offre aux autres applications un contrôle direct de la présentation.

NSH applique cette leçon dès le départ. `nsh/base` possède les comportements complexes, l'interaction, l'état réactif, le focus, l'accessibilité et la présentation adaptative, avec des tests au niveau de la couche qui possède chaque comportement. Cela inclut des structures plus larges comme [Dock](../elements/dock.md). Les applications construisent des designs variés sur cette fondation grâce aux styles, aux états, aux slots et aux parties. Les contributions de composants suivent la même frontière : les valeurs visuelles par défaut et les variantes de marque appartiennent aux composants de l'application ou de tiers. Les présentations gérées par le système documentées et les valeurs de lecture par défaut de `TextView` conservent leurs contrats propres ([Architecture](./architecture.md#three-layers)).

<a id="what-the-gallery-demonstrates"></a>

### Ce que démontre la Gallery

Les démos du site web et la Gallery sont des applications d'exemple stylisées. Leurs dégradés, ombres, coins arrondis, transitions et animations mettent à l'épreuve les capacités de personnalisation de NSH et fournissent des exemples de code source. Ces choix appartiennent aux démos et à la Gallery ; les composants de base réutilisables exposent le comportement et les parties qui les sous-tendent. Les applications peuvent reprendre les exemples ou construire un langage visuel différent.

Une bibliothèque stylisée distribuée indépendamment relèverait de la couche application/communauté décrite plus haut. Le style de la Gallery illustre une direction de design ; son adéquation à un produit donné est une décision de design propre à ce produit.

<a id="rust-and-tsx-on-one-engine"></a>

## Rust et TSX sur un même moteur

Les applications Rust, les écrans TSX et les projets mixtes partagent les primitives, les composants de base, les signaux et la mise en page. Rust apporte la logique d'application compilée et des composants natifs réutilisables. TSX permet une itération rapide et des modules livrés à l'exécution ([Développer avec Rust](./rust.md)).

Le moteur met à jour les liaisons qui dépendent de signaux modifiés et regroupe les opérations sur les vues. La mise en page du texte, les animations natives et l'entrée relèvent du moteur et de ses backends de plateforme ([Architecture](./architecture.md)). Les performances sont évaluées à partir de charges de travail d'application reproductibles ([Performance](./performance.md)).

<a id="embedding-dynamic-delivery-and-ai"></a>

## Intégration, livraison dynamique et IA

Une application native existante place une vue NSH là où une fonctionnalité doit se trouver et expose ses propres composants natifs et services hôtes. Les applications autonomes utilisent le même runtime et le même modèle de composants ([Plateformes](./platforms.md)).

Les modules TSX livrés dynamiquement possèdent leur état, leur logique et leur mise en page. Les paquets signés établissent quels éditeurs l'hôte approuve ; les limites du sandbox et les capacités définissent ce que les modules peuvent faire. L'hôte choisit à la fois la confiance et les permissions ([Paquets signés](./signed-packages.md), [Sandbox et capacités](./sandbox-and-capabilities.md)).

L'interface générée par IA suit ce contrat : générer du TSX à partir des API déclarées, le vérifier et le tester, construire et signer le module, puis le vérifier et l'exécuter selon la politique de l'hôte. Les déclarations générées, la documentation lisible par les modèles et les tests en CLI rendent ce flux de travail inspectable et reproductible ([Tests et traçage](./testing-and-trace.md)).

<a id="how-these-goals-guide-additions"></a>

## Comment ces objectifs guident les ajouts

1. Établir le comportement utilisateur et déterminer s'il est partagé entre les plateformes.
2. Placer le comportement partagé dans la primitive ou le composant de base existant, en exposant l'état et les parties pour la personnalisation par l'application.
3. Placer les capacités à sémantique propre à une plateforme dans le module de cette plateforme, en documentant leur applicabilité et leur composition avec l'interface partagée.
4. Construire les composants stylisés dans l'application ou dans la bibliothèque communautaire.
5. Vérifier le comportement, l'accessibilité, la mise en page et l'entrée sur les plateformes concernées, et documenter le contrat public dans les deux langues.

Ces principes préservent la flexibilité du design visuel, la cohérence des API de composants partagés et l'explicitation de l'intégration à la plateforme à mesure que NSH évolue.
