---
title: "Avatar"
description: "Avatar 및 AvatarGroup 컴포넌트: 사람의 사진을 표시하며, 사진을 불러오는 중이거나 불러오지 못했거나 사진이 없을 때는 대체 콘텐츠를 보여 줍니다. 로딩 상태는 네이티브로 처리됩니다. 또한 처음 몇 개의 아바타만 보여 주고 나머지는 하나로 대신 표시하는 아바타 목록도 제공합니다."
group: base
demo: el-avatar
source_hash: 3ec5a888836ebb12
---

# Avatar

아바타는 사람의 사진을 보여줍니다. 팀 구성원, 댓글 작성자, 헤더의 계정 등이 그 예입니다. 사진이 로드되기 전, 로드에 실패했을 때, 사진이 없을 때는 폴백을 보여줍니다. 폴백은 그 사람의 `name` 이니셜이거나 앱 자체의 콘텐츠(아이콘)입니다. 아바타는 사진의 로딩 상태를 직접 관리하며, 이는 JavaScript 없이 이미지 자체의 load 및 error 이벤트로 네이티브하게 실행됩니다. 스크린 리더에는 사람의 이름이 레이블로 붙은 이미지로 전달됩니다. 외형은 앱이 정합니다. `Avatar` 에는 자체 크기, 모양, 색상, 글꼴이 없습니다. `AvatarGroup` 는 한 행의 처음 몇 개 아바타와 나머지를 대표하는 오버플로("+5")를 보여줍니다.

```rust tabs
use nsh_base::{avatar, theme};
use nsh_core::prelude::*;

fn author(name: &'static str, picture: &'static str) -> impl IntoElement {
    avatar()
        .src(picture)
        .name(name)
        .size(px(40.0))
        .image_style(|s| s.rounded_full())
        .fallback_style(|s| {
            s.rounded_full()
                .items_center()
                .justify_center()
                .bg(move || theme().muted)
                .text_color(move || theme().muted_foreground)
                .text_sm()
        })
}
```

```tsx tabs
import { mount } from "nsh";
import { Avatar } from "nsh/base";

function App() {
  return (
    <Avatar
      src="https://example.com/ada.png"
      name="Ada Lovelace"
      class="size-10"
      imageClass="rounded-full"
      fallbackClass="items-center justify-center rounded-full bg-muted text-sm text-muted-foreground"
    />
  );
}

mount(App);
```

[`nsh/base`](../modules/nsh-base.md)(Rust의 `nsh-base` 크레이트)에서 `Avatar` 및 `AvatarGroup` 를 제공합니다. Rust에서는 `avatar()` 및 `avatar_group()` 로 이들을 만들며, 속성마다 세터(`.src(..)`, `.fallback_delay(..)`)를 사용합니다. 아바타 자체에는 타입이 지정된 스타일 메서드를, 사진 위에 놓이는 요소에는 `.child(..)` 를 사용합니다.

