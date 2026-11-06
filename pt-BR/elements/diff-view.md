---
title: "DiffView"
description: "O componente DiffView: as alterações entre dois textos ou de um patch, lado a lado ou unificadas, com as palavras alteradas dentro das linhas destacadas, linhas não modificadas recolhidas em separadores que podem ser expandidos, destaque de sintaxe, quebra de linha automática, ações por alteração, seleção de linhas e anotações de revisão."
group: base
demo: el-diff-view
source_hash: 2004ab3c0d854626
---


# DiffView

`DiffView` mostra as alterações entre dois textos como as ferramentas de code review: lado a lado, com o texto antigo à esquerda e o novo à direita, com as linhas alinhadas, ou unificado, com as linhas removidas acima das adicionadas. Dentro de uma linha alterada, as palavras que mudaram são destacadas, as linhas inalteradas entre as alterações se recolhem em separadores que podem ser expandidos, e o texto é destacado com as cores de sintaxe do [`Editor`](./editor.md). Ele mostra dois textos (`oldValue` e `newValue`) ou os arquivos de um diff unificado (`patch`: o de `git diff`, o de um pull request), cada um sob seu cabeçalho, e foi feito para revisar alterações, inclusive as edições propostas por uma IA: as ações do app em cada alteração a mantêm ou a revertem. Apenas as linhas visíveis são criadas, então um arquivo longo rola como um curto.

`DiffView` é responsável pelo comportamento e já vem com uma aparência própria, construída a partir dos tokens do tema: o `font-mono` do tema a 13pt em linhas de 20pt, números de linha em `muted-foreground`, linhas adicionadas com tom verde e linhas removidas com tom vermelho, as palavras alteradas em um tom mais forte, uma barra na borda da calha de cada linha alterada e separadores em `muted`. Cada parte aceita os estilos do app sobre esses padrões (`classes` e `styles`). Em Rust, cria-se um com `nsh_base::diff_view()`; em TSX, com `<DiffView>` de `nsh/base`.

```rust tabs
use nsh_base::diff_view;
use nsh_core::prelude::*;

const OLD: &str = "fn total(prices: &[u32]) -> u32 {\n    prices.iter().sum()\n}\n";
const NEW: &str = "fn total(prices: &[u64]) -> u64 {\n    prices.iter().copied().sum()\n}\n";

fn review() -> impl IntoElement {
    diff_view().old_value(OLD).new_value(NEW).language("rust").flex_1()
}
```

```tsx tabs
import { mount } from "nsh";
import { DiffView } from "nsh/base";

const OLD = `fn total(prices: &[u32]) -> u32 {
    prices.iter().sum()
}
`;
const NEW = `fn total(prices: &[u64]) -> u64 {
    prices.iter().copied().sum()
}
`;

function App() {
  return <DiffView oldValue={OLD} newValue={NEW} language="rust" class="flex-1" />;
}

mount(App);
```

A view preenche a caixa que o app lhe dá (`flex-1`, uma altura) e rola internamente: na vertical pelas linhas e, na horizontal, até a linha mais longa, com os dois lados de uma view dividida rolando juntos. Com `softWrap`, as linhas longas quebram na largura do lado, e uma linha dividida tem a altura do seu lado mais alto, para que os lados continuem alinhados.

<a id="two-texts-or-a-patch"></a>

## Dois textos ou um patch

