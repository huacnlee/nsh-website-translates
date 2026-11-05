---
title: "Guides de conception"
description: "Recommandations de conception produit et d'interaction pour les applications créées avec Native Shell : hiérarchie, couleurs et tokens, espacement, densité, composants, états d'interaction, superpositions, animation, vues riches en données, textes de l'interface et adaptation aux plateformes."
order: 29
group: ui
source_hash: 4296bdbce6ed3911
---

# Guides de conception

Utilisez ce guide avant de choisir des composants ou d'écrire du code de mise en page pour une application construite avec Native Shell. Il consigne le jugement produit que GPUI Kit a accumulé au fil des années de travail sur le bureau, transposé à NSH : une interface doit sembler native, sobre, précise et compréhensible sans deviner.

Ce guide est normatif. **Doit** désigne une contrainte de correction ou d'écosystème, **devrait** est le comportement par défaut, qu'il faut un motif concret pour écarter, et **peut** est une technique facultative. Les pages [Éléments](../elements/index.md) et [API](../modules/index.md) restent la référence pour chaque prop et chaque méthode.

Ces règles s'appuient sur le comportement de `nsh/base` (`nsh_base` en Rust), sur le thème et ses jetons, ainsi que sur l'interaction que les utilisateurs de chaque plateforme connaissent déjà. NSH effectue son rendu avec l'interface native de chaque plateforme et laisse l'apparence à l'application : les composants de `nsh/base` apportent le comportement, l'état, le focus et l'accessibilité, tandis que chaque couleur, taille, rayon et espacement provient des composants propres à l'application ; ces règles guident donc le design system de l'application. <a href="https://ui.shadcn.com/docs" target="_blank" rel="noopener noreferrer">shadcn/ui</a> apporte des méthodes utiles (code ouvert, composition et valeurs par défaut fiables) mais ne détermine pas l'apparence d'une application NSH. Quand les influences entrent en conflit, préservez le comportement de la plateforme et l'interaction que les gens comprennent déjà.

<a id="design-thesis"></a>

## Thèse de conception

Construisez des interfaces natives, discrètes et précises. Laissez le contenu, la hiérarchie et l'interaction porter l'expérience ; la décoration doit les soutenir plutôt que leur faire concurrence.