## Props

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `src` | `.src(..)` | `string \| ImageAsset` | 없음 | 사진입니다. [`<Image>`](./image.md)의 `src` 가 받는 형식을 따릅니다. URL, `asset:/` 또는 `data:` URI, `blob:` URL(사용자가 고른 사진: `URL.createObjectURL(file)`), 또는 임포트한 이미지를 쓸 수 있습니다. 로드가 끝나면 표시되며, 빈 문자열은 사진이 없음을 뜻합니다. |
| `name` | `.name(..)` | `string` | 없음 | 사람의 이름입니다. 스크린 리더가 읽는 값이며, 앱이 `fallback` 를 전달하지 않으면 폴백에 표시되는 이니셜의 기준이 됩니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | `name` | `name` 보다 우선하여 스크린 리더가 읽는 값입니다. `""` 은 아바타를 장식용으로 만들어 스크린 리더에서 숨깁니다. |
| `fallbackDelay` | `.fallback_delay(..)` | `number` (ms) | `0` | 사진이 로드되는 동안 폴백을 표시하기 전에 기다리는 시간입니다. 빠르게 로드되는 사진이 폴백의 깜박임 없이 바로 표시되도록 합니다. `Infinity`: 로드 중에는 폴백을 표시하지 않고, 로드에 실패했거나 사진이 없을 때만 표시합니다. |
| `imageClass`, `imageStyle` | `.image_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 사진의 맞춤 방식, 반경, 모션입니다. |
| `fallbackClass`, `fallbackStyle` | `.fallback_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 폴백의 배경, 텍스트 색상, 크기, 그리고 콘텐츠 정렬 방식입니다. |
| `fallback` | `.fallback(..)` | `JSX.Element` | 이니셜 | 이니셜 대신 표시할 폴백 콘텐츠입니다. 이름이 없는 사람을 위한 아이콘이나 플레이스홀더 등이 해당합니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 사진 위에 표시되는 요소입니다. 접속 상태 점이나 배지 등이 해당합니다. 스크린 리더는 이 요소가 아니라 아바타의 레이블을 읽습니다([접근성](#accessibility) 참고). |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 아바타 자체의 크기와 모양입니다. |

| 이벤트 | Rust | 페이로드 | 설명 |
|---|---|---|---|
| `onStatusChange` | `.on_status_change(..)` | `{ status: AvatarStatus }` | 사진의 상태가 바뀌었습니다. `"idle"`(`src` 없음), `"loading"`, `"loaded"`, `"error"` 중 하나입니다. |

## Parts

| 파트 | 위치 | 스타일 지정 |
|---|---|---|
| 아바타 | | `class`, `style` |
| 폴백 | 아바타 안의 맨 앞, 아바타와 같은 크기. 사진이 로드되는 동안(`fallbackDelay` 이후), 로드에 실패했거나 사진이 없을 때 존재 | `fallbackClass`, `fallbackStyle`. 콘텐츠는 이니셜 또는 `fallback` |
| 사진 | 아바타 안, 폴백 위에 폴백을 채우며 배치 | `imageClass`, `imageStyle` |
| 앱의 콘텐츠 | 아바타 안의 맨 뒤 | 자체 요소(`children`) |

아바타에 크기를 지정하세요(`class="size-10"`). 폴백과 사진이 그 크기를 채우므로, 폴백이 사라져도 레이아웃이 다시 계산되지 않습니다. 사진은 처음부터 투명한 상태로 레이아웃에 배치되어 있다가 로드가 끝나면 불투명해지고, 그러면 폴백이 사라집니다. `imageClass` 에 `transition-opacity` 을 지정하면 페이드 인됩니다(모션 줄이기가 켜져 있으면 즉시 표시). 아바타를 클리핑하지 말고 사진과 폴백 각각을 둥글게 처리하세요(각각에 `rounded-full`). 그러면 가장자리에 놓은 접속 상태 점(`absolute bottom-0 right-0`)이 잘리지 않고 온전히 표시됩니다.

이니셜은 이름의 첫 두 단어의 첫 글자를 대문자로 만든 것입니다("Ada Lovelace"는 "AL"). 한 단어이면 처음 두 글자를 사용하며("huacnlee"는 "HU"), 대소문자가 없는 문자 체계의 이름은 첫 글자를 사용합니다("王小明"은 "王").

## Groups

```tsx
import { Text } from "nsh";
import { Avatar, AvatarGroup } from "nsh/base";

<AvatarGroup
  limit={3}
  total={members.length}
  accessibilityLabel={`${members.length} members`}
  class="flex-row"
  overflowClass="-ml-2 size-8 items-center justify-center rounded-full bg-muted ring-2 ring-background"
  overflowAccessibilityLabel={`${members.length - 3} more people`}
  overflow={<Text class="text-xs">{`+${members.length - 3}`}</Text>}
>
  <Each of={members.slice(0, 3)} key={(m) => m.id}>
    {(m, i) => <Avatar src={m().picture} name={m().name} class={i() > 0 ? "-ml-2 size-8" : "size-8"} />}
  </Each>
</AvatarGroup>
```

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `limit` | `.limit(..)` | `number` | `3` | 앞에서부터 이 개수만큼의 아바타만 표시하며, 나머지는 뷰를 만들지 않습니다. |
| `total` | `.total(..)` | `number` | 자식 수 | 앱이 앞쪽 일부만 전달할 때, 그룹이 대표하는 전체 인원 수입니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 스크린 리더가 그룹에 대해 읽는 값입니다. |
| `overflowClass`, `overflowStyle` | `.overflow_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 표시된 아바타 뒤에 오는 오버플로 파트입니다. |
| `overflow` | `.overflow(..)` | `JSX.Element` | 없음 | 표시되지 않은 사람들을 대표하는 내용("+5", "⋯")입니다. 그룹에 표시된 아바타보다 더 많은 인원이 있을 때 존재합니다. |
| `overflowAccessibilityLabel` | `.overflow_accessibility_label(..)` | `string` | 없음 | 오버플로의 내용 대신 스크린 리더가 읽는 값입니다. "+5"에 대해 "5 more people"처럼 쓸 수 있습니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 순서대로 나열된 아바타입니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 행의 방향(`flex-row`)과 간격입니다. |

겹침, 링, 오버플로의 모양은 앱이 정합니다. 첫 번째 이후의 모든 아바타에 음수 마진(`-ml-2`)을 주면 아바타가 겹쳐 쌓이고, 배경색의 링으로 서로 구분됩니다. 긴 목록의 경우 처음 `limit` 명과 `total` 를 전달하세요. 표시되는 아바타만 생성됩니다. 오버플로가 대표하는 수는 `total` 에서 표시된 아바타 수를 뺀 값이며, 표시된 아바타 수는 자식 수와 `limit` 중 작은 쪽입니다. 예를 들어 자식이 두 개인 `total={8}` 은 아바타 두 개와 "+6"을 표시합니다.

## Accessibility

- 아바타는 스크린 리더에 하나의 이미지로 전달되며, `accessibilityLabel` 또는 `name` 이 레이블이 됩니다. 이름은 한 번만 읽힙니다. 폴백과 사진은 스크린 리더에서 숨겨지므로 이니셜이 따로 읽히지 않습니다. 둘 다 없거나 `accessibilityLabel=""` 이 지정된 아바타는 장식용으로 간주되어 스크린 리더에서 숨겨집니다. 아바타가 표시하는 이름 옆에 있을 때는 이렇게 하는 것이 좋습니다.
- 그룹은 그룹으로 전달되며 `accessibilityLabel` 이 레이블이 됩니다("Ada, Grace and 5 others"). 표시된 아바타는 그 안의 이미지로 읽힙니다. 오버플로는 그 내용("+5")으로 읽히며, 앱이 `overflowAccessibilityLabel` 을 지정하면 그 값("5 more people")으로 읽힙니다. NSH는 자체 문구를 작성하지 않습니다.
- 아바타는 스크린 리더에 하나의 요소이므로 자식이 표시하는 내용은 따로 읽히지 않으며, iOS에서는 그 안의 버튼이나 링크에 아예 접근할 수 없습니다. 접속 상태 점이나 배지의 의미는 `accessibilityLabel` 에 담으세요("Ada Lovelace, online"). 누를 수 있는 요소는 아바타 안이 아니라 옆에 두세요.
- 둘 다 누르기나 키보드 포커스를 받지 않습니다. 눌 수 있게 하려면 아바타를 `Button` 안에 넣으세요.

레이블, 역할, 공지 전반에 대해서는 [접근성](../docs/accessibility.md)을 참고하세요.

## Platform notes

- 모든 플랫폼은 각자의 이미지 로더와 캐시로 사진을 로드합니다([Image](./image.md) 참고). 로드 및 error 이벤트가 Rust에서 아바타의 상태를 바꾸므로, 로딩 중이거나 실패한 사진은 사진과 폴백만 바꾸고 다른 것은 바꾸지 않습니다.
- 사진은 프레임이 생기면 로드를 시작하므로, 투명한 동안에도 레이아웃에 유지됩니다.