- **Dois textos**: `oldValue` e `newValue`. As linhas são comparadas como estão, então uma quebra de linha final adicionada ou removida é uma alteração, como o git mostra.
- **Um patch**: `patch`, um diff unificado de um ou vários arquivos (`git diff`, `git format-patch`, `diff -u`; renomeações, modos, arquivos novos, removidos e binários, e uma mensagem de commit antes dele, lidos como o git os escreve). A view mostra as linhas dos hunks, numeradas como no arquivo, cada hunk sob um separador com o seu cabeçalho (a função em que ele está) e cada arquivo, entre vários, sob um cabeçalho próprio ([Arquivos de um patch](#files-of-a-patch)). O caminho de cada arquivo indica a sua linguagem quando `language` não está definido.

```tsx
const PATCH = `diff --git a/src/total.rs b/src/total.rs
--- a/src/total.rs
+++ b/src/total.rs
@@ -10,3 +10,3 @@ impl Cart {
-    fn total(&self) -> u32 {
+    fn total(&self) -> u64 {
         self.prices.iter().sum()
     }
`;

<DiffView patch={PATCH} layout="unified" class="flex-1" />
```

`language` nomeia a linguagem como o `Editor` faz: um nome, um alias, uma extensão ou um nome de arquivo (`"rust"`, `"tsx"`, `"main.go"`, `"Dockerfile"`).

<a id="files-of-a-patch"></a>

## Arquivos de um patch

Um patch de vários arquivos mostra cada arquivo sob uma linha de cabeçalho: por padrão, o seu caminho (`old → new` quando renomeado), as contagens de linhas adicionadas e removidas e `▾`; pressioná-lo recolhe o arquivo até o cabeçalho (`▸`) ou o expande. `renderFileHeader` desenha os cabeçalhos do jeito do app (e mostra um também acima de um patch de um único arquivo), recebendo o arquivo (`DiffFile`): `index`, `path`, `oldPath` (renomeado ou copiado de), `status` (`"modified"`, `"added"`, `"deleted"`, `"renamed"`, `"copied"`), `binary` (o patch não mostra linhas dele), `added`, `deleted`, `hunks`, `firstHunk` e `collapsed`. O cabeçalho do app chama o `toggleFile(path)` do ref; `collapseFile` e `expandFile` definem o estado, e toda alteração é informada com `onFileToggle({ file })`. Um arquivo recolhido continua recolhido enquanto um novo `patch` ainda o contiver.

As alterações são contadas entre os arquivos, em ordem: as alterações de um arquivo vão de `firstHunk` a `firstHunk + hunks - 1`, que `goToHunk`, `renderHunkActions` e `hunks()` usam (o `file` de um `DiffHunk` é o índice do seu arquivo, e suas linhas são contadas nesse arquivo), e `stats()` soma as de todos os arquivos. `goToHunk` expande primeiro um arquivo recolhido.

```tsx
let diff!: DiffViewRef;
const files = signal<DiffFile[]>([]);

<View class="flex-1 flex-row">
  <View class="w-48">
    <Each of={files()}>
      {(file) => (
        <Button onPress={() => diff.scrollToFile(file().path)} class="px-2 py-1">
          <Text class="text-sm">{file().path} +{file().added} −{file().deleted}</Text>
        </Button>
      )}
    </Each>
  </View>
  <DiffView
    ref={(r) => {
      diff = r;
      r.files().then((list) => files.set(list));
    }}
    patch={PULL_REQUEST}
    renderFileHeader={(file) => (
      <Button onPress={() => diff.toggleFile(file.path)} class="flex-1 flex-row items-center gap-2 bg-muted px-2">
        <Text>{file.collapsed ? "▸" : "▾"}</Text>
        <Text class="flex-1 text-sm font-medium">{file.oldPath ? `${file.oldPath} → ${file.path}` : file.path}</Text>
        <Text class="text-xs text-muted-foreground">{file.binary ? "Binary" : file.status}</Text>
      </Button>
    )}
    class="flex-1"
  />
</View>
```

<a id="layout-and-inline-changes"></a>

## Layout e alterações inline

`layout` é `"split"` (o padrão: lado a lado, cada linha removida ao lado da linha adicionada mais parecida com ela) ou `"unified"` (uma coluna, com as linhas removidas de uma alteração acima das adicionadas, e com os dois números de linha). `inline` define o que é destacado dentro de uma linha alterada:

| `inline` | O que é destacado |
|---|---|
| `"wordAlt"` (padrão) | As palavras que mudaram, unidas quando separadas por um único caractere, de modo que uma frase alterada seja lida como uma só |
| `"word"` | Cada palavra que mudou |
| `"char"` | Cada caractere que mudou |
| `"none"` | Nada: apenas o tom das linhas |

Palavras são sequências de letras, dígitos e `_`; cada caractere CJK, kana e sílaba hangul é uma palavra própria, de modo que um caractere alterado em uma frase marca apenas a si mesmo. Uma linha que mudou quase por completo mostra apenas o seu tom.

`indicators` marca as linhas alteradas ao lado dos seus números: `"bars"` (o padrão, uma barra na borda da calha), `"classic"` (`+` e `−` antes do texto) ou `"none"`. `background={false}` deixa as linhas alteradas sem tom, e `lineNumbers={false}` oculta os números.

```tsx
<DiffView oldValue={before()} newValue={after()} language="md" layout="unified" inline="word" indicators="classic" class="flex-1" />
```

<a id="collapsed-lines"></a>

## Linhas recolhidas

Ao redor de cada alteração, `contextLines` linhas inalteradas são exibidas (3 por padrão); as linhas inalteradas entre as alterações, e as antes da primeira e depois da última, se recolhem em um separador que informa quantas linhas ele oculta. Pressioná-lo mostra todas elas. `expandAll` mostra todas as linhas; `expand`, `expandAll()` e `collapseAll()` do ref as revelam e as recolhem a partir do app.

`renderSeparator` desenha os separadores do jeito do app. Ele recebe o separador (`DiffSeparator`): `gap`, o índice da sequência recolhida (0 antes da primeira alteração, `i` entre as alterações `i - 1` e `i`), `lines`, quantas linhas ele oculta, `first` e `last`, e, para um patch, o `header` do hunk. `expand(gap, direction, lines)` mostra `"all"` as suas linhas (o padrão), ou `lines` (padrão 20) `"up"`, logo acima da alteração abaixo do separador, ou `"down"`, logo abaixo da alteração acima dele. O primeiro separador expande para cima e o último para baixo.

```tsx
let diff!: DiffViewRef;

<DiffView
  ref={diff}
  oldValue={before()}
  newValue={after()}
  language="ts"
  renderSeparator={(sep) => (
    <View class="flex-1 flex-row items-center gap-1 bg-muted px-2">
      <If when={!sep.first}>
        <Button onPress={() => diff.expand(sep.gap, "down")} class="px-1"><Text>↓</Text></Button>
      </If>
      <If when={!sep.last}>
        <Button onPress={() => diff.expand(sep.gap, "up")} class="px-1"><Text>↑</Text></Button>
      </If>
      <Button onPress={() => diff.expand(sep.gap)} class="flex-1">
        <Text class="text-xs text-muted-foreground">{sep.header ?? `${sep.lines} unchanged lines`}</Text>
      </Button>
    </View>
  )}
  class="flex-1"
/>
```

<a id="keeping-and-reverting-changes"></a>

## Manter e reverter alterações

`renderHunkActions` coloca as ações do app no canto superior direito de cada alteração visível, recebendo a alteração (`DiffHunk`: `index`, `oldStart`, `oldLines`, `newStart`, `newLines`, linhas a partir de 0, e `file`, o índice do seu arquivo em um patch). Elas chamam o ref: `revertHunk(index)` devolve as linhas antigas da alteração ao texto novo, e `acceptHunk(index)` torna as linhas novas dela o texto antigo. A view mostra o resultado imediatamente e informa os dois textos com `onChange({ change })` (`{ oldValue, newValue }`), que o app define como as props. Manter ou reverter a edição de uma IA, uma alteração por vez, é isto:

```tsx
import { signal, Text, View } from "nsh";
import { Button, DiffView, type DiffViewRef } from "nsh/base";

function Proposal(props: { file: string; current: string; proposed: string; onApply: (text: string) => void }) {
  let diff!: DiffViewRef;
  const current = signal(props.current);
  const proposed = signal(props.proposed);
  return (
    <View class="flex-1">
      <DiffView
        ref={diff}
        oldValue={current()}
        newValue={proposed()}
        language={props.file}
        onChange={({ change: { oldValue, newValue } }) => {
          current.set(oldValue);
          proposed.set(newValue);
          props.onApply(oldValue);
        }}
        renderHunkActions={(hunk) => (
          <View class="flex-row gap-1">
            <Button onPress={() => diff.revertHunk(hunk.index)} class="rounded bg-background px-2 py-0.5 border border-border">
              <Text class="text-xs">Revert</Text>
            </Button>
            <Button onPress={() => diff.acceptHunk(hunk.index)} class="rounded bg-primary px-2 py-0.5">
              <Text class="text-xs text-primary-foreground">Keep</Text>
            </Button>
          </View>
        )}
        class="flex-1"
      />
    </View>
  );
}
```

Aqui o texto antigo é o arquivo como ele está: manter uma alteração a aplica ao arquivo (`onApply`), e revertê-la a retira da proposta. Uma view que mostra um `patch` mostra trechos dos arquivos, e as suas alterações permanecem como estão.

<a id="methods"></a>

## Métodos

`ref={diff}` fornece os métodos da view (`DiffViewRef`). Os métodos que retornam um valor (`hunks()`, `stats()`) retornam em JS uma `Promise` dele, então use `await` neles: `const changes = await diff.hunks()`. Para as contagens exibidas na tela, `onStatsChange` as informa conforme mudam. Um método que recebe uma alteração, um separador ou um arquivo que o diff não tem não altera nada e registra um aviso com o nome do método e o valor.

| Método | Descrição |
|---|---|
| `hunks()` | `Promise<DiffHunk[]>`: as alterações, em ordem. |
| `stats()` | `Promise<DiffStats>`: `{ added, deleted, hunks }`, as linhas adicionadas e removidas e o número de alterações. |
| `goToHunk(index)` | Rola a alteração `index` para a área visível, com a sua primeira linha no topo. |
| `revertHunk(index)` | Devolve as linhas antigas da alteração `index` ao texto novo e informa os textos (`onChange`). |
| `acceptHunk(index)` | Torna as linhas novas da alteração `index` o texto antigo e informa os textos (`onChange`). |
| `expand(gap, direction?, lines?)` | Mostra as linhas que o separador `gap` oculta: `"all"` (padrão), ou `lines` (padrão 20) `"up"` ou `"down"`. |
| `expandAll()` | Mostra todas as linhas inalteradas. |
| `collapseAll()` | Recolhe novamente as linhas inalteradas. |
| `nextHunk()` | `Promise<number \| null>`: rola a próxima alteração para o topo e retorna o seu índice (depois da última, a primeira). |
| `previousHunk()` | `Promise<number \| null>`: rola a alteração anterior para o topo e retorna o seu índice (antes da primeira, a última). |
| `currentHunk()` | `Promise<number \| null>`: a última alteração para a qual se foi, enquanto a view permanece ali; caso contrário, a que está no topo da view ou a primeira visível. |
| `selectedLines()` | `Promise<DiffLineRange \| null>`: as linhas selecionadas nos números de linha. |
| `setSelectedLines(range)` | Seleciona linhas de um lado (`null`: nenhuma), sem `onLineSelectionChange`. |
| `selectedText()` | `Promise<string>`: o texto das linhas selecionadas. |
| `files()` | `Promise<DiffFile[]>`: os arquivos do patch, em ordem, com as suas contagens (nenhum para dois textos). |
| `scrollToFile(path)` | Rola o cabeçalho do arquivo em `path` para o topo. |
| `collapseFile(path)` | Mostra apenas o cabeçalho do arquivo em `path`. |
| `expandFile(path)` | Mostra novamente as linhas do arquivo em `path`. |
| `toggleFile(path)` | Recolhe o arquivo em `path`, ou o expande quando recolhido. |
| `hunkBounds()` | `Promise<DiffHunkBounds[]>`: onde cada alteração está nas linhas, em ordem ([Uma régua de visão geral](#an-overview-ruler)). |
| `scrollOffset()` | `Promise<Point>`: quanto as linhas estão roladas (`x` é 0). |
| `setScrollOffset(offset)` | Rola as linhas para `offset.y` imediatamente, até onde for possível, como um thumb que acompanha o ponteiro que o arrasta. |

`nextHunk()` e `previousHunk()` continuam a partir da alteração para a qual foram, enquanto a view permanece ali, e, caso contrário, a partir do topo da view, de modo que uma alteração perto do fim que não consegue rolar até o topo ainda conta. Botões de próxima e anterior alteração, com as contagens de `onStatsChange`:

```tsx
let diff!: DiffViewRef;
const stats = signal<DiffStats>({ added: 0, deleted: 0, hunks: 0 });

<View class="flex-row items-center gap-2 p-2">
  <Text class="text-sm text-green-600">+{stats().added}</Text>
  <Text class="text-sm text-red-600">−{stats().deleted}</Text>
  <Text class="text-sm text-muted-foreground">{stats().hunks} changes</Text>
  <Button onPress={() => diff.previousHunk()}><Text>Previous</Text></Button>
  <Button onPress={() => diff.nextHunk()}><Text>Next</Text></Button>
</View>
<DiffView ref={diff} oldValue={before()} newValue={after()} onStatsChange={(e) => stats.set(e.stats)} class="flex-1" />
```

<a id="an-overview-ruler"></a>

## Uma régua de visão geral

`onScroll({ offset, contentSize, size })` informa onde as linhas estão, com as mesmas chaves de um [`Scroll`](./scroll.md): `offset.y`, quanto elas estão roladas (as linhas rolam na vertical, com a largura da view, e os lados rolam na horizontal por conta própria: `offset.x` é 0), `contentSize`, o tamanho de todas as linhas juntas, e `size`, o do viewport. Ele dispara quando a view é disposta e novamente sempre que um deles muda: quando as linhas rolam, quando a view é redimensionada e quando as linhas mudam de altura (outros textos, `layout`, `softWrap`, um arquivo ou um separador expandido ou recolhido, uma anotação disposta). `hunkBounds()` fornece onde cada alteração está nas linhas (`DiffHunkBounds`: `{ index, bounds }`, `bounds` do topo da sua primeira linha até a base da última, com as anotações abaixo delas, atravessando a view), as alterações que aparecem: as de um arquivo recolhido não têm linhas. `onHunkBoundsChange({ hunkBounds })` fornece a mesma lista quando a view é disposta e novamente sempre que uma alteração se move ou muda de tamanho, mesmo quando as linhas mantêm a altura (uma linha alterada se tornando outra): uma régua desenha as suas marcas a partir dele, em vez de lê-las em `onScroll`. `scrollOffset()` lê quanto as linhas estão roladas, e `setScrollOffset({ x, y })` rola as linhas para `y` imediatamente, de modo que um thumb arrastado acompanhe o ponteiro no mesmo frame.

Juntos, eles formam uma régua de visão geral ao lado da view, como a dos editores de código: uma marca para cada alteração, um thumb sobre as linhas visíveis e um toque ou arrasto que rola até ali. Aqui a régua tem a altura da view:

```rust tabs
use nsh_base::{DiffHunkBounds, DiffView, DiffViewApi, DiffViewEvent, diff_view, theme};
use nsh_core::prelude::*;

fn review(old: SharedString, new: SharedString) -> impl IntoElement {
    let diff = component_ref::<DiffView>();
    let ruler = element_ref();
    let ruler_top = stored(px(0.0));
    // How far the rows are scrolled, their height and the viewport's.
    let rows = signal((px(0.0), px(0.0), px(0.0)));
    let marks = signal(Vec::<DiffHunkBounds>::new());
    // Points of the rows per point of the ruler.
    let scale = move || {
        let (_, height, view) = rows.get();
        height.max(px(1.0)) / view.max(px(1.0))
    };
    // The thumb's middle at the pointer.
    let follow = move |page_y: Points| {
        let view = rows.get_untracked().2;
        let y = (page_y - ruler_top.get()) * scale() - view / 2.0;
        if let Some(api) = diff.api::<DiffViewApi>() {
            api.set_scroll_offset(point(px(0.0), y));
        }
    };
    view()
        .flex_1()
        .flex_row()
        .child(
            diff_view()
                .old_value(old)
                .new_value(new)
                .on_scroll(move |e: &DiffViewEvent| {
                    if let DiffViewEvent::Scroll(offset, content, size) = e {
                        rows.set((offset.y, content.height, size.height));
                    }
                })
                .on_hunk_bounds_change(move |list: &Vec<DiffHunkBounds>| marks.set(list.clone()))
                .component_ref(&diff)
                .flex_1(),
        )
        .child(
            view()
                .element_ref(&ruler)
                .w(px(12.0))
                .bg(move || theme().muted)
                .claim_touches(TouchClaim::on_start())
                .on_responder_grant(move |e: &ResponderEvent| {
                    let y = e.page.y;
                    spawn(async move {
                        ruler_top.replace(ruler.measure().await.map_or(px(0.0), |m| m.page.y));
                        follow(y);
                    });
                })
                .on_responder_move(move |e: &ResponderEvent| follow(e.page.y))
                .child(each(
                    marks,
                    |mark: &DiffHunkBounds| mark.index,
                    move |mark, _| {
                        view()
                            .absolute()
                            .left(px(0.0))
                            .right(px(0.0))
                            .bg(rgb(0xf59e0b))
                            .top(move || mark.get().bounds.origin.y / scale())
                            .h(move || (mark.get().bounds.size.height / scale()).max(px(2.0)))
                    },
                ))
                .child(
                    view()
                        .absolute()
                        .left(px(0.0))
                        .right(px(0.0))
                        .bg(move || theme().foreground.opacity(0.2))
                        .top(move || rows.get().0 / scale())
                        .h(move || rows.get().2 / scale()),
                ),
        )
}
```

```tsx tabs
import { Each, signal, View, type ViewRef } from "nsh";
import { DiffView, type DiffHunkBounds, type DiffViewRef } from "nsh/base";

let diff!: DiffViewRef;
let ruler!: ViewRef;
let rulerTop = 0;
const rows = signal({ y: 0, height: 0, view: 0 });
const marks = signal<DiffHunkBounds[]>([]);
// Points of the rows per point of the ruler.
const scale = () => Math.max(rows().height, 1) / Math.max(rows().view, 1);
// The thumb's middle at the pointer.
const follow = (pageY: number) => diff.setScrollOffset({ x: 0, y: (pageY - rulerTop) * scale() - rows().view / 2 });

<View class="flex-1 flex-row">
  <DiffView
    ref={diff}
    oldValue={before()}
    newValue={after()}
    onScroll={({ offset, contentSize, size }) => rows.set({ y: offset.y, height: contentSize.height, view: size.height })}
    onHunkBoundsChange={({ hunkBounds }) => marks.set(hunkBounds)}
    class="flex-1"
  />
  <View
    ref={ruler}
    class="w-3 bg-muted"
    onStartShouldSetResponder={() => true}
    onResponderGrant={async (e) => {
      const y = e.pageY;
      rulerTop = (await ruler.measure())?.pagePosition.y ?? 0;
      follow(y);
    }}
    onResponderMove={(e) => follow(e.pageY)}
  >
    <Each of={marks()}>
      {(mark) => (
        <View
          class="absolute inset-x-0 bg-amber-500"
          style={{ top: mark().bounds.origin.y / scale(), height: Math.max(mark().bounds.size.height / scale(), 2) }}
        />
      )}
    </Each>
    <View class="absolute inset-x-0 bg-foreground/20" style={{ top: rows().y / scale(), height: rows().view / scale() }} />
  </View>
</View>
```

O `index` de uma marca é o da alteração em `hunks()`, cujos `oldLines` e `newLines` distinguem uma alteração adicionada (sem linhas antigas) de uma removida (sem linhas novas), para colorir a sua marca.

<a id="review-comments"></a>

## Comentários de revisão

Os números de linha selecionam linhas de um lado: pressionar um seleciona uma linha, Shift e pressionar estende a seleção até ela, e arrastar o mouse sobre os números seleciona as linhas por onde ele passa. `onLineSelectionChange` informa as linhas como `range` (`DiffLineRange`: `{ side, start, end }`, linhas a partir de 0, `null` para nenhuma), e pressionar um número também informa `onLineNumberPress({ line })` (`{ side, line }`). O ref lê a seleção (`selectedLines()`, `selectedText()`) e a define.

`annotations` coloca o conteúdo do app sob as linhas: cada `{ id, side, line }` é desenhado por `renderAnnotation` ao longo do lado da sua linha (a view inteira quando unificada), com a altura que ele tiver ao ser disposto, e aparece enquanto a sua linha aparece. `renderAddAnnotation` é o controle do app para adicionar um, à direita da calha da linha sobre a qual está o ponteiro e da última linha selecionada; ele recebe as linhas selecionadas quando a sua linha é uma delas, e, caso contrário, essa linha.

```tsx
type Comment = { id: string; side: "old" | "new"; line: number; text: string };
const comments = signal<Comment[]>([]);
const drafting = signal<DiffLineRange | null>(null);

<DiffView
  oldValue={before()}
  newValue={after()}
  annotations={comments().map(({ id, side, line }) => ({ id, side, line }))}
  renderAnnotation={(a) => (
    <View class="m-2 rounded-md border border-border bg-card p-2">
      <Text class="text-sm">{comments().find((c) => c.id === a.id)?.text}</Text>
    </View>
  )}
  renderAddAnnotation={(range) => (
    <Button onPress={() => drafting.set(range)} class="size-4 items-center justify-center rounded bg-primary">
      <Text class="text-xs text-primary-foreground">+</Text>
    </Button>
  )}
  class="flex-1"
/>
```
<a id="styling-the-parts"></a>

## Estilizando as partes

`class` e `style` estilizam a caixa da view. `classes` recebe classes Tailwind por parte e `styles` recebe estilos inline por parte; as classes de uma parte vêm depois de seus próprios estilos padrão, então prevalecem sobre eles, e seus `styles` prevalecem sobre as classes. A fonte é definida com `fontFamily`, `fontSize` e `lineHeight`.

```tsx
<DiffView
  oldValue={before()}
  newValue={after()}
  language="py"
  fontSize={12}
  lineHeight={18}
  class="flex-1 rounded-lg border border-border"
  classes={{
    gutter: "bg-muted",
    lineAdded: "bg-blue-500/10",
    wordAdded: "bg-blue-500/30",
    indicatorAdded: "bg-blue-500",
    separator: "bg-transparent",
  }}
/>
```

| Parte | O que é | Padrão |
|---|---|---|
| `side` | Cada lado (split) ou a coluna única (unified) | Uma linha `border` entre os lados |
| `gutter` | Os números de linha e os indicadores de um lado | |
| `lineNumber` | Todo número de linha | Alinhado à direita, `muted-foreground` |
| `lineNumberAdded` | Os números das linhas adicionadas, depois de `lineNumber` | |
| `lineNumberDeleted` | Os números das linhas removidas, depois de `lineNumber` | |
| `content` | O texto de um lado, ao lado de sua gutter | 8pt antes e depois do texto |
| `line` | Todas as linhas (rows) de um lado | |
| `lineAdded` | As rows das linhas adicionadas, depois de `line` | Um tom de verde |
| `lineDeleted` | As rows das linhas removidas, depois de `line` | Um tom de vermelho |
| `filler` | A metade vazia de uma row split ao lado de uma linha que o outro lado não tem | Um preenchimento `muted` discreto |
| `wordAdded` | As palavras alteradas dentro de uma linha adicionada | Um verde mais forte |
| `wordDeleted` | As palavras alteradas dentro de uma linha removida | Um vermelho mais forte |
| `indicatorAdded` | A barra de uma linha adicionada (`"bars"`) ou `+` (`"classic"`) | Verde, 3pt de largura |
| `indicatorDeleted` | A barra de uma linha removida ou `−` | Vermelho, 3pt de largura |
| `separator` | Um separador de linhas recolhidas, ou o cabeçalho de hunk de um patch | `⋯` e a contagem em `muted` |
| `hunkActions` | A caixa das ações do app sobre uma alteração | No canto superior direito da alteração |
| `lineSelected` | Sobre as rows das linhas selecionadas de seu lado | A cor de seleção do tema (como as seleções do `Editor`) |
| `annotation` | A caixa de uma anotação, abaixo de sua linha | Ocupa a largura do lado de sua linha |
| `addAnnotation` | A caixa do controle de adicionar, com a largura da gutter e a altura de uma linha | O controle à sua direita |
| `fileHeader` | O cabeçalho de um arquivo de um patch | O caminho e as contagens em `secondary`, uma linha `border` abaixo |

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `oldValue` | `.old_value(..)` | `string` | | O texto antigo. |
| `newValue` | `.new_value(..)` | `string` | | O texto novo. |
| `patch` | `.patch(..)` | `string` | | Um unified diff de um ou de vários arquivos, exibido quando `oldValue` e `newValue` não estão definidos. |
| `language` | `.language(..)` | `string` | texto simples (em um patch: o de cada arquivo) | O nome, alias, extensão ou nome de arquivo de uma linguagem. |
| `layout` | `.layout(..)` | `"split" \| "unified"` | `"split"` | Lado a lado ou em uma coluna. |
| `inline` | `.inline(..)` | `"wordAlt" \| "word" \| "char" \| "none"` | `"wordAlt"` | O que é destacado dentro das linhas alteradas. |
| `indicators` | `.indicators(..)` | `"bars" \| "classic" \| "none"` | `"bars"` | Como as linhas alteradas são marcadas ao lado de seus números. |
| `contextLines` | `.context_lines(..)` | `number` | `3` | Linhas inalteradas exibidas ao redor de cada alteração. |
| `expandAll` | `.expand_all(..)` | `boolean` | `false` | Todas as linhas inalteradas são exibidas. |
| `lineNumbers` | `.line_numbers(..)` | `boolean` | `true` | Os números de linha. |
| `background` | `.background(..)` | `boolean` | `true` | As linhas alteradas recebem um tom de cor. |
| `fontFamily` | `.font_family(..)` | `string` | o `font-mono` do tema | A fonte do texto. |
| `fontSize` | `.font_size(..)` | `number` | `13` | O tamanho da fonte, em pontos. |
| `lineHeight` | `.line_height(..)` | `number` | `20` | A altura de uma row, em pontos. |
| `renderSeparator` | `.render_separator(..)` | `(separator: DiffSeparator) => JSX.Element` | | Desenha os separadores de linhas recolhidas. |
| `renderHunkActions` | `.render_hunk_actions(..)` | `(hunk: DiffHunk) => JSX.Element` | | As ações do app sobre cada alteração. |
| `softWrap` | `.soft_wrap(..)` | `boolean` | `false` | As linhas longas quebram na largura do lado. |
| `annotations` | `.annotations(..)` | `DiffAnnotation[]` | `[]` | O conteúdo do app abaixo das linhas: `{ id, side, line }`. |
| `renderAnnotation` | `.render_annotation(..)` | `(annotation: DiffAnnotation) => JSX.Element` | | Desenha uma anotação abaixo de sua linha. |
| `renderAddAnnotation` | `.render_add_annotation(..)` | `(range: DiffLineRange) => JSX.Element` | | O controle do app para adicionar uma anotação, ao lado da linha sob o cursor e da última linha selecionada. |
| `renderFileHeader` | `.render_file_header(..)` | `(file: DiffFile) => JSX.Element` | | Desenha o cabeçalho de cada arquivo de um patch, com a altura de uma row. |
| `classes` | `.classes(..)` | `DiffViewClasses` | `{}` | Classes Tailwind por parte. |
| `styles` | `.styles(..)` | `DiffViewStyles` | `{}` | Estilos inline por parte, sobre as classes. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | | A caixa da view. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descrição |
|---|---|---|
| `onChange` | `.on_change(\|change: &DiffChange\| ..)` | Uma alteração foi mantida ou revertida: `{ change }`, os textos atuais (`{ oldValue, newValue }`). |
| `onLineNumberPress` | `.on_line_number_press(\|line: &DiffLine\| ..)` | Um número de linha foi pressionado: `{ line }`, um `{ side, line }`. |
| `onLineSelectionChange` | `.on_line_selection_change(\|range: &Option<DiffLineRange>\| ..)` | As linhas selecionadas mudaram: `{ range }`, um `{ side, start, end }` ou `null`. |
| `onStatsChange` | `.on_stats_change(\|stats: &DiffStats\| ..)` | As contagens mudaram: `{ stats }`, um `{ added, deleted, hunks }`. É disparado uma vez quando a view é criada e novamente sempre que os textos passam por diff e resultam em outras contagens, para uma linha como "+8 −8 · 5 changes". |
| `onFileToggle` | `.on_file_toggle(\|file: &DiffFile\| ..)` | Um arquivo do patch foi recolhido ou expandido (seu cabeçalho, ou a ref): `{ file }`, o `DiffFile` atual. |
| `onScroll` | `.on_scroll(\|e: &DiffViewEvent\| ..)` | As rows foram roladas, ou elas ou a viewport mudaram de tamanho: `{ offset, contentSize, size }`, como o de um `Scroll` (`DiffViewEvent::Scroll(offset, content_size, size)` em Rust). É disparado uma vez quando a view é posicionada no layout e novamente quando um deles muda. |
| `onHunkBoundsChange` | `.on_hunk_bounds_change(\|bounds: &Vec<DiffHunkBounds>\| ..)` | Onde as alterações estão nas rows mudou: `{ hunkBounds }`, a lista que `hunkBounds()` fornece. É disparado uma vez quando a view é posicionada no layout e novamente quando uma alteração se move ou muda de tamanho, com a altura das rows mantida ou não, para as marcas de uma overview ruler. |

<a id="related"></a>

## Relacionados

- [Editor](./editor.md): o editor de código cujas cores de sintaxe e linguagens o `DiffView` usa.
- [TextView](./text-view.md): documentos em Markdown e HTML, para o texto ao redor de uma revisão.
- [`nsh/base`](../modules/nsh-base.md): os outros componentes base.
