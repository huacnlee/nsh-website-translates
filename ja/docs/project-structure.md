---
title: "プロジェクト構造"
description: "RustまたはTSXで書かれたNSHアプリのファイル構成、nsh.jsonのすべてのキー、.nsh/types内のTypeScript設定、アセット、そしてモジュールとパッケージのインポート方法について説明します。"
order: 5
group: start
source_hash: 67da39e1182fc05c
---


# プロジェクト構造

NSH アプリは、`nsh.json` とそのコードを含むディレクトリです。コードは、`nsh.json` がルートコンポーネントを指定する Rust クレート、TSX のエントリモジュール、またはその両方です。それ以外のもの(追加のモジュール、画像、フォント、JSON ファイル)はすべてそこから辿って見つかります。クレートのモジュールと `assets/` ディレクトリ、あるいは TSX エントリがインポートするファイルが対象なので、管理すべきファイル一覧はありません。

Rust で書かれたアプリは Cargo プロジェクトです。

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

TSX アプリは、エントリとそれがインポートするモジュールで構成されます。

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

両方を使うアプリは、`"rust"` にクレートを列挙し、それらをインポートする TSX エントリを持ちます([Building with Rust](./rust.md#extending-a-rust-app-with-tsx))。

すべてのコマンドは、引数としてアプリのディレクトリまたはエントリを受け取ります(`nsh run my-app`、`nsh run my-app/App.tsx`)。`nsh.json` とエントリのディレクトリがアプリのルートです。`nsh.json` はそこから読み込まれ、アセットのパスはそこからの相対パスになり、`.nsh/` はそこに書き出されます。Rust アプリ(`nsh.json` `"root"`)では、ディレクトリを指定するとルートコンポーネントが実行されます。TSX エントリを指定した場合は、そちらが代わりに実行されます。

<a id="the-root-component"></a>

## ルートコンポーネント

Rust アプリのルートは、そのクレートのコンポーネントであり、`nsh.json` の `"root"` がクレート内のパスで指定します(`App`、`shell::Gallery`)。TSX エントリは、ルートコンポーネントのレンダリングで終わる通常のモジュールです。

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

`nsh run` と `nsh package` は、QuickJS を使わずに、すべてのプラットフォームで Rust のルートをマウントします。TSX では、`mount(component, props?)` がコンポーネントをアプリのサーフェスにレンダリングし、それを再び取り除く関数を返します。アプリが呼び出すのは 1 回だけです。エントリのトップレベルのコードは、バンドルの読み込み時、最初のフレームより前に実行されます。

## nsh.json

`nsh.json` はアプリのルートに置きます。`nsh init` は `name`、`id`、`version`、`build` を書き出し、Rust アプリの場合はクレートとそのルートコンポーネントも書き出します。

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

その他のキーはすべて任意です。TSX アプリでは、上の 4 つも省略できます。TSX アプリの `nsh.json` は次のようになります。

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

| キー | 型 | 使用するコマンド | 説明 |
|---|---|---|---|
| `name` | string | `package` | アプリアイコンの下に表示される名前。デフォルト: エントリディレクトリの名前。 |
| `id` | string | `package`、`publish`、`Storage` | 逆ドメイン形式のバンドル識別子 / アプリケーション ID。例: `com.yourcompany.app`。`package` と `publish` では必須です。`nsh run` は、これがない場合 `com.example.<name>` を使用します。 |
| `version` | string | `package`、`publish` | ユーザーに表示されるバージョン。例: `1.2.0`(`CFBundleShortVersionString`、Android では `versionName`)。 |
| `build` | number | `package`、`publish` | ビルド番号(`CFBundleVersion`、Android では `versionCode`)。署名付きパッケージでは、リリースごとに増加させる必要があります。 |
| `minRuntime` | string | `publish` | 署名付きパッケージを実行できる最小の NSH ランタイム。例: `0.2.0`。デフォルト: CLI のバージョン([Signed packages](./signed-packages.md#which-runtimes-run-a-package))。 |
| `icon` | string | `package` | 正方形の PNG。1024×1024 が理想です。`nsh.json` からの相対パス。 |
| `tailwind` | object | すべてのビルド | `class` 文字列が解決される Tailwind テーマを拡張します([Tailwind](./tailwind.md#theme))。 |
| `appearance` | string | すべてのビルド、`package` | `"light"`、`"dark"`、または `"system"`(デフォルト)。常にライトまたは常にダークのアプリは、ここで指定します。`colorScheme()`、`dark:` クラス、コンポーネントのテーマ、プラットフォームのコントロールは、起動時からこの設定に従います([Device and environment](./device-and-environment.md#dark-mode))。 |
| `theme` | string or object | すべてのビルド | アプリのデザイントークン(デフォルトの `neutral` テーマに対する shadcn/ui の `cssVars`)。トークンクラス、`token()`、Rust コンポーネントがこれを使って描画します。`nsh.json` からの相対パスで指定するテーマファイルのパス、またはインラインのテーマを指定します([Building with Rust](./rust.md#theme)、[Theme tokens](./tailwind.md#theme-tokens))。 |
| `statusBar` | object | すべてのビルド、`package` | すべてのページとダイアログの下にあるステータスバーのデフォルト(iOS と Android)。`{ "foreground": "auto" \| "light" \| "dark", "hidden": boolean }`、どちらも任意です。パッケージ化された iOS アプリでは、起動画面から表示されます([Status bar](../modules/nsh-base.md#status-bar))。 |
| `capabilities` | object | すべてのビルド | アプリが VM の外でアクセスできるもの。ネットワークホスト、Web ビューホスト、ステータスバー([Sandbox and capabilities](./sandbox-and-capabilities.md))。 |
| `resolve` | object | すべてのビルド | 裸のインポートの解決方法。npm パッケージのエクスポート条件とエイリアス([npm packages](#npm-packages))。 |
| `rust` | string or string[] | すべてのコマンド | アプリの Rust クレート、またはそのリスト。`nsh.json` からの相対パスで指定します。それらのコンポーネントとモジュールは、TSX から各クレートの `#[native_module]` 指定子でインポートされます([Building with Rust](./rust.md#several-crates))。 |
| `web` | object | `package` | Web パッケージがページに追加するもの。`web.host`: `nsh.json` からの相対パスで指定する、`createHost(player)` をエクスポートする JS モジュール。アプリの [`host`](../modules/nsh.md#host) 呼び出しに応答します。`web.connect`: そのモジュール自身のリクエストが到達するホストを `capabilities.network.hosts` のパターンで指定します。ページの Content-Security-Policy がこれを許可します([Web](./web.md#the-hosts-functions))。 |
| `root` | string | `run`、`package` | Rust アプリのルートコンポーネント。`rust` クレート内でのパスで指定し、リストの場合は最初のものです(`App`、`shell::Gallery`)。アプリのディレクトリに対する `nsh run` と `nsh package` は、QuickJS なしで、すべてのプラットフォームでこれをマウントします。`nsh run App.tsx` は引き続き TSX エントリを実行します([Building with Rust](./rust.md))。 |

`nsh package` と `nsh publish` のフラグ(`--name`、`--id`、`--app-version`、`--build`、`--icon`、`--min-runtime`)は、ファイルの値を上書きします([CLI](./cli.md))。

`tailwind`、`theme`、`appearance`、`statusBar`、`capabilities`、`resolve` は、アプリのビルド時に検査されます。タイプミスは、何も効果がないまま見過ごされる設定ではなく、ビルドエラーになります。

```text
error building App.tsx failed
nsh.json: tailwind: unknown theme key `colours`
```


### capabilities

`capabilities` キーがない場合、アプリはネットワーク、Web ビュー、ステータスバーを自由に使用できます。スタンドアロンアプリは、その開発者自身のものだからです。キーがある場合は、列挙されていないものはすべて、開発中もパッケージ化されたアプリでも拒否されます。

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

`network` は、`fetch`、リモート画像、動画ソースを対象とします。ローカルのアセットは常に許可されます。NSH を組み込むアプリは、アプリが宣言したものより少ない権限を付与することもできます。詳細は [Sandbox and capabilities](./sandbox-and-capabilities.md) を参照してください。

## tsconfig.json and .nsh/types

NSH は `node_modules` を必要としません。その代わりに、アプリをビルドするすべてのコマンド(`init`、`build`、`test`、`dev`、`run`、`package`、`publish`、`check`)が、NSH が提供するすべての TypeScript 宣言を `.nsh/types` に、NSH の TypeScript 設定を `.nsh/tsconfig.json` に書き出します。アプリの `tsconfig.json` はそれらを拡張します。

```json
{
  "extends": "./.nsh/tsconfig.json",
  "include": ["**/*.ts", "**/*.tsx"]
}
```

`.nsh/tsconfig.json` は、`nsh` のインポートとアプリのクレートを `.nsh/types` に向け、グローバル、アセット、トークンの宣言を含め、NSH アプリが使うコンパイラオプション(`lib`、`jsx`、`strict` など)を設定します。NSH はこれを最新の状態に保ちます。新しいバージョンがライブラリやパスを追加した場合、次のビルドでアプリに反映され、あなたが書いた `tsconfig.json` はそのまま残ります。`tsconfig.json` に追加したオプションは、NSH の設定より優先されます。

| `.nsh/types/nsh/` 内のファイル | 宣言する内容 |
|---|---|
| `index.d.ts` | `nsh`:`signal`、`computed`、`effect`、`mount`、`View`、`Text` など。以下の型も再エクスポートします |
| `types.d.ts` | スタイル(`ViewStyle`、`TextStyle` など)、すべての要素の props とイベント、ref(`ViewRef`、`InputRef` など。`ref` が受け取るもの) |
| `jsx-runtime.d.ts` | `jsxImportSource` を通じて TypeScript が解決する JSX ランタイム(`JSX` 名前空間) |
| `globals.d.ts` | `If` と `Each`、`console`、タイマー、`requestAnimationFrame`、`fetch`、その他の[グローバル API](../modules/globals.md) |
| `assets.d.ts` | 画像やフォントをインポートしたときに得られるもの |
| `tokens.d.ts` | `Tokens`: アプリの `"theme"` に由来するデザイントークン。[`token()`](../modules/nsh.md#token) の型になります |
| `mobile.d.ts`、`desktop.d.ts` | モジュールごとに 1 ファイル(`nsh/mobile`、`nsh/desktop`) |
| `base.d.ts` | `nsh/base` |

`lib` は、`DOM` のない `ES2023` です。`document` も `window` もありません。`.nsh` 内のファイルは再生成されます(内容が変わった場合のみ)。そのため、編集せず、コミットもしないでください。`.gitignore` はすでに `.nsh/` を除外しています。プロジェクトをクローンした後、エディタが `nsh` を見つけられないと表示する場合は、任意のビルドコマンドを一度実行してください。例: `nsh check`。

`.nsh/tsconfig.json` は `"ESNext.Disposable"` を追加します。これは `using` 宣言と、ランタイムが持つ `Symbol.dispose` を宣言します。`using account = new Account()` は、ブロックの終わりで [Rust クラス](./rust.md)の値を解放します。その `jsxImportSource: "nsh"` と `jsx: "preserve"` はエディタにとってのみ意味があります。`tsconfig.json` の内容にかかわらず、NSH は独自のコンパイラで JSX をコンパイルします。TypeScript の型は、エディタまたは `nsh check` が検査します。他のコマンドは、型を検査せずに取り除きます。

以前の `nsh init` で作成されたアプリは、自身の `tsconfig.json` が NSH のテンプレートのまま変更されていない場合、次のビルドで新しいものが適用されます。NSH はその旨を示す 1 行を出力します。変更した `tsconfig.json` はあなたのものとして扱われます。`nsh check` は、それが `./.nsh/tsconfig.json` を拡張していない場合に指摘します。その場合は、`extends` の行を追加し、それが設定するオプションを削除してください。

<a id="modules"></a>

## モジュール

Rust アプリのコードはそのクレートのモジュール(`mod screens;`)であり、依存関係は他のクレートと同様に crates.io から取得します。NSH 自身のクレートは `nsh-core`(プリミティブ、シグナル、型付きスタイル、`use nsh_core::prelude::*`)と `nsh-base`(基本コンポーネントとテーマ)です。

TSX では、アプリを好きなだけ `.ts` と `.tsx` のモジュールに分割し、相対パスでインポートできます。拡張子は省略できます。

```tsx
import { Header } from "./components/Header";
import { formatPrice } from "./lib/format";
import strings from "./strings.json";
```

すべてが 1 つのスクリプトにバンドルされます。JSON ファイルは、パースされた値としてインポートされます。

<a id="loading-code-on-demand"></a>

### コードのオンデマンド読み込み

アプリのモジュールの `import()` は、ブラウザと同様に、そのエクスポートの Promise を返します。

```tsx
const open = async () => {
  const { Settings } = await import("./screens/Settings");
  screen.set(() => Settings);
};
```

デバイス上のアプリは 1 つのバンドルとして配布されるため、モジュールはすでに存在し、Promise は即座に解決されます。分割して公開された Web アプリ(`nsh build --split`)では、そのモジュールと、それだけが使うものが別ファイルとして提供され、`import()` が最初に要求したときにダウンロードされます([Web](./web.md#split-bundles))。指定子はリテラルの相対パスでなければなりません。バンドラーが、どのモジュールを指しているかを判別できる必要があるためです。

<a id="nshs-modules"></a>

### NSH のモジュール

`nsh` と `nsh/...` のインポートはバンドルされません。ランタイムがネイティブに提供します。

| モジュール | 内容 |
|---|---|
| `nsh` | リアクティビティ(`signal`、`computed`、`effect` など)、`mount`、`split`、`context`。プリミティブ `View`、`Text`、`Scroll`、`Image`、`List`、`Canvas`、`WebView`、`Video`(テキスト選択のための `View` の `selectable`)。セーフエリアのインセット(`safeArea`、`safeAreaInsets`)とソフトウェアキーボード(`Keyboard`、`keyboardFrame`)。ネイティブアニメーション。`PanResponder`。環境(`platform`、`windowSize`、`colorScheme`、`fontScale`、`pixelRatio`、`locale`)。スクリーンリーダーとモーション低減の状態、アナウンス。クリップボード、フォトピッカー、ストレージ、ホストチャネル、キーボードショートカット。組み込み側のアプリが登録するコンポーネントと関数([リファレンス](../modules/nsh.md)) |
| `nsh/base` | アプリの UI のスタイルなしの基盤。ナビゲーションスタックとそのページ(`NavStack`、`NavPage`、`createNavStack`)、ダイアログ(`Dialog`)、押下ターゲット(`Button`)、テキスト入力(`Input`)、システムのアラートダイアログ(`AlertDialog`)。ページとダイアログはステータスバーを設定します(`statusBar`)([リファレンス](../modules/nsh-base.md)) |
| `nsh/mobile` | iOS と Android が持つもの: `TabBar`、`InputAccessoryView`(iOS)、`BackHandler`(Android)([リファレンス](../modules/nsh-mobile.md)) |
| `nsh/desktop` | macOS、Windows、Linux が持つもの: `Window`、`titleBar`、`Menu`([リファレンス](../modules/nsh-desktop.md)) |

[モジュールリファレンス](../modules/index.md)で、それぞれを説明しています。NSH にないモジュール(`nsh/foo`)をインポートすると、ビルドエラーになります。コードが使用している名前がモジュールにエクスポートされていない場合(`import { Buton } from "nsh/base"`)も同様です。エラーはインポートを指し示し、最も近いエクスポート名(``did you mean `Button`?``)を示します。型としてのみ使用される名前は、`nsh check` が検査します。

### npm packages

NSH は npm を必要としませんが、パッケージマネージャーでパッケージをインストールした場合、バンドラーは `node_modules` ディレクトリから裸のインポートを解決します。ランタイムが提供するのは Node の API(`fs`、`Buffer`、`process`)ではなく Web API(`fetch`、ストリーム、`URL`、`TextEncoder` など)であるため、パッケージはそのブラウザ向けビルドに解決されます。DOM に触れるパッケージは動作しません。DOM が存在しないためです。

ブラウザ向けビルドが DOM を使うパッケージには、ワーカーや React Native 向けの別のビルドがあることがよくあります。`resolve.conditions` は、デフォルトの `["browser"]` の代わりに、パッケージの解決に使うエクスポート条件を選びます。`import`、`require`、`module`、`default` は常に適用され、`browser` がない場合、パッケージは `module` と `main` フィールドを通じて解決されます。`resolve.alias` はインポートを置き換えます。置き換え先は、`nsh.json` からの相対パス(`./` または `../`)、別のパッケージ、または空のモジュールを表す `false` です。TypeScript(`nsh check`、エディタ)は、インポートを記述されたとおりに型付けします。インストール済みのパッケージではない名前の型は、アプリの `.d.ts` ファイルから取得されます。

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

`solid-js` はインポートできません。バンドラーはこれを拒否し、これに代わる `nsh` 独自の `signal`、`computed`、`effect` を案内します。

<a id="assets"></a>

## アセット

画像とフォントはアプリと一緒に配布されます。Rust クレートは、`assets/` ディレクトリの各ファイルを `asset!` でコンパイル時に読み込み、`#[native_module]` 関数内の `registry.assets(assets!())` でそれらすべてを配布します。TSX ではモジュールのようにインポートし、バンドラーはインポートされた各ファイル(および画像のピクセル密度バリアント)を記録します。`nsh build` はそれらを `.nsh/out/assets/` にコピーし、`nsh package` はアプリに組み込み、開発中はアプリに配信されます。

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

| 拡張子 | インポートで得られるもの |
|---|---|
| `.png`、`.jpg`、`.jpeg`、`.gif`、`.webp`、`.heic` | `ImageAsset`: `{ url, size, scales? }`。サイズはポイント単位です。`@2x` / `@3x` のサフィックスは、ピクセルサイズを 2 / 3 で割ります。サフィックスのないファイルは、`scales` に列挙された `@1.5x`〜`@4x` の兄弟ファイルも一緒に配布し、画面に合ったバリアントが読み込まれます([pixel densities](./images-and-assets.md#pixel-densities))。 |
| `.svg` | SVG の `width` と `height`(または `viewBox`)によってポイント単位でサイズが決まる `ImageAsset`。 |
| `.ttf`、`.otf`、`.woff`、`.woff2` | フォントのファミリー名(文字列)。フォントは最初のフレームの前に登録されます。 |
| `.json` | パースされた JSON |

[Images and assets](./images-and-assets.md) と [Fonts](./fonts.md) も参照してください。
<a id="generated-directories"></a>

## 生成されるディレクトリ

- **`.nsh/`**: NSH が生成するすべてのもの。型宣言 (`.nsh/types`)、Rust アプリのランナーのソース (`.nsh/rust`)、`nsh run` がシミュレータやデバイスにインストールするもの (Catalyst ホストアプリ、Android 開発用 APK)、そして `.nsh/out`。これは `nsh build` のデフォルトの出力先 (`bundle.js`、`bundle.js.map`、`bundle.nshc`、`capabilities.json`、`assets/`。Rust アプリの場合は `app.json` と `assets/`) および `nsh package` のデフォルトの出力先 (`.app`、`.ipa`、`.apk`、サイト) です。`-o` は別の場所に書き出します。削除しても問題なく、再生成されます。
- **`target/`**: アプリのクレートとランナーのための Cargo のビルドディレクトリ (または `CARGO_TARGET_DIR`)。
