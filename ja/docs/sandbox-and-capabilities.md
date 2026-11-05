---
title: "サンドボックスとケイパビリティ"
description: "すべての NSH アプリが動作する際の制限(メモリ、時間、ノード数)、リリースビルドにおける言語のハードニング、そして nsh.json で宣言されホストアプリによって付与されるケイパビリティについて説明します。"
order: 21
group: delivery
source_hash: 4659e6a8ee8e724e
---

# サンドボックスとケイパビリティ

Rust で書かれたアプリは、アプリのほかの部分と同様に、配布するアプリにコンパイルされるネイティブコードであり、そのアプリの信頼のもとで動作します。NSH のサービス(`fetch`、画像、Web ビュー、ステータスバー)への呼び出しは、ホストが許可する範囲で、TSX からの呼び出しと同じネイティブのチェックを通ります。アプリが実行する TSX と JavaScript は、自作のものでも、ダウンロードした[署名付きパッケージ](./signed-packages.md)のものでも、ビューごとに QuickJS VM で実行されます。VM の外で行えることはすべて NSH のネイティブランタイムを経由します。そのため、サードパーティのミニアプリやダウンロードした更新など、自分が書いていないコードを、ホストアプリが管理するルールのもとで実行できます。

- **制限(Limits)** は、1 つのアプリが使えるメモリ、時間、ネイティブリソースに上限を設けます。
- **ハードニング(Hardening)** は、リリースビルドで文字列をコードに変換する手段を取り除きます。
- **ケイパビリティ(Capabilities)** は、アプリが到達できる範囲を列挙します。fetch できるホスト、Web ビューが表示できるページ、ステータスバーを変更できるかどうかなどです。アプリが宣言し、ホストアプリはそれより少なく許可することもできます。

バンドルにはアプリのコードだけが含まれます。リアクティブグラフ、レンダラー、アプリがインポートするすべてのモジュールはネイティブです。そのため JS 内のものは何も信頼されず、すべての制限とチェックは Rust で強制されます。アプリがパッチを当ててそれらを回避できるような JS コードは存在しません。

<a id="limits"></a>

## 制限

制限は VM に対するもので、TSX と JavaScript に適用されます。別のアプリに埋め込まれたアプリは、ホストアプリが決める制限の範囲内で動作します。単独のアプリ(`nsh package` でパッケージ化したもの(Web を含む)、または `nsh run` で実行したもの)は、ネイティブアプリと同様に自分自身のコードです。デバイスが与えるメモリと時間を使い、4096 KB のインタープリタースタックにより、深い再帰はアプリがキャッチできる `RangeError` になります。

埋め込まれたアプリには次の制限があります。

| 制限 | デフォルト | 上限に達したとき |
|---|---|---|
| JS ヒープ | 256 MB | VM が停止します。 |
| インタープリタースタック | 4096 KB(最大値でもあります) | 深い再帰は `RangeError` をスローし、アプリはこれをキャッチできます。 |
| バンドルの評価時間 | 10 秒 | 評価が打ち切られます。 |
| JS へのそれ以外の呼び出しの時間 | 2 秒 | 呼び出しが打ち切られ、アプリは動作を続けます。 |
| 保持されるノード数 | 200 000 | VM が停止します。 |
| 一度に行える変更(キューされた操作) | 8 000 000 個の値 | VM が停止します。 |
| 1 回の canvas 描画での操作数 | 1 000 000 | VM が停止します。 |

**時間はアプリ単位ではなく、呼び出し単位で割り当てられます。** 「呼び出し」とは、ランタイムが JS に依頼する 1 つの処理です。1 つのイベントの処理(それによって発生するレンダリングを含む)、リストの 1 行のバインド、1 つのタイマーの実行、1 フレーム分の `requestAnimationFrame` コールバックの実行、マイクロタスクキューの消化などが該当します。長時間動作するアプリでも、時間が制限に向けて累積されることはありません。時間内に戻らない単一の呼び出しだけが中断されます。別の呼び出しの内側で行われる呼び出しは、外側の呼び出しの予算を共有します。

