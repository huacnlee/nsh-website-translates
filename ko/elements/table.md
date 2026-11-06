---
title: "Table"
description: "Table 컴포넌트와 그 구성 요소: 앱이 직접 정의한 행과 셀로 이루어져 있으며 스크린 리더가 표로 인식하는 테이블로, 각 부분에는 앱이 지정한 스타일이 적용됩니다."
group: base
demo: el-table
source_hash: b35a56c82dadd942
---

# 테이블

`Table`은 앱이 자식으로 작성한 몇 개의 행(송장, 요약, 비교 등)을 배치하고, 스크린 리더에 테이블을 제공합니다. 테이블 자체, 행 그룹, 행, 열 헤더, 셀이 각각 고유한 역할을 가집니다. 구성 요소는 `TableHeader`, `TableBody`, `TableFooter`(행 그룹), `TableRow`(셀을 나란히 배치), `TableHead`(열의 헤더 셀), `TableCell`, `TableCaption`입니다. 외형은 앱이 정합니다. 어떤 구성 요소도 자체 색상, 테두리, 패딩, 너비를 갖지 않으며, 각 구성 요소는 앱의 `class`과 `style`을 받습니다. 많은 행, 정렬, 선택, 크기 조절이 가능한 열이 필요하다면 [`DataTable`](./data-table.md)이 적합한 테이블입니다.

```rust tabs
use nsh_base::{table, table_body, table_cell, table_head, table_header, table_row, theme};
use nsh_core::prelude::*;

fn invoices() -> impl IntoElement {
    let cell = |label: &'static str| table_cell().w(px(120.0)).px_3().py_2().child(text(label));
    table()
        .accessibility_label("Recent invoices")
        .child(
            table_header().child(
                table_row()
                    .border_b_1()
                    .border_color(move || theme().border)
                    .child(table_head().w(px(120.0)).px_3().py_2().child(text("Invoice")))
                    .child(table_head().w(px(120.0)).px_3().py_2().child(text("Amount"))),
            ),
        )
        .child(table_body().child(table_row().child(cell("INV001")).child(cell("$250.00"))))
}
```

```tsx tabs
import { mount, Text } from "nsh";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "nsh/base";

function App() {
  return (
    <Table accessibilityLabel="Recent invoices">
      <TableHeader>
        <TableRow class="border-b border-border">
          <TableHead class="w-32 px-3 py-2"><Text>Invoice</Text></TableHead>
          <TableHead class="w-32 px-3 py-2"><Text>Amount</Text></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell class="w-32 px-3 py-2"><Text>INV001</Text></TableCell>
          <TableCell class="w-32 px-3 py-2"><Text>$250.00</Text></TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

mount(App);
```

`Table`와 그 구성 요소는 Rust의 `nsh-base` crate인 [`nsh/base`](../modules/nsh-base.md)에서 제공되며, `table()`, `table_header()`, `table_body()`, `table_footer()`, `table_row()`, `table_head()`, `table_cell()`, `table_caption()`가 타입이 지정된 스타일 메서드 및 `.child(..)`와 함께 이를 생성합니다. 행은 셀을 나란히 배치하며, 열이 정렬되도록 앱이 셀의 너비를 지정합니다.

## Props

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | `Table` 전용: 스크린 리더가 테이블을 부르는 이름입니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 구성 요소가 담는 내용: `Table`에는 그룹과 캡션, 그룹에는 행, 행에는 셀, 셀에는 콘텐츠가 들어갑니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 구성 요소의 외형과 레이아웃입니다. |

<a id="parts"></a>

## 구성 요소

| 구성 요소 | 포함 위치 | 스크린 리더용 역할 |
|---|---|---|
| `Table` | | table |
| `TableHeader` | `Table` | row group: 열 헤더 행들 |
| `TableBody` | `Table` | row group: 데이터 행들 |
| `TableFooter` | `Table` | row group: 합계, 요약 행 |
| `TableRow` | 그룹 또는 `Table` | row; 셀을 나란히 배치 |
| `TableHead` | 헤더의 `TableRow` | column header |
| `TableCell` | `TableRow` | cell |
| `TableCaption` | `Table` | 앱이 테이블에 대해 보여 주는 콘텐츠 |

각 플랫폼은 해당 스크린 리더에 역할을 전달합니다. Linux(AT-SPI), 웹(ARIA), Android, GPUI 백엔드에서는 table, row, cell, column header 역할을 사용하고, macOS와 Windows에서는 grid와 group을, iOS에서는 헤더를 헤더로 전달합니다.

<a id="see-also"></a>

## 참고 항목

- [DataTable](./data-table.md): 선택, 정렬, 크기 조절 및 이동이 가능한 열을 갖춘, 행과 열의 수에 제한이 없는 테이블입니다.
- [접근성](../docs/accessibility.md): `accessibilityRole` 값, `table`, `row`, `cell`, `columnheader`, `rowgroup` 등을 다룹니다.
