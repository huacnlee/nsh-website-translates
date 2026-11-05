---
title: "アプローチの比較"
description: "Native Shell を React Native、Flutter、Qt、GPUI、Slint、Electron、Tauri、さらにリリース後の UI 配信における Web ビューやサーバー駆動 UI と比較します。"
order: 2
group: start
source_hash: 80f11e255cf3463f
---

# アプローチの比較

NSH は、iOS、Android、macOS、Windows、Linux、Web 向けのアプリ全体を構築するためのフレームワークであり、リリース後にアプリへ配信される UI のランタイムでもあります。このページでは、まずアプリの開発に使われるクロスプラットフォームフレームワークと比較し、次に、アプリが出荷時には含まれていなかった UI を取り込む方法と比較します。緑はその機能が利用できること、黄はアプリ側の追加作業や別プロジェクトが必要なこと、赤は提供されていないことを表します。これらの印は機能の有無を示すもので、パフォーマンスを示すものではありません。バージョンは、執筆時点で各フレームワークが公開している最小要件です。お使いのリリースについては、あらためて確認してください。

凡例: <span class="status status--yes" role="img" aria-label="対応"></span> 対応 · <span class="status status--partial" role="img" aria-label="一部対応"></span> 一部対応 · <span class="status status--no" role="img" aria-label="非対応"></span> 非対応

<a id="cross-platform-frameworks"></a>

## クロスプラットフォームフレームワーク

