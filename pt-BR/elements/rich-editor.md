---
title: "RichEditor"
description: "O editor de texto rico do nsh/base: documentos definidos pelo esquema do app, comandos, plugins, histórico, mapas de teclas, regras de entrada e Markdown, seguindo a arquitetura do ProseMirror, com seu estado em Rust."
group: base
demo: el-rich-editor
source_hash: 7ce7527a59594417
---


# RichEditor

`RichEditor` é um editor de rich text construído segundo a arquitetura do ProseMirror. O app define de que um documento é feito com um schema (parágrafos, títulos, listas, menções, quaisquer tipos de nodes e marks de que precise), e o editor mantém todo documento válido em relação a ele. As alterações são steps agrupados em transactions, de modo que podem ser desfeitas, mapear posições e trafegar como JSON; o comportamento vem de plugins (histórico, keymaps, input rules, atalhos de Markdown, os do próprio app); commands são valores que uma barra de ferramentas executa e consulta. O estado do editor, seus commands e seus plugins rodam em Rust: digitação, atalhos de teclado e input rules nunca esperam pelo JS, e o app lê o estado como JSON quando o solicita.

Um editor tem duas partes: a sessão (`createRichEditor`), que detém o estado e é conduzida pelo código do app, e a view (`<RichEditor editor={…} />`), que renderiza a sessão de forma nativa e converte a entrada da plataforma em transactions. Várias views podem mostrar uma mesma sessão.

