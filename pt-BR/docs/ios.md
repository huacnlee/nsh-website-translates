---
title: "iOS"
description: "Execute aplicativos NSH em Rust e TSX no iOS com views UIKit, no simulador ou em dispositivos, empacote-os como .app e .ipa e incorpore-os em um aplicativo iOS existente com AppView ou com o NshAppView do NativeShell.xcframework."
order: 11
group: platforms
source_hash: d33e715d25f83ce4
---


# iOS

Os apps NSH são executados no iOS com views UIKit e texto CoreText, em dispositivos e no simulador, a partir do iOS 15.0. Apps completos são executados e empacotados como nas outras plataformas, e um app existente pode exibir apps NSH em suas próprias views, seja uma raiz Rust que ele vincula ou TSX que ele carrega, incluindo pacotes assinados que ele baixa, sob limites e capacidades que ele define. No iOS, `os()` é `Os::Ios` (`platform.os` é `"ios"` em TSX) e as props `ios={{…}}` do TSX se aplicam.

<a id="requirements"></a>

## Requisitos

- **Xcode** em um Mac, com um runtime de simulador iOS (`xcodebuild -downloadPlatform iOS` instala um). Veja
  [Instalação](./installation.md#ios-and-mac-catalyst).
- Os apps precisam do **iOS 15.0** ou posterior, em iPhone e iPad.

<a id="running-an-app"></a>

## Executando um app

Um app Rust é executado a partir de seu diretório; um app TSX indica seu ponto de entrada:

```sh
nsh run --target ios                                  # a Rust app
nsh run --target ios --device "iPhone 16 Pro"
nsh run App.tsx --target ios                          # a TSX app
```

`nsh` usa um simulador já iniciado ou inicia o iPhone mais recente. Para um app Rust, ele compila o runner do próprio app com o seu crate, o instala e mostra os logs no terminal; uma alteração no código Rust do crate o compila novamente e reinicia o app. Para um app TSX, ele instala o host de desenvolvimento e mantém o app atualizado conforme você salva, com os logs no terminal. `--device` escolhe um simulador por nome ou UDID. Para um ciclo mais rápido sem simulador, `nsh run --target catalyst` em um Mac abre o mesmo backend UIKit em uma janela do tamanho de um iPhone no [Mac Catalyst](./getting-started.md#mac-catalyst).

<a id="packaging"></a>

## Empacotamento

```sh
nsh package --target ios-simulator --run      # .nsh/out/<Name>.app, installed and launched in the simulator
nsh package --target ios --sign "Apple Distribution: Example Inc (ABCDE12345)" --profile AppStore.mobileprovision
```

A partir do diretório de um app Rust, o app é o runner iOS compilado com o seu crate; um app TSX indica seu ponto de entrada (`nsh package App.tsx --target ios-simulator --run`).

`--target ios` grava um `.ipa` assinado para dispositivos, TestFlight ou App Store. Identidades de assinatura, perfis de provisionamento e ícones: [Empacotamento](./packaging.md#ios-devices).

<a id="embedding-in-an-ios-app"></a>

## Incorporando em um app iOS

Um app iOS existente pode exibir apps NSH dentro de sua própria UI. Um app iOS com código Rust vincula o seu crate e o crate `nsh-platform-ios` e exibe a sua raiz em um `AppView` ([Incorporando um app Rust](#embedding-a-rust-app)). Um app Swift vincula `NativeShell.xcframework`, um framework com um módulo Swift: você cria um `NshAppView` (um `UIView`), o adiciona em qualquer lugar da sua hierarquia de views e carrega nele um app TSX ou um pacote assinado. Suas telas nativas, a navegação e o app NSH convivem lado a lado em uma única hierarquia UIKit.

Cada view é um engine independente; não há singletons globais, então um app pode exibir vários apps NSH ao mesmo tempo, por exemplo um por aba.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/host-app-light.svg" alt="One host app with two NshAppView regions: each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
<img class="diagram diagram-dark" src="/diagrams/host-app-dark.svg" alt="One host app with two NshAppView regions: each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
</div>

<a id="embedding-a-rust-app"></a>

## Incorporando um app Rust

`nsh_platform_ios::AppView` é um engine na forma de um `UIView` para um app iOS criado com Rust: ele monta o componente raiz do seu crate, sem nenhuma VM JavaScript envolvida.

```rust
use nsh_platform_ios::{set_ui_sets, AppView, Root, SurfaceOptions};
use objc2::MainThreadMarker;
use objc2_ui_kit::UIView;

fn show(container: &UIView) -> AppView {
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let mtm = MainThreadMarker::new().expect("main thread");
    let app = AppView::new(mtm, container.bounds(), SurfaceOptions::default());
    container.addSubview(app.view());
    app.run(Root::of::<my_app::App>());
    // Keep the AppView: dropping it stops the app.
    app
}
```

A view é redimensionada junto com sua superview. `AppView::run` substitui o que estava em execução; `AppView::load` executa um bundle TSX no lugar (`Bundle::source`, ou `unsafe { Bundle::bytecode(bytes) }` para um `bundle.nshc` no bundle do app). `SurfaceOptions` contém os limites, as capacidades concedidas, o diretório de dados e os componentes nativos, assim como os membros de `NshAppView` abaixo; `AppView::set_locale`, `set_font_scale` e `set_error_handler` correspondem a `locale`, `fontScale` e `onError`. `nsh package --target ios` cria esse tipo de app para você, com a sua raiz montada.

<a id="get-the-framework"></a>

## Obtendo o framework

A distribuição contém as duas variantes:

```text
dist/nsh/embed/ios/NativeShell.xcframework      release: bundles and signed packages
dist/nsh/embed/ios/NativeShellDev.xcframework   also connects to a `nsh dev` server
```

A partir de um checkout do NSH, você pode compilar apenas os frameworks:

```sh
cargo xtask ios-embed    # writes dist/nsh/embed/ios/{NativeShell,NativeShellDev}.xcframework
```

A compilação padrão produz frameworks estáticos. Para compilar frameworks dinâmicos, use:

```sh
cargo xtask ios-embed --dynamic
```

Frameworks dinâmicos dão ao runtime sua própria imagem de biblioteca e tabela de unwind, oferecendo suporte a apps host que já vinculam outros runtimes Rust. Escolha a configuração de incorporação do Xcode abaixo de acordo com o framework que você compilar.

Por padrão, cada XCFramework tem três slices arm64: dispositivos iOS, o simulador iOS (Apple silicon) e Mac Catalyst. O alvo de implantação mínimo é o iOS 15.0. O módulo Swift é compilado com library evolution, de modo que apps compilados com outras versões do compilador Swift podem importá-lo, e o framework vincula tudo de que precisa: você não adiciona nada mais.

<a id="add-it-to-an-xcode-project"></a>

## Adicionando a um projeto Xcode

1. Arraste `NativeShell.xcframework` (ou `NativeShellDev.xcframework` para builds de desenvolvimento) para **Frameworks, Libraries, and Embedded Content** do target do app. Escolha **Do Not Embed** para os frameworks estáticos padrão, ou **Embed & Sign** para frameworks dinâmicos compilados com `--dynamic`.
2. Em Swift, `import NativeShell`.
3. No `Info.plist` do app, defina `CADisableMinimumFrameDurationOnPhone` como `YES`: em iPhones com ProMotion, as animações do app passam a rodar a 120 Hz, como a rolagem (os apps criados por `nsh package` já têm isso).

> [!TIP]
> Vincule `NativeShellDev.xcframework` na configuração Debug e `NativeShell.xcframework` em Release, para que somente os builds de desenvolvimento possam se conectar a um servidor de desenvolvimento.

<a id="ship-a-bundle-with-the-app"></a>

## Distribuindo um bundle com o app

Um app Swift distribui apps TSX como bundles. Compile o app NSH em uma pasta e adicione essa pasta aos recursos do app como uma referência de pasta chamada `nsh`:

```sh
nsh build App.tsx --release --out MyApp/nsh
```

`nsh build` grava:

| Arquivo | Conteúdo |
|---|---|
| `bundle.nshc` | O app compilado para bytecode: o mais rápido de carregar. |
| `bundle.js` | O mesmo app como código-fonte JS. |
| `bundle.js.map` | Seu source map (os stack traces apontam para os seus arquivos `.tsx`). |
| `capabilities.json` | As [capacidades](./sandbox-and-capabilities.md) que o app declara, quando `nsh.json` tem alguma. |
| `assets/` | Imagens e fontes que o app importa, em seus caminhos relativos ao ponto de entrada. |

<a id="show-the-app"></a>

## Exibindo o app

```swift
import NativeShell
import UIKit

final class EmbedController: UIViewController {
    private let app = NshAppView()

    override func viewDidLoad() {
        super.viewDidLoad()
        app.translatesAutoresizingMaskIntoConstraints = false
        app.onError = { message in print("nsh error: \(message)") }
        view.addSubview(app)
        NSLayoutConstraint.activate([
            app.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            app.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            app.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            app.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])

        guard let url = Bundle.main.url(forResource: "bundle", withExtension: "nshc", subdirectory: "nsh") else { return }
        do {
            try app.loadBundle(at: url)
        } catch {
            print("cannot load: \(error)")
        }
    }

    // Let the embedded app's pages and dialogs decide the status bar.
    override var preferredStatusBarStyle: UIStatusBarStyle { NshAppView.preferredStatusBarStyle }
    override var prefersStatusBarHidden: Bool { NshAppView.prefersStatusBarHidden }
    override var preferredStatusBarUpdateAnimation: UIStatusBarAnimation {
        NshAppView.preferredStatusBarUpdateAnimation
    }
}
```

O tamanho da view é a janela do app: o NSH faz o layout do app nos limites da view e novamente sempre que eles mudam. Carregar novamente substitui o app em execução; o app é encerrado quando a view é desalocada.

O exemplo completo, um app UIKit que exibe um app NSH abaixo de seu próprio cabeçalho nativo, é `examples/embed-ios/main.swift`.

## `NshAppView`

`NshAppView` é uma subclasse de `UIView` isolada ao main actor.

| Membro | Descrição |
|---|---|
| `init(frame: CGRect = .zero, trace: Bool = false)` | Cria a view. `trace` registra no log o tempo de cada commit. `init?(coder:)` oferece suporte a storyboards e nibs. |
| `onError: ((String) -> Void)?` | Recebe os erros fatais do app (um bundle que falha ao carregar, exceções JS não capturadas, uma VM interrompida por um limite) na main thread. Os erros sempre são registrados no log; os builds de desenvolvimento também os mostram sobre o app. |
| `limits: NshLimits` | Os limites da VM dos apps carregados a partir de agora. |
| `grantCapabilities(_ json: String?) throws` | O máximo que os apps carregados a partir de agora podem fazer, como JSON no formato de `nsh.json` de `capabilities`; `nil` concede o que cada app declara. Lança `NshError` para JSON inválido. |
| `locale: Locale?` | O idioma e a região do app no lugar dos do usuário: `Intl`, `locale()` e os componentes o seguem imediatamente, e os apps carregados depois já começam com ele. `nil` segue o do sistema. |
| `fontScale: CGFloat?` | O tamanho de texto no lugar do de Dynamic Type (1 é o padrão): textos e inputs têm o layout refeito com ele e `fontScale()` o lê, imediatamente e para os apps carregados depois; os comprimentos mantêm seu tamanho. `nil` segue o do sistema. |
| `setThemeOverrides(_ json: String?) throws` | A marca do host sobre o [tema](./tailwind.md#theme-tokens) do app: um arquivo de tema no formato de `"theme"` de `nsh.json`. Seus tokens prevalecem sobre os do app de mesmo nome, nos modos claro e escuro, e os demais tokens do app permanecem. Aplica-se imediatamente e aos apps carregados depois; `nil` devolve ao app o seu próprio tema. Lança `NshError` para um arquivo que não pode ser interpretado. |
| `storageDirectory: URL?` | Onde os apps carregados a partir de agora mantêm seu [armazenamento](../modules/nsh.md#storage); `nil`: `Library/Application Support/nsh/<app id>`, pelo id do próprio app. |
| `cacheOptions: NshCacheOptions` | Onde os apps carregados a partir de agora mantêm seus caches, as [imagens que baixam](./images-and-assets.md#kept-on-disk), e quanto cada um mantém: `location` `.system` (`Library/Caches/nsh`, cada app em `<app id>`), `.directory(URL)` ou `.off`; `images` `.default` (256 MB), `.maxSize(megabytes:)` ou `.off`. |
| `loadBundle(at url: URL) throws` | Executa um bundle gerado por `nsh build`. Os assets vêm de `assets/` ao lado dele; `bundle.js.map` e `capabilities.json` ao lado dele também são lidos. |
| `run(_ package: NshPackage)` | Executa um pacote assinado verificado (veja abaixo). Um pacote é executado uma única vez. |
| `loadPackage(at:trust:) async throws -> NshPackage.Info` | Verifica o pacote em uma URL fora da main thread e depois o executa. Lança o motivo da recusa; o app em execução permanece. |
| `connectDevServer(_ url: URL) throws` | Desenvolvimento: carrega a partir de um servidor `nsh dev` e recarrega a cada alteração. Lança com `NativeShell.xcframework`, que não tem suporte a desenvolvimento. |
| `register(component:_:)` | Registra um [componente nativo](./native-components.md). |
| `params: [String: Any]` | Os parâmetros de inicialização dos apps carregados a partir de agora: o app os lê ao iniciar como `host.params` ([`host`](../modules/nsh.md#host)). |
| `send(_ name: String, _ data: Any? = nil)` | Envia um evento ao app (`host.on(name, …)`); mantido até que ele o escute, ou para o próximo app enquanto nenhum estiver em execução. |
| `handle(_ name: String, _ handler:)` | Trata as chamadas (`host.call`) e os posts (`host.post`) do app para `name` na main thread: `{ data, reply in … }`, ou uma função `async throws` `{ data in … }` cujo resultado responde à chamada. |
| `removeHandler(_ name: String)` | Remove o handler de `name`: as chamadas do app a ele falham imediatamente. |
| `static preferredStatusBarStyle`, `prefersStatusBarHidden`, `preferredStatusBarUpdateAnimation` | O que os apps em execução pediram (`statusBar` de suas páginas e diálogos, o padrão de `nsh.json`): retorne-os nos overrides do view controller de hospedagem. |

> [!IMPORTANT]
> `bundle.nshc` (bytecode) só é carregado de dentro do bundle do app. O QuickJS não valida bytecode, então bytecode vindo de qualquer outro lugar poderia corromper a memória: para um arquivo fora do bundle do app, carregue `bundle.js` (código-fonte JS) ou, melhor ainda, um [pacote assinado](./signed-packages.md).

`limits`, `grantCapabilities`, `storageDirectory` e `cacheOptions` valem a partir do próximo carregamento: defina-os antes de `loadBundle` / `run`.

Cada app mantém seu armazenamento sob o seu próprio id, sem nenhuma configuração: um pacote assinado sob o id que o certificado de sua chave de release atesta, um bundle sob o `id` de seu `nsh.json` (`app.json` ao lado dele, gravado por `nsh build`). Defina `storageDirectory` para manter os dados de um app em um local escolhido pelo host:

```swift
app.storageDirectory = FileManager.default
    .urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
    .appendingPathComponent("nsh/com.example.orders")
try app.loadBundle(at: url)
```

<a id="talking-to-the-app"></a>

## Conversando com o app

A view e o app que ela executa conversam por um canal próprio ([`host`](../modules/nsh.md#host)): parâmetros de inicialização que o app lê ao iniciar, eventos do app host, e chamadas e posts do app, com dados JSON (objetos Foundation deste lado). Ele não precisa de nenhuma view no app nem de nenhum componente nativo.

```swift
// Before loading: what the app opens first (`host.params` in TSX).
app.params = ["conversation": notification.conversationID]
try app.loadBundle(at: url)

// The app's `await host.call("user.profile", { id })`: return the answer, or throw to reject it.
app.handle("user.profile") { data in
    let id = (data as? [String: Any])?["id"] as? Int ?? 0
    let profile = try await api.profile(id: id)
    return ["id": id, "name": profile.name]
}

// A handler that answers later, from any thread, with its reply.
app.handle("photo.pick") { _, reply in
    picker.present { url in
        if let url { reply.resolve(url.absoluteString) } else { reply.reject("cancelled") }
    }
}

// The app's `host.post("analytics", …)`: no answer.
app.handle("analytics") { data, _ in analytics.log(data) }

// Later: the app hears `host.on("conversation.open", …)`.
app.send("conversation.open", ["id": tapped.conversationID])
```

Os handlers são executados na main thread; uma chamada espera pela resposta no app sem bloquear nenhum dos lados. Uma resposta liberada sem ter sido respondida faz a chamada falhar, e uma chamada de um nome sem handler falha imediatamente. Eventos de nomes que o app ainda não escuta são mantidos até que ele passe a escutar, e os eventos enviados enquanto nenhum app está em execução (antes de `loadBundle`, durante um reload) vão para o próximo, de modo que uma notificação tocada enquanto o app inicia ainda o alcança.
<a id="theme-overrides"></a>

## Sobrescrita de tema

Um app incorporado em vários apps host com marcas diferentes assume a marca de cada host: o host fornece os tokens que sua marca altera, como um arquivo de tema no formato de `"theme"` de `nsh.json` (`cssVars` do shadcn/ui, com valores como o CSS os escreve). Eles prevalecem sobre os tokens do app de mesmo nome; os demais tokens do app permanecem. Dê a um token o seu valor do modo escuro em `dark` (um conjunto definido apenas em `light` ou `theme` é aquela cor nos dois modos):

```swift
try app.setThemeOverrides("""
{ "cssVars": {
    "theme": { "radius": "0.75rem" },
    "light": { "primary": "#e11d48", "primary-foreground": "#ffffff" },
    "dark": { "primary": "#fb7185", "primary-foreground": "#1c1917" }
} }
""")
try app.loadBundle(at: url)
```

Chame-o antes ou depois de carregar: classes como `bg-primary` e `rounded-(--radius)` são reestilizadas imediatamente, e todo app carregado depois já começa com as sobrescritas em seu primeiro frame. `setThemeOverrides(nil)` devolve ao app o seu próprio tema.

<a id="links-the-app-opens"></a>

## Links que o app abre

As URLs que o app abre ([`openUrl`](../modules/nsh.md#openurl), os links de um `TextView` com `links="open"`) chegam primeiro a `onOpenURL`, na main thread: retorne `true` quando o app host tratou a URL, por exemplo roteando-a pelo seu próprio router, e `false` para que o sistema a abra com `UIApplication.open`. Sem `onOpenURL`, o sistema abre todas as URLs. As URLs chegam a ele depois que a capacidade `openUrl` do app as permitiu.

```swift
app.onOpenURL = { url in
    // The host app's own links open in the host app.
    if url.scheme == "lb" || url.host == "longbridge.com" {
        router.open(url)
        return true
    }
    return false
}
```

<a id="limits"></a>

## Limites

```swift
app.limits = NshLimits(memoryMB: 128, callBudget: 1, maxNodes: 50_000)
```

| Campo de `NshLimits` | Padrão | Significado |
|---|---|---|
| `memoryMB: UInt32?` | 256 | Heap JS em MB. Ficar sem memória interrompe o app. |
| `stackKB: UInt32?` | 4096 (também o máximo) | Pilha do interpretador em KB. Uma recursão mais profunda lança um `RangeError`. |
| `loadBudget: TimeInterval?` | 10 s | Tempo para avaliar o bundle. |
| `callBudget: TimeInterval?` | 2 s | Tempo de qualquer outra chamada para dentro do JS (um evento, um timer, um frame). Uma chamada que excede o tempo é interrompida. |
| `maxNodes: UInt32?` | 200 000 | Nós que o app pode manter. |

`nil` mantém o padrão. O que cada limite faz quando é atingido: [Sandbox e capacidades](./sandbox-and-capabilities.md).

<a id="capabilities"></a>

## Capacidades

Um app declara o que pode acessar em seu `nsh.json`; o app que o incorpora pode conceder menos. Uma requisição precisa ser permitida pelos dois:

```swift
try app.grantCapabilities("""
{
  "network": { "hosts": ["api.example.com", "*.cdn.example.com"] },
  "webview": { "hosts": ["help.example.com"] }
}
""")
try app.loadBundle(at: url)
```

Aqui o app não pode definir a barra de status (sem `statusBar`), mesmo que seu `nsh.json` a solicite. Detalhes: [Sandbox e capacidades](./sandbox-and-capabilities.md).

<a id="signed-packages"></a>

## Pacotes assinados

Para executar código que o app baixa (atualizações, mini apps de terceiros), use [pacotes assinados](./signed-packages.md): `nsh publish` grava um `.nshpkg` assinado por uma chave de release que a sua chave raiz certificou, e o app o verifica antes de executá-lo.

```swift
let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
let trust = try NshTrust(stateDirectory: support.appendingPathComponent("nsh"))
try trust.addRoot(rootPublicKey)   // the contents of root.pub from `nsh keygen`

Task {
    do {
        let info = try await app.loadPackage(at: downloadedFile, trust: trust)
        print("running \(info.id) \(info.version) (build \(info.build))")
    } catch {
        print("refused: \(error)")   // the running app stays
    }
}
```

Para verificar primeiro e executar depois, separe as duas etapas:

```swift
let package = try await trust.openPackage(at: downloadedFile)   // verifies off the main thread
// ... decide, ask the user, ...
app.run(package)
```

| API | Descrição |
|---|---|
| `NshTrust(stateDirectory: URL) throws` | Abre ou cria o trust store. Seu estado (a lista de revogação mais recente, o maior build aceito por app) persiste ali, e os assets dos pacotes são extraídos sob ele. Não confia em nenhuma chave até `addRoot`. Thread-safe. |
| `addRoot(_ publicKey: String) throws` | Confia em uma chave pública raiz (base64, o conteúdo de um arquivo `.pub`). Várias raízes podem ser confiadas. |
| `updateRevocations(_ json: String) throws` | Aplica uma lista de revogação gerada por `nsh revoke`, assinada por uma raiz confiável e mais nova do que a que o store possui. |
| `openPackage(at: URL) async throws -> NshPackage` | Verifica, extrai os assets e aceita o pacote (builds mais antigos desse app são recusados a partir de então). |
| `NshPackage.info` | `id`, `name`, `version`, `build` do app contido no pacote. |
| `NshError` | O erro que toda chamada que pode lançar exceção lança; `message` diz o motivo. |
<a id="development"></a>

## Desenvolvimento

Com `NativeShellDev.xcframework`, aponte a view para um servidor de desenvolvimento em vez de um bundle:

```swift
#if DEBUG
try app.connectDevServer(URL(string: "ws://127.0.0.1:8790/ws")!)
#else
try app.loadBundle(at: bundledURL)
#endif
```

Execute `nsh dev App.tsx` no seu Mac. O simulador compartilha a rede do Mac, então `127.0.0.1` alcança o servidor; um dispositivo usa o endereço de LAN que `nsh dev` imprime (`devices on this network: ws://192.168.1.20:8790/ws`). Cada salvamento atualiza o app no lugar, os logs aparecem no terminal `nsh dev` e os erros são exibidos sobre o app. Consulte [Servidor de desenvolvimento e depuração](./dev-server-and-debugging.md).

> [!NOTE]
> Em um dispositivo, a conexão com o seu Mac é tráfego comum de rede local, usando `ws://` simples e `http://` (assets).
> O iOS pode pedir ao usuário acesso à rede local, e as configurações de App Transport Security do app devem permitir isso.

<a id="notes"></a>

## Observações

- **Threads.** `NshAppView` é isolado ao main actor. `NshTrust`, `NshPackage` e `NshComponentContext` são thread-safe.
  O mecanismo de JS é executado em sua própria thread; a thread principal nunca espera por ele.
- **Barra de status.** As páginas e os diálogos do app incorporado (`statusBar`) alteram o que `NshAppView.preferredStatusBarStyle` e similares retornam;
  o view controller que hospeda deve encaminhá-los, como no exemplo acima.
- **Área segura.** Os apps usam `safe_area()` em Rust, e `env(safe-area-inset-*)` em padding ou
  `safeAreaInsets()` de [`nsh`](../modules/nsh.md#safe-area-and-keyboard) em TSX, como de costume. Um `NshAppView` posicionado abaixo do seu próprio cabeçalho recebe os insets que se aplicam a ele, não os da janela.
- **Mac Catalyst.** O mesmo framework funciona em apps Catalyst.

<a id="see-also"></a>

## Veja também

- [Compilando com Rust](./rust.md)
- [Incorporando em apps Android](./android.md)
- [Componentes nativos](./native-components.md)
- [Pacotes assinados](./signed-packages.md)
- [Sandbox e capacidades](./sandbox-and-capabilities.md)
