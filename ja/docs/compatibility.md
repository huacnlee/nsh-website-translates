---
title: "後方互換性"
description: "Native Shell がリリース間でアプリの動作を維持する仕組みについて説明します。互換性のあるリリースが保証する内容、その変更をすべて記録する nsh-compat の履歴、リリースの流れ、そして API の追加、名前変更、変更の方法を扱います。"
order: 22
group: delivery
source_hash: 431c24b579dd57ba
---

# 後方互換性

ホストアプリは NSH アプリを[署名付きパッケージ](./signed-packages.md)としてダウンロードし、プラグインとして実行します。出荷済みのアプリは二度とビルドされないかもしれません。開発チームは次の仕事に移り、ソースは業務プロセスの中に眠り、ホストアプリは独自のスケジュールで NSH を更新します。そのため Native Shell はすべてのアプリに対して次の約束を守ります。**互換性のあるリリース向けにビルドされたアプリは、以降のあらゆるリリースで変更なしに動作します。** NSH の更新後にアプリが動かなくなった場合、それは NSH のバグです。

このページでは、この約束の内容、約束をどのように強制するか、そして約束の範囲内で NSH を変更する方法を説明します。

<a id="what-an-app-can-rely-on"></a>

## アプリが依拠できるもの

この約束は、ビルド済みアプリが触れるすべてをカバーします。

| 対象 | 重要である理由 |
| --- | --- |
| すべてのモジュール(`nsh`、`nsh/*`、`nsh/base`、標準モジュール)のエクスポートとそのメンバー | バンドルは名前でインポートします。名前が欠けるとアプリは起動しません。 |
| `nsh:rt`、コンパイル済み JSX が呼び出す関数 | 各バンドルには、それをビルドしたコンパイラの出力が含まれています。 |
| グローバル(タイマー、`fetch`、`console` など)とそのメンバー | アプリは名前で呼び出します。 |
| 要素の props、イベントとそのペイロード、スタイルキーとその値 | アプリは名前で渡します。名前を変えた prop は無視され、アプリは誤動作します。 |
| Tailwind のユーティリティとバリアント | クラスは、バンドル内の文字列から実行時に解決されます。 |
| 振る舞い: デフォルト値、単位、ペイロード、コールバックの順序 | アプリは、作成時に確認した挙動に依拠しています。 |
| TypeScript の宣言(`.nsh/types`) | 古いアプリのソースは、チームがバグを修正するときにも型チェックを通ります。 |
| パッケージ形式とその署名 | 以前のリリース向けに署名されたパッケージは、引き続き検証に通ります。 |

約束を守るためのルールは次のとおりです。

1. **リリースが出荷したものは残ります。** モジュール、エクスポート、メンバー、prop、イベント、ペイロードキー、スタイルキーや値、Tailwind ユーティリティ、グローバル、`nsh:rt` 関数は、いずれも削除されません。
2. **名前を変更しても古い名前は残ります。** 古い名前は同じ実装のエイリアスとして、新しい名前を指す `@deprecated` を付けて永久に維持されます。エクスポートを別のモジュールへ移した場合も、古いモジュールに残します。
3. **型は広がる方向にのみ変更できます。** ユニオンには選択肢が加わり、関数にはオーバーロードや末尾のオプション引数が加わり、引数はオプションになります。アプリが渡すもの(props、スタイル、オプション)には、オプションのメンバーだけが加わります。アプリが読み取る値も同様に増えます。`platform.os` にはプラットフォームが加わり、状態や理由にはケースが加わります。アプリが以前に見たケースの値は変わりません。アプリは、未知の値を `switch` の `default` で処理します。

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
4. **振る舞いは維持されます。** 新しい振る舞いは、新しい prop、オプション、値によるオプトインで提供されます。
5. **`nsh:rt` は増える一方です。** 各関数はシグネチャと意味を保ちます。
6. **形式は永久に読み取られます。** 以前のリリースのパッケージ、証明書、失効リスト、`app.json` は、後のリリースでも読み取られます。パッケージは必要とする最低限のランタイムを明示します(`nsh publish --min-runtime`)。
7. **セキュリティは唯一の例外です。** 安全に維持できない機能は閉じられ、理由とともに一覧化され、リリースノートに記載されます。