1. **La clarté avant la personnalité.** Rendez la tâche principale et l'action suivante évidentes avant d'ajouter l'expression de la marque.
2. **La composition avant l'invention.** Partez de composants établis et composez-les en flux de travail propres au produit. Ne créez une nouvelle primitive que si son comportement est réellement nouveau.
3. **Les jetons avant les valeurs.** Les couleurs, rayons, typographies et espacements doivent former un système. Évitez les littéraux isolés qui ne peuvent pas répondre aux thèmes. Voir [Style](./styling.md), [Tailwind](./tailwind.md) et [le thème](./rust.md#theme).
4. **La plateforme avant les conventions du web.** Préservez l'accès au clavier, le chrome des fenêtres, les menus, les vues de données denses, les zones redimensionnables et la navigation persistante sur les ordinateurs de bureau, ainsi que les en-têtes, le geste de retour, les alertes et les cibles tactiles du système sur téléphones et tablettes, là où la tâche en tire parti.
5. **L'état doit être visible.** Les états de survol, d'appui, de focus, de sélection, de désactivation, de chargement, de validation et de destruction nécessitent chacun un traitement distinct et cohérent.
6. **La géométrie explique l'imbrication.** Les rayons, les marges intérieures et les bordures doivent décrire une hiérarchie cohérente, même lorsque des surfaces se chevauchent.
7. **Le retour reflète la réalité.** Les indicateurs de chargement, les infobulles et les animations doivent clarifier un état ou une transition réels, et non ajouter du cérémonial à une action immédiate.

<a id="learning-from-shadcn"></a>

## Ce que l'on apprend de Shadcn

L'apport le plus utile de Shadcn n'est pas une couleur de bordure particulière. C'est une manière de construire un système :

- posséder la couche supérieure de l'interface au lieu de lutter contre une abstraction scellée ;
- composer de petites parties prévisibles en composants propres au produit ;
- fournir des valeurs par défaut qui forment déjà un seul langage visuel ;
- garder le code et la composition lisibles pour les humains comme pour l'IA ;
- séparer les primitives de comportement de la couche stylée.

NSH applique ces idées grâce à la séparation entre les primitives de `nsh`, les composants de base sans style de `nsh/base` et la couche stylée, qui appartient à l'application ([Trois couches](./architecture.md#three-layers)). Les applications construisent leurs composants sur `nsh/base`, en TSX ou dans le crate Rust de l'application ; le comportement réutilisable relève de `nsh/base`, et la politique visuelle reste au-dessus.

Ne copiez pas aveuglément ces hypothèses du web :

| Habitude du web | Comportement par défaut de NSH |
| --- | --- |
| Curseur en main pointante sur chaque bouton | Curseur par défaut ; main pointante (`cursor-pointer`) pour les liens |
| La navigation par pages comme structure principale | Fenêtres, volets, barres latérales, onglets et menus persistants sur les ordinateurs de bureau ; un `NavStack` avec le retour du système sur téléphone |
| Focus et défilement du navigateur comme solution de repli | Propriété explicite du focus et défilement propre à chaque zone (`Scroll`, `List`) |
| Une seule colonne, mobile d'abord | Une colonne sur téléphone, une interface redimensionnable avec une taille de fenêtre minimale définie sur les ordinateurs de bureau |
| Actions critiques révélées au survol | Actions accessibles au clavier, au toucher et au pointeur, sans dépendre du survol |
| Une rangée de boutons-icônes visibles uniquement au survol | Une action principale visible plus `Menu` ou `ContextMenu` pour les commandes secondaires |
| Texte stylé en lien pour les commandes de l'application | Un `Button` dans le style par défaut, outline ou ghost de l'application ; le style lien uniquement pour les URL, les ressources web ou les adresses e-mail |
| Grande densité tactile partout | Cibles de taille tactile sur les écrans tactiles ; densité moyenne avec un pointeur, compacte seulement là où le travail sur l'information en bénéficie |
| Un en-tête et une carte d'alerte dessinés sur chaque plateforme | L'en-tête et le `AlertDialog` du système sur iOS et Android ; l'emplacement `header` de la page sur les ordinateurs de bureau et le web |
| Surcharges CSS sur tous les descendants | Les composants de l'application, leurs parties et les jetons du thème |

<a id="start-from-the-task"></a>

## Partir de la tâche

Avant de dessiner un écran, notez :

- la tâche principale de l'utilisateur ;
- l'objet consulté ou modifié ;
- les actions qui doivent rester immédiatement disponibles ;
- l'information nécessaire pour prendre une décision ;
- les états vide, de chargement, d'erreur, hors ligne, en lecture seule et d'autorisation refusée ;
- le parcours au clavier, au toucher et au lecteur d'écran à travers le flux de travail ;
- l'endroit où l'application est affichée : seule, ou dans une application hôte.

Organisez l'écran autour de ces réponses. Ne commencez pas par une grille de tableau de bord ou un catalogue de composants. Une bonne interface expose le modèle mental de l'utilisateur : documents, comptes, projets, messages, paramètres ou un autre objet stable, et non l'architecture interne des services.

Concevez la tâche principale avant de répartir les contrôles. Son poids visuel, son emplacement et sa profondeur d'information doivent correspondre à son importance pour le produit. Un résultat central ne doit pas être réduit à un petit compteur, à une icône dans un coin ou à une action faible en pied de page pendant que le contenu secondaire occupe la page. Lorsqu'un ensemble de résultats constitue la valeur principale du produit, envisagez une zone de synthèse ou une carte qui expose le nombre, des résultats représentatifs, un état significatif et une action suivante claire.

Pour chaque action proposée, nommez son objet visible, son état actuel, sa portée et son résultat. Si l'interface ne montre pas ou n'implique pas clairement ces éléments, l'action est prématurée. N'exposez pas une capacité simplement parce que le backend la possède ; concevez d'abord la manière dont l'objet entre dans le modèle mental de l'utilisateur.

<a id="visual-language"></a>

## Langage visuel

<a id="hierarchy"></a>

### Hiérarchie

Privilégiez un petit nombre de niveaux clairs :

- le **titre de fenêtre ou de page** identifie l'objet ou l'espace de travail courant ;
- le **titre de section** sépare les zones significatives (`role="header"`, afin que les lecteurs d'écran puissent y naviguer) ;
- le **corps de texte** porte le travail ;
- le **texte atténué** fournit les métadonnées secondaires et l'aide ;
- les **libellés** identifient les contrôles et les valeurs.

Utilisez la taille, la graisse, l'espacement et les séparateurs avant d'ajouter de la couleur ou des conteneurs. Évitez d'imbriquer des cartes dans des cartes : la plupart des zones n'ont besoin que d'un arrière-plan, d'une bordure fine et d'un espacement réfléchi.

Évaluez la hiérarchie sur l'ensemble de la fonctionnalité, et non composant par composant. Masquez la couleur d'accent et la décoration pendant la revue : la tâche principale, la sélection courante, la synthèse des résultats et l'action suivante doivent rester évidentes grâce à la structure. Un écran qui contient des contrôles plausibles pris isolément peut tout de même échouer s'ils ne forment pas un seul ordre de lecture et un seul chemin de décision.

Considérez l'emphase comme un budget limité. Une surface locale a besoin d'un seul point focal clair, et non d'un champ de mises en valeur concurrentes. Si tout est coloré, badgé, en gras, encadré ou promu en alerte, rien ne paraît important. Établissez la priorité d'abord par la structure et la proximité ; ne dépensez une couleur plus forte et des composants plus marquants que là où une distinction change ce que l'utilisateur remarque ou fait.

<a id="color-and-themes"></a>

### Couleur et thèmes

Lisez les couleurs depuis le thème (`theme()` en Rust, classes de jetons en TSX) et utilisez-les selon leur rôle sémantique :

- `background` et `foreground` pour la surface et le texte principaux ;
- `card`, `popover`, `sidebar` et leurs jetons de premier plan pour leurs surfaces nommées ;
- `muted` et `muted-foreground` pour l'information de soutien ;
- `primary` pour l'action principale ou l'emphase de sélection, `secondary` et `accent` pour une emphase plus discrète et pour les lignes survolées ou ayant le focus ;
- `destructive` uniquement pour les actions destructrices et les erreurs, et les couleurs d'état que l'application ajoute à son thème (`success`, `warning`) uniquement pour leur signification ;
- `chart-1` à `chart-5` pour les séries de données ;
- `border`, `input` et `ring` pour la structure et l'interaction.

```rust tabs
use nsh_base::theme;

view()
    .rounded(move || theme().radius)
    .border_1()
    .border_color(move || theme().border)
    .bg(move || theme().background)
    .p_4()
    .gap_1()
    .child(text("Balance").text_color(move || theme().foreground))
    .child(text("Updated just now").text_sm().text_color(move || theme().muted_foreground))
```

```tsx tabs
<View class="gap-1 rounded-(--radius) border border-border bg-background p-4">
  <Text class="text-foreground">Balance</Text>
  <Text class="text-sm text-muted-foreground">Updated just now</Text>
</View>
```

N'utilisez pas une couleur d'état sémantique comme décoration. N'encodez pas le sens par la seule couleur. Vérifiez chaque surface personnalisée avec les thèmes clair et sombre et avec des valeurs de thème personnalisées, y compris le thème d'une application hôte qui intègre la vôtre ; ne supposez jamais que le premier plan est noir ou que l'arrière-plan est blanc.

Utilisez un badge pour un état court, un compteur ou une classification qui gagne à être repérée rapidement, et non pour chaque libellé, valeur de métadonnée, filtre ou titre de section. Gardez la plupart des badges neutres ; réservez les couleurs sémantiques aux états qui portent réellement un sens de succès, d'avertissement, de destruction ou d'information. Une rangée de badges multicolores signale généralement une décision de hiérarchie ou de regroupement manquante.

L'interface d'une application ne devrait contenir ni couleurs hex brutes, ni couleurs `rgb()`/`rgba()` ou `hsl()`, ni classes de palette telles que `bg-zinc-100`. Résolvez les couleurs depuis le thème selon le rôle sémantique. Si le rôle requis n'existe pas, définissez-le dans le fichier de thème de l'application ([Jetons de thème](./tailwind.md#theme-tokens) : `"up": "#16a34a"` dans son `light` et `dark` produit `text-up`, `bg-up/30`, `token("up")` en TSX et `theme().color("up")` en Rust) plutôt que d'intégrer une valeur de palette à l'endroit de l'appel. Les couleurs brutes n'ont leur place que dans les définitions de thème ou dans des contenus de données ou raster audités dont la couleur est elle-même la donnée.

<a id="radius-spacing-and-density"></a>

### Rayon, espacement et densité

Utilisez une échelle de rayons finie, comme pour la typographie et les tailles de contrôles. Choisissez parmi les `radius` du thème (pour les contrôles comme pour les surfaces, `rounded-(--radius)`), les rayons que l'application ajoute à son thème et `rounded-sm` … `rounded-2xl` de Tailwind entre eux) au lieu d'inventer un rayon pour chaque élément. Les grands conteneurs peuvent utiliser un palier plus doux que les contrôles qu'ils contiennent ; les contrôles compacts et les superpositions utilisent des paliers plus serrés. Pour un rectangle ordinaire, le rayon doit rester nettement inférieur à la moitié de son plus petit côté. N'utilisez `rounded-full` (`.rounded_full()`) que pour des cercles et des pilules intentionnels ; une infobulle ne doit pas devenir une capsule par accident.

Les surfaces imbriquées doivent se lire comme des formes concentriques. Utilisez `inner radius ≈ max(0, outer radius − gap)` pour choisir le rayon approprié le plus proche ; la bande visible doit rester régulière tout au long du virage. Ajoutez un jeton nommé au thème (`"radius-inset": "0.375rem"`, `rounded-(--radius-inset)`) si une composition répétée a besoin d'une valeur intermédiaire. Un contrôle segmenté est une seule silhouette : ses segments d'extrémité suivent les angles intérieurs du conteneur, ses segments centraux restent carrés, et chaque frontière a un seul séparateur d'épaisseur constante.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/radius-hierarchy-light.svg" alt="Light theme chat composer: the inset surface, both buttons, and placeholder spacing change together; red guide circles show their shared corner center.">
<img class="diagram diagram-dark" src="/diagrams/radius-hierarchy-dark.svg" alt="Dark theme chat composer: the inset surface, both buttons, and placeholder spacing change together; red guide circles show their shared corner center.">
</div>

Un rayon doit régir toute la surface visible, et pas seulement sa bordure. Les angles exposés restent transparents vis-à-vis de la surface située derrière eux ; les arrière-plans des enfants, les remplissages de sélection et le contenu défilant doivent aussi suivre la limite. Donnez aux surfaces intérieures leur propre rayon, ou découpez le conteneur avec `overflow-hidden` (`.overflow_hidden()`), puis inspectez la composition sur un arrière-plan contrasté dans les deux thèmes. Préservez les anneaux de focus extérieurs lorsque vous choisissez un découpage.

Utilisez une échelle d'espacement compacte et répétez-la. Les paires libellé/contrôle apparentées doivent être plus proches que des groupes distincts ; les groupes distincts doivent être plus proches que des sections distinctes. Préférez les tailles des composants de l'application (petit, moyen par défaut, grand) aux hauteurs ponctuelles. Utilisez les variantes compactes pour les barres d'outils et les écrans riches en données, et non pour faire tenir une mise en page confuse dans moins d'espace.

L'échelle sémantique partagée est volontairement réduite : l'espacement progresse approximativement par 2, 4, 8, 12, 16, 24 et 32 points, tandis que la typographie reste proche de 12, 14, 16, 18 et 20 points. Considérez ces valeurs comme des relations, et non comme l'autorisation d'éparpiller leurs valeurs actuelles dans le code des fonctionnalités. L'échelle d'espacement de Tailwind les fournit : un pas vaut 4 points (`p-4` vaut 16 pt), aussi bien dans les classes que dans les méthodes Rust typées ; `"spacing"` dans le `"tailwind"` de `nsh.json` change le pas des classes, et les méthodes typées conservent l'échelle par défaut de Tailwind. Une application qui a besoin d'une autre échelle la possède dans ses propres composants ou jetons de thème (`p-(--gap-card)`) et l'utilise de manière cohérente.
<a id="spatial-grammar"></a>

### Grammaire spatiale

L'espacement exprime une relation. Choisissez un écart dans l'échelle sémantique en vous demandant ce que les deux éléments représentent l'un pour l'autre :

| Relation | Classe typique | Échelle actuelle | Exemples |
| --- | --- | --- | --- |
| Correction optique | `gap-0.5` | 2 pt | ligne de base d'une icône, séparateur compact |
| Parties d'un même contrôle | `gap-1` | 4 pt | icône/libellé d'un menu, titre/description |
| Contrôles étroitement liés | `gap-2` | 8 pt | icône/libellé d'un bouton, actions d'une boîte de dialogue |
| Un même groupe de contenu | `gap-3` | 12 pt | colonnes d'une notification, lignes de formulaire compactes |
| Groupes distincts dans une même section | `gap-4` | 16 pt | marge interne d'un panneau, groupes de formulaire |
| Sections distinctes | `gap-6` | 24 pt | blocs principaux d'une page ou d'un inspecteur |
| Limite de région majeure | `gap-8` | 32 pt | espace de respiration d'un état vide, bandes d'une page |

Ces valeurs décrivent l'échelle par défaut, et non des littéraux à répéter. Utilisez les classes d'espacement et les méthodes typées (`gap-2`,
`.gap_2()`, `p-4`, `.p_4()`) ou les tokens du thème. Une échelle propre à un produit doit préserver l'ordre et
les relations, et doit être transmise par les composants de l'application plutôt qu'écrite à chaque site d'appel.

Appliquez ces règles pour résoudre l'espace horizontal et vertical :

1. **L'intérieur avant l'extérieur.** La marge interne d'un composant lui appartient ; l'écart entre composants appartient
   à leur parent.
2. **Le rythme vertical révèle le regroupement.** L'écart entre un titre et sa description est plus petit que celui entre cette
   description et la section suivante. Des écarts égaux impliquent des relations égales.
3. **L'espace horizontal facilite le balayage visuel.** Les lignes répétées gardent icônes, libellés, valeurs, badges et actions de fin
   sur des colonnes stables.
4. **Début et fin sont sémantiques.** Raisonnez en bords selon le sens de lecture et écrivez-les en début et fin (`ps-*`,
   `me-*`, `.ps_4()`), afin que la mise en page soit inversée en lecture de droite à gauche.
5. **Ne doublez pas la marge interne.** Une carte placée dans un panneau déjà doté d'une marge interne ne doit pas ajouter
   automatiquement une seconde marge complète de panneau.
6. **N'utilisez la correction optique qu'avec parcimonie.** Une correction d'un ou deux points est valable pour la géométrie d'une icône ou d'un glyphe,
   mais documentez pourquoi elle diffère de l'échelle.

Des compositions courantes illustrent ces relations :

- le contenu d'un bouton utilise 4 pt aux petites tailles et 8 pt aux tailles normales ;
- les en-têtes et pieds de boîte de dialogue utilisent un écart interne de 8 pt ;
- les lignes compactes de liste et de menu utilisent 4 pt de marge verticale et 8 à 12 pt de marge horizontale ;
- les en-têtes de feuille utilisent environ 16 pt d'espace en début et 12 pt en fin, ce qui laisse de la place à un élément de fermeture, tandis que les pieds
  utilisent 16 pt d'espace horizontal et 12 pt d'espace vertical ;
- les notifications utilisent 16 pt de marge horizontale et 12 pt d'écart entre colonnes, car l'icône, le message et l'action forment des
  groupes distincts.

Ne les traitez pas comme des recettes à copier-coller pour chaque surface. Elles révèlent le système : les contrôles sont plus serrés
en interne, les lignes optimisent le balayage, et les conteneurs consacrent plus d'espace à leur bordure qu'entre leurs contenus.

<a id="proportion-and-layer-hierarchy"></a>

### Proportions et hiérarchie des couches

Partez des besoins du contenu, puis définissez les proportions. Évitez les moitiés arbitraires lorsqu'un volet a un rôle nettement différent.

- Une barre latérale de navigation doit être assez large pour des libellés stables, mais visiblement subordonnée à la zone de travail. Donnez-lui une
  largeur minimale, préférée et maximale (`min-w-*`, `w-*`, `max-w-*`) plutôt qu'un simple pourcentage.
- Dans les dispositions maître-détail, laissez la collection rester facile à parcourir et donnez le surplus au volet de détail. Un point de départ d'environ
  un tiers/deux tiers est souvent utile, mais les contraintes du contenu font foi. Sur un téléphone, les deux
  deviennent deux pages d'un `NavStack`.
- Les inspecteurs et feuilles auxiliaires ne doivent pas recouvrir l'objet principal par défaut. Ils doivent pouvoir être redimensionnés ou
  fermés lorsque leur contenu s'agrandit ; un [`Sheet`](../elements/sheet.md) se ferme avec son arrière-plan, Échap et le retour.
- La largeur d'une boîte de dialogue découle de la décision à prendre : un `AlertDialog` pour une courte confirmation, un formulaire moyen, ou une
  fenêtre/page dédiée pour un travail complexe. N'agrandissez pas une boîte de dialogue simplement pour créer de l'espace blanc.
- Réservez l'élévation la plus forte à la couche de décision la plus haute. Au sein d'une couche, utilisez l'arrière-plan et les traits fins, et non
  des ombres de plus en plus grandes, pour montrer la hiérarchie.

Définissez trois contraintes de taille pour chaque région majeure : le minimum auquel sa tâche reste réalisable, une valeur par défaut confortable, et la façon dont elle absorbe le surplus. Conservez les séparations contrôlées par l'utilisateur lorsqu'elles représentent une préférence de flux de travail, et bornez les valeurs restaurées en fonction de la fenêtre actuelle.

<a id="alignment-details"></a>

### Détails d'alignement

L'alignement est un système structurel, et non une passe de finition. Établissez un petit ensemble d'axes d'alignement pour chaque surface :
bords de début et de fin partagés, lignes de base du texte, lignes centrales et couloirs fonctionnels fixes. Les éléments d'un même niveau
doivent se rattacher au même axe, de haut en bas ou du début à la fin, même s'il s'agit de types de composants différents.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/alignment-spines-light.svg" alt="Alignment spines across a content region">
<img class="diagram diagram-dark" src="/diagrams/alignment-spines-dark.svg" alt="Alignment spines across a content region">
</div>

Des lignes rouges verticales se placent à côté des bords partagés ou des centres de contrôles pour le contenu, l'état, l'heure et les actions de fin.
Des lignes horizontales se placent sous les lignes de base du texte ou traversent le centre d'une ligne pour montrer l'alignement en bas et au centre vertical.
La comparaison compacte isole une dérive d'un pixel rendu, qui doit être corrigée chez son propriétaire structurel.

- Donnez aux régions sœurs une marge de contenu partagée. Un titre, une barre d'outils, une ligne de liste, un état vide et un pied de page décrivant
  le même niveau ne doivent pas chacun inventer un bord de début légèrement différent.
- Répétez la géométrie des colonnes dans toute la région. Les en-têtes, lignes, résumés, états de chargement et éditeurs en ligne doivent réserver
  les mêmes couloirs pour l'identité, les métadonnées, l'état, les nombres et les actions.
- Alignez les contrôles liés d'une ligne et d'une section à l'autre. Les libellés, champs, descriptions et messages de validation d'un formulaire doivent
  révéler une grille verticale stable lorsque la page est parcourue de haut en bas.
- Gardez les bandes horizontales cohérentes. Les éléments partageant une barre d'outils, un en-tête, une barre d'état ou une ligne doivent utiliser une seule ligne de base ou
  ligne centrale, plutôt que des décalages réglés individuellement.
- N'introduisez une indentation que pour une vraie hiérarchie, un vrai emboîtement ou un vrai dépliage. Une indentation décorative donne l'impression que des éléments de même niveau
  sont subordonnés et brise la ligne de lecture de la surface.
- Lorsqu'un niveau imbriqué se termine, revenez exactement à l'axe du parent. Ne laissez pas les marges internes s'accumuler et dériver
  d'un conteneur imbriqué à l'autre.
- Préservez l'axe malgré le contenu optionnel. L'absence d'icônes, de badges, de descriptions ou d'actions de fin ne doit pas déplacer les libellés restants ;
  utilisez des emplacements ou des couloirs explicites lorsque la comparaison entre lignes est importante.
- Alignez les régions majeures entre elles lorsque leur hiérarchie correspond. Les en-têtes de barre latérale, titres de contenu, volets séparés,
  barres d'outils et barres inférieures n'ont pas à partager toutes leurs coordonnées, mais les niveaux coïncidents doivent former des lignes continues et visibles.

Tous les bords ne doivent pas être alignés. Un enfant peut être indenté, une valeur principale peut précéder ses métadonnées secondaires, et une
décision destructive peut recevoir davantage de séparation. De telles exceptions doivent communiquer une hiérarchie ou un sens ; elles ne doivent pas résulter
de marges internes de composants non coordonnées. Commencez par l'axe partagé, puis rendez l'exception explicite.

Traitez l'alignement exact et les écarts répétés comme des invariants de qualité. Lorsque deux bords ou deux espaces sont censés être égaux, une différence d'un pixel rendu
est un défaut, et non une approximation optique acceptable. Inspectez les limites résolues avec un outil de mesure, à des tailles de fenêtre,
des tailles de texte et des facteurs d'échelle d'affichage représentatifs. Comparez les coordonnées et
les distances ; n'approuvez pas un alignement sur la seule base d'une capture d'écran faite à l'œil.

La tolérance en pixels rendus est une règle de vérification, et non une autorisation de rafistoler le code avec des décalages bruts en points. Des relations égales
doivent découler de la même classe ou méthode d'espacement, du même token, de la même définition de grille ou de la même marge partagée d'un composant.
Corrigez le propriétaire commun lorsqu'ils diffèrent. Tenez compte de la mise en page fractionnaire et de l'arrondi selon l'appareil (téléphones 2× et 3×, échelles
fractionnaires sur ordinateur) afin que les axes visés tombent sur le même pixel physique au lieu de dériver à certaines échelles.

- Alignez le texte sur les lignes de base, et non sur les centres des boîtes englobantes, lorsque des tailles différentes partagent une ligne.
- Centrez les icônes dans un emplacement fixe afin que les libellés ne bougent pas lorsque la largeur intrinsèque des icônes diffère.
- Alignez les nombres comparables à la fin et utilisez des chiffres tabulaires (`tabular-nums`) ; alignez la prose et les identifiants au
  début, sauf si la langue l'exige autrement.
- Gardez les actions de fin de ligne et les indicateurs de dépliage dans des couloirs de largeur fixe.
- Alignez les contrôles de formulaire sur leur cadre interactif, et non sur le texte d'aide situé en dessous.
- N'utilisez `justify-between` (`.justify_between()`) que lorsque les deux côtés possèdent réellement des bords opposés ; cela ne doit pas
  masquer une structure manquante au milieu.
- Les traits fins appartiennent au propriétaire de la bordure. Deux régions adjacentes ne doivent pas dessiner chacune le même séparateur.
- Une barre de défilement appartient à la région qui défile et se place contre le bord de fin de ce panneau, de cet éditeur ou de cette fenêtre.
  La marge interne du contenu peut décaler le texte et les lignes ; elle ne doit pas ramener la barre de défilement au milieu de la surface. Ajoutez la marge interne au
  contenu de la vue défilante, pas à la vue défilante elle-même.

<a id="density-tiers"></a>

### Niveaux de densité

Medium est la valeur par défaut. Changez la densité pour tout le contexte local, et non pour un seul contrôle isolé :

- **confortable / large :** accueil, formulaires aérés, décisions importantes ;
- **standard / medium :** la plupart du chrome applicatif et des flux de travail, ainsi que tous les écrans tactiles ;
- **compact / small :** barres d'outils, menus, tableaux et données professionnelles répétées sur ordinateur ;
- **très compact / xsmall :** utilitaires exceptionnels à haute densité, jamais le choix automatique pour toute une application.

Utilisez une échelle bornée plutôt qu'un dimensionnement arbitraire. Sur les écrans tactiles, chaque cible pressable fait au moins 44 × 44 points
([Cibles tactiles](./accessibility.md#touch-targets)). Avec un pointeur, les boutons passent couramment par des cadres d'environ 24, 28
et 32 pt, les champs de saisie vont jusqu'à environ 40 pt en grande taille, et les lignes de tableau font environ 28, 32 et 40 pt. Donnez aux
composants de l'application une taille qui modifie ensemble la typographie, l'icône, la marge interne et la cible de toucher ; une hauteur personnalisée qui ne change
que la boîte extérieure est généralement incomplète.

<a id="text-size-base-font-and-points"></a>

### Taille du texte, police de base et points

Une échelle bien conçue préserve la hiérarchie lorsque le texte grandit. Un texte plus grand est réussi lorsque la relation entre
titre et corps, contrôle et icône, espacement intérieur et extérieur, régions principale et secondaire reste la même à chaque
taille, et pas simplement lorsque chaque objet devient plus grand.

Les longueurs de NSH sont en points, et la taille de texte choisie par l'utilisateur (Dynamic Type sur iOS, taille de police sur Android, la mise à l'échelle du texte des
environnements de bureau, le réglage propre d'une application hôte) met le texte à l'échelle : tout texte et toute saisie qui autorise la mise à l'échelle de la police grandit, tandis que les espacements,
les rayons, les bordures et les images gardent leur taille ([Taille du texte](./device-and-environment.md#text-size)). La taille de texte de base de l'application
(`text-base` de Tailwind, 16 points) est la taille du corps autour de laquelle s'articule l'échelle typographique.

Concevez en ratios :

- les paliers typographiques conservent la même hiérarchie autour de la taille de base du corps ;
- les paliers d'espacement conservent les mêmes relations de regroupement autour du texte ;
- les cadres de contrôles et les cibles de toucher grandissent avec leurs libellés : dimensionnez-les selon leur contenu et un minimum (`min-h-11`), et non selon une
  hauteur fixe ;
- les minimums de volets et les largeurs confortables tiennent compte des textes plus grands ;
- les rayons des coins et le traitement du focus restent optiquement cohérents avec le cadre du contrôle.

Comme le texte grandit de lui-même, un cadre fixe autour de lui se brise : un libellé plus grand dans un bouton de hauteur fixe, un document plus grand
dans des minimums de volet fixes, ou des lignes plus grandes dans une hauteur de ligne fixe détruisent le rythme d'origine et peuvent tronquer le
contenu. Laissez les lignes passer à la ligne ou basculer en colonne lorsque le texte devient grand (`fontScale()`, `font_scale()`), et plafonnez la mise à l'échelle
d'un texte déjà grand, comme un titre de 34 pt (`maxFontSizeMultiplier`).

En règle générale, la mise en page d'une application ne doit pas écrire de valeurs littérales en points (`p-[13px]`, `px(13.0)`). Utilisez l'échelle d'espacement
(`p-2`, `gap-3`, `w-64`, `text-sm` et leurs méthodes typées) ou les tailles des composants de l'application. N'utilisez des points littéraux que lorsque
la valeur représente une limite physique ou matricielle : un trait fin, une marge de fenêtre propre à la plateforme, les dimensions d'une image bitmap, une tolérance minimale
de détection de toucher, ou une géométrie qui doit correspondre à une surface externe. Ce sont des exceptions auditées et documentées. L'espacement,
la typographie, la taille des icônes et la géométrie ordinaire des contrôles d'un produit restent sur l'échelle.

Testez à plusieurs tailles de texte, et pas seulement à la taille par défaut. Vérifiez la hiérarchie, le retour à la ligne, la troncature, la taille minimale de fenêtre, le redimensionnement des volets, le dégagement de l'anneau de focus, le placement des fenêtres contextuelles et la mesure des lignes de liste.
<a id="surfaces-and-elevation"></a>

### Surfaces et élévation

Utilisez l'élévation pour expliquer l'empilement, pas l'importance. La surface de base est plane ; les séparateurs et le contraste d'arrière-plan définissent ses régions. Les popovers, menus, sheets, dialogues et notifications peuvent utiliser des ombres de plus en plus marquées, car ils se trouvent au-dessus d'autres contenus. Ne mettez pas d'ombre sur chaque carte.

Toutes les surfaces d'un même type doivent partager un seul traitement. Donnez aux familles de popups une seule surface thématisée (les tokens `popover`, la bordure, `radius` et une seule ombre) afin que `Popover`, `Menu`, `ContextMenu` et `Tooltip` ne divergent pas.
Lorsqu'une application invente une autre surface ancrée, réutilisez ce traitement au lieu de l'approcher avec des valeurs littérales de bordure et d'ombre sans rapport.

<a id="typography-and-icons"></a>

### Typographie et icônes

Utilisez la police d'interface de la plateforme pour le texte de l'interface, et une police monospace uniquement pour le code, les identifiants, les raccourcis et les données numériques alignées. Gardez un texte courant lisible et évitez l'excès de majuscules ou d'espacement des lettres, en particulier pour le texte CJK.

Utilisez une seule famille d'icônes dans un produit. Les icônes complètent les libellés ; elles ne doivent pas remplacer des actions peu familières par des devinettes. Les boutons composés uniquement d'une icône ont toujours besoin d'un nom accessible (`accessibilityLabel`). Leur explication visuelle suit la politique d'infobulles ci-dessous. Utilisez des icônes pleines ou colorées pour communiquer un état, pas simplement pour égayer une barre d'outils.

<a id="layout-patterns"></a>

## Modèles de mise en page

<a id="choose-a-stable-shell"></a>

### Choisir une structure stable

La plupart des applications devraient utiliser l'une de ces structures :

- **espace de travail unique :** un en-tête ou une barre d'outils au-dessus d'une vue principale ;
- **pile de navigation :** des pages empilées et dépilées (`NavStack`), avec le geste de retour du système sur téléphone ;
- **espace de travail avec barre latérale :** une navigation persistante à côté d'une vue de détail changeante ;
- **maître–détail :** des volets de collection et de détail redimensionnables, deux pages sur téléphone ;
- **espace de travail de documents :** des onglets pour plusieurs objets de longue durée ;
- **fenêtre utilitaire :** une tâche ciblée avec un parcours d'actions court et fixe.

Gardez la navigation globale stable pendant que le contenu change. Donnez à la zone de travail principale l'espace restant avec `flex-1` (`.flex_1()`) et `min-w-0` / `min-h-0` lorsque des enfants qui débordent doivent se réduire. Utilisez `Scroll` et `List` pour leur comportement prévu au lieu de reconstruire le défilement ou la virtualisation à partir de vues imbriquées.

Sur les ordinateurs de bureau, la barre de titre propre à l'application ([`nsh/desktop`](../modules/nsh-desktop.md)) est avant tout un élément de chrome de la fenêtre. Préservez sa zone de déplacement (`.window_drag(true)`) et évitez de lier de simples clics sur le titre à des commandes d'édition peu fréquentes. Le renommage doit se trouver derrière une commande explicite sur l'objet, avec un chemin au clavier lorsque c'est approprié.

<a id="responsive-windows"></a>

### Fenêtres adaptatives

Une fenêtre peut avoir n'importe quelle taille : c'est l'utilisateur, une vue scindée ou l'application hôte qui en décide. Décidez de ce qui se passe lorsqu'une fenêtre se rétrécit :

1. préserver la tâche principale ;
2. laisser les régions redimensionnables atteindre un minimum documenté ;
3. réduire les libellés secondaires ou les inspecteurs ;
4. déplacer les actions peu fréquentes dans un menu ;
5. ne faire défiler que la région dont le contenu déborde réellement.

Ne masquez pas une action sans fournir un autre chemin pour y accéder. Évitez de faire défiler toute la fenêtre alors que seule une liste ou un corps de document doit défiler. Les points de rupture (`md:`, `lg:`) et `windowSize()` (`window()` en Rust) suivent la surface dans laquelle NSH effectue son rendu.

La mise en page flex de NSH subit la même pression de taille intrinsèque que d'autres systèmes de mise en page : un enfant `flex-1` peut encore refuser de se réduire autour d'un contenu long. La conception et l'implémentation doivent s'accorder sur les volets qui peuvent se réduire, être tronqués, passer à la ligne ou défiler. Une région rognée rogne aussi un anneau de focus extérieur ; ne sacrifiez jamais la visibilité au clavier simplement pour simplifier la gestion du débordement.

<a id="forms-and-settings"></a>

### Formulaires et paramètres

Utilisez un libellé visible pour chaque champ et placez l'aide ou la validation à côté du champ qu'elle décrit. Alignez les champs liés, mais ne forcez pas des libellés longs dans une colonne fixe étroite. Utilisez le contrôle approprié : `Checkbox` pour des choix indépendants, un [`RadioGroup`](../elements/radio.md) de `Radio` pour un petit ensemble visible, un `Menu` de choix pour un ensemble plus long, et [`Switch`](../elements/switch.md) pour un paramètre qui prend effet immédiatement. Leurs parties (la piste et le curseur du switch, l'indicateur de la checkbox) peuvent être stylisées par l'application, avec des classes `checked:`, `indeterminate:` et `disabled:` qui suivent le contrôle :

```rust tabs
use nsh_base::{switch, theme};

fn setting_switch(label: &'static str, on: Signal<bool>) -> impl IntoElement {
    switch()
        .checked(on)
        .on_change(move |next: &bool| on.set(*next))
        .flex_row()
        .items_center()
        .gap_3()
        .track_style(|s| {
            s.w(px(44.0))
                .p(px(2.0))
                .rounded_full()
                .bg(move || theme().muted)
                .transition_colors()
                .checked(|s| s.bg(move || theme().primary))
        })
        .thumb_style(|s| {
            s.size(px(20.0))
                .rounded_full()
                .bg(move || theme().background)
                .shadow_sm()
                .transition_transform()
                .checked(|s| s.translate_x(px(20.0)))
        })
        .child(text(label).text_color(move || theme().foreground))
}
```

```tsx tabs
import { Text } from "nsh";
import { Switch } from "nsh/base";

function SettingSwitch(props: { label: string; on: boolean; onChange: (e: { checked: boolean }) => void }) {
  return (
    <Switch
      checked={props.on}
      onChange={props.onChange}
      class="flex-row items-center gap-3"
      trackClass="w-11 rounded-full bg-muted p-0.5 transition-colors checked:bg-primary"
      thumbClass="size-5 rounded-full bg-background shadow-sm transition-transform checked:translate-x-5"
    >
      <Text class="text-foreground">{props.label}</Text>
    </Switch>
  );
}
```

Une case « tout sélectionner » indique une sélection partielle avec son état indéterminé :

```rust tabs
use nsh_base::{checkbox, theme};

fn select_all(selected: Signal<usize>, total: usize) -> impl IntoElement {
    checkbox()
        .checked(move || selected.get() == total)
        .indeterminate(move || selected.get() > 0 && selected.get() < total)
        .on_change(move |all: &bool| selected.set(if *all { total } else { 0 }))
        .flex_row()
        .items_center()
        .gap_2()
        .indicator_style(|s| {
            s.size(px(20.0))
                .items_center()
                .justify_center()
                .rounded(move || theme().radius)
                .border_2()
                .border_color(move || theme().border)
                .checked(|s| s.bg(move || theme().primary).border_color(move || theme().primary))
                .indeterminate(|s| s.bg(move || theme().primary).border_color(move || theme().primary))
        })
        .indicator(text(move || mark(selected.get(), total)).text_color(move || theme().primary_foreground))
        .child(text("Select all").text_color(move || theme().foreground))
}

fn mark(selected: usize, total: usize) -> &'static str {
    if selected == total { "✓" } else if selected > 0 { "–" } else { "" }
}
```

```tsx tabs
import { Text } from "nsh";
import { Checkbox } from "nsh/base";

function SelectAll(props: { selected: number; total: number; onChange: (e: { checked: boolean }) => void }) {
  return (
    <Checkbox
      checked={props.selected === props.total}
      indeterminate={props.selected > 0 && props.selected < props.total}
      onChange={props.onChange}
      class="flex-row items-center gap-2"
      indicatorClass="size-5 items-center justify-center rounded-(--radius) border-2 border-border checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary"
      indicator={
        <Text class="text-primary-foreground">
          {props.selected === props.total ? "✓" : props.selected > 0 ? "–" : ""}
        </Text>
      }
    >
      <Text class="text-foreground">Select all</Text>
    </Checkbox>
  );
}
```

Désactivez la soumission pendant qu'une opération est en cours, conservez la saisie de l'utilisateur et affichez le résultat près de l'action. Gardez les champs de saisie au-dessus du clavier logiciel (`env(keyboard-inset-height)`). Réservez les dialogues aux décisions courtes et ciblées ; utilisez une page complète ou une sheet pour les workflows qui demandent de l'exploration ou de nombreux champs.

Un traitement de chargement doit représenter une attente réelle. Le passage entre des panneaux de paramètres dont le contenu est déjà disponible doit être immédiat ; un skeleton n'est approprié que pendant un chargement réel dont la forme est connue.

<a id="components-and-composition"></a>

## Composants et composition

Suivez le principe de Shadcn selon lequel les composants sont des matériaux de construction plutôt qu'un système de design fermé. `nsh/base` fournit le comportement ; l'application fournit des valeurs par défaut cohérentes dans ses propres composants et gère la composition et la sémantique du produit.

- Utilisez les variantes de composants selon leur sens. Primary est réservé à la validation par défaut explicite dans une zone de décision — normalement l'action déclenchée par Return sur les ordinateurs de bureau. Une action isolée, fréquente ou souhaitable n'est pas automatiquement primary. Une commande `Add` dans une barre d'outils de gestion utilise normalement un bouton default ; la validation `Create` par défaut d'un formulaire peut utiliser primary. Utilisez destructive pour un engagement destructeur et ghost pour les actions discrètes de barre d'outils.
- Préférez des parties et des slots explicites au style appliqué à des descendants arbitraires.
- Gardez un motif répété cohérent dans tout le produit. Enveloppez-le dans un composant d'application lorsqu'il porte un langage ou une politique propres au domaine.
- Utilisez le composant standard pour son rôle sémantique. `Menu`, `ContextMenu`, `Popover`, `Sheet`, `Dialog` et `AlertDialog` ne sont pas des boîtes interchangeables ; chacun possède des contrats différents de sélection, de focus, de clavier, de fermeture et de mise en page, et prend sa propre forme sur chaque appareil.
- Préservez la géométrie de la famille de composants. Les lignes de menu partagent le même remplissage vertical et horizontal, la même hauteur, les mêmes emplacements d'icône et de coche, les mêmes séparateurs, le même rayon et le même traitement des états. N'imitez pas un menu avec un popup personnalisé dont l'espacement ne fait que s'approcher de celui du système.
- N'enveloppez pas un composant simplement pour renommer chaque prop ou figer toutes ses capacités.
- Déplacez le comportement réutilisable sans style de produit vers `nsh/base`, ou vers un crate que partagent les produits de l'application ; gardez la présentation thématisée et opinionnée dans les composants de l'application.

```rust tabs
use nsh_base::{button, theme};

/// The footer of a form: a default Cancel and the primary commit.
fn form_actions(cancel: impl Fn() + 'static, create: impl Fn() + 'static) -> impl IntoElement {
    view()
        .flex_row()
        .justify_end()
        .gap_2()
        .child(
            button()
                .on_press(cancel)
                .rounded(move || theme().radius)
                .border_1()
                .border_color(move || theme().border)
                .px_4()
                .py_2()
                .active(|s| s.bg(move || theme().muted))
                .child(text("Cancel").text_color(move || theme().foreground)),
        )
        .child(
            button()
                .on_press(create)
                .rounded(move || theme().radius)
                .bg(move || theme().primary)
                .px_4()
                .py_2()
                .active(|s| s.bg(move || theme().primary.opacity(0.9)))
                .child(text("Create").text_color(move || theme().primary_foreground)),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Button } from "nsh/base";

// The footer of a form: a default Cancel and the primary commit.
function FormActions(props: { onCancel: () => void; onCreate: () => void }) {
  return (
    <View class="flex-row justify-end gap-2">
      <Button onPress={props.onCancel} class="rounded-(--radius) border border-border px-4 py-2 active:bg-muted">
        <Text class="text-foreground">Cancel</Text>
      </Button>
      <Button onPress={props.onCreate} class="rounded-(--radius) bg-primary px-4 py-2 active:bg-primary/90">
        <Text class="text-primary-foreground">Create</Text>
      </Button>
    </View>
  );
}
```

<a id="interaction-states"></a>

## États d'interaction

<a id="make-the-result-understandable-before-the-click"></a>

### Rendre le résultat compréhensible avant le clic

Un contrôle doit prédire son résultat. Utilisez des contrôles et des emplacements familiers de la plateforme afin que les gens puissent agir sans avoir à apprendre d'abord l'interface. Son libellé nomme l'action et l'objet, son état indique la disponibilité, et son retour confirme le même résultat.

N'intitulez pas un Button `Save` s'il ouvre un flux de configuration, ni `Delete` s'il ne fait que retirer un élément d'un groupe. Nommez la portée lorsque le contexte ne la rend pas claire. Répondez immédiatement à l'activation, empêchez la double soumission pendant les traitements plus longs et affichez le résultat près de l'objet modifié. N'ajoutez un message de succès que si le résultat n'est pas visible en lui-même.

Chaque contrôle interactif doit être conçu pour :

| État | NSH | Exigence de conception |
| --- | --- | --- |
| Repos | | Affordance claire sans bruit visuel |
| Survol | `hover:` | Retour subtil du pointeur, jamais le seul indice |
| Appuyé | `active:` | Retour immédiat à l'appui, stylisé par l'application |
| Ouvert / appuyé | le `open` du popup | Retour persistant tant qu'un popup attaché est ouvert |
| Focus visible | `focus-visible:` | Anneau de focus clavier à fort contraste |
| Sélectionné / coché | `selected:`, `checked:` | État persistant distinct du survol |
| Désactivé | `disabled:` | Emphase réduite et aucune réponse trompeuse au survol ou à l'appui |
| Chargement | | Préserver le contexte, empêcher l'action en double, expliquer les longues attentes |
| Erreur | | Indiquer ce qui s'est passé et comment y remédier |

Liez les commandes qui doivent fonctionner au clavier avec [`keymap`](../modules/nsh.md#keymap) sur les ordinateurs de bureau et le web. Respectez les raccourcis familiers de la plateforme (`"mod+k"` correspond à Command sur macOS, à Control ailleurs), affichez les raccourcis dans les menus ou les infobulles, et gardez le focus à un endroit logique après l'ouverture ou la fermeture d'une surcouche.

La sélection fait partie du modèle d'information, pas d'un simple raffinement facultatif. Les onglets, les choix segmentés, les lignes sélectionnables, les filtres et les destinations de navigation doivent afficher un état sélectionné persistant (`selected`, que les lecteurs d'écran annoncent). Un bouton qui possède un menu doit rester visiblement appuyé ou ouvert jusqu'à la fermeture du popup ; le survol seul ne peut pas expliquer la relation entre le déclencheur et la surface.

```rust tabs
use nsh_base::{tab, theme};

fn section_tab(label: &'static str, id: Section, current: Signal<Section>) -> impl IntoElement {
    let selected = move || current.get() == id;
    tab()
        .selected(selected)
        .on_press(move || current.set(id))
        .rounded(move || theme().radius)
        .px_3()
        .py_2()
        .selected_style(|s| s.bg(move || theme().muted))
        .child(text(label).text_color(move || {
            if selected() { theme().foreground } else { theme().muted_foreground }
        }))
}
```

```tsx tabs
import { Text } from "nsh";
import { Tab } from "nsh/base";

function SectionTab(props: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Tab
      selected={props.selected}
      onPress={props.onPress}
      class="group rounded-(--radius) px-3 py-2 selected:bg-muted"
    >
      <Text class="text-muted-foreground group-selected:text-foreground">{props.label}</Text>
    </Tab>
  );
}
```

Dans un contrôle segmenté, le remplissage sélectionné et la surface non sélectionnée doivent partager la silhouette du conteneur. Aucun des deux ne doit rendre carré un coin d'extrémité ni faire paraître une limite plus lourde que ses voisines.

Montrez un élément de navigation, une ligne de liste ou un onglet sélectionné à travers la surface de l'élément lui-même : un remplissage de sélection, un premier plan plus marqué ou une graisse plus forte. N'ajoutez pas de barre sur le bord d'attaque ni de bordure d'un seul côté comme marqueur de sélection. C'est une habitude des modèles web, pas une convention native ; elle brise la silhouette arrondie de l'élément et ajoute un second bord concurrent à une colonne qui s'aligne déjà sur son texte.

Pour les actions destructrices, distinguez le travail réversible du travail irréversible. Préférez l'annulation ou une notification temporaire pour les changements réversibles. Utilisez un [`AlertDialog`](../elements/alert-dialog.md) lorsque la conséquence est grave et ne peut pas être annulée ; nommez l'objet précis et la conséquence dans le texte de confirmation.

<a id="pointer-conventions"></a>

### Conventions du pointeur

Utilisez le curseur par défaut pour les boutons, cases à cocher, éléments de menu, onglets et autres contrôles. Utilisez une main pointée (`cursor-pointer`) pour les liens et les contenus qui se comportent comme des liens. N'utilisez les curseurs de texte, de redimensionnement, de saisie et d'interdiction que lorsqu'ils décrivent la manipulation en cours. Un curseur renforce une affordance ; il ne remplace ni l'état visible du contrôle ni son rôle accessible.

Gardez des effets de survol modestes, car le tactile, le clavier et l'accessibilité n'ont pas de survol. Ne révélez pas au survol l'unique exemplaire d'une action destructrice ou essentielle. Les actions contextuelles d'une ligne peuvent devenir plus discrètes au repos si les mêmes commandes restent disponibles par la sélection, le clavier ou un menu contextuel.

<a id="prefer-command-surfaces-over-hover-toolbars"></a>

### Préférer les surfaces de commandes aux barres d'outils au survol

Utilisez la fréquence et la portée d'une commande pour choisir où elle se place :

- gardez l'action principale ou fréquente visible sous forme de bouton avec libellé ou de contrôle familier de barre d'outils ;
- placez les actions secondaires de la région courante derrière un déclencheur [`Menu`](../elements/menu.md) visible ;
- placez les commandes qui agissent sur l'objet situé sous le pointeur ou le doigt dans un `ContextMenu` : un clic droit sur les ordinateurs de bureau, un doigt maintenu sur les écrans tactiles ;
- exposez la même commande importante par un raccourci clavier ([`keymap`](../modules/nsh.md#keymap)) lorsqu'elle a une forme clavier naturelle, et dans le menu de l'application (`Menu.setApplicationMenu` à partir de [`nsh/desktop`](../modules/nsh-desktop.md)) ;
- n'utilisez une icône révélée au survol que comme raccourci vers une commande qui reste accessible ailleurs.

C'est plus qu'une préférence visuelle. Les menus de `nsh/base` gèrent déjà le placement au niveau du déclencheur, les sous-menus en cascade sur les ordinateurs de bureau et une sheet avec sous-menus intégrés sur téléphone, la fermeture par le choix d'un élément, un appui à l'extérieur, Escape ou le retour, ainsi que les rôles menu et menu item pour les lecteurs d'écran. Une bande personnalisée de boutons au survol doit reconstruire ces comportements et reste invisible pour le tactile, pour l'usage exclusivement au clavier et pour de nombreux workflows de technologies d'assistance.

```rust tabs
use nsh_base::{menu, menu_item, menu_separator, theme};
use nsh_core::{color::black, element::StyleRefinement};

/// The app's popup surface, shared by its menus, popovers and tooltips.
fn popup(s: StyleRefinement) -> StyleRefinement {
    s.min_w(px(192.0))
        .p_1()
        .rounded(move || theme().radius)
        .border_1()
        .border_color(move || theme().border)
        .bg(move || theme().popover)
        .shadow_lg()
}

fn item(label: &'static str, on_select: impl Fn() + 'static) -> impl IntoElement {
    menu_item()
        .on_select(on_select)
        .px_3()
        .py_2()
        .rounded(move || theme().radius)
        .hover(|s| s.bg(move || theme().muted))
        .active(|s| s.bg(move || theme().muted))
        .child(text(label).text_color(move || theme().foreground))
}

fn more_menu(rename: impl Fn() + 'static, duplicate: impl Fn() + 'static, delete: impl Fn() + 'static) -> impl IntoElement {
    menu()
        .offset(px(4.0))
        .popup_style(popup)
        .backdrop_style(|s| s.bg(black().opacity(0.5)))
        .trigger(
            view()
                .label("More actions")
                .size(px(44.0))
                .items_center()
                .justify_center()
                .rounded_full()
                .active(|s| s.bg(move || theme().muted))
                .child(text("⋯").text_color(move || theme().foreground)),
        )
        .child(item("Rename…", rename))
        .child(item("Duplicate", duplicate))
        .child(menu_separator().h(px(1.0)).my_1().bg(move || theme().border))
        .child(item("Delete…", delete))
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Menu, MenuItem, MenuSeparator } from "nsh/base";

/** The app's popup surface, shared by its menus, popovers and tooltips. */
export const popup = "min-w-48 rounded-(--radius) border border-border bg-popover p-1 shadow-lg";
const item = "rounded-(--radius) px-3 py-2 hover:bg-muted active:bg-muted";

function MoreMenu(props: { onRename: () => void; onDuplicate: () => void; onDelete: () => void }) {
  return (
    <Menu
      offset={4}
      popupClass={popup}
      backdropClass="bg-black/50"
      trigger={
        <View accessibilityLabel="More actions" class="size-11 items-center justify-center rounded-full active:bg-muted">
          <Text class="text-foreground">⋯</Text>
        </View>
      }
    >
      <MenuItem onSelect={props.onRename} class={item}><Text class="text-foreground">Rename…</Text></MenuItem>
      <MenuItem onSelect={props.onDuplicate} class={item}><Text class="text-foreground">Duplicate</Text></MenuItem>
      <MenuSeparator class="my-1 h-px bg-border" />
      <MenuItem onSelect={props.onDelete} class={item}><Text class="text-foreground">Delete…</Text></MenuItem>
    </Menu>
  );
}
```

Choisissez `Menu` lorsque les utilisateurs ont besoin d'une indication visible de l'existence de commandes supplémentaires — par exemple un débordement de barre d'outils, des actions de document ou un menu de compte. Choisissez `ContextMenu` pour les commandes portant sur une sélection ou un objet, comme renommer, dupliquer, afficher ou supprimer. Le menu contextuel ne doit pas être le seul moyen d'effectuer une commande essentielle ; fournissez un chemin par la barre de menus, la barre d'outils, le clavier ou la vue de détail, selon le cas.

Ne mettez pas toutes les actions dans un menu pour donner à un écran un aspect minimaliste. La découvrabilité et la rapidité comptent : l'action principale reste visible, les éléments dangereux restent clairement libellés et séparés, et un élément de menu doit utiliser le même verbe, la même icône, le même raccourci, le même état d'activation et le même résultat partout où il apparaît.
<a id="button-means-application-action-link-means-external-resource"></a>

### Button signifie action de l'application ; Link signifie ressource externe

Utilisez un `Button` lorsque l'activation modifie l'état de l'application, confirme une décision, ouvre un outil, soumet des données ou exécute une commande. Choisissez son traitement selon la hiérarchie locale :

- bouton primaire pour l'unique engagement mis en avant dans une zone de décision ;
- bouton par défaut pour les actions visibles ordinaires ;
- bouton avec contour lorsqu'une action a besoin d'une limite claire avec moins d'emphase ;
- bouton fantôme (ghost) pour les actions familières et discrètes des barres d'outils et des contenus en ligne ;
- bouton d'icône uniquement pour un symbole bien connu, avec un nom accessible et une infobulle lorsque le sens ou la portée n'est pas clair.

N'attribuez pas le style primaire parce qu'un bouton est la seule action à l'écran, parce qu'il est placé en haut à droite, ou parce que l'équipe souhaite davantage de clics. Le style primaire communique l'engagement par défaut et le comportement au clavier. Si l'activation n'est qu'une commande ordinaire, comme ajouter un élément, ouvrir un outil ou actualiser une vue, utilisez un bouton par défaut, avec contour ou fantôme selon sa hiérarchie locale.

Utilisez un lien souligné (`role="link"`) uniquement pour une cible qui est une ressource externe : une URL, une page web, une documentation en ligne ou une adresse e-mail. Il utilise le curseur en forme de main, car son contrat est de quitter le contexte actuel de l'application pour cette ressource. N'utilisez pas le style de lien pour rendre une commande fonctionnelle plus discrète. Une action Supprimer, Enregistrer, Actualiser, Ajouter, Ouvrir le menu ou de navigation interne présentée comme un lien masque l'affordance du contrôle et expose un mauvais rôle d'accessibilité.

« Voir » ne fait pas d'une destination interne un lien. Un rapport complet, une analyse, un panneau de détails ou un enregistrement local s'ouvre toujours via un bouton, une ligne, une carte, un onglet ou un contrôle de déploiement. Utilisez des libellés concis et contextuels tels que `Full analysis` lorsque la carte qui les contient établit déjà ce qui s'ouvre ; réservez le soulignement aux ressources qui s'ouvrent réellement dans un navigateur ou un client de messagerie.

Toute la navigation interne — lignes de la barre latérale, onglets, fils d'Ariane, éléments de liste, ouverture d'une vue locale ou changement d'espace de travail — doit passer par la pile de navigation, un `Button` ou le composant correspondant. L'emphase visuelle se choisit par la variante du bouton ou par l'état sélectionné du composant de navigation, jamais en trompant sur la sémantique.

<a id="feedback-and-overlays"></a>

## Retours et superpositions

Choisissez la plus petite surface adaptée à la décision :

- infobulle : une explication courte ou un raccourci ([`Tooltip`](../elements/tooltip.md), ou le `tooltip` de n'importe quel élément) ;
- popover : des contrôles contextuels qui n'interrompent pas la tâche ([`Popover`](../elements/popover.md)) ;
- menu : une liste compacte d'actions ([`Menu`](../elements/menu.md)) ;
- notification : un statut asynchrone qui n'exige aucune décision ;
- dialogue : une décision ciblée ou un court formulaire ([`Dialog`](../elements/dialog.md)) ;
- dialogue d'alerte : confirmation explicite d'une action lourde de conséquences ([`AlertDialog`](../elements/alert-dialog.md)) ;
- sheet : un travail complémentaire qui bénéficie d'un espace plus persistant ([`Sheet`](../elements/sheet.md)).

Chacun prend la forme attendue par l'appareil, à partir d'une seule structure que l'application stylise (`popupClass`, `backdropClass`) :

| | Ordinateurs de bureau | Téléphones et tablettes |
| --- | --- | --- |
| `Tooltip` | après que le pointeur s'est arrêté sur l'élément | uniquement lorsque l'application l'ouvre |
| `Popover` | ancré ; un appui à l'extérieur le ferme et se poursuit | ancré ; un appui à l'extérieur ne fait que le fermer |
| `Menu` | une fenêtre contextuelle au niveau du déclencheur, avec sous-menus en cascade | une sheet en bas ; un sous-menu remplace ses éléments |
| `ContextMenu` | le bouton secondaire, au niveau du pointeur | un doigt maintenu ouvre la sheet |
| `Sheet` | un panneau latéral au-dessus d'un fond voilé | identique |
| `AlertDialog` | une alerte dans le style de dialogue de la plateforme | l'alerte ou la feuille d'actions du système |

Une infobulle apporte un sens manquant ; elle ne répète pas une action évidente. Réservez-la à un symbole inconnu, à une portée ambiguë ou à un raccourci utile qui serait sinon caché. Les commandes répétées et reconnaissables, comme Copier et Télécharger dans le pied d'un message, ont besoin de noms accessibles et d'un accès au clavier, mais leurs libellés au survol ajoutent de l'interruption plutôt que de la clarté. Les téléphones n'affichent une infobulle que lorsque l'application l'ouvre ; une infobulle ne doit donc jamais contenir ce dont un utilisateur tactile a besoin.

Une alerte interrompt la hiérarchie visuelle même lorsqu'elle n'ouvre pas de modale. Utilisez-la pour une information importante et exceptionnelle qui requiert l'attention dans la tâche en cours, et non comme un conteneur décoratif pour des descriptions ordinaires, des conseils ou de l'espace vide. Préférez une aide en ligne, un texte atténué ou une section normale lorsque le contenu n'exige ni attention ni action immédiate.

Évitez d'empiler les superpositions. Échap et le bouton retour d'Android ferment la couche fermable la plus haute ; gardez l'état de l'application synchronisé depuis `onOpenChange`, et rendez le focus au déclencheur ou à la prochaine cible logique.

Une action de superposition doit se rapporter à un objet ou à un état que la superposition montre réellement. Par exemple, n'exposez `Clear history` que lorsqu'une section d'historique récent distincte est visible et contient des entrées. Les résultats de recherche, les éléments récents et les favoris sont des collections différentes : nommez-les et séparez-les au lieu de les fusionner en une liste inexpliquée. Masquez une action inapplicable ou désactivez-la avec une raison utile ; ne laissez pas une icône de corbeille ambiguë traîner dans un pied de page.

L'espace du pied de page n'est pas un fourre-tout pour les fonctionnalités qui n'ont pas trouvé leur place dans la conception. Un pied de page peut présenter des raccourcis, un statut ou des actions qui s'appliquent à toute la surface, mais chaque élément doit répondre à ces questions : quel est son objet, pourquoi est-il disponible maintenant, quelle portée affecte-t-il, et quel état visible change après l'activation ?

<a id="motion"></a>

## Mouvement

Le mouvement explique un changement ; ce n'est pas une décoration d'ambiance. Utilisez de courtes transitions pour l'apparition, la fermeture, le déploiement et la continuité spatiale. Évitez d'animer de grands changements de mise en page lorsque l'opacité ou une transformation exprime la même relation. Respectez les préférences de réduction des animations (`motion-reduce:`, `reduceMotion()`), n'exigez jamais une animation pour comprendre un état, et n'ajoutez pas d'animation par défaut à chaque composant.

```rust tabs
view()
    .on_press(open)
    .transition_transform()
    .duration(150.0)
    .when(!reduce_motion(), |v| v.active(|s| s.scale(0.97)))
```

```tsx tabs
<View onPress={open} class="transition-transform duration-150 active:scale-[0.97] motion-reduce:active:scale-100" />
```

La politique de mouvement appartient à la couche applicative. `nsh/base` possède le mécanisme de cycle de vie ou la géométrie nécessaires à une transition, mais ne décide pas que chaque produit utilise un fondu ou un glissement. Donnez une identité stable aux valeurs animées indépendamment, et faites en sorte qu'une interruption s'inverse en douceur à partir de la valeur actuellement échantillonnée plutôt que de repartir d'une ancienne extrémité.

Le mouvement suit la continuité de l'interaction. Tant qu'un pointeur ou une position de défilement se déplace entre des cibles liées, gardez la surface d'aperçu stable et mettez à jour son contenu ou sa position sur place. Ne la fermez qu'à la fin de l'interaction ; des fondus de sortie et des réapparitions répétés à chaque mise à jour donnent une impression de scintillement.

<a id="designing-data-heavy-interfaces"></a>

## Concevoir des interfaces riches en données

Dense ne veut pas dire à l'étroit. Dans les tableaux, les arbres, les longues listes et les éditeurs :

- gardez les en-têtes et l'identité principale des lignes visuellement stables ;
- alignez les valeurs comparables et utilisez des chiffres tabulaires lorsque c'est approprié ;
- distinguez le focus, le survol, la ligne active et la sélection multiple ;
- gardez le tri et le filtrage visibles et réversibles ;
- conservez la sélection selon l'identité métier à travers le filtrage et le réordonnancement ;
- virtualisez les grandes collections (`List`) sans modifier la sémantique du clavier ;
- utilisez la divulgation progressive pour les colonnes secondaires et les inspecteurs ;
- fournissez un état vide utile qui explique la prochaine action.

Choisissez un tableau pour comparer des champs cohérents, une liste pour parcourir des éléments hétérogènes, et un arbre pour une hiérarchie réelle. N'utilisez pas une mise en page de données complexe comme un style visuel.

<a id="interface-language"></a>

## Langue de l'interface

Les mots font partie de l'architecture de l'interface. Écrivez le vocabulaire d'une fonctionnalité comme un système — destinations, objets, commandes, états et résultats — et non comme des traductions isolées de fonctionnalités d'implémentation. Préférez la formulation la plus courte qui reste exacte dans son contexte réel.

<a id="let-context-carry-context"></a>

### Laisser le contexte porter le contexte

Ne répétez pas une information que la surface environnante établit déjà. Une destination de barre latérale est généralement l'objet ou le domaine lui-même : utilisez `Users`, et non `User Management` ; `Shortcuts`, et non `Shortcut Configuration Management`. Une colonne dont les lignes contiennent déjà des actions peut omettre un en-tête générique `Operation`. Un dialogue intitulé `Delete “Roadmap”?` n'a pas besoin d'un corps de texte qui repose la même question.

Il s'agit d'économie de contexte, pas de suppression pour elle-même. Ajoutez du texte lorsqu'il change la décision : identifier la portée concernée, une conséquence irréversible, un prérequis inhabituel ou un moyen de récupération. Chaque mot supplémentaire doit répondre à une question à laquelle la mise en page actuelle ne répond pas déjà.

Utilisez des noms pour les destinations et les objets (`Users`, `Appearance`, `Orders`), des verbes pour les commandes (`Save`, `Duplicate`, `Export`), et des adjectifs ou de courtes locutions pour les états (`Offline`, `Up to date`, `Pending review`). Évitez les enveloppes telles que `Management`, `Module`, `Page`, `Function`, `Operation` et `System`, sauf si le mot distingue un véritable concept du domaine.

<a id="write-each-language-do-not-translate-its-shape"></a>

### Écrire chaque langue, sans traduire sa forme

Partez de l'intention, de la hiérarchie et de la terminologie communes, puis composez chaque langue comme un langage d'interface naturel. Ne conservez pas l'ordre des mots, le nombre de mots, les formules de politesse superflues ni la catégorie grammaticale de la langue source. L'anglais `Users` peut exprimer un concept de fonctionnalité en chinois qui, littéralement, se développerait en « gestion des utilisateurs » ; la fidélité consiste à préserver l'objectif, pas les mots.

Supprimez les mots fournis par l'architecture de l'information environnante. Dans une surface `Settings`, une destination est souvent simplement `Account`, et non `Account Settings`, et jamais le singulier peu naturel `Account Setting`. Le bon libellé anglais se choisit d'après son rôle et ses voisins, et non d'après l'expression source isolée.

Maintenez un petit lexique de produit pour les objets, commandes et états récurrents. Utilisez le même terme dans la barre d'outils, le menu, le menu contextuel, le dialogue, la recherche de raccourcis et la documentation, sauf si le contexte change réellement son sens. Relisez les textes dans la surface rendue : les libellés voisins révèlent souvent des répétitions ou des portées incohérentes qu'un fichier de langue ne peut pas montrer.

Dans la rédaction technique localisée, conservez un terme de framework établi lorsqu'une traduction serait moins précise. Gardez les identifiants d'API sous leur forme d'origine et formatez-les comme du code. Ne conservez pas de mots étrangers ordinaires uniquement pour paraître technique. Expliquez un terme conservé lors de sa première utilisation si nécessaire, puis employez la même forme partout dans l'interface, la documentation et les exemples d'API.

Dans la documentation, utilisez le nom anglais exact d'une API, d'un composant, d'un fichier source ou d'un guide nommé dans le texte du lien, y compris dans les pages localisées. Par exemple, écrivez `View`, `Button`, `Menu` et `Text` plutôt que de traduire leurs noms ou d'ajouter un préfixe `NSH` redondant. Gardez les explications environnantes dans la langue de la page. Ne liez que la cible nommée ; placez des mots tels que « source » en dehors du lien lorsqu'ils décrivent pourquoi elle est citée.

Dans un tableau comparatif technique partagé entre plusieurs langues, conservez sous leur forme anglaise établie les noms de capacités, de frameworks, d'API et de modèles. Traduisez l'explication autour du tableau, pas ses libellés techniques. Les mots d'interface courants dotés d'un nom local établi peuvent toujours être localisés en dehors de ce contexte de comparaison.
<a id="buttons-and-confirmation-dialogs"></a>

### Boutons et boîtes de dialogue de confirmation

Par défaut, les libellés de boutons sont courts, généralement un ou deux mots, et décrivent le résultat, non le geste ni le composant.
Préférez `Save`, `Move` ou `Delete` à `Click to save`, `Perform move` ou `Confirm deletion`. Utilisez systématiquement `Cancel`
pour l'action qui quitte sans valider. Réservez `OK` à la prise de connaissance d'un contenu purement informatif.

Court est une valeur par défaut, non une limite de caractères. Un libellé volontairement plus long est préférable lorsque ses mots révèlent une conséquence
ou distinguent des choix que les utilisateurs pourraient confondre, par exemple `Delete from this group` par opposition à `Delete
everywhere`, or `Restart without saving`. La longueur doit apporter une information décisive ; elle ne doit pas répéter le titre ou le corps de la
boîte de dialogue.

Utilisez, dans la mesure du possible, le résultat concis le plus précis comme libellé de confirmation :

| Contexte | À éviter | À privilégier |
| --- | --- | --- |
| Boîte de dialogue de suppression | `Yes`, `Sure`, `Confirm deletion` | `Delete` |
| Modifications non enregistrées | `Confirm`, `Yes` | `Discard changes` |
| Simple prise de connaissance | `Confirm operation` | `OK` ou `Done` |
| Consentement complexe dont le résultat n'a pas de verbe clair | `Yes` | `Confirm` |

`Confirm` est une solution de repli utile lorsque la boîte de dialogue environnante nomme entièrement un engagement complexe et qu'aucun verbe de résultat plus court
n'est exact. Il ne doit pas remplacer une commande claire. `Sure` relève de la conversation plutôt que d'une commande anglaise stable et
est trop ambigu pour le vocabulaire standard.

Une boîte de dialogue de confirmation doit former une décision compacte :

- titre : la décision ou la condition, par exemple `Delete “Roadmap”?` ;
- corps : uniquement la nouvelle portée, la conséquence ou l'information de récupération ;
- actions : `Cancel` et le résultat, par exemple `Delete` ;
- style destructif : appliqué au résultat destructif (une action `AlertDialog` avec le rôle `destructive`), sans se substituer à
  une formulation précise.

Évitez les titres génériques tels que `Notice`, `Warning`, `Error` et `Confirmation` lorsque la condition réelle peut être nommée.
Évitez les formules rituelles telles que « Êtes-vous sûr de vouloir… », « Souhaitez-vous… », « Veuillez noter que… » et
« avec succès » lorsque la structure ou l'état les communique déjà. La courtoisie doit venir d'un ton calme et respectueux,
non de `please` répétés.

<a id="capitalization-punctuation-and-symbols"></a>

### Majuscules, ponctuation et symboles

Utilisez par défaut la casse de phrase pour l'interface en anglais : `Reset layout`, et non `Reset Layout` ni `RESET LAYOUT`. Conservez les noms
propres et les acronymes établis. Suivez une convention de plateforme, telle que la casse de titre pour les commandes de menu natives, uniquement lorsque l'intégration à la
plateforme en tire profit, et appliquez cette convention de manière cohérente au sein de la classe de composants.

Les capitales peuvent apporter une emphase typographique mesurée pour des libellés de section très courts, des surtitres, des statuts, des acronymes établis et des identifiants
de type code. Leur forme compacte et un espacement des lettres maîtrisé peuvent former un niveau comparable au gras, mais
elles n'ont pas leur place sur les boutons, les titres longs, les phrases ni les listes denses. Ne combinez pas majuscules, couleur forte et
graisse grasse dans la même zone, et ne transformez pas automatiquement toutes les chaînes : les noms de produits, les acronymes et
le contenu localisé doivent conserver leur casse prévue.

Les libellés, boutons, éléments de menu, onglets, titres, textes indicatifs et états courts ne se terminent pas par un point. Les phrases
complètes d'explication, d'avertissement et d'erreur en prennent un. Évitez les points d'exclamation dans les messages de réussite et d'échec courants. En
chinois, utilisez la ponctuation pleine chasse dans les phrases et omettez la ponctuation finale des libellés de contrôle courts selon la même
règle sémantique.

Utilisez le caractère unique de points de suspension (`…`), et non trois points. Ajoutez-le à chaque bouton ou élément de menu qui ouvre une boîte de dialogue,
une feuille ou une fenêtre séparée, ainsi qu'à toute commande nécessitant davantage de saisies ou de choix avant de pouvoir s'achever, comme
`Settings…` ou `Export…`. Une commande exécutée immédiatement ne prend pas de points de suspension. Utilisez un indicateur de progression
indéterminé, et non des points décoratifs, pour signaler un travail en cours.

Les erreurs doivent dire ce qui s'est passé et, si c'est utile, l'action de récupération suivante. Le retour de réussite ne doit nommer l'état obtenu
que si cet état n'est pas déjà visible. Préférez `Couldn’t save. Check your connection and try again.` à un
code technique ou à de longues excuses ; omettez une notification `Saved successfully` lorsque le document passe visiblement à l'état enregistré.

<a id="internationalization-and-platform-fit"></a>

## Internationalisation et adéquation à la plateforme

Les noms et libellés d'accessibilité (A11y) peuvent rester en anglais ; la localisation n'est pas requise pour ces chaînes. Conservez le
libellé propre à l'élément lorsque vous nommez un contrôle qui agit sur lui, même si ce libellé est localisé. Cette exception ne
s'applique pas au texte visible de l'interface.

Le texte doit résister à l'expansion, à la typographie CJK, aux écritures de droite à gauche et aux différentes notations de raccourcis. Ne dimensionnez pas un
contrôle à partir d'un seul libellé anglais. Gardez le texte hors des images matricielles, évitez de concaténer des fragments traduits, et ne laissez les
libellés passer à la ligne ou être tronqués que là où le produit définit un moyen de récupération, comme une info-bulle.

Respectez les différences de plateforme porteuses de sens : Command par opposition à Control, décorations de fenêtre natives, apparence
système, comportement des barres de défilement, menus, capacités de notification et, sur téléphone, l'en-tête système, le geste de retour et les
alertes. Gardez l'architecture de l'information du produit stable d'une plateforme à l'autre, mais n'effacez pas un comportement de plateforme
familier au profit d'une égalité de pixels superficielle.

Les applications NSH s'exécutent sur téléphones, tablettes, ordinateurs de bureau et sur le web, et souvent à l'intérieur d'une application hôte. Concevez pour chacun :

- **L'interface système conserve l'aspect de la plateforme.** Sur iOS et Android, l'en-tête d'une page est celui du système (`NavPage`, `title` et
  options d'en-tête) ; les ordinateurs de bureau et le web affichent l'emplacement `header` de la page, que l'application dessine. Donnez à chaque page les deux
  ([Navigation](./navigation.md#navpage-and-the-header)). Les confirmations utilisent `AlertDialog` ; la barre d'état suit
  la page ou la boîte de dialogue au premier plan (`statusBar`).
- **Le thème de l'hôte.** Une application intégrée peut recevoir le thème de son hôte ; les classes et les bindings Rust qui lisent les jetons
  le suivent nativement ([Jetons de thème](./tailwind.md#theme-tokens)).
- **Zones sûres et clavier.** Gardez le contenu à l'intérieur de la zone sûre (`env(safe-area-inset-*)`, `safeAreaInsets()`) et les champs de saisie
  au-dessus du clavier logiciel (`env(keyboard-inset-height)`) ([Appareil et environnement](./device-and-environment.md)).
- **Apparence, taille du texte et mouvement.** Chaque surface fonctionne en clair et en sombre (`dark:`, `colorScheme()`), à la
  taille de texte de l'utilisateur et avec un mouvement réduit (`motion-reduce:`, `reduceMotion()`).
- **De droite à gauche.** La direction de mise en page suit la locale, et le style `direction` la définit pour une vue et son
  sous-arbre ; les propriétés de début et de fin sont inversées ([De droite à gauche](./layout.md#right-to-left)).
- **Toucher et pointeur.** Les cibles tactiles mesurent au moins 44 × 44 points ; le survol et les info-bulles n'existent qu'avec un pointeur.

```rust tabs
use nsh_base::nav_page;

nav_page()
    .title("Inbox")
    .header(page_header("Inbox"))
    .child(inbox())
```

```tsx tabs
import { NavPage } from "nsh/base";

<NavPage title="Inbox" header={<PageHeader title="Inbox" />}>
  <Inbox />
</NavPage>
```

<a id="guidance-for-ai-generated-interfaces"></a>

## Consignes pour les interfaces générées par IA

Une IA qui modifie une interface NSH doit d'abord inspecter la fonctionnalité la plus proche, les composants et les jetons de thème de l'application, ainsi que
la documentation et les déclarations des composants (`.nsh/types`). Elle doit énoncer la tâche principale, le propriétaire de l'état, la composition des composants, ainsi que les parcours clavier et tactile
avant de générer du code. Elle ne doit pas déduire une API à partir d'exemples React, React Native
ou Shadcn, ni inventer une prop ou une méthode NSH parce que le nom semble plausible ; `nsh check` et la vérification des classes
de la compilation signalent ce qui n'existe pas.

Une sortie d'IA est incomplète tant qu'un humain ne peut pas expliquer pourquoi la hiérarchie, la densité, le choix des composants et les valeurs
littérales exceptionnelles ont leur place dans ce produit. Une capture d'écran visuellement plausible ne prouve rien : le comportement au clavier et au toucher,
le focus, le contenu dynamique, les thèmes, le redimensionnement, la taille du texte et les états d'échec font partie de la conception.

<a id="accessibility-checklist"></a>

## Liste de contrôle d'accessibilité

Avant de considérer un écran comme terminé, vérifiez que :

- chaque action est accessible et utilisable au clavier, au toucher et avec un lecteur d'écran ;
- l'ordre du focus suit l'ordre visuel et l'ordre des tâches ;
- le focus reste visible et est restauré après les surcouches ;
- les contrôles ont des noms accessibles ; les contrôles à icône seule utilisent des info-bulles lorsque leur signification, leur portée ou leur raccourci nécessite
  une explication ;
- le texte et les limites significatives présentent un contraste suffisant ;
- l'état n'est pas communiqué par la seule couleur ;
- les états désactivé et en lecture seule sont distinguables ;
- les libellés, les erreurs et les descriptions restent près de leurs contrôles ;
- le contenu reste utilisable avec des traductions plus longues, de droite à gauche et avec un texte plus grand ;
- les cibles tactiles mesurent au moins 44 × 44 points, et les cibles de pointeur ont une taille confortable, même dans une mise en page dense.

<a id="design-review-checklist"></a>

## Liste de contrôle de revue de conception

Une revue ne dresse pas l'inventaire des composants ; elle juge si l'interface a pris les bonnes décisions. Demandez-vous, dans l'ordre :

1. **La tâche est-elle claire ?** Un nouvel utilisateur peut-il reconnaître l'objectif, l'action principale et l'étape suivante sans apprendre,
   deviner ni expérimenter ?
2. **Chaque action tient-elle sa promesse ?** Le libellé, le contrôle, l'état, la portée, le retour et le résultat décrivent-ils un seul
   résultat cohérent ?
3. **La hiérarchie est-elle décisive et sobre ?** La fonctionnalité centrale reçoit-elle l'espace qu'elle mérite tandis que la couleur forte,
   le gras, les badges, les alertes et les boutons principaux restent rares ?
4. **L'interface pourrait-elle faire moins, mais mieux ?** Un point d'entrée, une option ou un état peut-il être supprimé, combiné ou différé
   sans affaiblir la tâche complète ?
5. **La structure est-elle exacte ?** Les éléments de même rang partagent-ils des axes d'alignement, les espacements égaux restent-ils égaux au pixel rendu près, et
   les barres de défilement se trouvent-elles au bord de leur zone de défilement réelle ?
6. **Suit-elle le système de composants ?** Les contrôles standard conservent-ils leur géométrie, leurs états, leur comportement au clavier et leur
   modèle de fermeture, l'apparence étant fournie par les jetons de thème et d'échelle ?
7. **Reste-t-elle utilisable dans chaque état et contrainte ?** Vérifiez le comportement au clavier, au toucher et du focus, les états
   vide, de chargement, d'échec et d'autorisation, les traductions plus longues, le texte plus grand, le sens de droite à gauche, les deux apparences,
   la taille minimale de fenêtre et le mouvement réduit.
8. **A-t-elle été testée sur de vraies plateformes ?** Accomplissez la tâche avec de vrais composants, du vrai texte et un contenu représentatif
   sur chaque plateforme cible (`nsh run --target …`, `nsh test --target …`), et pas seulement avec une capture d'écran idéale.