| 機能 | NSH | React Native | Flutter | Qt 6 | GPUI | GPUI Fast | Slint |
|---|---|---|---|---|---|---|---|
| 描画方式 | プラットフォームのUI | プラットフォームのビュー | 独自エンジン | シーングラフ | 独自（GPU） | 独自（GPU） | 独自レンダラー |
| UIモデル | 保持モード | 保持モード | 保持モード | 保持モード | 即時モード | 即時モード + 保持モード | リアクティブ、保持モード |
| 言語 | Rust, TSX | JS, TS | Dart | C++, QML | Rust | Rust | Slint + Rust, C++ |
| iOS | <span class="status status--yes" role="img" aria-label="対応"></span> 15+ | <span class="status status--yes" role="img" aria-label="対応"></span> 15.1+ | <span class="status status--yes" role="img" aria-label="対応"></span> 15+ | <span class="status status--yes" role="img" aria-label="対応"></span> 17+ | <span class="status status--no" role="img" aria-label="非対応"></span> | <span class="status status--no" role="img" aria-label="非対応"></span> | <span class="status status--partial" role="img" aria-label="一部対応"></span> Rust |
| Android | <span class="status status--yes" role="img" aria-label="対応"></span> 9+ | <span class="status status--yes" role="img" aria-label="対応"></span> 7+ | <span class="status status--yes" role="img" aria-label="対応"></span> 7+ | <span class="status status--yes" role="img" aria-label="対応"></span> 9+ | <span class="status status--no" role="img" aria-label="非対応"></span> | <span class="status status--no" role="img" aria-label="非対応"></span> | <span class="status status--yes" role="img" aria-label="対応"></span> |
| macOS | <span class="status status--yes" role="img" aria-label="対応"></span> 14+ | <span class="status status--partial" role="img" aria-label="一部対応"></span> 別プロジェクト | <span class="status status--yes" role="img" aria-label="対応"></span> 12+ | <span class="status status--yes" role="img" aria-label="対応"></span> 13+ | <span class="status status--yes" role="img" aria-label="対応"></span> 12+ | <span class="status status--yes" role="img" aria-label="対応"></span> 12+ | <span class="status status--yes" role="img" aria-label="対応"></span> 13+ |
| Windows | <span class="status status--yes" role="img" aria-label="対応"></span> 10 1809+ | <span class="status status--partial" role="img" aria-label="一部対応"></span> 別プロジェクト | <span class="status status--yes" role="img" aria-label="対応"></span> 10+ | <span class="status status--yes" role="img" aria-label="対応"></span> 10 1809+ | <span class="status status--yes" role="img" aria-label="対応"></span> 10+ | <span class="status status--yes" role="img" aria-label="対応"></span> 10+ | <span class="status status--yes" role="img" aria-label="対応"></span> 10+ |
| Linux | <span class="status status--yes" role="img" aria-label="対応"></span> GTK 4.14+ | <span class="status status--no" role="img" aria-label="非対応"></span> | <span class="status status--yes" role="img" aria-label="対応"></span> Debian 10+ | <span class="status status--yes" role="img" aria-label="対応"></span> Debian 11+ | <span class="status status--yes" role="img" aria-label="対応"></span> Vulkan | <span class="status status--yes" role="img" aria-label="対応"></span> Vulkan | <span class="status status--yes" role="img" aria-label="対応"></span> |
| Web | <span class="status status--yes" role="img" aria-label="対応"></span> HTML | <span class="status status--partial" role="img" aria-label="一部対応"></span> ライブラリ | <span class="status status--yes" role="img" aria-label="対応"></span> Canvas | <span class="status status--yes" role="img" aria-label="対応"></span> Canvas | <span class="status status--no" role="img" aria-label="非対応"></span> | <span class="status status--no" role="img" aria-label="非対応"></span> | <span class="status status--yes" role="img" aria-label="対応"></span> Canvas |
| システムのテキスト | <span class="status status--yes" role="img" aria-label="対応"></span> | <span class="status status--yes" role="img" aria-label="対応"></span> | <span class="status status--partial" role="img" aria-label="一部対応"></span> | <span class="status status--partial" role="img" aria-label="一部対応"></span> | <span class="status status--partial" role="img" aria-label="一部対応"></span> | <span class="status status--partial" role="img" aria-label="一部対応"></span> | <span class="status status--partial" role="img" aria-label="一部対応"></span> |
| デバイスごとのUX | <span class="status status--yes" role="img" aria-label="対応"></span> | <span class="status status--partial" role="img" aria-label="一部対応"></span> | <span class="status status--partial" role="img" aria-label="一部対応"></span> | <span class="status status--partial" role="img" aria-label="一部対応"></span> | <span class="status status--no" role="img" aria-label="非対応"></span> | <span class="status status--no" role="img" aria-label="非対応"></span> | <span class="status status--partial" role="img" aria-label="一部対応"></span> |
| JSランタイムなし | <span class="status status--yes" role="img" aria-label="対応"></span> Rustアプリ | <span class="status status--no" role="img" aria-label="非対応"></span> | <span class="status status--yes" role="img" aria-label="対応"></span> | <span class="status status--partial" role="img" aria-label="一部対応"></span> C++ | <span class="status status--yes" role="img" aria-label="対応"></span> | <span class="status status--yes" role="img" aria-label="対応"></span> | <span class="status status--yes" role="img" aria-label="対応"></span> |
| 署名付き配信 | <span class="status status--yes" role="img" aria-label="対応"></span> | <span class="status status--partial" role="img" aria-label="一部対応"></span> OTA | <span class="status status--no" role="img" aria-label="非対応"></span> | <span class="status status--partial" role="img" aria-label="一部対応"></span> QML | <span class="status status--partial" role="img" aria-label="一部対応"></span> Shell | <span class="status status--partial" role="img" aria-label="一部対応"></span> Shell | <span class="status status--no" role="img" aria-label="非対応"></span> |
| ライセンス | Apache-2.0 | MIT | BSD-3-Clause | LGPL、GPL、商用 | Apache-2.0 | Apache-2.0 | GPL、商用 |

