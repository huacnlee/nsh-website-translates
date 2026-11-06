---
title: "If / Each"
description: "제어 흐름: If는 조건에 따라 분기를 렌더링하고, Each는 목록의 각 항목마다 키가 지정된 행을 렌더링합니다. Rust와 TSX를 모두 지원합니다."
order: 140
group: primitives
demo: el-control-flow
source_hash: f203fe49580cd892
---

# If / Each

`If` 및 `Each`는 어떤 요소가 존재할지를 결정하며, 조건부 콘텐츠와 반복 콘텐츠를 담당합니다. 자체 네이티브 뷰는 만들지 않습니다.
네이티브 렌더러는 변경된 부분만 업데이트합니다. `If`는 조건이 바뀌면 분기를 교체하고, `Each`는 목록을 다시 만들지 않고 키를 기준으로 행을 추가, 이동, 제거합니다. Rust에는 `nsh_core::prelude`에 `when(..)`, `each(..)`, `dynamic(..)`가 있고, TSX에는 import가 필요 없는 전역인 `<If>`와 `<Each>`가 있습니다.

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

TSX에서 이들은 전역입니다(스코프에 같은 이름의 바인딩이 있으면 그것이 우선합니다). JSX 표현식 안에서는 일반 JavaScript(`cond ? a : b`, `items.map(…)`)를 계속 사용할 수 있고, Rust에서는 `dynamic(move || ..)`을 사용할 수 있습니다. 이런 방식은 읽는 값이 바뀔 때마다 해당 요소를 다시 만들지만, `If` 및 `Each`(Rust에서는 `when` 및 `each`)는 유지되는 요소를 그대로 보존합니다.

## If

조건이 참인 동안에는 해당 분기를 렌더링하고, 그렇지 않으면 다른 분기를 렌더링합니다(없으면 아무것도 렌더링하지 않습니다).

| Prop | Rust | 타입 | 설명 |
|---|---|---|---|
| `when` | `when(cond, ..)` | `T` | 조건입니다. Rust에서는 값, 시그널 또는 클로저이고, TSX에서는 해당 값의 truthiness로 판단합니다. |
| `else` | `.otherwise(\|\| ..)` | `JSX.Element` | `when`이(가) 성립하지 않는 동안 렌더링됩니다. |
| `children` | `when(.., \|\| ..)` | `JSX.Element` \| `(value: () => NonNullable<T>) => JSX.Element` | `when`이(가) 성립하는 동안 렌더링됩니다. TSX에서 함수를 전달하면 `when` 값의 접근자(accessor)를 받습니다. |

조건이 바뀌어 특정 분기로 전환될 때 그 분기가 만들어지고, 다른 쪽으로 전환되면 그 분기가 만든 것은 제거됩니다. TSX의 `when`이(가) 하나의 truthy 값에서 다른 truthy 값으로 바뀌는 경우(`user()`이(가) 한 객체에서 다른 객체로 바뀌는 경우) 분기는 그대로 유지되며, 그 안의 표현식이 스스로 업데이트됩니다.

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

TSX에서 함수 자식은 `when`이(가) 전달한 값을 읽으며, 타입에 `null`나 `undefined`이(가) 포함되지 않으므로 분기에 `!`이(가) 필요 없습니다. Rust에서는 분기가 시그널을 직접 읽거나, `dynamic`이(가) 값을 요소로 매핑합니다.

```rust tabs
let user = signal(None::<User>);

dynamic(move || user.get().map(|u| text(u.name)))
```

```tsx tabs
const user = signal<User | null>(null);

<If when={user()}>{(u) => <Text>{u().name}</Text>}</If>;
```

## Each

목록의 각 항목마다 행을 렌더링합니다.

| Prop | Rust | 타입 | 설명 |
|---|---|---|---|
| `of` | `each(items, ..)` | `readonly any[] \| null \| undefined` | 항목들입니다. Rust에서는 `Vec`, 그 시그널, 또는 이를 반환하는 클로저입니다. `null`와 `undefined`은 아무것도 렌더링하지 않습니다. |
| `key` | `each(.., \|item\| key, ..)` | `(item: any) => unknown` | 항목의 식별자입니다. TSX의 기본값은 항목 자체입니다(객체는 참조, 원시 값은 값 기준). |
| `children` | `each(.., .., \|item, index\| row)` | `(item: () => any, index: () => number) => JSX.Element` | 한 행을 렌더링합니다. |

행 함수는 값이 아닌 **접근자(accessor)**를 받습니다. TSX에서는 `item()` 및 `index()`을, Rust에서는 `item.get()` 및 `index.get()`을 호출하세요(둘 다 `ReadSignal`입니다). 항목이 바뀌면 키가 그대로 남아 있는 행은 유지되고(위치가 바뀌었다면 이동됩니다), 해당 행의 항목과 인덱스가 업데이트되며, 이를 읽는 표현식만 다시 실행됩니다. 새로운 키에는 새 행이 만들어지고, 키가 사라진 행은 제거됩니다.

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

### Choosing a key

- 업데이트할 때마다 항목이 새 객체로 교체되는 경우(불변 업데이트, `{ ...t, done: true }`)에는 보통 id와 같은 `key`이(가) 필요합니다. 키가 없으면 새 객체마다 새 행이 되어 그 요소들이 다시 만들어집니다. Rust는 항상 키를 받습니다.
- TSX에서 문자열이나 숫자 배열은 값으로 비교되므로 키 없이도 동작합니다.
- 각 행은 자체 owner를 가집니다. 행 안에서 만든 effect와 cleanup은 행이 제거될 때 종료됩니다.

> [!NOTE]
> `Each` 및 `each`은 제네릭입니다. TypeScript는 `of`에서, Rust는 items에서 항목 타입을 추론하므로 행의 `todo()`와 `key` 매개변수에 타입 어노테이션이 필요 없습니다.

## Each or a list

`Each`은 모든 행을 생성합니다. 수십 개에서 수백 개 정도의 항목을 뷰나 [scroll view](./scroll.md)에 표시할 때는 이 방식이 적합합니다.
길거나 끝이 없는 데이터에는 [list](./list.md)를 사용하세요. 뷰포트 근처의 행만 생성하고 재활용합니다.

표현식이 업데이트되는 방식은 [JSX and components](../docs/jsx-and-components.md)와 [reactivity](../docs/reactivity.md)를 참고하세요.
