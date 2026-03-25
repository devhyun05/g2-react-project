from __future__ import annotations

import csv
import html
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "test-matrix.csv"
CSV_TARGET = ROOT / "test-matrix.ko.csv"
XLSX_TARGET = ROOT / "test-matrix.ko.xlsx"


HEADER_MAP = {
    "Category": "분류",
    "Area": "영역",
    "File": "파일",
    "Test Name": "테스트명",
    "Extreme Case": "극단 케이스",
    "Expected Result": "기대 결과",
    "Status": "상태",
}

VALUE_MAP = {
    "Contract": "계약",
    "Unit": "단위",
    "Load": "부하",
    "Integration": "통합",
    "VNode": "VNode",
    "Diff": "Diff",
    "Patch": "Patch",
    "History": "History",
    "domToVNode": "domToVNode",
    "vNodeToDOM": "vNodeToDOM",
    "render": "render",
    "diff": "diff",
    "patch": "patch",
    "history": "history",
    "UI Bindings": "UI 바인딩",
    "Concurrency": "동시성",
    "Render/History": "렌더/히스토리",
    "App": "앱",
    "Y": "예",
    "N": "아니오",
    "PASS": "통과",
}

TEXT_MAP = {
    "VNode contract keeps props and children as objects and arrays": "VNode 계약은 props를 객체로, children을 배열로 유지한다",
    'TEXT VNode contract uses type "TEXT" and props.nodeValue': 'TEXT VNode 계약은 type "TEXT"와 props.nodeValue를 사용한다',
    "diff contract returns only documented patch kinds with agreed fields": "diff 계약은 문서화된 patch kind와 합의된 필드만 반환한다",
    "patch contract resolves nodes by path from the provided root element": "patch 계약은 전달된 root element 기준 path로 노드를 찾는다",
    "applyPatches mutates only through documented patch operations": "applyPatches는 문서화된 patch 연산만으로 DOM을 변경한다",
    "history contract uses entries/index shape and returns null when empty": "history 계약은 entries/index 형태를 사용하고 비어 있으면 null을 반환한다",
    "history contract stores snapshots and preserves undo/redo shape": "history 계약은 snapshot을 저장하고 undo/redo 형태를 유지한다",
    "domToVNode converts DOM to the agreed VNode shape": "domToVNode는 DOM을 합의된 VNode 형태로 변환한다",
    "domToVNode preserves extreme text cases including empty strings and whitespace": "domToVNode는 빈 문자열과 공백을 포함한 극단적 텍스트 케이스를 보존한다",
    "domToVNode ignores event-like attributes and returns null for unsupported nodes": "domToVNode는 이벤트성 attribute를 무시하고 지원하지 않는 노드에는 null을 반환한다",
    "vNodeToDOM builds DOM nodes with className mapped back to class": "vNodeToDOM은 className을 class로 다시 매핑해 DOM 노드를 만든다",
    "vNodeToDOM preserves empty text nodes inside elements": "vNodeToDOM은 element 내부의 빈 텍스트 노드를 보존한다",
    "vNodeToDOM ignores event props and returns null for null input": "vNodeToDOM은 이벤트 prop을 무시하고 null 입력에는 null을 반환한다",
    "render clears the container and mounts a fresh tree": "render는 container를 비우고 새 트리를 마운트한다",
    "render can replace an existing tree with a structurally different tree": "render는 구조가 다른 트리로 기존 트리를 교체할 수 있다",
    "render clears the container when vnode is null": "render는 vnode가 null이면 container를 비운다",
    "diff emits text, prop, and create patches with stable paths": "diff는 안정적인 path로 text, prop, create patch를 생성한다",
    "diff replaces the root when node types differ": "diff는 노드 타입이 다르면 루트를 교체한다",
    "diff handles deep nested paths and prop removals": "diff는 깊은 중첩 path와 prop 제거를 처리한다",
    "diff ignores event props and emits remove patches for trailing children": "diff는 이벤트 prop을 무시하고 뒤쪽 child 제거 patch를 생성한다",
    "applyPatches applies diff output to produce the target DOM": "applyPatches는 diff 결과를 적용해 목표 DOM을 만든다",
    "applyPatches safely ignores invalid paths and unsupported payloads": "applyPatches는 잘못된 path와 지원하지 않는 payload를 안전하게 무시한다",
    "getDOMNodeByPath resolves extreme deep descendants": "getDOMNodeByPath는 매우 깊은 자손 노드도 찾는다",
    "applyPatches can replace the root element when called on the mounted root": "applyPatches는 마운트된 루트 기준 호출 시 루트 element를 교체할 수 있다",
    "applyPatches can insert at a specific child index and remove className-mapped props": "applyPatches는 특정 child index에 삽입하고 className 매핑 prop을 제거할 수 있다",
    "history keeps snapshots immutable across reads": "history는 조회 이후에도 snapshot 불변성을 유지한다",
    "history undo then push truncates future entries": "history는 undo 후 push하면 future entry를 잘라낸다",
    "history gracefully normalizes malformed state": "history는 잘못된 상태도 안전하게 정규화한다",
    "createHistory clones the initial snapshot instead of storing external references": "createHistory는 외부 참조를 저장하지 않고 초기 snapshot을 복제한다",
    "syncHistoryButtons disables and enables controls based on history index": "syncHistoryButtons는 history index에 따라 컨트롤을 비활성화/활성화한다",
    "renderPatchLog and renderHistoryLog write readable debug text": "renderPatchLog와 renderHistoryLog는 읽기 쉬운 디버그 텍스트를 출력한다",
    "renderVNodeTree handles empty and nested vnode data": "renderVNodeTree는 빈 vnode와 중첩 vnode 데이터를 처리한다",
    "bindControls wires handlers to button clicks and setStatusText updates labels": "bindControls는 버튼 클릭에 핸들러를 연결하고 setStatusText는 라벨을 갱신한다",
    "interleaved history operations on separate states do not bleed into each other": "분리된 상태에서 교차 실행된 history 연산은 서로 간섭하지 않는다",
    "rapid successive patch computations keep DOM deterministic": "빠르게 연속된 patch 계산에서도 DOM 결과는 결정적으로 유지된다",
    "rapid bound control clicks keep handler order stable": "빠른 연속 컨트롤 클릭에서도 핸들러 순서는 안정적으로 유지된다",
    "load diff on a nested tree stays correct under larger input": "큰 입력의 중첩 트리에서도 diff는 올바르게 동작한다",
    "load patch loop preserves correctness over many sequential updates": "여러 번의 순차 업데이트에도 patch 루프는 정합성을 유지한다",
    "load render/history loop keeps snapshots stable over repeated churn": "반복적인 churn 상황에서도 render/history 루프는 snapshot 안정성을 유지한다",
    "integration flow keeps real DOM, test DOM, patch log, and history in sync": "통합 흐름은 real DOM, test DOM, patch log, history를 동기화 상태로 유지한다",
    "integration flow supports undo and redo through bound controls": "통합 흐름은 바인딩된 컨트롤을 통해 undo/redo를 지원한다",
    "createVNode returns { type, props: {}, children: [] } when nullish inputs are passed": "nullish 입력이 들어와도 createVNode는 { type, props: {}, children: [] }를 반환한다",
    "createTextVNode normalizes numbers to strings and children to []": "createTextVNode는 숫자를 문자열로 정규화하고 children을 []로 맞춘다",
    "Every emitted patch uses an allowed kind and required payload shape": "생성된 모든 patch는 허용된 kind와 필요한 payload 형태를 사용한다",
    "Path lookup starts from rootEl and resolves nested descendants correctly": "path 탐색은 rootEl에서 시작하고 중첩 자손을 정확히 찾는다",
    "Patch application transforms DOM to the target tree using agreed patch kinds": "patch 적용은 합의된 patch kind만 사용해 DOM을 목표 트리로 바꾼다",
    "Empty history is { entries: [], index: -1 } and getCurrentVNode returns null": "빈 history는 { entries: [], index: -1 }이며 getCurrentVNode는 null을 반환한다",
    "Undo and redo keep entries/index contract and current snapshot selection": "undo와 redo는 entries/index 계약과 현재 snapshot 선택을 유지한다",
    "class is mapped to className and comments are skipped": "class는 className으로 매핑되고 comment 노드는 건너뛴다",
    "Empty string and single-space text nodes are preserved as TEXT VNodes": "빈 문자열과 공백 한 칸 텍스트 노드는 TEXT VNode로 보존된다",
    "on* attributes are skipped and comment/null inputs return null": "on* attribute는 건너뛰고 comment/null 입력은 null을 반환한다",
    "VNode becomes serialized DOM with correct attributes": "VNode는 올바른 attribute를 가진 직렬화 가능한 DOM이 된다",
    "Empty TEXT children are still mounted in DOM": "빈 TEXT child도 DOM에 그대로 마운트된다",
    "on* props are not rendered as attributes and null returns null": "on* prop은 attribute로 렌더링되지 않고 null 입력은 null을 반환한다",
    "Existing children are removed and replaced with one rendered root": "기존 child는 제거되고 렌더된 루트 하나로 교체된다",
    "Second render fully remounts updated DOM": "두 번째 render는 갱신된 DOM을 완전히 다시 마운트한다",
    "Container becomes empty and return value is null": "container는 비워지고 반환값은 null이 된다",
    "SET_PROP/TEXT/CREATE patches use expected old-tree paths": "SET_PROP/TEXT/CREATE patch는 예상한 old-tree path를 사용한다",
    "Type changes emit one REPLACE patch at path []": "타입 변경 시 path []에 REPLACE patch 하나를 생성한다",
    "Deep descendants and removed props generate stable nested paths": "깊은 자손과 제거된 prop은 안정적인 중첩 path를 만든다",
    "on* prop changes are ignored and extra children emit REMOVE": "on* prop 변경은 무시되고 추가 child 제거에는 REMOVE가 생성된다",
    "Applying diff output reaches the same serialized DOM as target vnode": "diff 결과를 적용하면 목표 vnode와 동일한 직렬화 DOM에 도달한다",
    "Bad paths and invalid payloads do not corrupt DOM": "잘못된 path와 유효하지 않은 payload는 DOM을 망가뜨리지 않는다",
    "Deep path lookup returns the intended text node": "깊은 path 탐색은 의도한 텍스트 노드를 반환한다",
    "Root replacement swaps mounted element without touching wrapper": "루트 교체는 wrapper를 건드리지 않고 마운트된 element만 바꾼다",
    "CREATE inserts before existing child and REMOVE_PROP strips class attr": "CREATE는 기존 child 앞에 삽입되고 REMOVE_PROP은 class attribute를 제거한다",
    "Mutating read snapshot does not alter stored history": "조회한 snapshot을 변경해도 저장된 history는 바뀌지 않는다",
    "Redo branch disappears after pushing new snapshot from undone state": "undo된 상태에서 새 snapshot을 push하면 redo 분기가 사라진다",
    "Malformed entries/index are normalized before push/get": "잘못된 entries/index는 push/get 전에 정규화된다",
    "External mutation after createHistory does not leak into entries[0]": "createHistory 이후 외부 변경은 entries[0]에 새어 들어가지 않는다",
    "Undo/redo button disabled state follows history boundaries": "undo/redo 버튼의 비활성화 상태는 history 경계를 따른다",
    "Patch log and history log render readable summaries": "patch log와 history log는 읽기 쉬운 요약을 렌더링한다",
    "Empty vnode renders placeholder and nested tree renders labels": "빈 vnode는 placeholder를 렌더링하고 중첩 트리는 라벨을 렌더링한다",
    "Click handlers fire in order and status text updates": "클릭 핸들러는 순서대로 실행되고 상태 텍스트는 갱신된다",
    "Independent history states remain isolated under interleaved async scheduling": "교차된 비동기 스케줄링에서도 독립 history 상태는 서로 분리된다",
    "Sequential async patch waves converge to the same DOM as the final target tree": "순차적인 비동기 patch wave는 최종 목표 트리와 같은 DOM으로 수렴한다",
    "High-frequency clicks preserve handler registration order without missing events": "고빈도 클릭에서도 이벤트 누락 없이 핸들러 등록 순서를 유지한다",
    "Diff emits valid patches for a larger nested tree without correctness loss": "더 큰 중첩 트리에서도 diff는 정합성을 잃지 않고 유효한 patch를 생성한다",
    "Repeated diff+patch cycles end with DOM identical to the final vnode": "반복된 diff+patch 사이클 이후 DOM은 최종 vnode와 동일하다",
    "Repeated render/push/undo churn keeps history and DOM aligned": "반복적인 render/push/undo churn에서도 history와 DOM은 정렬 상태를 유지한다",
    "Patch workflow syncs DOM, debug output, status, and history buttons": "patch 흐름은 DOM, 디버그 출력, 상태, history 버튼을 동기화한다",
    "Undo/redo workflow re-renders DOM/test text and toggles buttons correctly": "undo/redo 흐름은 DOM과 테스트 텍스트를 다시 렌더링하고 버튼 상태를 올바르게 바꾼다",
}