この約束は、互換性ありと記録された最初のリリースから始まり、バージョン番号に関係なく永久に有効です。リリースの合間は、`main` にしかない API は変更されることがあります。

<a id="how-it-is-enforced"></a>

## どのように強制されるか

リリースが固定した内容は、NSH のコードとは別のリポジトリである [longbridge/nsh-compat](https://github.com/longbridge/nsh-compat) に保管されます。NSH への変更はこのリポジトリに対して実行され、これを編集することはできません。API の名前を変更するプルリクエストが、その API の記録まで書き換えることはできないということです。

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

NSH へのすべてのプルリクエストでは、そのチェックアウトに対して `nsh-compat` のチェックが実行されます(**Compat** ワークフロー、またはローカルでは `cargo xtask compat`)。

| チェック | 合格の条件 |
| --- | --- |
| `checkout_apps_run` | `tests/compat/` のアプリを、このチェックアウトでビルドしたものがスクリプトどおりに動作し、スクリプトが検証すると主張する API のすべての部分が実際に検証されていること。 |
| `nothing_released_is_removed` | 記録された各リリースが提供していたすべて(エクスポート、メンバーとその種別、宣言、Tailwind クラスとそれらが設定する内容)が、同じまま、または広がった形で今も提供されていること。 |
| `released_apps_run` | 記録された各リリースがビルドしたアプリが、当時のコンパイラでビルドされたままの状態でこのランタイム上で起動し、スクリプトどおりに動作すること。 |

最初のチェックは、現在書かれている API を検証します。残りの 2 つは、記録されたすべてのリリースを保護します。リリース済み API の名前を変更すると、次のように失敗します。

```
v0.2.0: runtime [nsh] Platform: removed
Keep it: a rename keeps the old name as a @deprecated alias of the new one, a type only widens.
```

`nsh-compat` は NSH のメンテナがレビューし、その CI は NSH の `main` に対してこれを実行します。

<a id="the-release-flow"></a>

## リリースの流れ

1. **開発。** API は `main` に追加され、`tests/compat/` にはそれを検証するスクリプトを持つケースが追加されます。リリースに記録されるまでは、名前の変更や形の変更が可能です。その場合はケースも一緒に変更します。
2. **記録。** リリース時に、`cargo xtask compat record <version>` が `releases/v<version>/` を `nsh-compat` のチェックアウトに書き込みます。書き込まれるのは、そのリリースが提供するサーフェスと、そのコンパイラでビルドされた `tests/compat/` のすべてのアプリ(スクリプト付き)です。記録されるのは、すべての部分がスクリプトで検証されている API のみです。
3. **固定。** 記録は `nsh-compat` のプルリクエストを通じてマージされます。以降、NSH へのすべての変更は、それ以前のすべての記録とともに、この記録に照らして検証されます。

<a id="developing-within-the-promise"></a>

## 約束の範囲内で開発する

<a id="adding-an-api"></a>

### API を追加する

新しいエクスポート、グローバル、prop、イベント、スタイルキーには、必ずケースを付けます。

1. その API を使い、結果を表示するコンポーネントをデフォルトエクスポートとするモジュール `tests/compat/cases/<domain>/<case>.tsx` を書きます。ドメインは `base`、`core`、`events`、`layout`、`paint`、`props`、`modules`、`web` です。これに加えて、特定のプラットフォームや `nsh.json` の設定によって決まる内容のために `android`、`macos`、`browser` があります。
2. そのケースを、ドメインの `App.tsx` に追加します。これは一度に 1 つのケースを表示します。
3. ドメインの `script.txt` にステップを追記します。まず `tap id:case-<case>`、次に API の動作を検証するステップ、そして追加する各部分に対する `covers <item>` ステップです。
4. `cargo xtask compat` を実行します(`NSH_COMPAT_APP=<domain>` は 1 つのドメインを実行します)。

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

`covers` ステップは検証されます。アプリがその項目を使用している必要があり、prop、イベント、スタイルキーの場合は、ビルド済みアプリからそれを取り除くとスクリプトのいずれかのステップが失敗しなければなりません。項目は `[<module>] <export>`、`[globals] <name>`、`[props] <name>`、`[events] <name>`、`[styles] <name>` のように指定し、コンポーネント固有のものは `[props] <Component>.<name>`、プラットフォームの props は `ios.<name>`、`android.<name>`、`desktop.<name>`、`web.<name>` のように指定します。

<a id="renaming-or-moving-an-api"></a>

### API の名前変更・移動

新しい名前を追加し、古い名前は同じ実装のエイリアスとして残します。エイリアスは新しい名前を指す `@deprecated` として宣言します。ケースとそのスクリプトは新しい名前に更新します。まだどのリリースにも記録されていない API は、単純に名前を変更できます。

<a id="changing-a-type"></a>

### 型の変更

型は広げます。ユニオンの選択肢を増やし、オーバーロードを増やし、末尾にオプション引数を加え、アプリが渡すものにはオプションの新しいメンバーを加えます。アプリが読み取るユニオンも同様に、新しいケースごとにメンバーを加えます。引数名は自由に変更できますが、引数の数、オプション性、型は維持します。

<a id="changing-behavior"></a>

### 振る舞いの変更

古い振る舞いは維持し、新しい振る舞いは新しい prop、オプション、値の背後に追加します。動作中のアプリから見える結果を変えるバグ修正も、振る舞いの変更です。オプトインの背後に置くか、どのアプリも古い結果に依拠できないことを確認してください。その振る舞いにはケース内のステップを用意し、今のまま保たれるようにします。

<a id="changing-the-compiler"></a>

### コンパイラの変更

追加の作業は不要です。各リリースのアプリは、そのリリースのコンパイラでビルドされたまま保たれ、ケースは現在のコンパイラで新しくビルドされます。コンパイラがバンドルに出力する関数(`nsh:rt`)は増える一方です。

<a id="closing-an-api-for-security"></a>

### セキュリティのために API を閉じる

`nsh-compat` のプルリクエストで、その `closed.txt` に理由(`<entry> -- <reason>`、チェックが報告するとおりのエントリ)を付けたエントリを追加し、これを先にマージします。その後、API を削除する NSH の変更が合格します。リリースノートには理由が記載されます。

<a id="scripts"></a>

## スクリプト

`script.txt` は 1 行に 1 ステップで記述します。動作を行うステップは `tap <selector>`、`type <selector> <text>`、`key <selector> <key>`、`scroll <selector> <x> <y>`、`touch start|move|end|cancel`、`event <selector> <onEvent>
[<key>=<value>...]`, `wait <ms>`, `keyboard <height> <duration>`, `pixelratio <ratio>` です。検証を行うステップは `expect <text>`、`absent <text>`、`frame <selector> <x> <y> <width> <height>`、`origin`、`prop` / `noprop`、`style` / `nostyle`、`listens`、`state`、`statusbar`、`log <text>` です。先頭の行では画面を設定できます: `viewport <w> <h>`、`platform <os> [desktop]`、`fontscale <scale>`。セレクタは `id:<testID>`、`label:<label>`、`text:<text>`、`span:<text>` のいずれかで、props とスタイルはアプリでの書き方と同じように記述します(`style id:card backgroundColor #3366ffff`)。`NSH_COMPAT_DUMP=1` は、各ステップが画面に追加・削除する内容を出力するので、スクリプトを書くときに役立ちます。

<a id="commands"></a>

## コマンド

```sh
cargo xtask compat                      # the checks against this checkout
NSH_COMPAT_APP=props cargo xtask compat -v
cargo xtask compat record 0.2.0         # at a release: record it in nsh-compat, then open a pull request there
```

`cargo xtask compat` は、`nsh-compat` のチェックアウトを `target/nsh-compat/` に保持し、実行のたびに最新の状態に更新します。独自の変更が加えられているチェックアウトはそのまま使用されるため、プルリクエストを出す前に、チェックの変更を NSH に対して試すことができます。
