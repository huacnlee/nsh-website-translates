---
title: "If / Each"
description: "Управление потоком: If отображает ветку по условию, Each отображает строку с ключом для каждого элемента списка, в Rust и TSX."
order: 140
group: primitives
demo: el-control-flow
source_hash: f203fe49580cd892
---

# If / Each

`If` и `Each` определяют, какие элементы существуют: условное и повторяющееся содержимое. Собственного нативного представления они не создают.
Нативный рендерер обновляет только то, что изменилось: `If` заменяет ветку, когда меняется её условие, а `Each` добавляет, перемещает и
удаляет строки по ключу, а не перестраивает весь список. В Rust есть `when(..)`, `each(..)` и `dynamic(..)` в
`nsh_core::prelude`; в TSX есть `<If>` и `<Each>`, это глобальные имена, которым не нужен импорт.

```rust tabs
use nsh_core::prelude::*;

view()
    .child(
        when(move || user.with(|u| u.is_some()), move || {
            text(move || format!("Hello, {}", user.with(|u| u.as_ref().map(|u| u.name.clone()).unwrap_or_default())))
        })
        .otherwise(|| text("Signed out")),
    )
    .child(each(todos, |t: &Todo| t.id, |todo, _index| text(move || todo.get().title)))
```

```tsx tabs
<View>
  <If when={user()} else={<Text>Signed out</Text>}>
    {(u) => <Text>Hello, {u().name}</Text>}
  </If>
  <Each of={todos()}>{(todo) => <Text>{todo().title}</Text>}</Each>
</View>
```

В TSX это глобальные имена (привязка с тем же именем в текущей области видимости заменяет их). Внутри JSX-выражений по-прежнему можно использовать
обычный JavaScript (`cond ? a : b`, `items.map(…)`), а в Rust — `dynamic(move || ..)`: такие конструкции создают свои элементы
заново каждый раз, когда меняется то, что они читают, тогда как `If` и `Each` (`when` и `each` в Rust) сохраняют элементы, которые остаются.

## If

Отрисовывает свою ветку, пока условие выполняется, иначе другую ветку (или ничего).

| Проп | Rust | Тип | Описание |
|---|---|---|---|
| `when` | `when(cond, ..)` | `T` | Условие: значение, сигнал или замыкание в Rust; в TSX проверяется его истинность. |
| `else` | `.otherwise(\|\| ..)` | `JSX.Element` | Отрисовывается, пока `when` не выполняется. |
| `children` | `when(.., \|\| ..)` | `JSX.Element` \| `(value: () => NonNullable<T>) => JSX.Element` | Отрисовывается, пока `when` выполняется. В TSX функция получает accessor значения `when`. |

Ветка создаётся, когда условие переключается на неё, а созданное ею удаляется, когда условие переключается обратно. Если `when` в TSX переходит от
одного истинного значения к другому (`user()` меняется с одного объекта на другой), ветка сохраняется, а выражения внутри
неё обновляются сами.

```rust tabs
let loading = signal(true);

when(move || !loading.get(), || profile())
    .otherwise(|| text("Loading…").text_color(rgb(0x6e7781)))
```

```tsx tabs
const loading = signal(true);

<If when={!loading()} else={<Text style={{ color: "#6e7781" }}>Loading…</Text>}>
  <Profile />
</If>;
```

В TSX дочерняя функция читает значение, которое передал `when`, без `null` или `undefined` в своём типе, поэтому ветке не нужен
`!`. В Rust ветка сама читает сигнал, либо `dynamic` преобразует значение в элементы:

```rust tabs
let user = signal(None::<User>);

dynamic(move || user.get().map(|u| text(u.name)))
```

```tsx tabs
const user = signal<User | null>(null);

<If when={user()}>{(u) => <Text>{u().name}</Text>}</If>;
```

## Each

Отрисовывает строку для каждого элемента списка.

| Проп | Rust | Тип | Описание |
|---|---|---|---|
| `of` | `each(items, ..)` | `readonly any[] \| null \| undefined` | Элементы: в Rust это `Vec`, сигнал с ним или замыкание, возвращающее его. `null` и `undefined` ничего не отрисовывают. |
| `key` | `each(.., \|item\| key, ..)` | `(item: any) => unknown` | Идентичность элемента. Значение по умолчанию в TSX: сам элемент (объекты сравниваются по ссылке, примитивы по значению). |
| `children` | `each(.., .., \|item, index\| row)` | `(item: () => any, index: () => number) => JSX.Element` | Отрисовывает одну строку. |

Функция строки получает **accessors**, а не значения: вызывайте `item()` и `index()` в TSX, `item.get()` и `index.get()` в
Rust (оба являются `ReadSignal`). Когда элементы меняются, строки, ключ которых сохранился, остаются (и перемещаются, если их позиция
изменилась); их элемент и индекс обновляются, и повторно выполняются только выражения, которые их читают. Для новых ключей создаются новые строки; строки,
ключа которых больше нет, удаляются.

```rust tabs
#[derive(Clone, PartialEq)]
struct Todo {
    id: u32,
    title: String,
    done: bool,
}

let todos = signal(Vec::<Todo>::new());

each(todos, |t: &Todo| t.id, |todo, index| {
    view()
        .flex_row()
        .gap_2()
        .child(text(move || format!("{}.", index.get() + 1)))
        .child(
            text(move || todo.get().title)
                .style_when(move || todo.get().done, |s| s.line_through()),
        )
})
```

```tsx tabs
interface Todo {
  id: number;
  title: string;
  done: boolean;
}

const todos = signal<Todo[]>([]);

<Each of={todos()} key={(t: Todo) => t.id}>
  {(todo, index) => (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <Text>{index() + 1}.</Text>
      <Text style={{ textDecorationLine: todo().done ? "line-through" : "none" }}>{todo().title}</Text>
    </View>
  )}
</Each>;
```

<a id="choosing-a-key"></a>

### Выбор ключа

- Элементам, которые заменяются новыми объектами при каждом обновлении (иммутабельные обновления, `{ ...t, done: true }`), нужен `key`, обычно это id.
  Без него каждый новый объект становится новой строкой, и её элементы создаются заново. В Rust ключ нужен всегда.
- В TSX массивы строк или чисел работают без ключа: они сравниваются по значению.
- У каждой строки свой владелец: эффекты и cleanups, созданные в строке, завершаются при её удалении.

> [!NOTE]
> `Each` и `each` являются обобщёнными: TypeScript выводит тип элемента из `of`, а Rust — из элементов, поэтому у строки `todo()` и
> параметр `key` типизируются без аннотаций.

<a id="each-or-a-list"></a>

## Each или список

`Each` создаёт каждую строку. Это подходит для десятков или нескольких сотен элементов в view или [scroll view](./scroll.md).
Для длинных или неограниченных данных используйте [list](./list.md): он создаёт строки рядом с видимой областью и переиспользует их.

О том, как обновляются выражения, см. [JSX и компоненты](../docs/jsx-and-components.md) и [реактивность](../docs/reactivity.md).