def translate(value: str) -> str:
    return TEXT_MAP.get(value, VALUE_MAP.get(value, value))


def cell_ref(row: int, col: int) -> str:
    letters = ""
    current = col
    while current:
        current, remainder = divmod(current - 1, 26)
        letters = chr(65 + remainder) + letters
    return f"{letters}{row}"


def build_sheet_xml(rows: list[list[str]]) -> str:
    sheet_rows: list[str] = []
    for row_index, row in enumerate(rows, start=1):
        cells: list[str] = []
        for col_index, value in enumerate(row, start=1):
            ref = cell_ref(row_index, col_index)
            escaped = html.escape(str(value))
            cells.append(
                f'<c r="{ref}" t="inlineStr"><is><t>{escaped}</t></is></c>'
            )
        sheet_rows.append(f'<row r="{row_index}">{"".join(cells)}</row>')
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        f'<sheetData>{"".join(sheet_rows)}</sheetData>'
        "</worksheet>"
    )


with SOURCE.open("r", encoding="utf-8", newline="") as file:
    reader = csv.DictReader(file)
    translated_rows = []
    for row in reader:
        translated_rows.append(
            {
                "분류": translate(row["Category"]),
                "영역": translate(row["Area"]),
                "파일": row["File"],
                "테스트명": translate(row["Test Name"]),
                "극단 케이스": translate(row["Extreme Case"]),
                "기대 결과": translate(row["Expected Result"]),
                "상태": translate(row["Status"]),
            }
        )


with CSV_TARGET.open("w", encoding="utf-8-sig", newline="") as file:
    writer = csv.DictWriter(file, fieldnames=list(HEADER_MAP.values()))
    writer.writeheader()
    writer.writerows(translated_rows)


sheet_rows = [list(HEADER_MAP.values())] + [list(row.values()) for row in translated_rows]
sheet_xml = build_sheet_xml(sheet_rows)

with ZipFile(XLSX_TARGET, "w", compression=ZIP_DEFLATED) as archive:
    archive.writestr(
        "[Content_Types].xml",
        """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>""",
    )
    archive.writestr(
        "_rels/.rels",
        """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>""",
    )
    archive.writestr(
        "xl/workbook.xml",
        """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="테스트 매트릭스" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>""",
    )
    archive.writestr(
        "xl/_rels/workbook.xml.rels",
        """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>""",
    )
    archive.writestr(
        "xl/styles.xml",
        """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border/></borders>
  <cellStyleXfs count="1"><xf/></cellStyleXfs>
  <cellXfs count="1"><xf xfId="0"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>""",
    )
    archive.writestr("xl/worksheets/sheet1.xml", sheet_xml)

print(f"created: {CSV_TARGET}")
print(f"created: {XLSX_TARGET}")
