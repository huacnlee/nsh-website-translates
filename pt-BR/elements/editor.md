---
title: "Editor"
description: "O componente Editor: um editor de código com realce de sintaxe, números de linha, vários cursores, recolhimento de código, quebra de linha automática, localizar e substituir, diagnósticos e decorações, e os atalhos de teclado dos editores de código."
group: base
demo: el-editor
source_hash: 27f9d0cbb9ff5dd4
---


# Editor

`Editor` é um editor de código: realce de sintaxe para mais de cinquenta linguagens, números de linha, vários cursores, dobramento, quebra automática de linha, localizar e substituir, diagnósticos e decorações, com os atalhos dos editores de código (mover e duplicar linhas, comentários, indentação, colchetes e aspas que se fecham conforme são digitados). Ele comporta arquivos de qualquer tamanho: apenas as linhas visíveis são criadas, e o realce acompanha cada edição linha a linha, de modo que um arquivo longo rola e responde à digitação como um arquivo curto. A digitação passa pela entrada da plataforma, então métodos de entrada (pinyin, kana, teclas mortas) e teclados virtuais funcionam como em qualquer campo de texto.

O editor é responsável pelo comportamento e vem com uma aparência própria, construída a partir dos tokens do tema: o `font-mono` do tema a 13pt em linhas de 20pt, números de linha em `muted-foreground`, uma faixa discreta de `muted` atrás das linhas com cursor, seleções em um tom de `primary`, guias de indentação em `border` e as cores de sintaxe embutidas que os blocos de código do [`TextView`](./text-view.md) usam, em claro e escuro. Cada parte aceita os estilos do app sobre esses padrões (`classes` e `styles`). Rust cria um com `nsh_base::editor()`, TSX com `<Editor>` de `nsh/base`.

```rust tabs
use nsh_base::editor;
use nsh_core::prelude::*;

const MAIN: &str = "fn main() {\n    println!(\"Hello, world!\");\n}\n";

fn code() -> impl IntoElement {
    let source = signal(SharedString::from(MAIN));
    editor()
        .value(move || Some(source.get()))
        .language("rust")
        .on_change(move |value: &SharedString| source.set(value.clone()))
        .flex_1()
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { Editor } from "nsh/base";

const MAIN = `fn main() {
    println!("Hello, world!");
}
`;

function App() {
  const source = signal(MAIN);
  return <Editor value={source()} onChange={({ value }) => source.set(value)} language="rust" class="flex-1" />;
}

mount(App);
```

O editor preenche a caixa que o app lhe dá (`flex-1`, uma altura) e rola o texto dentro dela: sempre na vertical, na horizontal quando as linhas são mais longas que a caixa, ou nunca com `softWrap`, caso em que as linhas longas quebram na largura do editor.

<a id="the-text"></a>

## O texto

- **Controlado**: passe `value` e defina-o novamente em `onChange`, que informa o novo texto completo. Um `value` que o app altera (um arquivo carregado, a saída de um formatador) substitui o texto como uma única edição que o desfazer reverte, e os cursores e as dobras distantes do que mudou permanecem onde estão.
- **Não controlado**: passe `defaultValue` e leia o texto em `onChange` ou em `value()` do ref.

As quebras de linha são `\n`: `\r\n` e `\r` em um texto recebido se tornam `\n`.

<a id="languages"></a>

## Linguagens

