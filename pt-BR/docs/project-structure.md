---
title: "Estrutura do projeto"
description: "Os arquivos de um app NSH em Rust ou TSX, todas as chaves do nsh.json, a configuração do TypeScript em .nsh/types, os assets e como módulos e pacotes são importados."
order: 5
group: start
source_hash: 67da39e1182fc05c
---


# Estrutura do projeto

Um app NSH é um diretório com um `nsh.json` e seu código: um crate Rust cujo componente raiz é nomeado por `nsh.json`, ou um módulo de entrada TSX, ou ambos. Todo o resto (mais módulos, imagens, fontes, arquivos JSON) é encontrado a partir dali: os módulos de um crate e seu diretório `assets/`, ou os arquivos que a entrada TSX importa, de modo que não há lista de arquivos para manter.

Um app escrito em Rust é um projeto Cargo:

```text
my-app/
├── nsh.json           name, id, version, icon, the crate ("rust") and its root component ("root"), theme
├── Cargo.toml         the crate: nsh-core, nsh-base and your dependencies
├── src/
│   ├── lib.rs         the root component and the crate's UI set (#[native_module])
│   ├── main.rs        cargo run: the root on this machine's desktop backend
│   └── screens/       your own modules (any layout you like)
├── assets/            files the crate ships: asset!("logo@2x.png"), fonts
├── .gitignore         .nsh/ and target/
├── .nsh/              generated: the runners' sources, test entries, build output (.nsh/out)
└── target/            Cargo's build directory
```

Um app TSX é uma entrada e os módulos que ela importa:

```text
my-app/
├── App.tsx            the entry module: calls mount()
├── App.test.tsx       its tests (nsh test)
├── nsh.json           name, id, version, icon, Tailwind theme, capabilities
├── tsconfig.json      TypeScript settings for editors
├── .gitignore         .nsh/ and target/
├── components/        your own modules (any layout you like)
│   └── Header.tsx
├── assets/
│   ├── logo@2x.png    imported images
│   └── Inter.ttf      imported fonts
└── .nsh/              generated: type declarations, development host builds, test entries, build output (.nsh/out)
```