中断された呼び出しは、どの `catch` でも握りつぶせない例外で終了し、超過した予算とともにエラーが報告されます。

```text
the script was interrupted: a call into JS exceeded its budget of 2000 ms
```

VM は動作を続け、次のイベント、タイマー、フレームは通常どおり実行されます。

**メモリ不足やクォータ超過が起きると VM は停止します。** エラーは 1 回だけ(ホストアプリのエラーハンドラーに、開発ビルドではアプリ上にも)報告され、その後 JS は実行されず、ビューはそのままの状態で残ります。ノードと操作のクォータが存在するのは、ネイティブビューとキューされた変更がネイティブメモリ上にあり、JS ヒープの制限ではカバーされないためです。これらがなければ、アプリは UI を通じてデバイスのメモリを使い果たせてしまいます。

> [!TIP]
> これらの制限は、通常のアプリには十分に余裕があります。2 秒の呼び出し予算に達する場合、その処理はどのみち 1 つのイベントには長すぎます。その間、アプリの更新が止まってしまうからです。`setTimeout` で分割するか、イベントハンドラーの外に移してください。

ホストアプリは制限をビューごとに設定します。[iOS](./ios.md#limits) では `NshAppView.limits`、[Android](./android.md#limits) では `NshView.setLimits`、[GPUI アプリ](./gpui.md#embedding-in-a-gpui-app)では `AppOptions::limits` / `AppView::set_limits` を使います。設定は次回のロードから適用されます。

TSX アプリがホストアプリの制限内でどう動作するかを開発中に確認するには、[`--limits`](./cli.md#nsh-run) で実行します。`nsh run App.tsx --limits` は上記のデフォルトを使い、`nsh run --limits memory=128MB,call=500ms` はホストアプリと同じようにその 2 つを設定し、残りはデフォルトのままです。

<a id="hardening"></a>

## ハードニング

リリースビルド(開発サーバーからロードされないものすべて)は、ロード時にハードニングされます。

- `eval` が削除され、`Function`、`AsyncFunction`、`GeneratorFunction`、`AsyncGeneratorFunction` のコンストラクターは例外をスローします。NSH は、文字列から作られたコードを実行しません。

  ```text
  TypeError: the Function constructor is disabled: nsh runs no code from strings (development builds allow it)
  ```

- すべてのモジュールが共有するプロトタイプ(`Object`、`Array`、`Function`、`String`、`Number`、`Promise`、`Map`、型付き配列など)は凍結されます。これにより、1 つのモジュール(または 1 つのライブラリ)が、ほかのすべてのモジュールに影響する形で `Array.prototype` を変更することはできません。`Error.prototype` は書き込み可能のままなので、エラーのサブクラスは `this.name` を設定できます。

プロトタイプを凍結すると、通常は「オーバーライドの誤り(override mistake)」と呼ばれる一般的なパターンが動かなくなります。継承されたプロパティが凍結されていると、`Sub.prototype.constructor = Sub` や `obj.toString = …` への代入は例外をスローするためです。NSH は、よくオーバーライドされるメンバー(`constructor`、`toString`、`valueOf`、`toJSON` など)をアクセサーに変えています。そのセッターは、代入先のオブジェクト自身にプロパティを定義します。これにより、そのようなコード(およびそれを使う axios などのライブラリ)は引き続き動作します。

`nsh dev` / `nsh run`(`--release` の有無を問わず)が配信するバンドルはハードニングされないため、`eval` でデバッグできます。動的コードに依存するコードを出荷する前に、リリース時の動作を `nsh test`(ハードニングされます)またはパッケージ化したビルドでテストしてください。

<a id="capabilities"></a>

## ケイパビリティ

アプリは、VM の外で到達できる範囲を `nsh.json` で宣言します。

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

**`"capabilities"` のないアプリは、すべてを行えます。** 単独のアプリは開発者自身のものであり、何も制限されません。raw TCP ソケットは、どのアプリでも `network.sockets` を通じて名前で許可され、ホストの関数は `host` を通じて許可されます。**`"capabilities"` のあるアプリは、列挙したことだけを行えます。** それ以外はすべて拒否されます。未知のキーはビルドエラーになるため、タイプミスは実行時に権限が足りない問題になる代わりに、ビルド時に検出されます。より新しい NSH の[署名付きパッケージ](./signed-packages.md#packages-from-newer-versions-of-nsh)は、古いランタイムが知らないケイパビリティを宣言していることがあります。その場合、それらは許可されません。

### `network`

`fetch`(すべてのリダイレクトを含む)、WebSocket、リモート画像(`<Image>`、`placeholder`、canvas 画像、`Image.getSize` / `Image.prefetch`)、動画ソース、raw TCP ソケット(`net.connect`)を対象とします。

| キー | 型 | 説明 |
|---|---|---|
| `hosts` | `string[]` | アプリがあらゆるメソッドとスキームで到達できるホスト(`http`、`https`、`ws`、`wss`)。 |
| `http` | `object[]` | より細かい許可。ホストを、以下のキーのいずれかで絞り込みます。 |
| `http[].host` | `string` | ホストまたはホストパターン(必須)。 |
| `http[].methods` | `string[]` | 許可するメソッド(`["GET", "HEAD"]` など)。未指定の場合: すべて。 |
| `http[].schemes` | `string[]` | 許可するスキーム(`scheme`: 文字列で 1 つ)。未指定の場合: `http`、`https`、`ws`、`wss` のいずれも許可。 |
| `http[].port` | `number` | ポート。URL にポートがない場合は、そのスキームのデフォルト(`https` なら 443)として扱われます。未指定の場合: すべて。 |
| `http[].paths` | `string[]` | 完全一致のパス(`["/v1/quote"]` など)。クエリはパスに含まれません。 |
| `http[].pathPrefixes` | `string[]` | セグメント全体を対象とするパスのプレフィックス。`/v1` は `/v1` と `/v1/quote` を対象とし、`/v1/` はそれに続くものを対象とします。`pathPrefix`(文字列で 1 つ)と `path_prefixes` は同じ意味で読み取られます。 |
| `sockets` | `string[]` | [`net.connect`](../modules/standard-modules.md) 用の raw TCP の接続先。それぞれ完全一致の `"host:port"`(IPv6 では `"[::1]:9000"`)。 |

`http` ルールは、`paths` も `pathPrefixes` も指定されていなければすべてのパスを対象とし、両方がある場合はどちらかに一致するパスを対象とします。

ホストパターンは、`*`(任意のホスト)、`*.example.com`(`example.com` の任意のサブドメイン。`example.com` 自体は含みません)、または完全一致のホスト名です。照合では大文字小文字とポートは無視されます。ホストは最後の `@` の後ろから取り出されるため、`https://api.example.com@evil.io/` は `evil.io` として検査されます。

WebSocket のハンドシェイクは HTTP の GET です。`ws://` は `http://` として、`wss://` は `https://` として検査されるため、その URL の GET を許可する hosts と `http` の許可は、その WebSocket も許可します。raw ソケットはすべての HTTP ルールを越えて到達するため、`sockets` は各ホストとポートを正確に列挙し、それらを許可するのは `sockets` だけです。

`asset:` URI(アプリ自身のファイル)は常に許可されます。画像と動画では、`data:` URI と相対パスも使えます。

### `webview`

| キー | 型 | 説明 |
|---|---|---|
| `hosts` | `string[]` | [Web ビュー](./web-view-and-video.md)が表示およびナビゲートできるホスト(`http` と `https`)。`webview` がない場合、アプリは Web ページをまったく表示できません。 |
| `input` | `boolean` | Web ビューの ref が、そのページに信頼された入力を与えられるようにします([`sendInput`](./web-view-and-video.md#input-as-the-users-own))。宣言しない限り許可されません。`"capabilities"` のないアプリでも同様です。 |

Web ビュー内のトップレベルのナビゲーションも、読み込まれる前にプラットフォームのナビゲーションデリゲートによって検査されます。ページ自身のサブリソース(スクリプト、画像、XHR)は Web コンテンツ側の管理事項であり、検査されません。`about:blank` とインライン HTML(`html`)は、Web ビューが許可されてさえいれば利用できます。`"webview": { "hosts": [] }` は、リモートページを許可することなくこれらを許可します。

`input` が `hosts` とは別になっているのは、信頼された入力がユーザーアクティベーションを伴うためです。`injectJavaScript` にはそれが与えられません。ユーザーアクティベーションがあると、ページはウィンドウを開く、クリップボードに書き込む、システムのファイルパネルを開く、WebAuthn や権限のプロンプトを開始する、`isTrusted` をチェックするあらゆるボタンを押す、といったことができます。これがなければ、コアは `sendInput` を破棄し、追加すべきキーをログに出力します。

### `statusBar`

`"statusBar": true` は、アプリがステータスバーを変更できるようにします([`nsh/base`](../modules/nsh-base.md#status-bar) のページとダイアログの `statusBar`、および `nsh.json` の `"statusBar"` のデフォルト)。

### `clipboard`

`"clipboard": true` は、アプリがシステムのクリップボードを読み書きできるようにします([`Clipboard`](../modules/nsh.md#clipboard))。選択可能なテキストの編集メニューからのコピーはユーザー自身の操作であり、ケイパビリティを必要としません。

### `picker`

`"picker": true` は、アプリが写真用のシステムピッカーを表示できるようにします([`Picker`](../modules/nsh.md#picker))。アプリに渡るものは、ユーザーが選びます。

### `speech`

`"speech": true` は、アプリがユーザーの発話を認識できるようにします([`Speech`](../modules/nsh.md#speech))。マイクとシステムの音声認識を使い、その書き起こしがアプリに渡ります。システムは引き続き、ユーザーに 1 回確認します。

### `openUrl`

アプリが外部の URL を開けるようにします([`openUrl`](../modules/nsh.md#openurl)、`links="open"` を持つ `TextView` のリンク)。`"openUrl": true` はすべてのスキームを、`"openUrl": { "schemes": ["https", "mailto"] }` は列挙したスキームを許可します。スキームが許可されていない URL は `ERR_ACCESS_DENIED` で reject されます(`permission` は `"openUrl"`、`resource` は URL)。コードを実行したり、アプリ自身のデータに到達したりする URL(`javascript:`、`data:`、`file:` など)は、ケイパビリティにかかわらず決して開かれません。

<a id="storage"></a>

### ストレージ

どのアプリも、ケイパビリティなしで [`Storage`](../modules/nsh.md#storage) を使って自分のデータをデバイスに保存できます。ストレージにはそのアプリのデータだけが入り、保存場所は埋め込み側のアプリが決めます。

### `host`

`host` は、`nsh` の `host.call(name, args)` が呼び出せる、NSH を埋め込むアプリの関数を列挙します。完全一致の名前(`"getUserInfo"`)、または `*` で終わるプレフィックス(`"bridge.*"` は `bridge.call` と `bridge.share` に一致)を指定できます。`"host": true` はすべての関数を許可します。列挙されていない関数は、`"capabilities"` のないアプリでも拒否されます。ホストの関数がデフォルトで許可されることはなく、`nsh` から `host` をインポートするアプリを `host` なしでビルドすると、すべての呼び出しが拒否されるという警告が出ます。名前は 1〜128 文字で、`A`–`Z`、`a`–`z`、`0`–`9`、`_`、`.`、`:`、`-` の文字を使い、`..` を含みません。これ以外の名前の呼び出しは、許可を読み取る前に拒否されます。プレフィックスは区切り文字(`"bridge.*"`)で終えてください。`"bridge*"` は `bridgeAdmin` にも一致します。ホストのイベント(`host.on(event, listener)`)は、ホストが送信したとおりにアプリのリスナーに届きます。

```ts
import { host } from "nsh";

if (host.available()) {
  const user = await host.call("getUserInfo");
  const stop = host.on("loginChanged", (payload) => console.log(payload));
  stop();
}
```

`host.available()` は、ホストを埋め込むプラットフォームでは true です。それ以外では、`host.call` は `code` `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"` で reject されます。
<a id="what-a-refusal-looks-like"></a>

### 拒否はどのように見えるか

| リクエスト | 結果 |
|---|---|
| `fetch` | Promise は、失敗したすべてのリクエストと同様に `TypeError` で reject されます。その `code` は `ERR_ACCESS_DENIED`、`permission` `"network"` で、URL(リクエストの URL、またはリダイレクト先の URL)を `resource`。リクエストがネットワークに到達することはありません。 |
| `Image.getSize`, `Image.prefetch` | Promise は `ERR_ACCESS_DENIED` で reject されます。`permission` `"network"` で、URL を `resource`。画像がリクエストされることはありません。 |
| リモート画像、動画ソース、web view のソース、または `html` | 何も表示されず、その要素の `onError` が `code` `"ERR_ACCESS_DENIED"` で報告します。許可されていないホストへの web view のナビゲーションはキャンセルされ、同じ方法で報告されます。 |
| ステータスバーの変更、canvas の画像 | 何も変更されず、何も描画されません。拒否はログに記録されます。 |
| クリップボード | `Clipboard` のすべての関数が `ERR_ACCESS_DENIED`、`permission` `"clipboard"`、`resource` `""` で reject されます。システムのクリップボードには一切触れません。 |
| ピッカー | `pickImages` は何も表示せず、`ERR_ACCESS_DENIED`、`permission` `"picker"`、`resource` `""` で reject されます。 |
| 音声 | `Speech.start` は `ERR_ACCESS_DENIED`、`permission` `"speech"`、`resource` `""` を throw します。マイクはオフのままです。 |
| `openUrl` | Promise は `ERR_ACCESS_DENIED`、`permission` `"openUrl"` で reject され、URL を `resource`。何も開きません。 |
| ホスト呼び出し | `host.call` は `ERR_ACCESS_DENIED`、`permission` `"host"` で reject され、関数名を `resource`(`host.post` は throw します)。呼び出しがホストに到達することはありません。 |
| ファイル(`fs/promises`) | Promise は `ERR_ACCESS_DENIED`、`permission` `"fs"` で reject され、パスを `resource`。ディスクには一切触れません。 |
| プロセス(`process`) | `run` は reject され、`spawn` と `exit` は `ERR_ACCESS_DENIED`、`permission` `"process"` で throw します。コマンド(`exit` の場合は `"exit"`)を `resource`。子プロセスは起動しません。 |
| TCP ソケット(`net.connect`) | Promise は `ERR_ACCESS_DENIED`、`permission` `"network"` で reject され、`"host:port"` を `resource`。DNS 参照の前に拒否されます。 |
| WebSocket | `websocket` モジュールの `connect` は `ERR_ACCESS_DENIED`、`permission` `"network"` で reject され、URL を `resource`。グローバルな `WebSocket` は、接続に失敗した場合と同様に `error` に続いて `close`(コード 1006)を発火します。 |

[標準モジュール](../modules/standard-modules.md#failures)のエラーは `code` `"ERR_ACCESS_DENIED"` を持つため、アプリは拒否と操作の失敗を区別できます。また、その `permission` と `resource` は、要求された内容と対象の capability を示します。[`nsh`](../modules/nsh.md)のモジュールも同じ方法で拒否します。それらの Promise は `ERR_ACCESS_DENIED`、`permission`、`resource` で reject されます(`fetch` は `TypeError` を伴い、これは失敗したすべてのリクエストのクラスです)。

```ts
import { Clipboard } from "nsh";

try {
  await Clipboard.writeText(link);
} catch (error) {
  if (error.code !== "ERR_ACCESS_DENIED") throw error;
  console.warn(`${error.permission} is not granted`); // "clipboard"
}
```

Rust コンポーネントでは、同じ拒否が Rust の流儀で返されます。拒否されたクリップボードの読み取りは空のクリップボードと同じ結果を返し、拒否されたファイル選択は 0 件のファイルを返し、拒否された `open_url` は `false`、拒否された `fetch` はメッセージ付きの `Err` を返します。

各拒否は一度だけログに記録され、どのキーを追加すべきかが示されます。

```text
fetch GET https://evil.example.org/x is not granted: add `evil.example.org` to capabilities.network in nsh.json
```

リダイレクトはプラットフォームの HTTP スタックではなく NSH が処理するため、すべてのホップが capability に照らして検査されます。(ストリーミングされたリクエストボディは二度送信されないため、ストリーミングアップロードの `307` / `308` リダイレクトは失敗します。)

<a id="where-capabilities-travel"></a>

### capability の配布先

宣言はアプリとともにどこへでも移動します。

- `nsh build` と `nsh package` は、それをバンドルの隣に `capabilities.json` として書き出します。
- `nsh publish` は、それを[署名付きパッケージ](./signed-packages.md)のヘッダーに入れ、署名の対象にします。
- `nsh dev` は、ビルドごとにそれを送信するため、開発中も同じルールが適用されます。`capabilities` を変更すると、ホットパッチではなくアプリがリロードされます。

<a id="grants-what-a-host-app-allows"></a>

## 許可(Grants): ホストアプリが許可する範囲

NSH を組み込むホストアプリは、同じ JSON 形式で、capability を**最大でも**ここまで、と許可できます。

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

リクエストは、アプリの宣言とホストの許可の**両方**によって許可されている必要があります。上記の許可のもとでは、`"hosts": ["*"]` を宣言したアプリでも到達できるのは `api.example.com` だけで、Web ページの表示やステータスバーの変更はできません。許可がない場合(`nil` / `null`、デフォルト)は、各アプリの宣言がそのまま適用されます。

許可は次回のロードから適用されます。サードパーティのミニアプリでの一般的な構成は次のとおりです。各アプリには自身の API ホストだけを許可し、宣言を確認済みの[署名付きパッケージ](./signed-packages.md)から実行し、デフォルトの制限をそのまま使うか、より厳しくします。

> [!WARNING]
> ホストアプリが登録する[ネイティブコンポーネント](./native-components.md)はホスト自身のコードであり、capability は適用されません。ビューで実行されるすべてのアプリに対して安全なコンポーネントだけを登録してください。

<a id="summary"></a>

## まとめ

| レイヤー | 強制する主体 | 設定する主体 |
|---|---|---|
| 制限(ヒープ、スタック、時間、ノード) | ランタイム(VM ごと) | ホストアプリ(ビューごと。組み込みアプリの場合) |
| ハードニング | ランタイム(ロード時) | 開発時以外は常にオン |
| Capabilities | ランタイム(fetch、画像、動画、web view、ステータスバー、ファイル、プロセス、ソケット) | アプリ(`nsh.json`)とホストアプリ(grant) |
| コードの完全性 | 署名の検証 | `nsh publish`、ホストアプリの信頼するルート |

<a id="see-also"></a>

## 関連項目

- [署名付きパッケージ](./signed-packages.md)
- [ネットワーク](./networking.md)
- [iOS アプリへの組み込み](./ios.md)、[Android アプリへの組み込み](./android.md)