`language` indica a linguagem pelo nome, por um alias, por uma extensão ou por um nome de arquivo, em qualquer capitalização: `"rust"`, `"rs"`, `"typescript"`, `"tsx"`, `"main.go"`, `"Dockerfile"`, `"Makefile"`. Ele define o realce, o comentário que `mod+/` alterna, os colchetes que se correspondem e indentam, os pares que a digitação fecha, os caracteres que formam as palavras e a indentação padrão: quatro espaços, dois para linguagens web (JavaScript, TypeScript, JSON, HTML, CSS, YAML, ...), tabulações para Go e Makefiles. `tabSize` e `hardTabs` definem a indentação para todas as linguagens. Qualquer outro nome é texto simples, a menos que o app o tenha registrado ([linguagens próprias](#your-own-languages)).

As linguagens: Rust, JavaScript, JSX, TypeScript, TSX, JSON, Python, Go, C, C++, C#, Java, Kotlin, Swift, Objective-C, Objective-C++, Ruby, PHP, Lua, Shell, Fish, PowerShell, SQL, HTML, XML, Vue, Svelte, CSS, SCSS, Sass, Less, Markdown, YAML, TOML, INI, Dockerfile, Makefile, CMake, Dart, Scala, Elixir, Erlang, Haskell, OCaml, F#, Clojure, Zig, Perl, R, Julia, Nix, Terraform, Protocol Buffers, GraphQL e Diff.

```tsx
<Editor value={source()} onChange={({ value }) => source.set(value)} language={file().name} tabSize={2} softWrap class="flex-1" />
```

<a id="your-own-languages"></a>

### Linguagens próprias

Código Rust ensina mais linguagens aos editores de um app e realça qualquer linguagem com um realçador próprio (uma gramática tree-sitter, um parser do app). `register_language` registra um `EditorLanguage`: seu nome, aliases, extensões e nomes de arquivo, e suas regras de edição (comentários, colchetes, os pares que a digitação fecha, caracteres de palavra, indentação), com `syntax` indicando uma gramática embutida para realçá-la. `register_highlighter` dá a uma linguagem, embutida ou registrada, o realçador do app: um tipo que implementa `EditorHighlighter`, que recebe cada edição (linhas, bytes e posições, como as edições do tree-sitter as recebem) e fornece os tokens de cada linha (`EditorToken`, ou uma captura do tree-sitter ou um escopo do TextMate por meio de `EditorToken::from_scope`) dentro de um orçamento de tempo, fora da thread de UI. O editor guarda os tokens, move-os junto com o texto conforme ele é editado e pede novamente as linhas visíveis, como faz com o realçador embutido. `language` encontra primeiro as linguagens registradas, por nome, alias, extensão ou caminho, tanto em editores quanto em views de diff.

Cada engine mantém suas próprias linguagens. Um app Rust as registra em seu root antes de montar seus editores; para o app TSX, o crate do app as registra no setup de seu UI set, que toda engine que executa o app chama primeiro.

```rust
use nsh_base::editor::{EditorLanguage, register_highlighter, register_language};
use nsh_core::prelude::*;

static NIMBLE: EditorLanguage = EditorLanguage::new("Nimble")
    .extensions(&["nb"])
    .line_comment("#")
    .tab_size(2);

#[native_module("my-app/native")]
fn native(registry: &mut Registry) {
    registry.setup(|| {
        register_language(&NIMBLE);
        register_highlighter("nimble", || Box::new(NimbleHighlighter::default()));
    });
}
```

```tsx
<Editor value={source()} onChange={({ value }) => source.set(value)} language="build.nb" class="flex-1" />
```

<a id="editing"></a>

## Edição

O editor funciona como os editores de código:

- **Vários cursores.** Alt-click (Option-click) adiciona um cursor, `mod+d` seleciona a próxima ocorrência da seleção, `mod+shift+l` seleciona todas elas, e as teclas de adicionar cursor adicionam um na linha acima ou abaixo. Digitar, apagar, mover e todos os comandos agem em cada um deles; Escape volta a um só. `undoSelection` (`cmd+u`, `ctrl+u`) volta às seleções anteriores ao último movimento.
- **As seleções crescem** por unidades com `expandSelection` (`ctrl+shift+cmd+right`, `shift+alt+right`): a palavra, o conteúdo de uma string e a string, o conteúdo de um par de colchetes e o par, a linha, o texto; `shrinkSelection` volta da mesma forma. `splitSelectionIntoLines` (`shift+alt+i`) transforma uma seleção de várias linhas em uma seleção por linha.
- **Indentação.** Uma nova linha mantém a indentação da linha e adiciona um nível após um colchete de abertura (o `:` do Python, o `do` do Ruby, ...); Enter entre um par de colchetes coloca o de fechamento em sua própria linha. Tab e Shift+Tab indentam e desindentam as linhas selecionadas; Backspace em espaços iniciais volta à tabulação de indentação anterior. `autoIndent` desativa isso.
- **Colchetes e aspas** se fecham conforme são digitados, envolvem uma seleção e passam por cima do de fechamento quando ele é digitado novamente (`autoClose`). O colchete no cursor e seu par são contornados.
- **Desfazer** reverte sequências inteiras de digitação: uma palavra, uma exclusão, um comando. Um movimento ou um clique inicia uma nova etapa.
- **Dobramento.** Uma linha seguida de linhas com indentação mais profunda as dobra com o marcador na calha: `⌄` para dobrar, `›` e o `⋯` após a linha para desdobrar. Um cursor que se move para dentro de uma dobra a abre ([Dobramento](#folding)).
- **Cliques.** Com um ponteiro, um clique posiciona o cursor, um clique duplo seleciona uma palavra, um clique triplo uma linha, Shift-click estende a seleção e um arrasto seleciona de acordo com o que o clique selecionou. Um arrasto com Alt+Shift (Option+Shift; também Control+Alt no Linux) seleciona um bloco: uma seleção por linha, entre as mesmas colunas, que continuam além do fim das linhas curtas. Em telas sensíveis ao toque, um toque posiciona o cursor, um toque duplo ou um toque longo seleciona a palavra sob o dedo, e as alças nas extremidades dessa seleção movem cada extremidade conforme um dedo as arrasta (o texto ao redor delas continua rolando).
- **Área de transferência.** Copiar e recortar sem seleção pegam as linhas inteiras dos cursores, e elas são coladas de volta como linhas inteiras acima da linha do cursor.

`readOnly` mantém o texto como está enquanto ele ainda pode ser selecionado, pesquisado e copiado.

<a id="keys"></a>

## Teclas

As teclas do editor funcionam enquanto ele tem o foco; os outros inputs mantêm as suas. `mod` é Command no macOS e no iOS e Control nos demais (`keymap` keystrokes).

| Teclas (macOS) | Teclas (Windows, Linux) | Comando |
|---|---|---|
| Setas, com Shift para selecionar | Setas, com Shift para selecionar | Mover por caractere e por linha |
| `alt+left` / `alt+right` | `ctrl+left` / `ctrl+right` | Mover por palavra |
| `cmd+left` / `cmd+right`, `home` / `end`, `ctrl+a` / `ctrl+e` | `home` / `end` | O primeiro caractere não vazio da linha (depois seu início) / o fim da linha |
| `cmd+up` / `cmd+down` | `ctrl+home` / `ctrl+end` | O início / o fim do texto |
| `pageup` / `pagedown` | `pageup` / `pagedown` | Subir / descer uma página |
| `alt+backspace` / `alt+delete` | `ctrl+backspace` / `ctrl+delete` | Apagar uma palavra à esquerda / à direita |
| `cmd+backspace` / `cmd+delete`, `ctrl+k` | `ctrl+shift+backspace` / `ctrl+shift+delete` | Apagar até o início / o fim da linha |
| `cmd+z` / `cmd+shift+z` | `ctrl+z` / `ctrl+shift+z`, `ctrl+y` | Desfazer / refazer |
| `cmd+a` | `ctrl+a` | Selecionar tudo |
| `cmd+l` | `ctrl+l` | Selecionar a linha (novamente: a seguinte também) |
| `cmd+d` | `ctrl+d` | Selecionar a próxima ocorrência |
| `cmd+shift+l` | `ctrl+shift+l` | Selecionar todas as ocorrências |
| `cmd+alt+up` / `cmd+alt+down` | `ctrl+alt+up` / `ctrl+alt+down` | Adicionar um cursor acima / abaixo |
| `escape` | `escape` | Voltar a uma só seleção |
| `alt+up` / `alt+down` | `alt+up` / `alt+down` | Mover as linhas para cima / para baixo |
| `alt+shift+up` / `alt+shift+down` | `alt+shift+up` / `alt+shift+down` | Duplicar as linhas para cima / para baixo |
| `cmd+shift+k` | `ctrl+shift+k` | Apagar as linhas |
| `cmd+enter` / `cmd+shift+enter` | `ctrl+enter` / `ctrl+shift+enter` | Uma nova linha abaixo / acima |
| `tab` / `shift+tab`, `cmd+]` / `cmd+[` | `tab` / `shift+tab`, `ctrl+]` / `ctrl+[` | Indentar / desindentar |
| `cmd+/` | `ctrl+/` | Alternar o comentário de linha |
| `cmd+shift+\` | `ctrl+shift+\` | Ir ao colchete correspondente |
| `ctrl+j` | `ctrl+j` | Juntar as linhas |
| `ctrl+t` | | Trocar os caracteres ao redor do cursor |
| `ctrl+alt+left` / `ctrl+alt+right`, com Shift para selecionar | | Mover por parte de palavra (camelCase, snake_case) |
| `shift+alt+a` | `shift+alt+a` | Alternar o comentário de bloco |
| `shift+alt+i` | `shift+alt+i` | Dividir a seleção em linhas |
| `ctrl+shift+cmd+right` / `ctrl+shift+cmd+left` | `shift+alt+right` / `shift+alt+left` | Expandir / reduzir a seleção |
| `cmd+u` | `ctrl+u` | Voltar às seleções anteriores |
| `cmd+g` / `cmd+shift+g`, `f3` / `shift+f3` | `f3` / `shift+f3` | Localizar a próxima / a anterior ocorrência |
| `cmd+e` | | Localizar a seleção (`onFindWithSelection`) |
| `cmd+alt+[` / `cmd+alt+]` | `ctrl+shift+[` / `ctrl+shift+]` | Dobrar / desdobrar a linha do cursor |
| `f12` | `f12` | Ir à definição no cursor (`onDefinitionRequest`) |
| `cmd+.` | `ctrl+.` | Ações de código na seleção (`onCodeActionRequest`) |
| `cmd+c` / `cmd+x` / `cmd+v` | `ctrl+c` / `ctrl+x` / `ctrl+v` | Copiar / recortar / colar |

O macOS e o iOS também têm as teclas de texto do Cocoa: `ctrl+b` / `ctrl+f` / `ctrl+p` / `ctrl+n` movem, `ctrl+h` / `ctrl+d` apagam.

Os comandos sem teclas padrão, e os próprios do app, usam as teclas que o app vincula com [`keymap`](../modules/nsh.md#keymap), executando-os por meio de `run` do ref:

```tsx
import { keymap } from "nsh";

let editor!: EditorRef;

keymap.bind({
  "f9": () => editor.run("sortLinesAscending"),
  "mod+shift+u": () => editor.run("transformToUppercase"),
  "mod+alt+0": () => editor.run("foldAll"),
  "mod+alt+j": () => editor.run("unfoldAll"),
});
```

<a id="find-and-replace"></a>

## Localizar e substituir

`search` é o que deve ser localizado: `{ query, caseSensitive?, wholeWord?, regex?, inSelection? }`. As ocorrências são realçadas, e a que contém a seleção é realçada com mais intensidade, e `onSearchChange` informa `{ result }`, um `{ count, current, error }`: quantas ocorrências existem, em qual delas a seleção está (a partir de 0) e por que uma expressão regular não é válida. `findNext` e `findPrevious` selecionam a próxima e a anterior ocorrência, voltando ao início quando chegam ao fim; `replace(text)` substitui a ocorrência atual e seleciona a seguinte, e `replaceAll(text)` substitui todas as ocorrências como uma única edição e retorna `{ count }`, a quantidade. A substituição de uma expressão regular se refere a seus grupos como `$1` e `${name}`.

`inSelection` localiza apenas dentro do que estava selecionado quando foi ativado (as linhas dos cursores, quando não havia seleção): o escopo permanece enquanto ele estiver ativado, ao longo das edições, conforme a seleção passa de uma ocorrência para outra. `findWithSelection` (`cmd+e` no macOS) informa o texto selecionado, ou a palavra no cursor, com `onFindWithSelection`, para que a barra de busca o use como consulta.

A barra de busca é do próprio app:

```tsx
import { signal, Text, View } from "nsh";
import { Button, Editor, type EditorRef, type EditorSearchResult, Input } from "nsh/base";

function Find(props: { source: string; onChange: (value: string) => void }) {
  let editor!: EditorRef;
  const query = signal("");
  const replacement = signal("");
  const result = signal<EditorSearchResult>({ count: 0 });
  const status = () =>
    result().error ?? (result().current != null ? `${result().current! + 1} of ${result().count}` : `${result().count} found`);
  return (
    <View class="flex-1">
      <View class="flex-row items-center gap-2 border-b border-border p-2">
        <Input value={query()} onChange={({ value }) => query.set(value)} onSubmit={() => editor.run("findNext")} placeholder="Find" class="flex-1" />
        <Text class="text-sm text-muted-foreground">{status()}</Text>
        <Button onPress={() => editor.run("findPrevious")} class="px-2"><Text>↑</Text></Button>
        <Button onPress={() => editor.run("findNext")} class="px-2"><Text>↓</Text></Button>
        <Input value={replacement()} onChange={({ value }) => replacement.set(value)} placeholder="Replace" class="flex-1" />
        <Button onPress={() => editor.replace(replacement())} class="px-2"><Text>Replace</Text></Button>
        <Button onPress={async () => console.log("replaced", (await editor.replaceAll(replacement())).count)} class="px-2"><Text>All</Text></Button>
      </View>
      <Editor
        ref={editor}
        value={props.source}
        onChange={(e) => props.onChange(e.value)}
        language="ts"
        search={query() ? { query: query() } : undefined}
        onSearchChange={(e) => result.set(e.result)}
        class="flex-1"
      />
    </View>
  );
}
```

<a id="diagnostics"></a>

## Diagnósticos

`diagnostics` marca os problemas que um language server ou um linter informa: um sublinhado ondulado fino sob cada intervalo, na cor de sua severidade (`error`, `warning`, `info`, `hint`). As posições são linhas e colunas UTF-16 a partir de 0, como as de um language server, de modo que seus diagnósticos passam como chegam. As marcas permanecem sobre o texto enquanto o usuário digita, até que o app passe novas; exibir as mensagens (uma lista, um hover card na linha) fica por conta do app.

Um diagnóstico também carrega o restante do `Diagnostic` de um language server. Seus `tags` desenham o texto como os clientes de linguagem fazem: o código `unnecessary` (uma variável não usada, código inalcançável) fica esmaecido e o código `deprecated` fica riscado, nas partes `unnecessaryText` e `deprecatedText`; uma dica com uma tag aparece somente em seu texto. `codeDescription.href` é a página que descreve seu código (o de uma regra de lint), e `relatedInformation` lista os outros lugares que falam sobre ele (`{ location: { uri?, range }, message }`): o hover entrega ambos ao app, que os mostra em seu hover card e abre a página. Um language server envia as tags como números (`1`, `2`); o editor entende seus nomes.

```tsx
const problems = signal<EditorDiagnostic[]>([]);

async function lint(text: string) {
  // [{ range, severity, message, source?, code?, codeDescription?, tags?, relatedInformation? }]
  problems.set(await check(text));
}

<Editor
  value={source()}
  onChange={({ value }) => {
    source.set(value);
    lint(value);
  }}
  language="ts"
  diagnostics={problems()}
  classes={{ diagnosticWarning: "bg-orange-500", unnecessaryText: "text-zinc-400" }}
  class="flex-1"
/>
```

<a id="decorations"></a>

## Decorações

`decorations` estilizam intervalos que o app escolhe: realce semântico de um language server, a instrução em execução, as linhas que uma revisão alterou. `class` e `style` de uma decoração estilizam seu texto; `lineClass` e `lineStyle` estilizam as linhas dela, atrás do texto. Assim como os diagnósticos, elas permanecem sobre seu texto ao longo das edições até que o app defina novas.

```tsx
const range = (line: number, start: number, end: number) => ({ start: { line, column: start }, end: { line, column: end } });

<Editor
  value={source()}
  language="sql"
  readOnly
  decorations={[
    { range: range(4, 0, 0), lineClass: "bg-green-500/10" },
    { range: range(7, 6, 18), class: "underline text-blue-600" },
  ]}
  class="flex-1"
/>
```
<a id="gutter-and-overview-ruler-marks"></a>

### Marcas na calha e na régua de visão geral

O `gutter` de uma decoração coloca uma marca em uma faixa antes dos números de linha, ao lado de cada linha que seu intervalo cobre: as linhas que um diff do controle de versão adicionou ou modificou, ou um breakpoint (um intervalo vazio cobre a sua linha, como com `lineClass`). Com `placement: "before"`, a marca é uma linha atravessando a faixa no limite antes do início do intervalo, onde linhas foram excluídas. A faixa tem `gutterDecorationsWidth` pontos de largura (3 por padrão) e permanece enquanto uma decoração tiver uma marca na calha, de modo que o texto mantém sua posição conforme as marcas aparecem e somem. Um intervalo dentro de uma dobra marca a linha da dobra.

O `overviewRuler` de uma decoração coloca uma marca na régua de visão geral, a faixa ao longo da borda direita do editor, com 14 pontos de largura (a de uma barra de rolagem; a parte `overviewRuler` define outra largura), que mapeia o texto inteiro para a sua altura, como a do Monaco. Uma marca tem pelo menos 6 pontos de altura e ocupa uma `lane` da régua: `left`, `center` (o padrão), `right` ou `full`. A régua aparece enquanto uma decoração tiver uma marca nela.

Cada marca usa o `class` e o `style` do app, e é desenhada na cor de primeiro plano sem eles. Ambas acompanham as edições como o intervalo da decoração; uma edição que exclui um intervalo marcado deixa um intervalo vazio no lugar.

```tsx
<Editor
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  decorations={[
    { range: range(2, 0, 0), gutter: { class: "bg-yellow-500" }, overviewRuler: { lane: "left", class: "bg-yellow-500" } },
    { range: { start: { line: 3, column: 0 }, end: { line: 5, column: 0 } }, gutter: { class: "bg-green-500" } },
    { range: range(6, 0, 0), gutter: { class: "bg-red-500", placement: "before" }, overviewRuler: { lane: "left", class: "bg-red-500" } },
  ]}
  class="flex-1"
/>
```

<a id="your-own-highlighting"></a>

### Seu próprio realce de sintaxe

O `token` de uma decoração colore o texto como o realce embutido colore aquele tipo de token (`comment`, `keyword`, `string`, `number`, `title`, `attr`, `built`, `deletion`), no lugar do que o realçador embutido encontrou ali: o realçador do próprio app (os tokens semânticos de um language server, um parser próprio) mapeia seus tokens para esses e obtém as cores do editor nos temas claro e escuro. O token da decoração mais interna prevalece; `class` e `style` se aplicam por cima dele. `highlighting={false}` desativa o realçador embutido, de modo que os tokens do app colorem o texto sozinhos, enquanto `language` continua decidindo comentários, colchetes e indentação.

```tsx
const kinds: Record<string, EditorToken> = { keyword: "keyword", function: "title", string: "string", type: "built" };

<Editor
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  highlighting={false}
  decorations={semanticTokens().map((t) => ({ range: range(t.line, t.start, t.end), token: kinds[t.type] }))}
  class="flex-1"
/>
```

<a id="folding"></a>

## Dobramento

As dobras começam onde as linhas têm indentação mais profunda que a linha anterior. `foldRanges` dá ao editor os intervalos do próprio app (`{ startLine, endLine }`, o formato dos folding ranges de um language server, que passam como chegam): a linha `startLine` mostra a dobra e as linhas seguintes até `endLine` são dobradas. Elas permanecem em suas linhas através das edições até que o app passe novas dobras.

As dobras se aninham: dobrar um bloco mantém dobradas as dobras dentro dele, de modo que desdobrar o bloco as mostra como estavam. `foldRecursive` dobra um bloco e todos os blocos dentro dele, `unfoldRecursive` desdobra todos eles, `foldLevel(n)` dobra todos os blocos no nível de aninhamento `n`, e `foldSelection` (ou `foldRange(range)`) dobra quaisquer linhas, onde quer que as dobras comecem. `onFoldChange` informa os intervalos dobrados após cada mudança, e `folds()` / `setFolds(ranges)` leem e restauram esses intervalos, para guardá-los junto com o arquivo.

```tsx
const ranges = signal<EditorFoldRange[]>([]);
const folded = new Map<string, EditorFoldRange[]>();

<Editor
  ref={editor}
  value={file().text}
  language={file().name}
  foldRanges={ranges()} // from the language server's textDocument/foldingRange
  onFoldChange={({ folds }) => folded.set(file().name, folds)}
  class="flex-1"
/>
<Button onPress={() => editor.foldLevel(2)}><Text>Fold the methods</Text></Button>
```

<a id="breakpoints-and-context-menus"></a>

## Breakpoints e menus de contexto

Um clique em um número de linha informa `onLineNumberPress({ line })`, o lugar para um breakpoint que o app desenha como decoração. O botão secundário (clique direito, Control+clique em um Mac) informa `onContextMenu({ position, x, y })`: a posição no texto sob o ponteiro e o ponto na view raiz, onde o app abre seu próprio menu. Em telas de toque, um toque longo, um toque duplo, uma alça solta e um toque na seleção também o informam, com `selection`: a caixa da seleção na view raiz (`{ x, y, width, height }`), e `x` / `y` no meio de seu topo, para o menu de edição.

```tsx
<Editor
  value={source()}
  onContextMenu={({ x, y, selection }) =>
    Menu.popup(selection ? editItems : contextItems, { x, y })
  }
/>
```

```tsx
const breakpoints = signal<number[]>([]);

<Editor
  value={source()}
  language="py"
  onLineNumberPress={({ line }) =>
    breakpoints.set(breakpoints().includes(line) ? breakpoints().filter((l) => l !== line) : [...breakpoints(), line])
  }
  decorations={breakpoints().map((line) => ({ range: range(line, 0, 0), lineClass: "bg-red-500/15" }))}
  class="flex-1"
/>
```

<a id="language-features"></a>

## Recursos de linguagem

Sugestões, informações ao passar o mouse, ir para a definição e code actions vêm do language server do app. O editor desenha por conta própria a lista de completion, a inline completion e o link de definição, com suas teclas; para o resto, ele fornece ao app os momentos e os lugares, e o app desenha seus popups (um [`Overlay`](./overlay.md) ancorado a um `pageBounds`).

### Completion

Com `completion`, o editor pede sugestões ao app e as mostra como uma lista sob a palavra sendo digitada (acima dela perto da parte inferior da janela):

- Digitar uma letra, um dígito ou `_` no fim de uma palavra faz o pedido com `onCompletionRequest(event)`, trigger `"typing"`: `event` tem seu `id`, o `offset` e o `position` do cursor, a `query` (a palavra digitada até agora) e o offset `queryStart` onde ela começa. Cada um de `completionTriggerCharacters` (`["."]`, `["::", "<"]`) faz o pedido com uma query vazia depois dele, trigger `"character"` (e o `character`), e `showCompletions()` ou `run("showCompletions")` faz o pedido no cursor, trigger `"invoked"`.
- O app responde com `presentCompletions(event.id, items)`. Cada item tem o formato `CompletionItem` de um language server: `label`, e opcionalmente `kind` (`"function"`, `"variable"`, `"class"`, ...), `detail`, `documentation`, `insertText`, `filterText`, `sortText` e `range`. A resposta ao pedido mais recente é exibida; uma anterior, ou uma para uma palavra que o cursor já deixou, é descartada.
- Continuar digitando filtra a lista no lugar: a query corresponde ao `filterText` de cada item (ou, na falta dele, ao label) como letras em ordem, sem diferenciar maiúsculas de minúsculas, com as palavras que começam com a query primeiro, depois as correspondências mais próximas, depois por `sortText`. As letras correspondentes ficam em destaque. Passe `incomplete: true` (`presentCompletions(id, items, true)`) para que o editor faça o pedido de novo conforme a digitação continua.
- Seta para cima e Seta para baixo (e Control+P / Control+N) percorrem a lista, Page Up e Page Down avançam uma página, Enter e Tab aceitam, Escape a fecha. O ponteiro marca um item e um clique (um toque em telas de toque) o aceita. O `documentation` do item selecionado aparece ao lado da lista.
- Aceitar substitui o `range` do item (ou, na falta dele, a query) pelo seu `insertText` (ou, na falta dele, o label), como um único passo que o undo desfaz, no cursor e em todos os outros cursores com o mesmo texto antes deles, e informa `onCompletionAccept({ item })`.
- A lista se fecha quando o cursor sai da palavra, em um espaço ou outra pontuação, quando o editor perde o foco e quando o cursor sai da área visível por rolagem.

Uma pausa na digitação (`inlineCompletionDelay`, 300 ms por padrão) sem nenhuma lista aberta pede uma inline completion: `onInlineCompletionRequest({ id, offset, position })`. `presentInlineCompletion(id, text)` mostra `text` no cursor em uma cor atenuada, Tab a insere, e Escape, uma edição ou um movimento a remove.

```tsx
let editor!: EditorRef;

<Editor
  ref={(r) => (editor = r)}
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  completion
  completionTriggerCharacters={["."]}
  onCompletionRequest={async (e) => {
    const items = await server.completion(e.position);
    editor.presentCompletions(e.id, items);
  }}
  onInlineCompletionRequest={async (e) => {
    editor.presentInlineCompletion(e.id, await assistant.suggest(e.offset));
  }}
  class="flex-1"
/>
```

<a id="hovers-and-presses"></a>

### Hovers e cliques

- `onHover(event)`: o mouse repousa sobre um caractere sem nenhum botão pressionado (desktops e web; arrastar seleciona texto). `event` tem seu `position`, seu `offset` em UTF-16, o `range` de sua palavra, o `pagePosition` do ponteiro, o `pageBounds` da palavra, os `modifiers` pressionados e os `diagnostics` ali, cujas mensagens o app exibe. Mover-se para outra palavra informa o próximo hover imediatamente.
- `onHoverEnd()`: o mouse saiu da palavra ou do editor, ou o texto mudou ou rolou sob ele.
- `onTextPress(event)`: um caractere foi pressionado, depois que o editor posicionou seu cursor: `{ position, offset, range,
  pagePosition, modifiers, clicks }`.
- `caretBounds()` e `rangeBounds(range)`: onde estão o cursor e um intervalo, `{ bounds, pageBounds }` (no editor e na view raiz): um popup do app se abre ali.

```tsx
const hover = signal<EditorHoverEvent | null>(null);

<Editor
  ref={editor}
  value={source()}
  language="ts"
  onHover={(event) => hover.set(event)}
  onHoverEnd={() => hover.set(null)}
  class="flex-1"
/>
<If when={hover()}>
  {(event) => (
    <Overlay anchor={event().pageBounds} placement="top" class="rounded-md border border-border bg-popover p-2">
      <Text>{event().diagnostics.map((d) => d.message).join("\n") || describe(event().range)}</Text>
    </Overlay>
  )}
</If>
```

<a id="go-to-definition-and-code-actions"></a>

### Ir para a definição e code actions

Manter Mod pressionado (Command no macOS e no iOS, Control nos demais) transforma as palavras sob o mouse em links, como em editores de código:

- Com Mod pressionado sobre uma palavra (pressionado enquanto o mouse repousa ali, ou com o mouse movido para lá com ele pressionado), o editor faz o pedido com `onDefinitionRequest(event)`, trigger `"hover"`: `event` tem seu `id`, o `position` e o `offset` do caractere, e o `range` da palavra. Responda com `presentDefinitionLink(event.id, range)` quando o language server encontrar uma definição: o intervalo é sublinhado (a parte `definitionLink`) e o ponteiro vira uma mão sobre ele. O link desaparece quando Mod é solto, quando o mouse o deixa ou o texto muda ou rola, ou com `hideDefinitionLink()`. A resposta ao pedido mais recente é exibida; uma anterior é descartada.
- Um Mod+clique em uma palavra faz o pedido com trigger `"press"`; no link, o cursor permanece onde está. F12 (`goToDefinition`, `run("goToDefinition")`) faz o pedido para a palavra no cursor, trigger `"key"`. O app vai até a definição: `revealPosition` e `setSelections` para uma no mesmo texto, sua própria navegação para outro arquivo.
- Mod+. (`showCodeActions`, `run("showCodeActions")`) informa `onCodeActionRequest({ range, position, bounds })`: a seleção primária (início primeiro), o cursor e sua caixa. O app pede ações ao seu language server, mostra seu menu em `bounds.pageBounds` (um [`Menu`](./menu.md) ou um `Overlay`), e aplica as edições da ação escolhida com `edit(edits)`.

```tsx
let editor!: EditorRef;

<Editor
  ref={(r) => (editor = r)}
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  onDefinitionRequest={async (e) => {
    const target = await server.definition(e.position);
    if (!target) return;
    if (e.trigger === "hover") editor.presentDefinitionLink(e.id, target.originRange ?? e.range);
    else editor.revealPosition(target.range.start, true);
  }}
  onCodeActionRequest={async (e) => {
    const actions = await server.codeActions(e.range);
    const picked = await choose(actions, e.bounds?.pageBounds);
    if (picked) editor.edit(picked.edits);
  }}
  class="flex-1"
/>
```

<a id="size-and-scrolling"></a>

## Tamanho e rolagem

Com `minRows` e / ou `maxRows`, o editor cresce junto com seu texto: ele tem a altura de suas linhas, no mínimo `minRows` delas, e a partir de `maxRows` seu texto rola, como em uma caixa de mensagem ou em uma célula de um notebook. Caso contrário, o app define seu tamanho, e `scrollBeyondLastLine` permite que o texto role além de sua última linha: até uma tela (`true`, o padrão), nada (`false`) ou um número de linhas. Conforme o cursor se move, `cursorSurroundingLines` linhas permanecem visíveis ao redor dele. Arrastar uma seleção além das bordas do editor rola o texto, mais rápido quanto mais longe o ponteiro vai.

`showWhitespaces` mostra um `·` para cada espaço e um `→` para cada tab (a parte `whitespace`), e `rulers` desenha uma linha em cada uma de suas colunas (a parte `ruler`), como guias do comprimento de uma linha.

```tsx
<Editor
  defaultValue={message()}
  language="markdown"
  minRows={2}
  maxRows={8}
  rulers={[72]}
  showWhitespaces
/>
```

<a id="methods"></a>

## Métodos

`ref={editor}` fornece os métodos do editor (`EditorRef`), para os botões, menus e teclas do app. Os métodos que retornam um valor (`value()`, `selections()`, `replaceAll()`, `canUndo()`, `caretBounds()`, `folds()`, ...) retornam um `Promise` dele em JS, então use `await` neles: `const text = await editor.value()`. Um método que recebe uma linha além do texto (`fold`, `scrollToLine`, `goToLine`, ...) não altera nada e registra um aviso com o nome do método e a linha.

| Método | Descrição |
|---|---|
| `focus()`, `blur()` | Assume o foco, ou o abandona. |
| `value()` | `Promise<string>`: o texto. |
| `setValue(value)` | Substitui o texto, como uma edição que o undo desfaz. |
| `insert(text)` | Digita `text` em cada seleção, como está (os colchetes não são fechados). |
| `edit(edits)` | Aplica as substituições de `{ range, text }` (intervalos do texto atual; uma que se sobreponha a uma anterior é ignorada) como um único passo que o undo desfaz; as seleções acompanham o texto ao redor delas. Code actions e edições de formatação vêm por aqui. |
| `selections()` | `Promise<EditorSelection[]>`: todas as seleções, `{ anchor, head }`, com a primária (a mais recente) por último. |
| `setSelections(selections)` | Define as seleções (a última é a primária) e rola a primária para a área visível. |
| `run(command)` | Executa um comando, como suas teclas fariam ([Commands](#commands)). |
| `replace(text)` | Substitui a correspondência atual e seleciona a próxima. |
| `replaceAll(text)` | `Promise<EditorReplaceAll>`: substitui todas as correspondências em uma única edição; `{ count }`, quantas foram. |
| `fold(line)`, `unfold(line)` | Dobra as linhas abaixo da linha `line` (a partir de 0), ou a desdobra. |
| `foldRecursive(line)`, `unfoldRecursive(line)` | Dobra a dobra na linha `line` e toda dobra dentro dela, ou desdobra todas. |
| `foldLevel(level)` | Dobra toda dobra no nível de aninhamento `level` (1: a mais externa). |
| `foldRange(range)` | Dobra as linhas de `range` (`{ startLine, endLine }`), onde quer que as dobras comecem. |
| `folds()` | `Promise<EditorFoldRange[]>`: os intervalos dobrados, incluindo os aninhados. |
| `setFolds(folds)` | Dobra exatamente `folds`. |
| `scrollToLine(line)` | Rola a linha `line` para a área visível, desdobrando o que a esconde. |
| `canUndo()`, `canRedo()` | `Promise<boolean>`: se há uma edição para desfazer, ou para refazer. |
| `caretBounds()` | `Promise<EditorBounds \| null>`: a caixa do cursor primário, `{ bounds, pageBounds }`, no editor (com sua rolagem aplicada) e na view raiz; `null` antes de o editor ser posicionado no layout. |
| `rangeBounds(range)` | `Promise<EditorBounds[]>`: as caixas de `range`, uma por linha que ele cobre. |
| `scrollOffset()`, `setScrollOffset(offset)` | `Promise<Point>`: quanto o texto foi rolado; rola-o até `{ x, y }`. |
| `visibleRange()` | `Promise<EditorRange>`: o texto que a viewport mostra, do início de sua primeira linha ao fim de sua última linha. |
| `selectedText()` | `Promise<string>`: o texto da seleção primária. |
| `offsetToPosition(offset)`, `positionToOffset(position)` | `Promise<EditorPosition>`, `Promise<number>`: entre offsets UTF-16 de `value()` e posições. |
| `revealPosition(position, center)` | Rola `position` para a área visível, desdobrando o que o esconde; até o meio com `center`. |
| `goToLine(line)` | Coloca o cursor no início da linha `line` (a partir de 0) e a rola até o meio. |
| `showCompletions()` | Pede completions no cursor, com a palavra antes dele como query ([Completion](#completion)). |
| `presentCompletions(id, items, incomplete?)` | Responde ao pedido de completion `id`: a lista mostra `items`, filtrada pelo que foi digitado desde então; com `incomplete`, continuar digitando faz um novo pedido. Nenhum item fecha a lista. |
| `hideCompletions()` | Fecha a lista de completion. |
| `presentInlineCompletion(id, text)`, `hideInlineCompletion()` | Responde ao pedido de inline completion `id` com `text`, exibida no cursor; a remove. |
| `presentDefinitionLink(id, range)`, `hideDefinitionLink()` | Responde ao pedido de definição `id` (trigger `"hover"`): `range` é sublinhado como um link ([Go to definition](#go-to-definition-and-code-actions)); o oculta. |

```tsx
let editor!: EditorRef;

<Button onPress={() => editor.run("toggleComment")}><Text>Comment</Text></Button>
<Button onPress={async () => save(await editor.value())}><Text>Save</Text></Button>
<Button onPress={async () => (await editor.canUndo()) && editor.run("undo")}><Text>Undo</Text></Button>
<Button onPress={() => editor.setSelections([{ anchor: { line: 0, column: 0 }, head: { line: 0, column: 0 } }])}>
  <Text>Go to the top</Text>
</Button>
<Editor ref={editor} value={source()} onChange={({ value }) => source.set(value)} language="rs" class="flex-1" />
```
<a id="commands"></a>

### Comandos

`run` recebe os comandos do editor pelo nome (`EditorCommand`):

| Comandos | O que fazem |
|---|---|
| `moveLeft`, `moveRight`, `moveUp`, `moveDown`, `moveWordLeft`, `moveWordRight`, `moveLineStart`, `moveLineEnd`, `movePageUp`, `movePageDown`, `moveDocumentStart`, `moveDocumentEnd` | Movem os cursores. |
| `selectLeft`, `selectRight`, `selectUp`, `selectDown`, `selectWordLeft`, `selectWordRight`, `selectLineStart`, `selectLineEnd`, `selectPageUp`, `selectPageDown`, `selectDocumentStart`, `selectDocumentEnd` | Estendem as seleções. |
| `moveToMatchingBracket` | Vai para o delimitador correspondente ao que está no cursor. |
| `selectAll`, `selectLine`, `selectWord`, `selectNextOccurrence`, `selectPreviousOccurrence`, `selectAllOccurrences` | Selecionam. |
| `moveSubwordLeft`, `moveSubwordRight`, `selectSubwordLeft`, `selectSubwordRight` | Movem ou estendem por parte de uma palavra (partes de camelCase, partes de snake_case). |
| `moveParagraphUp`, `moveParagraphDown`, `selectParagraphUp`, `selectParagraphDown` | Movem ou estendem até a linha em branco antes ou depois do parágrafo. |
| `expandSelection`, `shrinkSelection` | Ampliam as seleções em uma unidade, ou voltam. |
| `undoSelection`, `redoSelection` | Voltam às seleções anteriores ao último movimento, ou avançam novamente. |
| `splitSelectionIntoLines` | Uma seleção por linha de cada seleção. |
| `addCaretAbove`, `addCaretBelow`, `singleSelection` | Adicionam um cursor; voltam a uma única seleção. |
| `deleteBackward`, `deleteForward`, `deleteWordLeft`, `deleteWordRight`, `deleteToLineStart`, `deleteToLineEnd`, `deleteLine` | Excluem. |
| `newline`, `newlineBelow`, `newlineAbove`, `indent`, `outdent`, `toggleComment`, `toggleBlockComment` | Linhas, indentação e comentários. |
| `sortLinesAscending`, `sortLinesDescending` | Ordenam as linhas selecionadas (todas as linhas, se houver apenas um cursor). |
| `transformToUppercase`, `transformToLowercase`, `transformToTitleCase` | Alteram a caixa das seleções (com um cursor: a palavra dele). |
| `trimTrailingWhitespace` | Remove os espaços em branco no fim de cada linha. |
| `moveLinesUp`, `moveLinesDown`, `duplicateLinesUp`, `duplicateLinesDown`, `joinLines`, `transposeCharacters` | Reorganizam. |
| `undo`, `redo` | Desfazem e refazem. |
| `fold`, `unfold`, `foldAll`, `unfoldAll` | Dobram na linha do cursor, ou tudo. |
| `foldRecursive`, `unfoldRecursive` | Dobram a dobra do cursor e todas as dobras dentro dela, ou as expandem. |
| `foldSelection` | Dobram as linhas de cada seleção que abrange várias. |
| `findNext`, `findPrevious` | Selecionam a próxima ocorrência ou a anterior de `search`. |
| `findWithSelection` | Informa o texto selecionado para a barra de busca (`onFindWithSelection`). |
| `copy`, `cut`, `paste` | A área de transferência. |
| `showCompletions` | Solicita sugestões de autocompletar no cursor ([Autocompletar](#completion)). |
| `goToDefinition` | Solicita a definição da palavra no cursor (`onDefinitionRequest`, gatilho `"key"`). |
| `showCodeActions` | Solicita as ações de código na seleção (`onCodeActionRequest`). |

<a id="styling-the-parts"></a>

## Estilizando as partes

`class` e `style` estilizam a caixa do editor. `classes` recebe classes do Tailwind por parte e `styles` estilos inline por parte; as classes de uma parte vêm depois dos estilos padrão dela, então prevalecem sobre eles, e seus `styles` prevalecem sobre suas classes. A fonte é definida com `fontFamily`, `fontSize` e `lineHeight`, nas quais o editor mede seu texto.

```tsx
<Editor
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="tsx"
  fontFamily="JetBrains Mono"
  fontSize={14}
  lineHeight={22}
  class="flex-1 rounded-lg border border-border"
  classes={{
    gutter: "bg-muted",
    lineNumber: "text-xs",
    activeLine: "bg-yellow-500/10",
    selection: "bg-blue-500/30",
  }}
  styles={{ caret: { backgroundColor: "#f59e0b", width: 3 } }}
/>
```

| Parte | O que é | Padrão |
|---|---|---|
| `gutter` | A coluna de números de linha e marcadores de dobra | 12pt antes dos números, 4pt depois dos marcadores |
| `lineNumber` | Cada número de linha | Alinhado à direita, `muted-foreground` |
| `activeLineNumber` | Os números das linhas com um cursor, depois de `lineNumber` | `foreground` |
| `foldMarker` | O marcador de uma linha onde começa uma dobra | `⌄`, `›` quando dobrada, `muted-foreground` |
| `overviewRuler` | A régua de visão geral na borda direita, enquanto uma decoração tem uma marca ali | nenhum |
| `content` | A área de texto ao lado da gutter | 4pt antes do texto |
| `line` | Cada linha de texto | |
| `activeLine` | Atrás das linhas com um cursor, abaixo dos indicadores de rolagem | `muted`, tênue |
| `selection` | Atrás do texto selecionado | Um tom de `primary` |
| `caret` | Os cursores | 2pt de largura, `foreground`, piscando |
| `composition` | O texto que um método de entrada está compondo | Sublinhado |
| `searchMatch` | As ocorrências de `search` | Âmbar translúcido |
| `currentSearchMatch` | A ocorrência em que a seleção está, depois de `searchMatch` | Âmbar mais forte |
| `matchingBracket` | O delimitador no cursor e seu par | Uma borda de 1pt |
| `indentGuide` | Uma guia por nível de indentação | Uma linha de 1pt de `border` |
| `foldPlaceholder` | O que uma linha dobrada mostra depois do seu texto | ` ⋯ `, `muted-foreground` |
| `placeholder` | Exibido enquanto o texto está vazio | `muted-foreground` |
| `diagnosticError` | A linha sob um erro | `destructive` |
| `diagnosticWarning` | A linha sob um aviso | Âmbar |
| `diagnosticInfo` | A linha sob uma informação | Azul |
| `diagnosticHint` | A linha sob uma dica | `muted-foreground` |
| `unnecessaryText` | O texto de um diagnóstico `unnecessary` | `muted-foreground` |
| `deprecatedText` | O texto de um diagnóstico `deprecated` | Tachado |
| `whitespace` | As marcas de espaços e tabulações (`showWhitespaces`) | `·` e `→`, `muted-foreground` a 60 % |
| `ruler` | As linhas de `rulers` | Uma linha de 1 ponto de `border` |
| `selectionHandle` | Os botões das alças nas extremidades de uma seleção por toque | Um ponto de 10pt de `primary` |
| `selectionHandleStart`, `selectionHandleEnd` | O botão do início (acima da sua linha) e o do fim (abaixo), depois de `selectionHandle` | |
| `completionMenu` | A caixa da lista de sugestões | `popover`, uma `border` de 1pt, arredondada, com sombra |
| `completionItem` | Cada item da lista | A altura de uma linha, 8pt de preenchimento |
| `selectedCompletionItem` | O item selecionado, depois de `completionItem` | `accent` |
| `completionMatch` | As letras de um rótulo que a consulta encontrou | Semibold, `primary` |
| `completionDetail` | O detalhe de um item, depois do seu rótulo | Alinhado à direita, `muted-foreground` |
| `completionKind` | O tipo de um item, antes do seu rótulo | Um nome curto (`fn`, `var`, `cls`), `muted-foreground` |
| `completionDocumentation` | A documentação do item selecionado, ao lado da lista | Como `completionMenu`, com no máximo 320pt de largura |
| `inlineCompletion` | A sugestão inline no cursor | `muted-foreground` |
| `definitionLink` | O sublinhado do link de definição | Uma linha de 1pt de `primary` sob o texto |

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | | O texto, controlado pelo app (defina-o novamente a partir de `onChange`). |
| `defaultValue` | `.default_value(..)` | `string` | | O texto inicial, quando o editor mantém o seu próprio. |
| `language` | `.language(..)` | `string` | texto simples | O nome, alias, extensão ou nome de arquivo de uma linguagem ([Linguagens](#languages)). |
| `placeholder` | `.placeholder(..)` | `string` | | Exibido enquanto o texto está vazio. |
| `readOnly` | `.read_only(..)` | `boolean` | `false` | O texto é selecionado e copiado, não alterado. |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | Recebe o foco quando aparece. |
| `lineNumbers` | `.line_numbers(..)` | `boolean` | `true` | Os números de linha da gutter. |
| `softWrap` | `.soft_wrap(..)` | `boolean` | `false` | Linhas longas quebram na largura do editor. |
| `tabSize` | `.tab_size(..)` | `number` | o da linguagem | As colunas de uma tabulação e de um nível de indentação. |
| `hardTabs` | `.hard_tabs(..)` | `boolean` | o da linguagem | Indenta com tabulações. |
| `folding` | `.folding(..)` | `boolean` | `true` | Linhas indentadas são dobradas com os marcadores da gutter. |
| `foldRanges` | `.fold_ranges(..)` | `EditorFoldRange[]` | por indentação | Onde as dobras começam, definido pelo app ([Dobramento](#folding)). |
| `highlighting` | `.highlighting(..)` | `boolean` | `true` | O destaque de sintaxe integrado ([Seu próprio destaque](#your-own-highlighting)). |
| `autoClose` | `.auto_close(..)` | `boolean` | `true` | Delimitadores e aspas são fechados à medida que são digitados. |
| `autoIndent` | `.auto_indent(..)` | `boolean` | `true` | Uma nova linha mantém a indentação e indenta após um delimitador de abertura. |
| `activeLine` | `.active_line(..)` | `boolean` | `true` | As linhas com um cursor são destacadas. |
| `indentGuides` | `.indent_guides(..)` | `boolean` | `true` | As guias de indentação. |
| `scrollBeyondLastLine` | `.scroll_beyond_last_line(..)` | `boolean \| number` | `true` | O texto continua rolando além da última linha: até uma tela (`true`), nada (`false`) ou essa quantidade de linhas. |
| `fontFamily` | `.font_family(..)` | `string` | o `font-mono` do tema | A fonte em que o texto é desenhado e medido. |
| `fontSize` | `.font_size(..)` | `number` | `13` | O tamanho da fonte, em pontos. |
| `lineHeight` | `.line_height(..)` | `number` | `20` | A altura de uma linha, em pontos. |
| `search` | `.search(..)` | `EditorSearch` | | O que localizar ([Localizar e substituir](#find-and-replace)). |
| `diagnostics` | `.diagnostics(..)` | `EditorDiagnostic[]` | `[]` | Problemas a marcar ([Diagnósticos](#diagnostics)). |
| `decorations` | `.decorations(..)` | `EditorDecoration[]` | `[]` | Intervalos que o app estiliza ([Decorações](#decorations)). |
| `gutterDecorationsWidth` | `.gutter_decorations_width(..)` | `number` | `3` | A largura da faixa da gutter com as marcas das decorações, em pontos. |
| `classes` | `.classes(..)` | `EditorClasses` | `{}` | Classes do Tailwind por parte. |
| `styles` | `.styles(..)` | `EditorStyles` | `{}` | Estilos inline por parte, sobrepondo as classes. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | | Como os leitores de tela chamam o editor. |
| `showWhitespaces` | `.show_whitespaces(..)` | `boolean` | `false` | Espaços e tabulações aparecem como `·` e `→`. |
| `rulers` | `.rulers(..)` | `number[]` | `[]` | Colunas nas quais desenhar uma linha vertical. |
| `minRows` | `.min_rows(..)` | `number` | | O editor cresce com o texto a partir desta quantidade de linhas ([Tamanho e rolagem](#size-and-scrolling)). |
| `maxRows` | `.max_rows(..)` | `number` | | O editor cresce com o texto até esta quantidade de linhas e depois rola. |
| `cursorSurroundingLines` | `.cursor_surrounding_lines(..)` | `number` | `1` | As linhas mantidas à vista acima e abaixo do cursor. |
| `completion` | `.completion(..)` | `boolean` | `false` | O editor pede sugestões e as exibe como uma lista ([Autocompletar](#completion)). |
| `completionTriggerCharacters` | `.completion_trigger_characters(..)` | `string[]` | `[]` | O que mais solicita sugestões enquanto se digita. |
| `inlineCompletionDelay` | `.inline_completion_delay(..)` | `number` | `300` | Milissegundos de pausa na digitação antes de uma sugestão inline ser solicitada. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | | A caixa do editor. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descrição |
|---|---|---|
| `onChange` | `.on_change(\|value: &SharedString\| ..)` | O texto mudou: `{ value }`, o novo texto completo. |
| `onSelectionChange` | `.on_selection_change(\|selections: &Vec<EditorSelection>\| ..)` | As seleções mudaram: `{ selections }`, todas, com a principal por último. |
| `onFocus`, `onBlur` | `.on_focus(\|\| ..)`, `.on_blur(\|\| ..)` | O editor recebeu ou perdeu o foco. |
| `onSearchChange` | `.on_search_change(\|result: &EditorSearchResult\| ..)` | As ocorrências da busca mudaram: `{ result }`, um `{ count, current, error }`. |
| `onLineNumberPress` | `.on_line_number_press(\|line: &u32\| ..)` | Um número de linha foi pressionado: `{ line }`, a linha, a partir de 0. |
| `onContextMenu` | `.on_context_menu(\|event: &EditorContextMenuEvent\| ..)` | O botão secundário foi pressionado sobre o texto, ou um toque selecionou texto: `{ position, x, y, selection? }`. |
| `onHover` | `.on_hover(\|event: &EditorHoverEvent\| ..)` | O mouse está parado sobre um caractere ([Recursos de linguagem](#language-features)). |
| `onHoverEnd` | `.on_hover_end(\|\| ..)` | O hover terminou. |
| `onTextPress` | `.on_text_press(\|event: &EditorTextPressEvent\| ..)` | Um caractere foi pressionado: com sua palavra, os modificadores e os cliques. |
| `onFindWithSelection` | `.on_find_with_selection(\|query: &String\| ..)` | `findWithSelection` foi executado: `{ query }`, o texto para a consulta da barra de busca. |
| `onFoldChange` | `.on_fold_change(\|folds: &Vec<EditorFoldRange>\| ..)` | Os intervalos dobrados mudaram: `{ folds }`, todos, incluindo os aninhados. |
| `onCompletionRequest` | `.on_completion_request(\|event: &EditorCompletionRequest\| ..)` | O editor solicita sugestões: `{ id, offset, position, query, queryStart, trigger, character? }` ([Autocompletar](#completion)). |
| `onCompletionAccept` | `.on_completion_accept(\|event: &EditorCompletionAcceptEvent\| ..)` | Um item foi aceito e inserido: `{ item }`. |
| `onInlineCompletionRequest` | `.on_inline_completion_request(\|event: &EditorInlineCompletionRequest\| ..)` | A digitação pausou: `{ id, offset, position }`, para uma sugestão inline. |
| `onDefinitionRequest` | `.on_definition_request(\|event: &EditorDefinitionRequest\| ..)` | O editor solicita uma definição: `{ id, position, offset, range, trigger }` ([Ir para a definição](#go-to-definition-and-code-actions)). |
| `onCodeActionRequest` | `.on_code_action_request(\|event: &EditorCodeActionRequest\| ..)` | O usuário solicitou ações de código: `{ range, position, bounds? }`. |

<a id="accessibility"></a>

## Acessibilidade

Os leitores de tela chamam o editor pelo seu `accessibilityLabel`; seu foco é o de um campo de entrada de texto, de modo que os serviços de texto da plataforma (métodos de entrada, ditado, teclados virtuais) funcionam nele.

<a id="related"></a>

## Relacionados

- [TextView](./text-view.md): documentos em Markdown e HTML, cujos blocos de código compartilham as cores de sintaxe do editor.
- [DiffView](./diff-view.md): as alterações entre dois textos, nas cores de sintaxe do editor.
- [Input](./input.md): campos de texto de uma ou várias linhas com a edição nativa da plataforma.
- [`keymap`](../modules/nsh.md#keymap): as teclas do app para os comandos do editor.
- [`nsh/base`](../modules/nsh-base.md): os demais componentes base.