Um app com ambos lista seus crates em `"rust"` e tem uma entrada TSX que os importa ([Desenvolvendo com Rust](./rust.md#extending-a-rust-app-with-tsx)).

Todo comando recebe o diretório do app ou sua entrada como argumento (`nsh run my-app`, `nsh run my-app/App.tsx`). O diretório de `nsh.json` e da entrada é a raiz do app: `nsh.json` é lido dali, os caminhos de assets são relativos a ela, e `.nsh/` é gravado nela. Em um app Rust (`nsh.json` `"root"`), o diretório executa o componente raiz; informar uma entrada TSX executa essa entrada.

<a id="the-root-component"></a>

## O componente raiz

A raiz de um app Rust é um componente de seu crate, que o `"root"` de `nsh.json` nomeia por seu caminho no crate (`App`, `shell::Gallery`). Uma entrada TSX é um módulo normal que termina renderizando o componente raiz:

```rust tabs
// src/lib.rs; nsh.json: { "rust": ".", "root": "App" }
mod screens;

use nsh_core::prelude::*;

/// What a TSX entry may import from the crate.
#[native_module("my-app/native")]
fn native(registry: &mut Registry) {
    registry.register::<App>().assets(assets!());
}

#[component]
pub fn App() -> impl IntoElement {
    screens::home()
}
```

```tsx tabs
// App.tsx
import { mount } from "nsh";
import { Home } from "./components/Home";

function App() {
  return <Home />;
}

mount(App);
```

`nsh run` e `nsh package` montam uma raiz Rust em todas as plataformas, sem QuickJS. Em TSX, `mount(component, props?)` renderiza o componente na superfície do app e retorna uma função que o remove novamente; um app a chama uma vez. O código no nível superior da entrada é executado quando o bundle é carregado, antes do primeiro frame.

## nsh.json

`nsh.json` fica na raiz do app. `nsh init` grava `name`, `id`, `version` e `build` e, para um app Rust, o crate e seu componente raiz:

```json
{
  "name": "Gallery",
  "id": "com.example.gallery",
  "version": "1.0.0",
  "build": 1,
  "rust": ".",
  "root": "App",
  "theme": "theme.json"
}
```

Todas as outras chaves são opcionais; um app TSX também pode omitir as quatro. O `nsh.json` de um app TSX poderia ser assim:

```json
{
  "name": "Gallery",
  "id": "com.example.gallery",
  "version": "1.0.0",
  "build": 1,
  "icon": "icon.png",
  "tailwind": {
    "colors": { "brand": { "500": "#7c3aed", "600": "#6d28d9" } },
    "radius": { "card": 14 }
  },
  "capabilities": {
    "network": { "hosts": ["api.example.com", "*.cdn.example.com"] }
  }
}
```

| Chave | Tipo | Usada por | Descrição |
|---|---|---|---|
| `name` | string | `package` | O nome de exibição sob o ícone do app. Padrão: o nome do diretório da entrada. |
| `id` | string | `package`, `publish`, `Storage` | Identificador de bundle / application id em formato DNS reverso, p. ex. `com.yourcompany.app`; exigido por `package` e `publish`. `nsh run` usa `com.example.<name>` sem ele. |
| `version` | string | `package`, `publish` | A versão visível ao usuário, p. ex. `1.2.0` (`CFBundleShortVersionString`, Android `versionName`). |
| `build` | number | `package`, `publish` | O número do build (`CFBundleVersion`, Android `versionCode`). Pacotes assinados exigem que ele aumente a cada release. |
| `minRuntime` | string | `publish` | O runtime NSH mais antigo que executa o pacote assinado, p. ex. `0.2.0`. Padrão: a versão da CLI ([Pacotes assinados](./signed-packages.md#which-runtimes-run-a-package)). |
| `icon` | string | `package` | Um PNG quadrado, idealmente de 1024×1024, relativo a `nsh.json`. |
| `tailwind` | object | todo build | Estende o tema do Tailwind com o qual suas strings `class` são resolvidas ([Tailwind](./tailwind.md#theme)). |
| `appearance` | string | todo build, `package` | `"light"`, `"dark"` ou `"system"` (o padrão): um app que é sempre claro ou sempre escuro declara isso aqui. As classes `colorScheme()` e `dark:`, o tema dos componentes e os controles da plataforma o seguem desde o início ([Dispositivo e ambiente](./device-and-environment.md#dark-mode)). |
| `theme` | string or object | todo build | Os design tokens do app (os `cssVars` do shadcn/ui, sobre o tema `neutral` padrão), com os quais as classes de token, `token()` e os componentes Rust desenham: o caminho de um arquivo de tema relativo a `nsh.json`, ou o tema inline ([Desenvolvendo com Rust](./rust.md#theme), [Tokens de tema](./tailwind.md#theme-tokens)). |
| `statusBar` | object | todo build, `package` | O padrão da barra de status sob toda página e diálogo (iOS e Android): `{ "foreground": "auto" \| "light" \| "dark", "hidden": boolean }`, ambos opcionais. Apps iOS empacotados a exibem desde a tela de lançamento ([Barra de status](../modules/nsh-base.md#status-bar)). |
| `capabilities` | object | todo build | O que o app pode acessar fora de sua VM: hosts de rede, hosts de web view, a barra de status ([Sandbox e capabilities](./sandbox-and-capabilities.md)). |
| `resolve` | object | todo build | Como os imports simples são resolvidos: as export conditions dos pacotes npm e os aliases ([Pacotes npm](#npm-packages)). |
| `rust` | string or string[] | todo comando | O crate Rust do app, ou uma lista deles, relativo a `nsh.json`: seus componentes e módulos, que o TSX importa pelo especificador `#[native_module]` de cada crate ([Desenvolvendo com Rust](./rust.md#several-crates)). |
| `web` | object | `package` | O que um pacote web adiciona à sua página. `web.host`: um módulo JS relativo a `nsh.json` que exporta `createHost(player)`, o qual responde às chamadas de [`host`](../modules/nsh.md#host) do app; `web.connect`: os hosts que as próprias requisições desse módulo alcançam, como padrões de `capabilities.network.hosts`, que a Content-Security-Policy da página permite ([Web](./web.md#the-hosts-functions)). |
| `root` | string | `run`, `package` | O componente raiz de um app Rust, seu caminho no crate `rust`, o primeiro de uma lista (`App`, `shell::Gallery`): `nsh run` e `nsh package` no diretório do app o montam sem QuickJS, em todas as plataformas; `nsh run App.tsx` ainda executa a entrada TSX ([Desenvolvendo com Rust](./rust.md)). |

As flags de `nsh package` e `nsh publish` (`--name`, `--id`, `--app-version`, `--build`, `--icon`, `--min-runtime`) sobrescrevem os valores do arquivo ([CLI](./cli.md)).

`tailwind`, `theme`, `appearance`, `statusBar`, `capabilities` e `resolve` são verificados quando o app é compilado. Um erro de digitação é um erro de build, e não uma configuração que silenciosamente não faz nada:

```text
error building App.tsx failed
nsh.json: tailwind: unknown theme key `colours`
```


### capabilities

Sem a chave `capabilities`, um app pode usar livremente a rede, as web views e a barra de status: um app standalone pertence ao próprio desenvolvedor. Com a chave, tudo o que não está listado é negado, tanto em desenvolvimento quanto em apps empacotados:

```json
"capabilities": {
  "network": {
    "hosts": ["api.example.com", "*.cdn.example.com"],
    "http": [{ "host": "quotes.example.com", "methods": ["GET"], "pathPrefix": "/v1/" }]
  },
  "webview": { "hosts": ["*.example.com"] },
  "statusBar": true
}
```

`network` cobre `fetch`, imagens remotas e fontes de vídeo; assets locais são sempre permitidos. Um app que incorpora o NSH pode conceder menos do que um app declara. Os detalhes estão em [Sandbox e capabilities](./sandbox-and-capabilities.md).

<a id="tsconfigjson-and-nshtypes"></a>

## tsconfig.json e .nsh/types

O NSH não precisa de `node_modules`. Em vez disso, todo comando que compila o app (`init`, `build`, `test`, `dev`, `run`, `package`, `publish`, `check`) grava as declarações TypeScript de tudo o que o NSH fornece em `.nsh/types`, e as configurações TypeScript do NSH em `.nsh/tsconfig.json`. O `tsconfig.json` do app as estende:

```json
{
  "extends": "./.nsh/tsconfig.json",
  "include": ["**/*.ts", "**/*.tsx"]
}
```

`.nsh/tsconfig.json` aponta os imports de `nsh` e os crates do seu app para `.nsh/types`, inclui as declarações de globais, assets e tokens e define as opções de compilador que os apps NSH usam (`lib`, `jsx`, `strict`, ...). O NSH o mantém atualizado: quando uma nova versão adiciona uma biblioteca ou um caminho, seu app o recebe no próximo build, e seu `tsconfig.json` permanece como você o escreveu. As opções que você adiciona a `tsconfig.json` prevalecem sobre as do NSH.

| Arquivo em `.nsh/types/nsh/` | Declara |
|---|---|
| `index.d.ts` | `nsh`: `signal`, `computed`, `effect`, `mount`, `View`, `Text`, ... e reexporta os tipos abaixo |
| `types.d.ts` | Estilos (`ViewStyle`, `TextStyle`, ...), as props e os eventos de cada elemento, as refs (`ViewRef`, `InputRef`, ...: o que um `ref` recebe) |
| `jsx-runtime.d.ts` | O JSX runtime que o TypeScript resolve por meio de `jsxImportSource` (o namespace `JSX`) |
| `globals.d.ts` | `If` e `Each`; `console`, timers, `requestAnimationFrame`, `fetch` e as demais [APIs globais](../modules/globals.md) |
| `assets.d.ts` | O que a importação de uma imagem ou fonte retorna |
| `tokens.d.ts` | `Tokens`: os design tokens do app, a partir de seu `"theme"`, que tipam [`token()`](../modules/nsh.md#token) |
| `mobile.d.ts`, `desktop.d.ts` | Um arquivo por módulo (`nsh/mobile`, `nsh/desktop`) |
| `base.d.ts` | `nsh/base` |

`lib` é `ES2023` sem `DOM`: não há `document` nem `window`. Os arquivos em `.nsh` são regenerados (somente quando seu conteúdo muda), portanto não os edite nem os faça commit; `.gitignore` já exclui `.nsh/`. Se o seu editor mostrar `nsh` como ausente após clonar um projeto, execute qualquer comando de build uma vez, p. ex. `nsh check`.

`.nsh/tsconfig.json` adiciona `"ESNext.Disposable"`, que declara as declarações de `using` e `Symbol.dispose`, que o runtime possui: `using account = new Account()` libera o valor de uma [classe Rust](./rust.md) ao final do bloco. Seus `jsxImportSource: "nsh"` e `jsx: "preserve"` só importam para o editor: o NSH compila JSX com seu próprio compilador, independentemente do que o `tsconfig.json` diga. O TypeScript é verificado pelo seu editor ou por `nsh check`; os demais comandos removem os tipos sem verificá-los.

Um app criado por um `nsh init` anterior recebe o novo `tsconfig.json` no próximo build quando o seu é o template do NSH, sem alterações; o NSH imprime uma linha informando isso. Um `tsconfig.json` que você alterou é seu: `nsh check` indica quando ele não estende `./.nsh/tsconfig.json`, e você adiciona a linha `extends` e remove as opções que ele define.

<a id="modules"></a>

## Módulos

O código de um app Rust são os módulos de seu crate (`mod screens;`), e suas dependências vêm do crates.io como as de qualquer crate; os crates do próprio NSH são `nsh-core` (as primitivas, signals e estilos tipados, `use nsh_core::prelude::*`) e `nsh-base` (os componentes base e o tema).

Em TSX, divida o app em quantos módulos `.ts` e `.tsx` quiser e importe-os com caminhos relativos; a extensão pode ser omitida:

```tsx
import { Header } from "./components/Header";
import { formatPrice } from "./lib/format";
import strings from "./strings.json";
```

Todos são reunidos em um único script. Arquivos JSON são importados como seu valor já interpretado.

<a id="loading-code-on-demand"></a>

### Carregando código sob demanda

`import()` de um dos módulos do app retorna uma promise de seus exports, como em um navegador:

```tsx
const open = async () => {
  const { Settings } = await import("./screens/Settings");
  screen.set(() => Settings);
};
```

Apps em dispositivos distribuem um único bundle, portanto o módulo já está lá e a promise é resolvida imediatamente. Um app web publicado dividido (`nsh build --split`) recebe o módulo, e o que só ele usa, como um arquivo separado que é baixado na primeira vez que `import()` o solicita ([Web](./web.md#split-bundles)). O especificador deve ser um caminho relativo literal: o bundler precisa ver qual módulo é o desejado.

<a id="nshs-modules"></a>

### Módulos do NSH

Os imports de `nsh` e `nsh/...` não são incluídos no bundle: o runtime os fornece nativamente.

| Módulo | O que ele tem |
|---|---|
| `nsh` | Reatividade (`signal`, `computed`, `effect`, ...), `mount`, `split`, `context`; as primitivas `View`, `Text`, `Scroll`, `Image`, `List`, `Canvas`, `WebView`, `Video` (o `selectable` de `View` para seleção de texto); insets de área segura (`safeArea`, `safeAreaInsets`) e o teclado virtual (`Keyboard`, `keyboardFrame`); animações nativas; `PanResponder`; o ambiente (`platform`, `windowSize`, `colorScheme`, `fontScale`, `pixelRatio`, `locale`); estado do leitor de tela e de redução de movimento, anúncios; a área de transferência, o seletor de fotos, o armazenamento, o canal com o host, atalhos de teclado; componentes e funções que o app anfitrião registra ([referência](../modules/nsh.md)) |
| `nsh/base` | A base sem estilo da UI de um app: pilhas de navegação e suas páginas (`NavStack`, `NavPage`, `createNavStack`), diálogos (`Dialog`), um alvo de toque (`Button`), um campo de texto (`Input`) e o diálogo de alerta do sistema (`AlertDialog`); páginas e diálogos definem a barra de status (`statusBar`) ([referência](../modules/nsh-base.md)) |
| `nsh/mobile` | O que o iOS e o Android têm: `TabBar`, `InputAccessoryView` (iOS), `BackHandler` (Android) ([referência](../modules/nsh-mobile.md)) |
| `nsh/desktop` | O que macOS, Windows e Linux têm: `Window`, `titleBar`, `Menu` ([referência](../modules/nsh-desktop.md)) |

A [referência de módulos](../modules/index.md) documenta cada um deles. Importar um módulo que o NSH não tem (`nsh/foo`) é um erro de build. O mesmo vale para um nome que seu código usa e que o módulo não exporta (`import { Buton } from "nsh/base"`): o erro aponta para o import e indica o export mais próximo (``did you mean `Button`?``). Nomes usados apenas como tipos são verificados por `nsh check`.

<a id="npm-packages"></a>

### Pacotes npm

O NSH não precisa de nada do npm, mas o bundler resolve imports simples a partir de um diretório `node_modules` se você instalar pacotes com um gerenciador de pacotes. Os pacotes resolvem seus builds para navegador, porque o runtime fornece APIs web (`fetch`, streams, `URL`, `TextEncoder`, ...) e não as do Node (`fs`, `Buffer`, `process`). Pacotes que mexem no DOM não funcionam: não há DOM.

Um pacote cujo build para navegador usa o DOM costuma ter outro build para workers ou React Native. `resolve.conditions` escolhe as export conditions com as quais os pacotes são resolvidos, no lugar do `["browser"]` padrão: `import`, `require`, `module` e `default` sempre se aplicam, e sem `browser` os pacotes são resolvidos pelos campos `module` e `main`. `resolve.alias` substitui um import: por um caminho relativo a `nsh.json` (`./` ou `../`), por outro pacote, ou por `false` para um módulo vazio. O TypeScript (`nsh check`, editores) tipa o import como escrito: um nome que não é um pacote instalado obtém seus tipos de um arquivo `.d.ts` do app.

```json
"resolve": {
  "conditions": ["worker"],
  "alias": { "dom-only-helper": "./shims/helper.ts", "node-polyfill": false }
}
```

```ts
// shims/aliases.d.ts
declare module "node-polyfill";
```

`solid-js` não pode ser importado: o bundler o recusa e aponta para `nsh`, `signal` e `computed` e `effect` do próprio NSH, que o substituem.

## Assets

Imagens e fontes são distribuídas com o app. Um crate Rust lê cada arquivo de seu diretório `assets/` em tempo de compilação com `asset!` e os distribui todos com `registry.assets(assets!())` em sua função `#[native_module]`; o TSX os importa como módulos, e o bundler registra cada arquivo importado (e as variantes de densidade de pixel de uma imagem). `nsh build` os copia para `.nsh/out/assets/`, `nsh package` os coloca no app, e durante o desenvolvimento eles são servidos ao app.

```rust tabs
use nsh_core::element::{FontAsset, ImageAsset, asset};

const LOGO: ImageAsset = asset!("logo@2x.png");      // its url, and its size: 64×64 points
const INTER: FontAsset = asset!("Inter.ttf");        // its uri, and its family: "Inter"

image(LOGO)
text("Hello").font_family(INTER.family)
```

```tsx tabs
import { Image, Text } from "nsh";
import logo from "./assets/logo@2x.png";   // { url: "asset:/assets/logo@2x.png", size: { width: 64, height: 64 } }
import Inter from "./assets/Inter.ttf";     // "Inter"

<Image src={logo} />
<Text style={{ fontFamily: Inter }}>Hello</Text>
```

| Extensão | O import retorna |
|---|---|
| `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.heic` | Um `ImageAsset`: `{ url, size, scales? }`, dimensionado em pontos. Um sufixo `@2x` / `@3x` divide o tamanho em pixels por 2 / 3. Um arquivo sem sufixo também distribui seus irmãos `@1.5x`–`@4x`, listados em `scales`, e a variante da tela é carregada ([densidades de pixel](./images-and-assets.md#pixel-densities)). |
| `.svg` | Um `ImageAsset` dimensionado em pontos pelos `width` e `height` do SVG (ou `viewBox`). |
| `.ttf`, `.otf`, `.woff`, `.woff2` | O nome da família da fonte, uma string. A fonte é registrada antes do primeiro frame. |
| `.json` | O JSON interpretado |

Veja [Imagens e assets](./images-and-assets.md) e [Fontes](./fonts.md).
<a id="generated-directories"></a>

## Diretórios gerados

- **`.nsh/`**: tudo o que o NSH gera: as declarações de tipos (`.nsh/types`), os códigos-fonte dos runners de um app Rust (`.nsh/rust`), o que `nsh run` instala em simuladores e dispositivos (o app host do Catalyst, o APK de desenvolvimento do Android) e `.nsh/out`, a saída padrão de `nsh build` (`bundle.js`, `bundle.js.map`, `bundle.nshc`, `capabilities.json`, `assets/`; para um app Rust, `app.json` e `assets/`) e de `nsh package` (`.app`, `.ipa`, `.apk`, um site); `-o` grava em outro local. Pode ser excluído com segurança; ele é recriado.
- **`target/`**: o diretório de build do Cargo para os crates e runners de um app (ou `CARGO_TARGET_DIR`).