即時モードは毎フレーム UI の記述を作り直します。保持モードは UI の記述を保持し、変更があった部分だけを更新します。GPUI Fast はこの 2 つを GPUI 上で組み合わせたもので、GPUI が動作する環境で動作します。「Shell」は [GPUI Shell](https://gpui-kit.com/shell) を指します。

NSH は、これらすべてを併せ持つ唯一のフレームワークです。各プラットフォーム固有の UI とテキスト入力、1 つのアプリからのスマートフォン・デスクトップ・Web への展開(Web は HTML として)、JavaScript ランタイムを持たない Rust アプリ、そしてリリース後に配信される署名付きでサンドボックス化された UI を提供します。

<a id="what-the-rows-mean"></a>

### 各行の意味

- **描画方式、UIモデル。** NSH は各プラットフォームのネイティブなビューをマウントして保持します(保持モード)。変更があっても、更新されるのはその変更が及んだビューだけです。React Native も iOS と Android ではプラットフォームのビューをマウントします。Flutter、Qt Quick、GPUI、Slint は独自のレンダラーで描画します。GPUI は毎フレーム要素ツリーを構築し(即時モード)、[GPUI Fast](https://github.com/longbridge/gpui-fast) は変更のなかった部分を再利用します。
- **プラットフォーム。** NSH の最小要件は NSH 独自のものです([Platforms](./platforms.md))。それ以外は、[React Native 0.76](https://reactnative.dev/blog/2024/10/23/release-0.76-new-architecture)(iOS 15.1、Android 7 / API 24。macOS と Windows は別プロジェクトの react-native-macos と react-native-windows、Web は react-native-web ライブラリ経由)、[Flutter 3.47](https://docs.flutter.dev/reference/supported-platforms)、[Qt 6.10](https://doc.qt.io/qt-6.10/supported-platforms.html)、GPUI については [Zed の要件](https://zed.dev/docs/installation)、[Slint のプラットフォームガイド](https://docs.slint.dev/latest/docs/slint/guide/platforms/mobile/general/)(iOS は Rust から)に基づいています。「Canvas」は、フレームワークがページ上のキャンバスに描画することを意味します。NSH の Web アプリは CSS でスタイルされた HTML 要素であり、スクロール、選択、編集はブラウザが担います([Web](./web.md))。
- **システムのテキスト。** NSH のテキストフィールドは、プラットフォーム標準のエディタ(`UITextView`、`EditText`、`NSTextView`、GTK の `TextView`、ブラウザのもの)であり、システムの入力メソッド、選択ハンドル、編集メニューをそのまま利用できます。Windows では、NSH 独自のエディタが DirectWrite とシステムの入力メソッド(IMM32)と連携して動作します。React Native もプラットフォームのテキスト入力を使用します。自前で描画するフレームワークは、テキスト編集を自前で実装し、それをシステムの入力メソッドに接続します。
- **デバイスごとのUX。** NSH の基本コンポーネントはデバイスに合わせて動作します。たとえば同じ `Menu` が、ポインタ操作ではトリガーの位置に表示されるポップアップに、スマートフォンでは下から現れるシートになります。また `ContextMenu` は、右クリックまたは指の長押しで開きます。他のフレームワークでは、デバイスごとにインタラクションを調整する作業は、ほとんどがアプリ側の作業になります。
- **JSランタイムなし。** Rust アプリのランナーは、どのプラットフォームでも JavaScript エンジンをリンクしません。TSX は同じエンジン上で動作する 2 つ目の手段です。Qt Quick の QML は Qt の JavaScript エンジン上で動作しますが、C++ による Qt Widgets は動作しません。
- **署名付き配信。** NSH は、署名付きの `.nshpkg` パッケージを、信頼するキーと失効リストに照らして検証し、ホストが付与する制限と機能の範囲で、それぞれを VM 内で実行します([Signed packages](./signed-packages.md)、[Sandbox and capabilities](./sandbox-and-capabilities.md))。React Native のオーバージエアップデートは、信頼されたアプリのコードを配信するものです。Qt は QML ファイルを読み込めます。GPUI アプリは [GPUI Shell](https://gpui-kit.com/shell) を通じて JavaScript モジュールを取り込みます。

<a id="what-sets-nsh-apart"></a>

### NSH の特長

- **あらゆるプラットフォームで、2つの意味でネイティブ。** 各バックエンドは、そのプラットフォーム自身のビュー、テキスト、入力メソッド(UIKit、Android ビュー、AppKit、Direct2D を用いた Win32、GTK 4、HTML)の上に構築されており、各プラットフォーム固有のインタラクションもそのまま備わります。テキストの選択、入力メソッド、アクセシビリティはシステムのものであり、新しい OS リリースがそれらにもたらす改善は、アプリにも反映されます([Introduction](./index.md#what-native-means))。
- **1つのアプリで、スマートフォン、デスクトップ、Web に対応。** 6 つのプラットフォームが 1 つのフレームワークのバックエンドであり、レイアウトは状況に応じて再構成され、入力はデバイスに従います。Web では、アプリは HTML となり、静的サイトとして公開されます。
- **Rust ファーストで、JavaScript ランタイムは不要。** アプリ全体を最初から最後まで Rust で書き、Rust の型、スレッド、クレートを活かしてネイティブコードにコンパイルできます。TSX は、同じエンジン上で動作する 2 つ目の手段で、画面を素早く作りたい場合に使います([Building with Rust](./rust.md))。
- **日常的なアプリに向く保持ビュー。** チャット、フォーム、リスト、ドキュメントは、静止時にはほぼアイドル状態になります。変更によって更新されるのは、その変更が及んだビューだけだからです([Introduction](./index.md#retained-views))。
- **リリース後に配信される、署名付きでサンドボックス化された UI。** NSH で構築したアプリは、各プラットフォーム自身のツールで書かれたネイティブアプリも含め、チームが書いたものでも AI が生成したものでも、実行時に TSX モジュールを取り込めます([Dynamic UI](./index.md#dynamic-ui-and-ai-generated-ui))。
- **人にもエージェントにも使える 1 つのツールチェーン。** 1 つの `nsh` 実行ファイルで、すべてのターゲット向けにアプリの作成、実行、実機でのテスト、パッケージ化、署名ができます。

### React Native

React Native は、意図の面で最も近い存在です。どちらも、クライアント開発の重複作業を減らし、プラットフォームのビューを使います。React Native の中心は、React とそのパッケージエコシステムを用いた JavaScript または TypeScript で、対象は iOS と Android であり、デスクトップへの対応は別プロジェクトで提供されています。NSH の中心は Rust です。ランタイム、レンダラー、モジュールは Rust で書かれており、Rust はそれ自体がアプリの開発言語であり、TSX は 2 つある手段のうちの 1 つです。デスクトップと Web を含む 6 つのプラットフォームは、同じフレームワークのバックエンドです。

### Flutter

Flutter は独自のエンジンですべてのピクセルを描画するため、アプリはどのプラットフォームでも同じ見た目になります。NSH は逆の道を取ります。各プラットフォームのビュー、テキスト、テキスト入力を使い、Web では HTML 要素とブラウザ自身のスクロール、選択、入力を使います。テキスト編集、入力メソッド、選択は、プラットフォームごとに再実装されるのではなく、プラットフォームのものがそのまま使われます。
### Qt

Qt は、Qt Widgets と Qt Quick という 2 つの UI 技術を備え、長年の実績あるツールとプラットフォームサポートを持つ成熟したツールキットです。NSH は、その基盤とモデルが異なります。コア言語として Rust を使い TSX の経路も備えていること、自動化された (AI 駆動の) 開発のために設計されたツールチェーン、Web では HTML として描画すること、そしてモバイル、デスクトップ、Web のインタラクションを 1 つのコンポーネントモデルの中で適応させることです。

<a id="gpui-and-gpui-fast"></a>

### GPUI と GPUI Fast

[GPUI](https://gpui-kit.com) は GPU で描画する Rust 製の UI フレームワークで、負荷の高いデスクトップアプリ向けに作られています。[GPUI Fast](https://github.com/longbridge/gpui-fast) は Longbridge によるフォークで、変更のないビュー、レイアウト、テキスト計測を再利用する保持型レンダリングに加え、スクロールレイヤーとネイティブウィンドウの合成を備えています。NSH は各プラットフォームのビューの上に構築されるため、テキスト入力、選択、入力メソッド、システムとのインタラクションはプラットフォーム自身のものになり、スマートフォンや Web もカバーします。また、NSH の GPUI バックエンドは、GPUI や GPUI Kit のアプリに NSH アプリを埋め込みます ([GPUI](./gpui.md))。

この 2 つは得意な負荷が異なります。[NSH パフォーマンスベンチマーク](https://github.com/longbridge/nsh-perf-bench) (Linux、500 行の気配値テーブル、NSH は GTK 4 バックエンド) では、通常の負荷ではコストは同じです。毎秒 1,000 件の気配値では、NSH Rust は 1 コアの 18%、GPUI Fast は 20% を使用します。持続的で高密度な更新では GPUI Fast が優位です。毎秒 20,000 件の気配値では、NSH が 73～78% を使うのに対し GPUI Fast は 25% で済み、1,000 個のボックスのフレーム単位アニメーションでは、CPU 使用量は NSH の約 3 分の 1 です。

### Slint

Slint は、独自の言語と軽量なレンダラーを持つ宣言的 UI ツールキットで、デスクトップと組み込みデバイスを対象とし、Rust、C++、JavaScript、Python から利用できます。どちらもネイティブ性能を重視しますが、NSH のアプローチは、各プラットフォーム自身の UI とインタラクション、Web での HTML、アプリ言語としての Rust と TSX、そして 6 つのプラットフォームにわたる AI 駆動の開発です。

<a id="electron-and-tauri"></a>

### Electron と Tauri

Electron は Chromium をバンドルし、Tauri はシステムの Web ビューを使います。どちらも Web コンテンツからデスクトップアプリ (Tauri ではモバイルアプリも) を構築し、ブラウザのテキストと入力を使います。NSH は代わりに各プラットフォーム自身のビューを構築し、HTML は Web 自体でのみ描画します。

<a id="ui-delivered-after-release"></a>

## リリース後に配信される UI

出荷時には含まれていなかった UI (モデルが生成する回答、パートナーや他チームからの機能、リリースなしで変わる画面など) を必要とするアプリには、スマートフォンでもデスクトップでも、確立された選択肢がいくつかあります。それらは、何が UI を描画するか、配信されたコードに何が許されるか、それをホストするためにアプリのどれだけを変更する必要があるか、という点で異なります。

| 機能 | NSH | Web view | サーバー駆動 UI | ミニプログラム | OTA 更新 |
|---|---|---|---|---|---|
| 描画主体 | プラットフォームの UI | ブラウザエンジン | アプリのビュー | Web エンジン + レイヤー | フレームワークのレンダラー |
| ネイティブな見た目と挙動 | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> |
| 独自の状態、ロジック、レイアウト | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> |
| ホストのネイティブコンポーネント | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> ブリッジ | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> |
| ホストが設定するサンドボックス | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> 同一オリジン | <span class="status status--yes" role="img" aria-label="Yes"></span> スキーマ | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> |
| 署名付きで取り消し可能なパッケージ | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> |
| AI 生成 UI への適合性 | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> Web ページ | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--no" role="img" aria-label="No"></span> |
| ホストアプリへのコスト | 1 つのビューとライブラリ | ビューごとにブラウザエンジン | コンポーネントごとにレンダラー | コンテナ SDK | アプリ全体をフレームワークに載せる |

- **Web view (H5)。** ブラウザエンジン内のページです。HTML で表現できるものなら何でも実現でき、見た目はブラウザのもので、ネイティブコードへのブリッジは手書きです。
- **サーバー駆動 UI。** アプリがすでに出荷しているコンポーネントとアクションを組み替える JSON です。生成は容易ですが、スキーマが提供するもの以外のローカルな状態やロジックは持てません。
- **ミニプログラムコンテナ。** Web エンジン上のプラットフォーム固有のフレームワークと API を、大きなコンテナ SDK の中で動かします。
- **Over-the-air 更新** (たとえば React Native とコードプッシュサービスの組み合わせ)。フレームワーク全体を使えますが、更新は信頼されたアプリコードとして扱われ、アプリはそのフレームワークで書かれている必要があります。
- **NSH。** 独自の状態、ロジック、アニメーション、レイアウトを持つ TSX モジュールで、プラットフォーム自身の UI で描画され、ホストが登録したネイティブビューを使えます。アプリが検証する署名付きパッケージとして届き、メモリ、呼び出し時間、ノード数に制限のある独自の VM で実行され、ホストが許可したネットワークホスト、Web ページ、システム設定にのみアクセスできます ([サンドボックスとケイパビリティ](./sandbox-and-capabilities.md))。ホストはモジュールを表示する場所に 1 つのビューを追加するだけでよく ([プラットフォーム](./platforms.md#embed-in-a-native-app))、同じバンドルがすべてのプラットフォームで動作します。これが、[GPUI Shell](./index.md#native-shell-and-gpui-shell) と並んで NSH が存在する理由です。

<a id="when-another-option-fits-better"></a>

## 他の選択肢の方が適している場合

- 画面が、数千のビューの持続的で高密度な更新で占められている場合。たとえば毎秒数万件の気配値をストリーミングするマーケットデータ端末や、フレームごとに再描画されるカスタム可視化では、GPUI Fast の保持型 GPU レンダリングは CPU 使用量をごく一部に抑えられます ([GPUI と GPUI Fast](#gpui-and-gpui-fast) を参照)。
- アプリがすべてのプラットフォームでピクセル単位まで同一に見える必要がある場合。Flutter や Slint のように、すべてを自前で描画するフレームワークなら、設計上それが実現できます。
- 今すぐ大規模なサードパーティパッケージのエコシステムが必要な場合。React Native、Flutter、Qt には長年の蓄積があります。
- UI がドキュメントや既存の Web ページである場合。Web view ならそのまま表示できます。
- 画面の種類が固定されていて少なく、変わるのはコンテンツと順序だけの場合。サーバー駆動 UI ならランタイムはまったく不要です。

<a id="see-also"></a>

## 関連項目

- [はじめに](./index.md): NSH とは何か、そしてその中でネイティブが意味するもの。
- [アーキテクチャ](./architecture.md): NSH の内部で何がどこで動くか。
- [パフォーマンス](./performance.md): NSH が従うルールと、アプリの計測方法。
