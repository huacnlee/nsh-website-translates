---
title: "Objetivos y principios de diseño"
description: "Los objetivos de Native Shell: vistas e interacción nativas, diseño propiedad de la app, componentes compartidos, y Rust y TSX en un mismo motor."
order: 1.5
group: start
source_hash: bad49295450504d6
---

Native Shell ofrece vistas e interacción nativas en iOS, Android, macOS, Windows, Linux y la web. La app es dueña de su diseño visual. Un único modelo de componentes sirve para apps completas, funciones incrustadas e interfaces entregadas dinámicamente.

<a id="native-foundations-app-owned-design"></a>

## Fundamentos nativos, diseño propiedad de la app

NSH se apoya en las vistas, el texto y la infraestructura de entrada de cada plataforma, y adapta la interacción al dispositivo: navegación con teclado, entrada con puntero y táctil, edición de texto, desplazamiento y accesibilidad ([Introducción](./index.md#what-native-means)).

La app define los colores, la tipografía, el espaciado, las formas, el feedback de estado y la animación. Una pantalla de ajustes puede seguir la marca de la app en iOS y Android, mientras que la entrada y la navegación siguen las convenciones de cada dispositivo. Los diseñadores refinan ese lenguaje visual mediante estilos y partes de los componentes.

Una vista nativa es la base de renderizado. Un control con estilo del sistema es una elección visual y de comportamiento concreta. Los controles comunes de NSH exponen comportamiento compartido y partes personalizables para que las aplicaciones puedan construir sus propios sistemas de diseño.

<a id="native-integration-in-practice"></a>

## Integración nativa en la práctica

La base nativa incluye renderizado, animación guiada por fotogramas, entrada y semántica de accesibilidad. En iOS y Android, [Input](../elements/input.md) usa los campos de texto de la plataforma: la plataforma se encarga de la edición, los menús de selección, los métodos de entrada y los servicios de autocompletado compatibles. La app describe el campo mediante `autoComplete`, por ejemplo `current-password` o `postal-code`, y el sistema ofrece las sugerencias disponibles según sus ajustes y servicios ([Formularios y teclado](./forms-and-keyboard.md)). Dar estilo al campo es compatible con mantener esta integración con el sistema.

Esto supone una diferencia arquitectónica respecto a dibujar un campo de texto por completo dentro de un renderizador propio: un renderizador propio aporta su propia integración con los servicios de edición y accesibilidad del sistema, mientras que NSH usa los controles de texto de la plataforma cuando su backend los proporciona. La documentación de cada backend define su integración, incluido el editor propio de NSH en Windows y el backend de incrustación GPUI ([Plataformas](./platforms.md)).

La separación que hace [GPUI Kit](https://gpui-kit.com) entre el comportamiento de los componentes y el diseño visual inspira las capas de NSH. NSH desarrolla ese principio apoyándose en la infraestructura de vistas y entrada de la plataforma. La integración nativa y el diseño propiedad de la app funcionan juntos en todo este modelo.

<a id="one-component-model-across-platforms"></a>

## Un modelo de componentes para todas las plataformas

Un interruptor significa lo mismo en un teléfono, en un escritorio y en la web. [`nsh/base`](../modules/nsh-base.md) proporciona estado, gestión de entrada, foco y accesibilidad; la app da estilo al track, al thumb y a los estados del [Switch](../elements/switch.md). Los botones, las casillas de verificación y los radios siguen el mismo principio.

| Responsabilidad | Ubicación | Ejemplo |
|---|---|---|
| Renderizado, layout, reactividad y entorno | `nsh-core`, `nsh` y módulos de runtime | Vistas, texto, signals, estilos |
| Comportamiento compartido y estructura accesible | `nsh-base`, importado como `nsh/base` en TSX | `Button`, `Checkbox`, `Switch`, `Tabs` |
| Diseño visual y componentes con estilo | La app o una biblioteca de la comunidad | Controles con marca, tarjetas, filas de formulario |
| Capacidades específicas de cada plataforma | `nsh/mobile`, `nsh/desktop` | Barra de navegación móvil, controles de ventana de escritorio |

Los controles comunes tienen un único hogar multiplataforma en `nsh/base`. Los módulos de plataforma se delimitan por propósito y por semántica de plataforma. [`TabBar`](../modules/nsh-mobile.md#tabbar) sirve a la navegación de primer nivel en móvil; [`Tabs`](../elements/tabs.md) cambia entre contenidos con pestañas en todas las plataformas. Sus funciones son distintas. `nsh/mobile` acepta capacidades con semántica de interacción específica de móvil; las diferencias en la apariencia, el tamaño, el tinte o la animación de un control común pertenecen a su componente compartido y al estilo de la app. Una notificación o un toast con un papel compartido debe diseñarse primero en torno a un único contrato multiplataforma, adaptando internamente la presentación.

Un componente compartido puede adaptar su interacción internamente: un menú se abre como popup en un escritorio y como sheet en un teléfono, mientras la app usa una sola API y aporta su apariencia. Las presentaciones gestionadas por el sistema, como las cabeceras de navegación y las alertas, siguen las reglas de presentación documentadas de cada plataforma. Las apps pueden exponer sus propios componentes y servicios nativos mediante las [interfaces de incrustación](./native-components.md).

<a id="the-unstyled-foundation-and-the-component-library-layer"></a>

## La base sin estilo y la capa de biblioteca de componentes

NSH es dueño de los primitivos y de la base sin estilo (`nsh-core` y `nsh-base`). Las aplicaciones y las bibliotecas de terceros son dueñas de la capa de biblioteca de componentes con estilo, el papel que desempeña `gpui-component` en [GPUI Kit](https://gpui-kit.com). Esta división da a cada producto control sobre su lenguaje visual mientras reutiliza las partes difíciles de la implementación de componentes.

La experiencia detrás de esta decisión proviene de [GPUI Kit](https://gpui-kit.com). Sus componentes con estilo surgieron del trabajo en Longbridge Pro. A medida que las aplicaciones necesitaban diseños cada vez más distintos, la presión de personalización llevó a los usuarios a hacer forks de los componentes. Extraer la base compartida en `gpui-base` hizo que el comportamiento fuera reutilizable en todos esos diseños. Los componentes con estilo siguen siendo útiles como referencia de diseño y para aplicaciones cuyas necesidades encajan en su superficie de personalización; la base da a las demás aplicaciones control directo sobre la presentación.

NSH aplica esta lección desde el principio. `nsh/base` es dueño del comportamiento complejo, la interacción, el estado reactivo, el foco, la accesibilidad y la presentación adaptativa, con pruebas en la capa que es dueña de cada comportamiento. Esto incluye estructuras mayores como [Dock](../elements/dock.md). Las aplicaciones construyen diseños diversos sobre esa base mediante estilos, estados, slots y partes. Las contribuciones de componentes siguen el mismo límite: los valores visuales por defecto y las variantes con marca pertenecen a los componentes de la aplicación o de terceros. Las presentaciones gestionadas por el sistema documentadas y los valores por defecto de lectura de `TextView` conservan sus contratos específicos ([Arquitectura](./architecture.md#three-layers)).

<a id="what-the-gallery-demonstrates"></a>

### Qué demuestra la Gallery

Las demos del sitio web y la Gallery son aplicaciones de ejemplo con estilo. Sus degradados, sombras, esquinas redondeadas, transiciones y movimiento ejercitan las capacidades de personalización de NSH y ofrecen ejemplos de código fuente. Esas decisiones pertenecen a las demos y a la Gallery; los componentes base reutilizables exponen el comportamiento y las partes que hay debajo. Las aplicaciones pueden tomar prestados los ejemplos o construir un lenguaje visual diferente.

Una biblioteca con estilo distribuida de forma independiente pertenecería a la capa de aplicación/comunidad descrita arriba. El estilo de la Gallery ilustra una dirección de diseño; su idoneidad para un producto concreto es una decisión de diseño de ese producto.

<a id="rust-and-tsx-on-one-engine"></a>

## Rust y TSX en un solo motor

Las apps en Rust, las pantallas en TSX y los proyectos mixtos comparten primitivos, componentes base, signals y layout. Rust aporta lógica de aplicación compilada y componentes nativos reutilizables. TSX permite iterar rápidamente y entregar módulos en tiempo de ejecución ([Compilar con Rust](./rust.md)).

El motor actualiza los bindings que dependen de signals modificados y agrupa las operaciones de vista por lotes. El layout de texto, las animaciones nativas y la entrada pertenecen al motor y a sus backends de plataforma ([Arquitectura](./architecture.md)). El rendimiento se evalúa con cargas de trabajo de aplicaciones reproducibles ([Rendimiento](./performance.md)).

<a id="embedding-dynamic-delivery-and-ai"></a>

## Incrustación, entrega dinámica e IA

Una app nativa existente coloca una vista de NSH donde corresponde una función y expone sus propios componentes nativos y servicios del host. Las apps independientes usan el mismo runtime y el mismo modelo de componentes ([Plataformas](./platforms.md)).

Los módulos TSX entregados dinámicamente son dueños de su estado, su lógica y su layout. Los paquetes firmados establecen en qué publicadores confía el host; los límites del sandbox y las capacidades definen lo que los módulos pueden hacer. El host decide tanto la confianza como los permisos ([Paquetes firmados](./signed-packages.md), [Sandbox y capacidades](./sandbox-and-capabilities.md)).

La interfaz generada por IA sigue ese contrato: se genera TSX a partir de las API declaradas, se comprueba y se prueba, se compila y firma el módulo, y después se verifica y se ejecuta bajo la política del host. Las declaraciones generadas, la documentación legible por modelos y las pruebas de la CLI hacen que el flujo de trabajo sea inspeccionable y repetible ([Pruebas y trazas](./testing-and-trace.md)).

<a id="how-these-goals-guide-additions"></a>

## Cómo guían estos objetivos las nuevas incorporaciones

1. Establece el comportamiento de usuario y si se comparte entre plataformas.
2. Coloca el comportamiento compartido en el primitivo o componente base existente, exponiendo estado y partes para la personalización de la app.
3. Coloca las capacidades con semántica específica de plataforma en su módulo de plataforma, documentando su aplicabilidad y su composición con la interfaz compartida.
4. Construye los componentes con estilo en la app o en la biblioteca de la comunidad.
5. Verifica el comportamiento, la accesibilidad, el layout y la entrada en las plataformas afectadas, y documenta el contrato público en ambos idiomas.

Estos principios mantienen flexible el diseño visual, coherentes las API de los componentes compartidos y explícita la integración con la plataforma a medida que NSH crece.
