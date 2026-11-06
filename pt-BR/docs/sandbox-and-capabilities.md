---
title: "Sandbox e Capabilities"
description: "Os limites sob os quais todo app NSH é executado (memória, tempo, nós), o hardening de linguagem das builds de release e as capabilities declaradas em nsh.json e concedidas por apps host."
order: 21
group: delivery
source_hash: 4659e6a8ee8e724e
---


# Sandbox e Capabilities

Um app escrito em Rust é código nativo compilado dentro do app que o distribui, assim como o resto desse app, e roda com a confiança dele. Suas chamadas aos serviços do NSH (`fetch`, imagens, web views, a barra de status) passam pelas mesmas verificações nativas que as de TSX, dentro do que o host concede. O TSX e o JavaScript que um app executa, seus próprios ou de um [pacote assinado](./signed-packages.md) que ele baixa, rodam em uma VM QuickJS por view, e tudo o que eles podem fazer fora dessa VM passa pelo runtime nativo do NSH. Isso torna possível executar código que você não escreveu, como mini apps de terceiros ou atualizações baixadas, sob regras controladas pelo app host:

- **Limites** restringem a memória, o tempo e os recursos nativos que um app pode usar.
- **Endurecimento** remove, em builds de release, as formas de transformar strings em código.
- **Capacidades** listam o que um app pode acessar: de quais hosts ele pode fazer fetch, quais páginas uma web view pode exibir, se ele pode alterar a barra de status. O app as declara; um app host pode conceder menos.

Um bundle contém apenas o código do app: o grafo reativo, o renderizador e todos os módulos que o app importa são nativos. Assim, nada em JS é confiável, e todo limite e toda verificação são aplicados em Rust; não há código JS que um app possa alterar para contorná-los.

<a id="limits"></a>

## Limites

Os limites restringem uma VM: aplicam-se a TSX e JavaScript. Um app embutido em outro app roda dentro de limites que o app host decide. Um app independente (empacotado com `nsh package`, inclusive para a web, ou executado com `nsh run`) é código seu, assim como um app nativo: ele usa a memória e o tempo que o dispositivo lhe dá, e sua pilha do interpretador de 4096 KB transforma recursão profunda em um `RangeError` que o app pode capturar.

Um app embutido tem estes limites:

| Limite | Padrão | Quando é atingido |
|---|---|---|
| Heap de JS | 256 MB | A VM para. |
| Pilha do interpretador | 4096 KB (também o máximo) | Recursão profunda lança um `RangeError`, que o app pode capturar. |
| Tempo para avaliar o bundle | 10 s | A avaliação é interrompida. |
| Tempo de qualquer outra chamada ao JS | 2 s | A chamada é interrompida; o app continua. |
| Nós mantidos | 200 000 | A VM para. |
| Alterações simultâneas (operações na fila) | 8 000 000 de valores | A VM para. |
| Operações em um desenho de canvas | 1 000 000 | A VM para. |

**O tempo é orçado por chamada, não por app.** Uma "chamada" é uma coisa que o runtime pede ao JS para fazer: tratar um evento (incluindo a renderização que ele causa), vincular uma linha de lista, executar um timer, executar os callbacks de `requestAnimationFrame` de um frame, esvaziar a fila de microtasks. Um app de longa execução nunca acumula tempo para um limite; apenas uma única chamada que não retorna a tempo é interrompida. Chamadas aninhadas dentro de outra compartilham o orçamento da chamada externa.

Uma chamada interrompida termina com uma exceção que nenhum `catch` consegue engolir, e o erro é reportado com o orçamento que foi excedido:

```text
the script was interrupted: a call into JS exceeded its budget of 2000 ms
```

A VM continua rodando: o próximo evento, timer ou frame executa normalmente.

**Ficar sem memória ou ultrapassar uma cota interrompe a VM.** O erro é reportado uma vez (ao tratador de erros do app host e, em builds de desenvolvimento, sobre o app), nenhum JS roda depois disso e as views permanecem como estavam. As cotas de nós e de operações existem porque as views nativas e as alterações na fila vivem na memória nativa, que o limite do heap de JS não cobre: sem elas, um app poderia esgotar a memória do dispositivo por meio da UI.