O kernel do editor é um port em Rust do [ProseMirror](https://prosemirror.net), de Marijn Haverbeke, e sua camada de extensões segue o [Tiptap](https://tiptap.dev): suas estruturas de dados, commands e nomes foram mantidos, e o que você já sabe sobre eles continua valendo. Ambos são licenciados sob MIT, e suas licenças se aplicam ao que foi portado deles.

```tsx
import { mount } from "nsh";
import { RichEditor, createRichEditor, history, inputRules, keymap, markdown, markdownRules, starterKeymap, baseKeymap, toggleMark } from "nsh/base";

const editor = createRichEditor({
  content: "# Notes\n\nStart typing…",
  format: "markdown",
  plugins: [
    history(),
    keymap({ "Mod-b": toggleMark("bold"), "Mod-i": toggleMark("italic") }),
    starterKeymap(),
    baseKeymap(),
    inputRules(markdownRules()),
    markdown(),
  ],
});

function App() {
  return <RichEditor editor={editor} class="flex-1" />;
}

mount(App);
```

Sem `schema`, um editor usa o schema inicial (`starterSchema()`); sem `plugins`, ele recebe o starter kit (`starterKit()`: as input rules e os atalhos de teclado do starter, os atalhos base e o histórico). Um array `plugins` vazio cria um editor sem nenhum plugin.

<a id="styling"></a>

## Estilização

O editor desenha o documento com a aparência do app: `classes` e `styles` estilizam suas partes (`root`, `content`, `caret`, `selection`, `placeholder`, `composition`, `selectedNode`, `listMarker` e, para tabelas, `selectedCell`, `tableGrip`, `tableResizeHandle`, `tableDropIndicator`), seus nodes por tipo (`nodes: { heading:
"text-2xl font-bold", "heading[level=2]": "text-xl" }`) and its marks (`marks: { bold: "font-bold" }`). Os itens de listas cujo node spec define `extra.listMarker` como `"bullet"` ou `"ordered"` (as listas do schema inicial) mostram um marcador na parte `listMarker`: `•`, `◦`, `▪` conforme a profundidade, ou números a partir do `start` da lista, posicionado antes do item, no recuo da lista (`pl-6` na lista, como um navegador recua `ul`).

```tsx
<RichEditor
  editor={editor}
  classes={{
    nodes: { heading: "text-2xl font-bold", bulletList: "pl-6", codeBlock: "font-mono bg-muted p-3 rounded-md" },
    marks: { bold: "font-bold", italic: "italic", code: "font-mono bg-muted" },
    listMarker: "text-muted-foreground",
  }}
/>
```

A parte `content` é a caixa do documento dentro da scroll view do editor: seu padding (`content: "px-6 py-5"`) é o espaço ao redor do texto, e a barra de rolagem corre pela própria borda do editor. Um arraste que seleciona além do topo ou da base do editor rola o documento junto, mais rápido quanto mais longe o ponteiro for.

### Bubble menu

`bubbleMenu` é o bubble menu do Tiptap: o conteúdo do app exibido ao lado da seleção, acima dela por padrão (`bubbleMenuPlacement`, passando para o outro lado onde não houver espaço) a `bubbleMenuOffset` pontos (8), em um overlay que acompanha o texto durante a rolagem. O app o passa enquanto quiser que seja exibido, a partir do estado da sessão:

```tsx
const revision = signal(editor.revision);
editor.on("revision", ({ revision: r }) => revision.set(r));
const inLink = () => (revision(), editor.isActive("link"));

<RichEditor
  editor={editor}
  bubbleMenu={inLink() ? <LinkMenu href={editor.getAttributes("link").href} /> : undefined}
  bubbleMenuPlacement="bottom"
/>
```

Um menu de link edita o link sob o cursor com `chain([extendMarkRange("link"), command("setLink", { href })])` e o remove com `command("unsetLink")` após o mesmo `extendMarkRange`.

## Schemas

`defineSchema(spec)` lê um schema no formato do ProseMirror e lança um erro indicando o que está errado nele. Os tipos de node nomeiam seu `content` (uma content expression: `"inline*"`, `"paragraph+"`, `"(heading | paragraph) block*"`), seu `group`, se são `inline` ou um `atom`, os `marks` que permitem e seus `attrs` com valores padrão e validação (`"string"`, `"number"`, `"boolean"`). O primeiro tipo de bloco é o padrão: o que o Enter cria e o que preenche conteúdo obrigatório. Chaves que um spec não conhece são mantidas como dados extras do tipo, para frameworks construídos sobre o editor.

```tsx
import { createRichEditor, defineSchema } from "nsh/base";

const schema = defineSchema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { content: "inline*", group: "block" },
    mention: { group: "inline", inline: true, atom: true, attrs: { id: {}, label: { default: "" } } },
    text: { group: "inline" },
  },
  marks: { bold: {}, link: { attrs: { href: {} }, inclusive: false } },
});

const editor = createRichEditor({ schema, doc: schema.parse("Hello") });
```

Um `RichSchema` lê e escreve documentos: `parse(content, format?)` (texto simples por padrão, `"markdown"` ou JSON), `parseMarkdown(markdown)`, `serialize(doc, format?)` (Markdown por padrão, `"text"`, `"json"`) e `check(doc)`, que retorna o documento com os valores padrão dos atributos preenchidos. `nodes`, `marks` e `topNode` nomeiam seus tipos. O Markdown é mapeado para os nomes do schema inicial (`paragraph`, `heading`, `blockquote`, `codeBlock`, `bulletList`, `orderedList`, `listItem`, `bold`, `italic`, `code`, `link`, `strike`).

## Commands

Um command é um valor: `toggleMark("bold")` cria um objeto que o app guarda, associa a teclas e passa ao editor. `editor.run(command)` o executa e retorna se ele foi aplicado; `editor.can(command)` consulta sem alterar nada, que é como uma barra de ferramentas habilita seus botões. `editor.isActive(name, attrs?)` informa se uma mark ou um node está ativo na seleção (`isActive("heading", { level: 2 })`).

| Command | O que faz |
| --- | --- |
| `toggleMark(name, attrs?)` | Adiciona a mark à seleção, ou a remove onde estiver presente; em um cursor, vale para o texto digitado em seguida |
| `setMark(name, attrs?)` / `unsetMark(name)` | Adiciona ou remove uma mark |
| `setBlockType(name, attrs?)` | Transforma os textblocks selecionados em um tipo (`setBlockType("heading", { level: 2 })`) |
| `wrapIn(name, attrs?)` / `lift()` | Envolve os blocos selecionados em um node (uma citação) / os retira de dentro do pai |
| `wrapInList(name, attrs?)` | Envolve os blocos selecionados em uma lista |
| `splitListItem(name)` / `sinkListItem(name)` / `liftListItem(name)` | Divide itens de lista, aumenta ou diminui seu recuo |
| `undo()` / `redo()` | Desfaz ou refaz uma alteração (com `history()`) |
| `selectAll()`, `setTextSelection(anchor, head?)`, `setNodeSelection(pos)` | Seleciona |
| `insertText(text)`, `insertContent(content, format?)` | Insere texto ou conteúdo sobre a seleção |
| `setNodeAttribute(pos, attr, value)` | Define um atributo do node em uma posição, como uma única alteração desfazível |
| `command(name)` | Um command sem parâmetros, por nome: `"splitBlock"`, `"joinBackward"`, `"exitCode"`, `"newlineInCode"`, `"selectParentNode"`, … |
| `chain(commands)` | Executa commands um após o outro como uma única transaction (um passo de undo); só se aplica quando todos se aplicam |
| `first(commands)` | Executa o primeiro command que se aplica |

```tsx
editor.run(chain([setBlockType("heading", { level: 1 }), toggleMark("bold")]));
const canIndent = editor.can(sinkListItem("listItem"));
```

<a id="the-session"></a>

## A sessão

| Membro | O que é |
| --- | --- |
| `state`, `doc`, `selection` | O estado, o documento e a seleção como JSON, gerados no momento da leitura |
| `revision` | Quantas transactions o estado aplicou |
| `isEmpty`, `undoDepth`, `redoDepth`, `composing` | O que uma UI mostra sobre o editor |
| `setContent(content, format?)` | Substitui o documento, como uma única alteração desfazível |
| `insertContent(content, format?)` | Insere conteúdo sobre a seleção |
| `getJSON()`, `getMarkdown()`, `getText()`, `textBetween(from?, to?, separator?)` | O documento em um formato |
| `dispatch(tr)` | Aplica uma transaction fornecida como JSON (seus steps sobre o documento atual) |
| `on(event, listener)` | Chama `listener` com o payload de cada `event`, no próximo turno do JS: `revision` (`{ revision }`, após cada alteração, de qualquer origem), `update`, `selectionUpdate`, `transaction`, `focus`, `blur`, `delete`. Retorna uma função que interrompe a escuta; um listener adicionado enquanto um componente renderiza é interrompido junto com o componente |
| `focus()`, `blur()` | Move o foco do teclado para as views que mostram o editor, ou para fora delas |

As posições são contadas como no ProseMirror: um texto conta suas unidades de código UTF-16, um node folha conta um, um node com conteúdo conta suas duas fronteiras. Tudo o que precisa sobreviver às edições guarda um id nos atributos de um node ou em uma mark. Uma consulta de posição (`resolve(pos)`, `nodeAt(pos)`, `coordsAtPos(pos)`, `findParentNode(name, pos)`, ...) lança um `RangeError` para uma posição fora do documento (`0` a `doc.content.size`), como faz o `resolve` do ProseMirror, e responde `null` onde não há nada (`nodeAt` no fim de um node, `coordsAtPos` sem nenhuma view mostrando o editor). `run` e `can` lançam um `TypeError` para um command, tipo de node ou mark que o editor não conhece.

<a id="taking-over-transactions"></a>

### Assumindo o controle das transactions

`editor.dispatchTransaction = (tr) => { … }` faz o app confirmar cada transaction por conta própria: o handler recebe cada uma como JSON e a confirma com `editor.applyTransaction(tr)`, ou a descarta. Colaboração, logging e transactions que precisam passar pelas verificações do app usam esse recurso; `null` devolve a confirmação ao editor. O handler ouve a digitação no próximo turno do JS, e o documento muda quando ele confirma.

## Extensions

As extensions são as do Tiptap: cada uma traz, em conjunto, seu tipo de node ou mark, seus atalhos de teclado, input e paste rules, plugins e commands nomeados, e um editor feito de extensions obtém delas seu schema, keymap, rules e tabela de commands. As embutidas são classes nomeadas como as do Tiptap, usadas como estão ou configuradas:

```tsx
import { RichEditor, StarterKit, Underline, command, createRichEditor } from "nsh/base";

const editor = createRichEditor({
  extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] }, codeBlock: false })],
  content: "Hello",
  editable: true,
});

editor.run(command("toggleHeading", { level: 2 }));
editor.run(command("toggleBold"));
```

`StarterKit` traz `Document`, `Paragraph`, o node de texto, `Heading`, `Blockquote`, `BulletList`, `OrderedList`, `ListItem`, `TaskList`, `TaskItem`, `CodeBlock`, `HardBreak`, `HorizontalRule`, `RichImage` (`Image` do Tiptap), `Bold`, `Italic`, `Strike`, `Code`, `Underline`, `RichLink` (`Link` do Tiptap), `Highlight`, `Subscript`, `Superscript`, `RichTextStyle` (`TextStyle` do Tiptap), `TextAlign`, `History`, `TrailingNode`, `Typography` e `ListKeymap`. Uma opção com o nome de uma delas definida como `false` a deixa de fora, e um objeto a configura (`heading: { levels }`, `history: { depth }`, `textAlign: { types }`, `codeBlock: { enableTabIndentation }`). O `configure(options)` e o `extend({...})` de cada classe criam um `RichExtension`, que tem `name`, `type`, `priority` e `options`. Todo editor também recebe o keymap central (Enter, Backspace, Delete, selecionar tudo).

Cada extension adiciona os commands do Tiptap, que `command(name, args)` executa: `toggleBold`, `setItalic`, `unsetStrike`, `toggleHeading({ level })`, `setParagraph`, `toggleBlockquote`, `toggleBulletList`, `toggleOrderedList`, `toggleTaskList`, `toggleCodeBlock({ language })`, `setHardBreak`, `setHorizontalRule`, `setImage({ src })`, `toggleHighlight({ color })`, `setTextAlign("center")`, `unsetTextAlign`, além dos commands de link, de contagem de caracteres e de sugestão abaixo.

As alternâncias de lista atuam sobre listas inteiras, como os botões de lista de um processador de texto: `toggleOrderedList` em uma lista com marcadores a numera em todos os níveis, inclusive nas listas aninhadas, e o toggle próprio de uma lista retira os blocos selecionados de todas as listas ao redor.

A ordem de `extensions` é sua prioridade entre iguais: uma extension listada depois associa suas teclas antes das listadas antes dela; `priority` (100 por padrão) as ordena de outra forma. Com `extensions`, os `plugins` de um editor vêm depois dos plugins das extensions.

<a id="the-apps-extensions"></a>

### As extensions do app

`defineExtension` cria uma. Suas funções rodam uma vez, quando um editor é criado com ela, recebem as opções da extension e retornam dados: commands, rules e plugins como as factories acima os criam.

```tsx
import { StarterKit, command, createRichEditor, defineExtension, insertText, textRule } from "nsh/base";

const Signature = defineExtension({
  name: "signature",
  priority: 200,
  addOptions: () => ({ text: "— Sent from NSH" }),
  addCommands: (options) => ({ insertSignature: insertText(options.text) }),
  addKeyboardShortcuts: () => ({ "Mod-Alt-s": command("insertSignature") }),
  addInputRules: () => [textRule("\\(sig\\)$", "✍")],
});

const editor = createRichEditor({ extensions: [StarterKit, Signature.configure({ text: "Best, Ana" })] });
```

`node` ou `mark` (na forma de `defineSchema`) a torna uma extension de node ou de mark; `addGlobalAttributes` adiciona atributos a outros tipos; `addProseMirrorPlugins` retorna plugins, incluindo `RichEditorPlugin`s; `addPasteRules` retorna rules `textRule` e `markRule` para texto colado. O `extend({...})` de uma classe embutida substitui as partes que ela fornece: `Underline.extend({ addKeyboardShortcuts: () => ({ "Mod-Alt-u": toggleMark("underline") }) })`.

O crate de um app registra extensions escritas em Rust por meio de seu UI set, e o JS as obtém pelo nome:

```rust
use nsh_base::rich_editor::extensions::{Extension, RichExtensionRegistry};

#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.rich_extension("mention", || Extension::new("mention") /* .add_plugins(...) */);
}
```

```tsx
const editor = createRichEditor({ extensions: [StarterKit, richExtension("mention", { char: "@" })] });
```

`richExtension(name, options)` também encontra toda extension embutida pelo nome (`"text"`, `"bold"`, ...).

## Plugins

| Factory | O que adiciona |
| --- | --- |
| `history({ depth?, newGroupDelay? })` | Histórico de undo; alterações dentro de `newGroupDelay` milissegundos (500) são desfeitas juntas |
| `keymap(bindings)` | Commands por nome de tecla: `"Mod-b"` (Cmd em plataformas Apple, Ctrl nas demais), `"Shift-Enter"`, `"Alt-ArrowUp"` |
| `baseKeymap()` | Enter, Backspace, Delete, selecionar tudo e as teclas de edição de texto da plataforma |
| `starterKeymap()` | Os atalhos do schema inicial: marks, títulos, listas, blocos de código, hard breaks |
| `inputRules(rules)` | O texto digitado antes do cursor que corresponde a uma rule se transforma no que a rule produz; Backspace logo em seguida desfaz |
| `markdown(options?)` | Markdown enquanto se digita, colagem de Markdown e cópia de Markdown (`blockRules`, `inlineRules`, `paste`, `copyAsMarkdown`) |
| `starterKit()` | As input rules e os atalhos do starter, os atalhos base e o histórico |

A posição de um plugin na lista é sua prioridade: keymaps e input rules mais acima na lista tratam primeiro uma tecla ou um texto. As input rules vêm de `markdownRules()` (títulos, citações, listas, code fences, rules, as marks comuns), `typographyRules()` (aspas tipográficas, reticências, travessão), `textRule(match, replacement)`, `markRule(match, mark)`, `wrappingRule(match, node)` e `textblockRule(match, node)`. O `match` de uma rule é uma expressão regular terminada em `$`, comparada com o texto antes do cursor.

<a id="the-apps-plugins"></a>

### Os plugins do app

`new RichEditorPlugin(key)` cria um plugin cujo comportamento é do app, definido com chamadas encadeadas:

```tsx
import { RichEditorPlugin, createRichEditor, starterKit } from "nsh/base";

const suggestions = new RichEditorPlugin("suggestions")
  .captureKeys(["ArrowUp", "ArrowDown", "Enter", "Escape"], (key) => moveSuggestion(key))
  .filterTransaction((tr) => tr.meta?.locked !== true)
  .appendTransaction((trs, state) => null);

const editor = createRichEditor({ plugins: [starterKit(), suggestions] });

// While the suggestion list is open, its keys are the list's.
suggestions.capturing = true;
editor.setDecorations("suggestions", [{ from: 5, to: 9, kind: "inline", attrs: { class: "bg-accent" } }]);
```

- `captureKeys(keys, handler)`: enquanto `capturing` for true, o editor consome essas teclas e informa a `handler` qual delas foi pressionada, logo em seguida; o teclado continua tão rápido quanto sem plugin.
- `editor.setDecorations(key, decorations)`: atributos inline, atributos de node e widgets que a view desenha sobre o documento sem alterá-lo. Eles acompanham toda alteração até serem definidos novamente.
- `filterTransaction(hook)` e `appendTransaction(hook)` veem as transactions criadas pelas chamadas do próprio app (`run`, `dispatch`, `setContent`, …) naquela chamada: `filterTransaction` pode descartar uma, e `appendTransaction` pode retornar mais uma para ser aplicada junto. `on("revision", …)` ouve toda alteração, inclusive a digitação.
<a id="links-character-counts-and-suggestions"></a>

## Links, contagem de caracteres e sugestões

Três plugins trazem o comportamento de Link, CharacterCount e Suggestion do Tiptap, tudo nativo:

```tsx
import { RichEditor, characterCount, createRichEditor, insertMention, link, starterKit, starterSchema, suggestion, withMention } from "nsh/base";

const editor = createRichEditor({
  schema: withMention(starterSchema()),
  plugins: [
    starterKit(),
    link({ defaultProtocol: "https" }),
    characterCount({ limit: 280 }),
    suggestion({ key: "mention", char: "@", decorationClass: "text-primary", captureKeys: ["ArrowUp", "ArrowDown", "Enter"] }),
  ],
});

editor.on("transaction", () => {
  const s = editor.suggestion("mention");
  if (s?.active) showPeople(s.query, editor.coordsAtPos(s.range.from), s.lastKey);
  setCount(`${editor.characters()} / ${editor.characterLimit}`);
});

// The list picked someone:
editor.run(insertMention(editor.suggestion("mention")!.range, "u1", "Joan"));
```

- `link(options?)`: uma URL digitada antes de um espaço ou Enter vira link, assim como as URLs em texto colado (`autolink`);
  uma URL colada sobre uma seleção transforma a seleção em link (`linkOnPaste`); um clique ou toque em um link com Mod pressionado, ou enquanto o
  editor está em modo somente leitura, o abre por meio do tratamento de URLs do app (`openOnClick`); `enableClickSelection` seleciona o
  link inteiro ao clicar. As URLs são encontradas com ou sem protocolo (`nsh.dev`, `https://nsh.dev/docs`, endereços de e-mail), e o protocolo que um host sem protocolo recebe é `defaultProtocol` (`http`). Os links aceitam os protocolos `http`,
  `https`, `ftp`, `ftps`, `mailto`, `tel`, `callto`, `sms`, `cid`, `xmpp` e os definidos em `protocols`, de modo que
  `setLink({ href })`, `toggleLink(attrs?)` e a criação automática de links mantêm scripts (`javascript:`) e URLs de dados de fora.
  `unsetLink()` remove o link ao redor da seleção.
- `characterCount(options?)`: `editor.characters(mode?)` conta os caracteres do texto (`"textSize"`, unidades UTF-16 como o `length`
  do JS) ou as posições do documento (`"nodeSize"`); `editor.words()` conta suas palavras (limites de palavra do Unicode). Com `limit`, alterações que ultrapassariam o limite são recusadas e o conteúdo colado é cortado até o que couber;
  um primeiro documento acima do limite é cortado (`autoTrim`). `setCharacterLimit(limit)` altera o limite e
  `editor.characterLimit` o lê.
- `suggestion(options?)`: acompanha um gatilho (`char`, `@` por padrão) digitado antes do cursor. `allowSpaces` permite que a
  consulta contenha espaços, `allowedPrefixes` lista o que pode preceder o gatilho (um espaço por padrão; `anyPrefix` aceita
  qualquer coisa), `startOfLine` exige o gatilho no início da linha (um menu de comandos `/`). `editor.suggestion(key)` fornece
  `{ active, range, query, text, lastKey, keyCount }`; o intervalo ativo carrega o `decorationClass` do app (e
  `decorationEmptyClass` enquanto a consulta está vazia). Enquanto uma sugestão está ativa, as teclas em `captureKeys` pertencem
  à lista do app: o editor as captura e registra a última no estado, e Escape descarta a
  sugestão (`exitSuggestion(key)` também). `replaceSuggestion(content, key?)` substitui o gatilho e a consulta
  por texto ou conteúdo JSON.
- `withMention(schema, { name?, char? })` adiciona o nó de menção do Tiptap: um átomo inline com `id`, `label` e seu
  gatilho, escrito como `@label` em texto e como `<span data-type="mention">` em HTML. `insertMention(range, id, label?)`
  substitui o intervalo de uma sugestão por uma menção e um espaço.

O popup é do app: ele lê o estado da sugestão, posiciona-se em `coordsAtPos(range.from)` e desenha os
itens à sua maneira.

<a id="tables"></a>

## Tabelas

`TableKit` traz as tabelas do Tiptap: `RichTable` (`Table` do Tiptap), `RichTableRow`, `RichTableHeader` e
`RichTableCell`. Ele é adicionado junto a `StarterKit`:

```tsx
import { RichEditor, StarterKit, TableKit, addRowAfter, createRichEditor, insertTable, mergeCells } from "nsh/base";

const editor = createRichEditor({
  extensions: [StarterKit, TableKit.configure({ table: { cellMinWidth: 40 } })],
});

editor.run(insertTable({ rows: 3, cols: 3, withHeaderRow: true }));
editor.run(addRowAfter());
```

A tabela aceita as opções `resizable` (true), `cellMinWidth` (25), `lastColumnResizable` (true),
`allowTableNodeSelection` (false) e `HTMLAttributes`; `TableKit.configure({ tableHeader: false })` deixa uma
extensão de fora. As células contêm blocos e têm `colspan`, `rowspan` e `colwidth` (uma largura em pontos para cada coluna
que abrangem); as linhas têm um `height`.

Tab e Shift-Tab movem entre as células, e Tab na última célula adiciona uma linha. As teclas de seta na borda de uma célula seguem para a
célula seguinte; Shift com uma seta, ou um arrasto sobre várias células, seleciona um retângulo de células (uma seleção do tipo
`"cell"`, cujos `anchor` e `head` são as posições antes de sua primeira e de sua última célula). Backspace e Delete esvaziam
as células selecionadas e excluem a tabela quando todas as suas células estão selecionadas.

No editor, uma tabela é uma grade de suas células: cada coluna tem a largura do `colwidth` de suas células, e as colunas sem esse valor
dividem o espaço restante (com no mínimo `cellMinWidth` de largura), e cada linha tem no mínimo seu `height`. Sua aparência parte do tema: uma
grade de `border` de 1 ponto, células de cabeçalho em `muted`, células com preenchimento, e cada célula selecionada sob a parte `selectedCell` na
cor de seleção. `classes.nodes` (`table`, `tableCell`, `tableHeader`) e as partes reestilizam
tudo isso. Seta para cima e para baixo na primeira ou na última linha de uma célula levam à célula acima ou abaixo.

Enquanto o documento pode ser editado:

- Em desktops, a borda direita de cada coluna e a borda inferior de cada linha as redimensionam: o ponteiro mostra o
  cursor de redimensionamento e a linha `tableResizeHandle`, a tabela acompanha o arrasto, e ao soltar define `colwidth` ou
  `height` em uma única etapa que o desfazer reverte. `resizable: false` desativa isso, `lastColumnResizable: false` mantém a
  largura da última coluna.
- A tabela em que a seleção está mostra alças (`tableGrip`) em sua borda superior sobre cada coluna e em sua borda esquerda
  ao lado de cada linha. Pressionar uma delas seleciona aquela coluna ou linha; arrastá-la em desktops mostra onde ela será solta
  (`tableDropIndicator`) e a move para lá ao soltar.

```tsx
<RichEditor
  editor={editor}
  classes={{
    nodes: { tableHeader: "font-semibold", tableCell: "px-3 py-2" },
    selectedCell: "bg-primary/10",
    tableGrip: "bg-muted-foreground/60 rounded-full",
  }}
/>
```

Os comandos, cada um um auxiliar de `nsh/base`:

- `insertTable({ rows, cols, withHeaderRow })` (3 × 3 com uma linha de cabeçalho por padrão) e `deleteTable()`.
- `addColumnBefore()`, `addColumnAfter()`, `deleteColumn()`, `addRowBefore()`, `addRowAfter()`, `deleteRow()`.
- `mergeCells()`, `splitCell()` e `mergeOrSplit()`.
- `toggleHeaderRow()`, `toggleHeaderColumn()` e `toggleHeaderCell()`.
- `setCellAttribute(name, value)`, `setCellSelection({ anchorCell, headCell })`, `goToNextCell()`,
  `goToPreviousCell()` e `fixTables()`, que repara tabelas com células ausentes ou sobrepostas.
- `moveTableRow({ from, to, select })` e `moveTableColumn({ from, to, select })` movem uma linha ou coluna, junto
  com as linhas ou colunas que suas células mescladas abrangem; `setColumnWidth({ col, width })` e
  `setRowHeight({ row, height })` as dimensionam (`null` as dimensiona de acordo com o conteúdo). Eles aceitam `table`, a posição
  antes de uma tabela, para agir em uma tabela diferente da da seleção.

As tabelas são lidas e gravadas em HTML (`<table>` com `<th>` / `<td>`, `colspan`, `rowspan` e `data-colwidth`) e em
Markdown: uma tabela com linha de cabeçalho cujas células têm cada uma um parágrafo é uma tabela GFM com barras verticais, e qualquer outra tabela é
gravada como seu HTML, que é lido de volta da mesma forma. Em texto simples, uma linha é uma linha de texto com suas células separadas por tabulações.