> [!TIP]
> Esses limites são generosos para apps normais. Se você atingir o orçamento de chamada de 2 s, o trabalho é longo demais para um único evento de qualquer forma: ele congelaria as atualizações do app por todo esse tempo. Divida-o com `setTimeout` ou tire-o do tratador de eventos.

Os apps host definem os limites por view: `NshAppView.limits` no [iOS](./ios.md#limits), `NshView.setLimits` no [Android](./android.md#limits), `AppOptions::limits` / `AppView::set_limits` em um [app GPUI](./gpui.md#embedding-in-a-gpui-app). Eles valem a partir do próximo carregamento.

Para ver em desenvolvimento o que um app TSX faz dentro dos limites de um app host, execute-o com [`--limits`](./cli.md#nsh-run): `nsh run App.tsx --limits` usa os padrões acima, e `nsh run --limits memory=128MB,call=500ms` define esses dois como um app host faria, mantendo os demais em seus padrões.

<a id="hardening"></a>

## Endurecimento

Os builds de release (tudo que não é carregado de um servidor de desenvolvimento) são endurecidos quando carregam:

- `eval` é removido, e os construtores `Function`, `AsyncFunction`, `GeneratorFunction` e `AsyncGeneratorFunction` lançam exceção. O NSH não executa código criado a partir de strings:

  ```text
  TypeError: the Function constructor is disabled: nsh runs no code from strings (development builds allow it)
  ```

- Os protótipos que todos os módulos compartilham (`Object`, `Array`, `Function`, `String`, `Number`, `Promise`, `Map`, typed arrays e o restante) são congelados, de modo que um módulo (ou uma biblioteca) não pode alterar `Array.prototype` para todos os outros. `Error.prototype` continua gravável, para que subclasses de erro possam definir `this.name`.

Congelar protótipos normalmente quebraria um padrão comum, o "override mistake": atribuir `Sub.prototype.constructor = Sub` ou `obj.toString = …` lança exceção quando a propriedade herdada está congelada. O NSH transforma os membros comumente sobrescritos (`constructor`, `toString`, `valueOf`, `toJSON`, ...) em accessors cujo setter define a propriedade no objeto ao qual a atribuição é feita, de modo que esse código (e bibliotecas como axios que o usam) continua funcionando.

Os bundles servidos por `nsh dev` / `nsh run` (com ou sem `--release`) não são endurecidos, então você pode depurar com `eval`. Teste o comportamento de release com `nsh test` (que endurece) ou com um build empacotado antes de distribuir código que depende de código dinâmico.

<a id="capabilities"></a>

## Capacidades

Um app declara o que pode acessar fora de sua VM em `nsh.json`:

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

**Um app sem `"capabilities"` pode fazer tudo**: um app independente é de seu próprio desenvolvedor, e nada é restringido. Sockets TCP brutos são concedidos por nome em todo app, por meio de `network.sockets`, e as funções do host por meio de `host`. **Um app com `"capabilities"` pode fazer apenas o que ele lista**: todo o resto é negado. Chaves desconhecidas são erros de build, de modo que um erro de digitação é detectado ao compilar, em vez de virar uma permissão ausente em tempo de execução. Um [pacote assinado](./signed-packages.md#packages-from-newer-versions-of-nsh) de um NSH mais novo pode declarar capacidades que um runtime mais antigo não conhece: elas não são concedidas nele.

### `network`

Cobre `fetch` (incluindo todo redirecionamento), WebSockets, imagens remotas (`<Image>`, `placeholder`, imagens de canvas, `Image.getSize` / `Image.prefetch`), fontes de vídeo e sockets TCP brutos (`net.connect`).

| Chave | Tipo | Descrição |
|---|---|---|
| `hosts` | `string[]` | Hosts que o app pode acessar com qualquer método e esquema (`http`, `https`, `ws`, `wss`). |
| `http` | `object[]` | Concessões mais precisas: um host, restringido por qualquer uma das chaves abaixo. |
| `http[].host` | `string` | O host ou padrão de host (obrigatório). |
| `http[].methods` | `string[]` | Métodos permitidos, como `["GET", "HEAD"]`. Ausente: qualquer um. |
| `http[].schemes` | `string[]` | Esquemas permitidos (`scheme`: um só, como string). Ausente: qualquer um entre `http`, `https`, `ws`, `wss`. |
| `http[].port` | `number` | A porta; uma URL sem porta usa o padrão do seu esquema (443 para `https`). Ausente: qualquer uma. |
| `http[].paths` | `string[]` | Caminhos exatos, como `["/v1/quote"]` (a query não faz parte do caminho). |
| `http[].pathPrefixes` | `string[]` | Prefixos de caminho que cobrem segmentos inteiros: `/v1` cobre `/v1` e `/v1/quote`, `/v1/` o que vem depois dele. `pathPrefix` (um só, como string) e `path_prefixes` são lidos da mesma forma. |
| `sockets` | `string[]` | Destinos TCP brutos para [`net.connect`](../modules/standard-modules.md), cada um um `"host:port"` exato (`"[::1]:9000"` para IPv6). |

Uma regra `http` cobre todos os caminhos quando não lista `paths` nem `pathPrefixes`, e, com ambos, um caminho que corresponda a qualquer um deles.

Os padrões de host são `*` (qualquer host), `*.example.com` (qualquer subdomínio de `example.com`, não o próprio `example.com`) ou um nome de host exato. A correspondência ignora maiúsculas e minúsculas e a porta. O host é obtido após o último `@`, de modo que `https://api.example.com@evil.io/` é verificado como `evil.io`.

Um handshake de WebSocket é um GET HTTP: `ws://` é verificado como `http://` e `wss://` como `https://`, de modo que os hosts e as concessões de `http` que permitem um GET da URL permitem o WebSocket. Um socket bruto ultrapassa todas as regras HTTP, então `sockets` lista cada host e porta exatamente, e somente `sockets` os concede.

URIs `asset:` (os arquivos do próprio app) são sempre permitidas; imagens e vídeos também podem usar URIs `data:` e caminhos relativos.

### `webview`

| Chave | Tipo | Descrição |
|---|---|---|
| `hosts` | `string[]` | Hosts que uma [web view](./web-view-and-video.md) pode exibir e para os quais pode navegar (`http` e `https`). Sem `webview`, o app não pode exibir páginas web. |
| `input` | `boolean` | A ref de uma web view pode dar à sua página entrada confiável ([`sendInput`](./web-view-and-video.md#input-as-the-users-own)). Nunca é concedida a menos que seja declarada, inclusive para um app sem `"capabilities"`. |

As navegações de nível superior dentro da web view também são verificadas, pelo delegate de navegação da plataforma, antes de carregarem. Os subrecursos da própria página (seus scripts, imagens, XHRs) são assunto do conteúdo web e não são verificados. `about:blank` e HTML inline (`html`) só precisam que as web views sejam concedidas: `"webview": { "hosts": [] }` os permite sem permitir nenhuma página remota.

`input` é separada de `hosts` porque a entrada confiável carrega ativação do usuário, que `injectJavaScript` nunca obtém: a página pode então abrir janelas, escrever na área de transferência, abrir o seletor de arquivos do sistema, iniciar WebAuthn ou prompts de permissão e pressionar qualquer botão que verifique `isTrusted`. Sem ela, o core descarta `sendInput` e registra no log qual chave adicionar.

### `statusBar`

`"statusBar": true` permite que o app altere a barra de status (o `statusBar` de páginas e diálogos em [`nsh/base`](../modules/nsh-base.md#status-bar), e o padrão `"statusBar"` de `nsh.json`).

### `clipboard`

`"clipboard": true` permite que o app leia e escreva na área de transferência do sistema ([`Clipboard`](../modules/nsh.md#clipboard)). Copiar pelo menu de edição de um texto selecionável é um ato do próprio usuário e não precisa de capacidade.

### `picker`

`"picker": true` permite que o app mostre o seletor de fotos do sistema ([`Picker`](../modules/nsh.md#picker)): o usuário escolhe o que chega ao app.

### `speech`

`"speech": true` permite que o app reconheça o que o usuário diz ([`Speech`](../modules/nsh.md#speech)): o microfone e o reconhecedor de fala do sistema, cuja transcrição chega ao app. O sistema ainda pergunta ao usuário uma vez.

### `openUrl`

Permite que o app abra URLs fora dele ([`openUrl`](../modules/nsh.md#openurl), os links de um `TextView` com `links="open"`): `"openUrl": true` para todos os esquemas, `"openUrl": { "schemes": ["https", "mailto"] }` para os esquemas listados. Uma URL cujo esquema não é concedido é rejeitada com `ERR_ACCESS_DENIED` (`permission` `"openUrl"`, `resource` a URL). URLs que executariam código ou alcançariam os dados do próprio app (`javascript:`, `data:`, `file:`, ...) nunca são abertas, seja qual for a capacidade.

<a id="storage"></a>

### Armazenamento

Todo app pode manter seus próprios dados no dispositivo com [`Storage`](../modules/nsh.md#storage), sem nenhuma capacidade: o armazenamento contém apenas os dados desse app, e o app que o embute decide onde eles são mantidos.

### `host`

`host` lista as funções do app que embute o NSH que o `host.call(name, args)` de `nsh` pode chamar: nomes exatos (`"getUserInfo"`) ou prefixos terminados em `*` (`"bridge.*"` corresponde a `bridge.call` e `bridge.share`). `"host": true` permite todas as funções. Uma função não listada é recusada, inclusive em um app sem `"capabilities"`: as funções do host nunca são concedidas por padrão, e compilar um app que importa `host` de `nsh` sem `host` emite um aviso de que toda chamada será recusada. Os nomes têm de 1 a 128 caracteres entre `A`–`Z`, `a`–`z`, `0`–`9`, `_`, `.`, `:` e `-`, sem `..`; a chamada de qualquer outro nome é recusada antes de as concessões serem lidas. Termine um prefixo com um separador (`"bridge.*"`): `"bridge*"` corresponde também a `bridgeAdmin`. Os eventos do host (`host.on(event, listener)`) chegam aos listeners do app como o host os envia.

```ts
import { host } from "nsh";

if (host.available()) {
  const user = await host.call("getUserInfo");
  const stop = host.on("loginChanged", (payload) => console.log(payload));
  stop();
}
```

`host.available()` é verdadeiro nas plataformas que embutem um host; nas demais, `host.call` é rejeitado com `code` `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"`.
<a id="what-a-refusal-looks-like"></a>

### Como é uma recusa

| Requisição | Resultado |
|---|---|
| `fetch` | A promise é rejeitada com um `TypeError`, como toda requisição que falha, cujo `code` é `ERR_ACCESS_DENIED`, `permission` `"network"` e `resource` a URL (a da requisição ou a do redirecionamento); a requisição nunca chega à rede. |
| `Image.getSize`, `Image.prefetch` | A promise é rejeitada com `ERR_ACCESS_DENIED`, `permission` `"network"` e `resource` a URL; a imagem nunca é requisitada. |
| Imagem remota, fonte de vídeo, fonte de web view ou `html` | Nada é exibido, e o `onError` do elemento o reporta com `code` `"ERR_ACCESS_DENIED"`. A navegação de uma web view para um host não concedido é cancelada e reportada da mesma forma. |
| Alteração da barra de status, imagem de canvas | Nada muda nem é desenhado; a recusa é registrada no log. |
| Área de transferência | Toda função de `Clipboard` é rejeitada com `ERR_ACCESS_DENIED`, `permission` `"clipboard"` e `resource` `""`; a área de transferência do sistema nunca é tocada. |
| Seletor | `pickImages` não mostra nada e rejeita com `ERR_ACCESS_DENIED`, `permission` `"picker"` e `resource` `""`. |
| Fala | `Speech.start` lança `ERR_ACCESS_DENIED`, `permission` `"speech"` e `resource` `""`; o microfone permanece desligado. |
| `openUrl` | A promise é rejeitada com `ERR_ACCESS_DENIED`, `permission` `"openUrl"` e `resource` a URL; nada é aberto. |
| Chamada ao host | `host.call` é rejeitada com `ERR_ACCESS_DENIED`, `permission` `"host"` e `resource` o nome da função (`host.post` lança o erro); a chamada nunca chega ao host. |
| Arquivos (`fs/promises`) | A promise é rejeitada com `ERR_ACCESS_DENIED`, `permission` `"fs"` e `resource` o caminho; o disco nunca é tocado. |
| Processos (`process`) | `run` é rejeitada, e `spawn` e `exit` lançam, com `ERR_ACCESS_DENIED`, `permission` `"process"` e `resource` o comando (`"exit"` para `exit`); nenhum processo filho é iniciado. |
| Socket TCP (`net.connect`) | A promise é rejeitada com `ERR_ACCESS_DENIED`, `permission` `"network"` e `resource` o `"host:port"`, antes de qualquer consulta DNS. |
| WebSocket | O `connect` do módulo `websocket` é rejeitado com `ERR_ACCESS_DENIED`, `permission` `"network"` e `resource` a URL; o `WebSocket` global dispara `error` e depois `close` (código 1006), como faz uma conexão que falha. |

Os erros dos [módulos padrão](../modules/standard-modules.md#failures) carregam `code` `"ERR_ACCESS_DENIED"`, de modo que um app distingue uma recusa de uma operação com falha, e seus `permission` e `resource` nomeiam a capacidade e o que foi solicitado. Os módulos de [`nsh`](../modules/nsh.md) recusam da mesma forma: suas promises são rejeitadas com `ERR_ACCESS_DENIED`, `permission` e `resource` (`fetch` com um `TypeError`, a classe de toda requisição que falha).

```ts
import { Clipboard } from "nsh";

try {
  await Clipboard.writeText(link);
} catch (error) {
  if (error.code !== "ERR_ACCESS_DENIED") throw error;
  console.warn(`${error.permission} is not granted`); // "clipboard"
}
```

Componentes Rust recebem as mesmas recusas nos termos do Rust: uma leitura da área de transferência recusada responde o que uma área de transferência vazia responde, uma seleção recusada não retorna arquivos, um `open_url` recusado `false` e um `fetch` recusado, um `Err` com a mensagem.

Cada recusa é registrada uma vez, indicando qual chave adicionar:

```text
fetch GET https://evil.example.org/x is not granted: add `evil.example.org` to capabilities.network in nsh.json
```

Os redirecionamentos são seguidos pelo NSH, não pela pilha HTTP da plataforma, então cada salto é verificado em relação às capacidades. (Um corpo de requisição em streaming não é enviado duas vezes, então um redirecionamento `307` / `308` de um upload em streaming falha.)

<a id="where-capabilities-travel"></a>

### Por onde as capacidades viajam

A declaração acompanha o app aonde quer que ele vá:

- `nsh build` e `nsh package` a gravam ao lado do bundle como `capabilities.json`;
- `nsh publish` a coloca no cabeçalho do [pacote assinado](./signed-packages.md), coberta pela assinatura;
- `nsh dev` a envia a cada build, de modo que o desenvolvimento aplica as mesmas regras. Alterar `capabilities` recarrega o app
  em vez de aplicar um hot-patch.

<a id="grants-what-a-host-app-allows"></a>

## Concessões: o que um app host permite

Um app host que incorpora o NSH pode conceder **no máximo** algumas capacidades, no mesmo formato JSON:

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

Uma requisição precisa ser permitida **tanto** pela declaração do app **quanto** pela concessão do host. Com a concessão acima, um app
que declara `"hosts": ["*"]` ainda só consegue acessar `api.example.com`, e não pode exibir páginas web nem alterar a barra de status.
Sem uma concessão (`nil` / `null`, o padrão), vale o que cada app declara.

As concessões valem a partir do próximo carregamento. Uma configuração típica para mini apps de terceiros: conceda a cada um apenas o seu próprio host de API, execute-o
a partir de um [pacote assinado](./signed-packages.md) cuja declaração você revisou e mantenha os limites padrão ou reduza-os.

> [!WARNING]
> Os [componentes nativos](./native-components.md) que o app host registra são código do próprio host: as capacidades não
> se aplicam a eles. Registre apenas componentes que sejam seguros para todo app que a view possa executar.

<a id="summary"></a>

## Resumo

| Camada | Aplicada por | Definida por |
|---|---|---|
| Limites (heap, pilha, tempo, nós) | o runtime, por VM | o app host por view (apps incorporados) |
| Endurecimento | o runtime, no carregamento | sempre ativo fora do desenvolvimento |
| Capacidades | o runtime (fetch, imagens, vídeo, web views, barra de status, arquivos, processos, sockets) | o app (`nsh.json`) e o app host (concessão) |
| Integridade do código | verificação de assinatura | `nsh publish`; as raízes confiáveis do app host |

<a id="see-also"></a>

## Veja também

- [Pacotes assinados](./signed-packages.md)
- [Rede](./networking.md)
- [Incorporação em apps iOS](./ios.md), [Incorporação em apps Android](./android.md)
