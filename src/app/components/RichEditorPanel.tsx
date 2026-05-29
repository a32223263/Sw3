import { useState } from "react";
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  AlignJustify, Table2, ImageIcon, Link, List, ListOrdered,
  Heading1, Heading2, Strikethrough, Undo, Redo, Type, Palette,
} from "lucide-react";

/* ─────────────────────────────────────────────────
   공통 타입
───────────────────────────────────────────────── */
export type FormType =
  | "장비 구매 요청서"
  | "출장 신청서"
  | "휴가 신청서"
  | "지출 결의서"
  | "업무 협조 요청서";

/** document_data: 기안자가 입력한 JSON Key-Value */
export type DocumentData = Record<string, string>;

type Approver = { name: string; title: string; order: number };

/* ─────────────────────────────────────────────────
   에디터 툴바
───────────────────────────────────────────────── */
type ToolbarButtonProps = {
  icon: React.ReactNode;
  title: string;
  active?: boolean;
  onClick: () => void;
};

function ToolbarButton({ icon, title, active, onClick }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`w-7 h-7 flex items-center justify-center rounded transition-all ${
        active
          ? "bg-blue-100 text-blue-700 border border-blue-300"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      }`}
    >
      {icon}
    </button>
  );
}

function ToolbarSep() {
  return <div className="w-px h-5 bg-gray-200 mx-0.5" />;
}

function EditorToolbar() {
  const [actives, setActives] = useState<Set<string>>(new Set());
  const toggle = (id: string) => {
    setActives((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const active = (id: string) => actives.has(id);

  return (
    <div className="flex items-center gap-0.5 px-3 py-2 bg-gray-50 border-b border-gray-200 flex-wrap">
      {/* Font family */}
      <select
        className="text-xs border border-gray-300 rounded px-1.5 py-1 bg-white text-gray-700 mr-1 focus:outline-none"
        defaultValue="나눔고딕"
        onChange={() => {}}
      >
        {["나눔고딕", "맑은 고딕", "돋움", "굴림", "Arial"].map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>

      {/* Font size */}
      <select
        className="text-xs border border-gray-300 rounded px-1.5 py-1 bg-white text-gray-700 mr-1 focus:outline-none w-14"
        defaultValue="11"
        onChange={() => {}}
      >
        {["9", "10", "11", "12", "14", "16", "18", "20", "24"].map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <ToolbarSep />

      <ToolbarButton icon={<Bold size={13} />} title="굵게" active={active("bold")} onClick={() => toggle("bold")} />
      <ToolbarButton icon={<Italic size={13} />} title="기울임" active={active("italic")} onClick={() => toggle("italic")} />
      <ToolbarButton icon={<Underline size={13} />} title="밑줄" active={active("underline")} onClick={() => toggle("underline")} />
      <ToolbarButton icon={<Strikethrough size={13} />} title="취소선" active={active("strike")} onClick={() => toggle("strike")} />

      <ToolbarSep />

      <ToolbarButton icon={<Palette size={13} />} title="글자색" active={false} onClick={() => {}} />
      <ToolbarButton icon={<Type size={13} />} title="형광펜" active={false} onClick={() => {}} />

      <ToolbarSep />

      <ToolbarButton icon={<AlignLeft size={13} />} title="왼쪽 정렬" active={active("alignL")} onClick={() => { ["alignL","alignC","alignR","alignJ"].forEach((a) => actives.delete(a)); toggle("alignL"); }} />
      <ToolbarButton icon={<AlignCenter size={13} />} title="가운데 정렬" active={active("alignC")} onClick={() => { ["alignL","alignC","alignR","alignJ"].forEach((a) => actives.delete(a)); toggle("alignC"); }} />
      <ToolbarButton icon={<AlignRight size={13} />} title="오른쪽 정렬" active={active("alignR")} onClick={() => { ["alignL","alignC","alignR","alignJ"].forEach((a) => actives.delete(a)); toggle("alignR"); }} />
      <ToolbarButton icon={<AlignJustify size={13} />} title="양쪽 정렬" active={active("alignJ")} onClick={() => { ["alignL","alignC","alignR","alignJ"].forEach((a) => actives.delete(a)); toggle("alignJ"); }} />

      <ToolbarSep />

      <ToolbarButton icon={<Heading1 size={13} />} title="제목1" active={active("h1")} onClick={() => toggle("h1")} />
      <ToolbarButton icon={<Heading2 size={13} />} title="제목2" active={active("h2")} onClick={() => toggle("h2")} />
      <ToolbarButton icon={<List size={13} />} title="글머리 기호" active={active("ul")} onClick={() => toggle("ul")} />
      <ToolbarButton icon={<ListOrdered size={13} />} title="번호 목록" active={active("ol")} onClick={() => toggle("ol")} />

      <ToolbarSep />

      <ToolbarButton icon={<Table2 size={13} />} title="표 삽입" active={false} onClick={() => {}} />
      <ToolbarButton icon={<ImageIcon size={13} />} title="이미지 삽입" active={false} onClick={() => {}} />
      <ToolbarButton icon={<Link size={13} />} title="하이퍼링크" active={false} onClick={() => {}} />

      <ToolbarSep />

      <ToolbarButton icon={<Undo size={13} />} title="실행 취소" active={false} onClick={() => {}} />
      <ToolbarButton icon={<Redo size={13} />} title="다시 실행" active={false} onClick={() => {}} />
    </div>
  );
}

/* ─────────────────────────────────────────────────
   결재란 (공통 헤더 컴포넌트)
───────────────────────────────────────────────── */
function ApprovalTable({ approvers, writer }: { approvers: Approver[]; writer: string }) {
  const cols = [{ name: writer, title: "기안자", order: 0 }, ...approvers];
  return (
    <div className="flex flex-col items-end shrink-0">
      <p className="text-xs text-gray-400 mb-1">결재</p>
      <div className="border border-gray-400 overflow-hidden" style={{ minWidth: 160 }}>
        <div className="flex">
          {cols.map((col) => (
            <div key={col.order} className="flex-1 border-r border-gray-400 last:border-r-0 text-center py-1 px-2 bg-gray-50">
              <p className="text-xs text-gray-600" style={{ fontWeight: 600 }}>
                {col.order === 0 ? "기안자" : `${col.order}차 결재`}
              </p>
            </div>
          ))}
        </div>
        <div className="flex" style={{ minHeight: 40 }}>
          {cols.map((col) => (
            <div key={col.order} className="flex-1 border-r border-gray-400 last:border-r-0 bg-white flex items-center justify-center py-2 px-1">
              <div className="text-center">
                <p className="text-xs text-gray-800" style={{ fontWeight: 600 }}>{col.name}</p>
                <p className="text-xs text-gray-500">{col.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   문서 헤더 (공통)
───────────────────────────────────────────────── */
function DocHeader({
  formType,
  approvers,
  writer,
  dept,
  date,
  docNo,
}: {
  formType: FormType;
  approvers: Approver[];
  writer: string;
  dept: string;
  date: string;
  docNo: string;
}) {
  return (
    <div className="border border-gray-300 overflow-hidden rounded-sm">
      {/* 상단: 회사 로고 + 문서명 + 결재란 */}
      <div className="flex items-start justify-between px-6 py-4 border-b border-gray-300 bg-white gap-4">
        <div className="flex items-center gap-4">
          {/* 회사 로고 */}
          <div className="w-12 h-12 rounded bg-blue-700 flex items-center justify-center shrink-0">
            <span className="text-white text-xs" style={{ fontWeight: 700, letterSpacing: "0.05em" }}>CORP</span>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">전자결재 시스템</p>
            <h3 className="text-gray-900" style={{ fontWeight: 700, letterSpacing: "0.03em" }}>{formType}</h3>
          </div>
        </div>
        <ApprovalTable approvers={approvers} writer={writer} />
      </div>

      {/* 문서 메타데이터 행 */}
      <div className="grid grid-cols-4 border-b border-gray-300 text-xs">
        {[
          { label: "작 성 일", value: date },
          { label: "부 서 명", value: dept },
          { label: "기 안 자", value: writer },
          { label: "문서 번호", value: docNo },
        ].map((item, i) => (
          <div key={i} className={`flex ${i < 3 ? "border-r border-gray-300" : ""}`}>
            <div className="bg-gray-50 border-r border-gray-300 px-2 py-1.5 shrink-0 flex items-center text-gray-600" style={{ fontWeight: 600, minWidth: 60 }}>
              {item.label}
            </div>
            <div className="flex-1 px-2 py-1.5 bg-white text-gray-800 flex items-center">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   양식별 본문 템플릿
───────────────────────────────────────────────── */

/** 장비 구매 요청서 */
function EquipmentPurchaseTemplate({
  data,
  onChange,
  readonly,
}: {
  data: DocumentData;
  onChange: (key: string, val: string) => void;
  readonly?: boolean;
}) {
  const totalAmount =
    Number((data.quantity || "0").replace(/,/g, "")) *
    Number((data.unitPrice || "0").replace(/,/g, ""));

  const cellCls = "border border-gray-300 px-2 py-1.5 text-xs";
  const headCls = `${cellCls} bg-gray-50 text-gray-600 text-center` ;

  return (
    <div className="space-y-4 text-sm">
      {/* 1. 구매 목적 */}
      <section>
        <div className="bg-gray-100 border-l-4 border-blue-600 px-3 py-1.5 mb-2">
          <p className="text-xs text-gray-700" style={{ fontWeight: 600 }}>1. 구매 목적</p>
        </div>
        {readonly ? (
          <div className="border border-gray-200 rounded px-3 py-2 bg-gray-50 text-sm text-gray-800 min-h-[60px] whitespace-pre-wrap leading-relaxed">
            {data.purpose || <span className="text-gray-400 italic">미입력</span>}
          </div>
        ) : (
          <textarea
            value={data.purpose || ""}
            onChange={(e) => onChange("purpose", e.target.value)}
            rows={3}
            placeholder="장비 구매가 필요한 이유 및 업무 목적을 구체적으로 기재하세요."
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white leading-relaxed"
          />
        )}
      </section>

      {/* 2. 구매 내역 */}
      <section>
        <div className="bg-gray-100 border-l-4 border-blue-600 px-3 py-1.5 mb-2">
          <p className="text-xs text-gray-700" style={{ fontWeight: 600 }}>2. 구매 내역</p>
        </div>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              {["품 목 명", "규 격 / 사 양", "수 량", "단 가 (원)", "합 계 (원)"].map((h) => (
                <th key={h} className={headCls} style={{ fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={cellCls}>
                {readonly ? (
                  <span className="text-gray-800">{data.itemName || "—"}</span>
                ) : (
                  <input
                    type="text"
                    value={data.itemName || ""}
                    onChange={(e) => onChange("itemName", e.target.value)}
                    placeholder="예: 개발용 노트북"
                    className="w-full focus:outline-none bg-transparent text-gray-800"
                  />
                )}
              </td>
              <td className={cellCls}>
                {readonly ? (
                  <span className="text-gray-800">{data.spec || "—"}</span>
                ) : (
                  <input
                    type="text"
                    value={data.spec || ""}
                    onChange={(e) => onChange("spec", e.target.value)}
                    placeholder="예: i9 / 64GB RAM"
                    className="w-full focus:outline-none bg-transparent text-gray-800"
                  />
                )}
              </td>
              <td className={`${cellCls} text-center`}>
                {readonly ? (
                  <span className="text-gray-800">{data.quantity || "—"}</span>
                ) : (
                  <input
                    type="text"
                    value={data.quantity || ""}
                    onChange={(e) => onChange("quantity", e.target.value)}
                    placeholder="0"
                    className="w-full text-center focus:outline-none bg-transparent text-gray-800"
                  />
                )}
              </td>
              <td className={`${cellCls} text-right`}>
                {readonly ? (
                  <span className="text-gray-800">{data.unitPrice ? `${Number(data.unitPrice.replace(/,/g,"")).toLocaleString()}` : "—"}</span>
                ) : (
                  <input
                    type="text"
                    value={data.unitPrice || ""}
                    onChange={(e) => onChange("unitPrice", e.target.value)}
                    placeholder="0"
                    className="w-full text-right focus:outline-none bg-transparent text-gray-800"
                  />
                )}
              </td>
              <td className={`${cellCls} text-right bg-blue-50`} style={{ fontWeight: 600 }}>
                {totalAmount > 0 ? `${totalAmount.toLocaleString()}` : "—"}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className={`${cellCls} bg-gray-50 text-right`} style={{ fontWeight: 600 }}>총 합계 (원)</td>
              <td className={`${cellCls} bg-yellow-50 text-right text-blue-800`} style={{ fontWeight: 700 }}>
                {totalAmount > 0 ? `${totalAmount.toLocaleString()}` : "—"}
              </td>
            </tr>
          </tfoot>
        </table>
        {totalAmount > 0 && (
          <p className="text-xs text-gray-500 mt-1 text-right">
            ※ 금액 단위: 원 (VAT 별도) · 합계: <strong className="text-blue-700">{totalAmount.toLocaleString()}원</strong>
          </p>
        )}
      </section>

      {/* 3. 참고사항 */}
      <section>
        <div className="bg-gray-100 border-l-4 border-blue-600 px-3 py-1.5 mb-2">
          <p className="text-xs text-gray-700" style={{ fontWeight: 600 }}>3. 참고사항 <span className="text-gray-400" style={{ fontWeight: 400 }}>(선택)</span></p>
        </div>
        {readonly ? (
          <div className="border border-gray-200 rounded px-3 py-2 bg-gray-50 text-sm text-gray-800 min-h-[50px] whitespace-pre-wrap leading-relaxed">
            {data.notes || <span className="text-gray-400 italic">없음</span>}
          </div>
        ) : (
          <textarea
            value={data.notes || ""}
            onChange={(e) => onChange("notes", e.target.value)}
            rows={2}
            placeholder="첨부파일, 추가 안내사항 등을 기재하세요."
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white leading-relaxed"
          />
        )}
      </section>
    </div>
  );
}

/** 출장 신청서 */
function BusinessTripTemplate({
  data,
  onChange,
  readonly,
}: {
  data: DocumentData;
  onChange: (key: string, val: string) => void;
  readonly?: boolean;
}) {
  const cellCls = "border border-gray-300 px-2 py-2 text-sm";
  const labelCls = `${cellCls} bg-gray-50 text-xs text-gray-600 text-center` ;

  const Field = ({ fieldKey, placeholder }: { fieldKey: string; placeholder: string }) =>
    readonly ? (
      <span className="text-gray-800">{data[fieldKey] || "—"}</span>
    ) : (
      <input
        type="text"
        value={data[fieldKey] || ""}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        placeholder={placeholder}
        className="w-full focus:outline-none bg-transparent text-sm text-gray-800"
      />
    );

  return (
    <div className="space-y-4 text-sm">
      <div className="bg-gray-100 border-l-4 border-blue-600 px-3 py-1.5">
        <p className="text-xs text-gray-700" style={{ fontWeight: 600 }}>출장 정보</p>
      </div>
      <table className="w-full border-collapse text-sm">
        <tbody>
          {[
            { label: "출장지", key: "destination", placeholder: "예: 부산 본사 / 해외: 미국 뉴욕" },
            { label: "출장 기간", key: "period", placeholder: "예: 2026-06-01 ~ 2026-06-03 (3일)" },
            { label: "출장 목적", key: "purpose", placeholder: "출장 목적을 구체적으로 기재하세요." },
            { label: "예산 (원)", key: "budget", placeholder: "예: 500,000" },
          ].map(({ label, key, placeholder }) => (
            <tr key={key}>
              <td className={`${labelCls} w-28`} style={{ fontWeight: 600 }}>{label}</td>
              <td className={cellCls}><Field fieldKey={key} placeholder={placeholder} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="bg-gray-100 border-l-4 border-blue-600 px-3 py-1.5">
        <p className="text-xs text-gray-700" style={{ fontWeight: 600 }}>상세 내용 및 참고사항</p>
      </div>
      {readonly ? (
        <div className="border border-gray-200 rounded px-3 py-2 bg-gray-50 text-sm text-gray-800 min-h-[60px] whitespace-pre-wrap">{data.notes || "—"}</div>
      ) : (
        <textarea
          value={data.notes || ""}
          onChange={(e) => onChange("notes", e.target.value)}
          rows={3}
          placeholder="상세 출장 일정, 동반자, 추가 안내사항 등을 기재하세요."
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
        />
      )}
    </div>
  );
}

/** 지출결의서 */
const EXPENSE_ITEMS = [
  { no: 1, item: "외부 세미나 참가비", vendor: "AWS Summit Korea", date: "04.22", amount: 250000, note: "클라우드 아키텍처 세미나" },
  { no: 2, item: "소프트웨어 구독료", vendor: "Figma, Inc.", date: "04.24", amount: 108000, note: "디자인 협업 툴 월정액" },
  { no: 3, item: "팀 내부 회의 식대", vendor: "더반찬 케이터링", date: "04.28", amount: 87400, note: "분기 전략 회의 (8인)" },
  { no: 4, item: "출장 교통비 (KTX)", vendor: "한국철도공사", date: "05.02", amount: 64800, note: "부산 지사 방문 왕복" },
  { no: 5, item: "업무용 소모품", vendor: "교보문고 기업구매", date: "05.05", amount: 23500, note: "서류 바인더·마커 세트" },
] as const;

const EXPENSE_SUBTOTAL = 533700;
const EXPENSE_VAT = 53370;
const EXPENSE_TOTAL = 587070;
const Q2_BUDGET = 800000;
const PREV_EXECUTED = 214300;
const BUDGET_REMAINING = 52000;
const EXECUTION_RATE = 93.5;

function ExpenseResolutionTemplate({
  data,
  onChange,
  readonly,
}: {
  data: DocumentData;
  onChange: (key: string, val: string) => void;
  readonly?: boolean;
}) {
  const thCls = "border border-gray-300 bg-gray-50 px-2 py-2 text-xs text-gray-600 text-center";
  const tdCls = "border border-gray-300 px-2 py-2 text-xs text-gray-800";

  return (
    <div className="space-y-5 text-sm">
      {/* Section 1: 지출 개요 */}
      <section>
        <div className="bg-gray-100 border-l-4 border-blue-600 px-3 py-1.5 mb-2">
          <p className="text-xs text-gray-700" style={{ fontWeight: 600 }}>1. 지출 개요</p>
        </div>
        <table className="w-full border-collapse text-xs">
          <tbody>
            <tr>
              <td className="border border-gray-300 bg-gray-50 px-3 py-2 text-gray-600 w-28 align-top" style={{ fontWeight: 600 }}>지출 목적</td>
              <td className="border border-gray-300 px-3 py-2" colSpan={3}>
                {readonly ? (
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{data.purpose || "—"}</p>
                ) : (
                  <textarea
                    value={data.purpose || ""}
                    onChange={(e) => onChange("purpose", e.target.value)}
                    rows={3}
                    placeholder="지출 목적 및 사유를 구체적으로 기재하세요."
                    className="w-full focus:outline-none bg-transparent text-gray-800 resize-none leading-relaxed placeholder:text-gray-400"
                  />
                )}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 bg-gray-50 px-3 py-2 text-gray-600" style={{ fontWeight: 600 }}>지출 기간</td>
              <td className="border border-gray-300 px-3 py-2 w-52">
                {readonly ? (
                  <span className="text-gray-800">{data.period || "—"}</span>
                ) : (
                  <input
                    type="text"
                    value={data.period || ""}
                    onChange={(e) => onChange("period", e.target.value)}
                    placeholder="예: 2026-04-01 ~ 2026-04-30"
                    className="w-full focus:outline-none bg-transparent text-gray-800 placeholder:text-gray-400"
                  />
                )}
              </td>
              <td className="border border-gray-300 bg-gray-50 px-3 py-2 text-gray-600 w-24 text-center" style={{ fontWeight: 600 }}>담당 부서</td>
              <td className="border border-gray-300 px-3 py-2 text-gray-800 w-32">IT 기획팀</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Section 2: 지출 명세서 */}
      <section>
        <div className="bg-gray-100 border-l-4 border-blue-600 px-3 py-1.5 mb-2">
          <p className="text-xs text-gray-700" style={{ fontWeight: 600 }}>2. 지출 명세서</p>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={thCls} style={{ fontWeight: 600, width: 28 }}>순번</th>
              <th className={thCls} style={{ fontWeight: 600 }}>지출 항목</th>
              <th className={thCls} style={{ fontWeight: 600 }}>거래처 / 공급사</th>
              <th className={thCls} style={{ fontWeight: 600, width: 52 }}>지출일</th>
              <th className={thCls} style={{ fontWeight: 600, width: 88 }}>금액 (원)</th>
              <th className={thCls} style={{ fontWeight: 600 }}>적요 (비고)</th>
            </tr>
          </thead>
          <tbody>
            {EXPENSE_ITEMS.map((row) => (
              <tr key={row.no} className="hover:bg-blue-50 transition-colors">
                <td className={`${tdCls} text-center text-gray-500`}>{row.no}</td>
                <td className={tdCls} style={{ fontWeight: 500 }}>{row.item}</td>
                <td className={`${tdCls} text-gray-600`}>{row.vendor}</td>
                <td className={`${tdCls} text-center text-gray-600`}>{row.date}</td>
                <td className={`${tdCls} text-right`} style={{ fontWeight: 500 }}>{row.amount.toLocaleString()}</td>
                <td className={`${tdCls} text-gray-500`}>{row.note}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className={`${tdCls} bg-gray-50 text-right`} style={{ fontWeight: 600 }}>소계</td>
              <td className={`${tdCls} bg-gray-50 text-right`} style={{ fontWeight: 600 }}>{EXPENSE_SUBTOTAL.toLocaleString()}</td>
              <td className={`${tdCls} bg-gray-50 text-gray-400 text-xs`}>VAT 별도</td>
            </tr>
            <tr>
              <td colSpan={4} className={`${tdCls} bg-gray-50 text-right text-gray-500`}>부가가치세 (10%)</td>
              <td className={`${tdCls} bg-gray-50 text-right text-gray-600`}>{EXPENSE_VAT.toLocaleString()}</td>
              <td className={`${tdCls} bg-gray-50`} />
            </tr>
            <tr>
              <td colSpan={4} className="border border-gray-300 bg-blue-600 px-2 py-2 text-right text-white text-xs" style={{ fontWeight: 700 }}>합계 (원)</td>
              <td className="border border-gray-300 bg-blue-600 px-2 py-2 text-right text-white text-xs" style={{ fontWeight: 700 }}>{EXPENSE_TOTAL.toLocaleString()}</td>
              <td className="border border-gray-300 bg-blue-50 px-2 py-2 text-xs text-blue-700">VAT 포함</td>
            </tr>
          </tfoot>
        </table>
        <p className="text-xs text-gray-400 mt-1 text-right">※ 금액 단위: 원 · 세금계산서 및 영수증 별첨</p>
      </section>

      {/* Section 3: 부서 예산 집행 현황 */}
      <section>
        <div className="bg-gray-100 border-l-4 border-emerald-500 px-3 py-1.5 mb-3">
          <p className="text-xs text-gray-700" style={{ fontWeight: 600 }}>3. 부서 예산 집행 현황 (2분기)</p>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { label: "2분기 승인 예산", value: `${Q2_BUDGET.toLocaleString()}원`, color: "bg-slate-50 border-slate-200" },
            { label: "기집행 누적 금액", value: `${PREV_EXECUTED.toLocaleString()}원`, color: "bg-amber-50 border-amber-200" },
            { label: "금회 신청 금액", value: `${EXPENSE_SUBTOTAL.toLocaleString()}원`, color: "bg-blue-50 border-blue-200" },
            { label: "집행 후 잔여 예산", value: `${BUDGET_REMAINING.toLocaleString()}원`, color: "bg-rose-50 border-rose-200" },
          ].map((item) => (
            <div key={item.label} className={`border rounded p-2.5 ${item.color}`}>
              <p className="text-xs text-gray-500 mb-1" style={{ fontSize: "10px" }}>{item.label}</p>
              <p className="text-xs text-gray-800" style={{ fontWeight: 700 }}>{item.value}</p>
            </div>
          ))}
        </div>
        {/* 예산 집행률 바 */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-gray-500">
            <span>예산 집행률</span>
            <span style={{ fontWeight: 600 }} className="text-amber-600">{EXECUTION_RATE}% (승인 시)</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(PREV_EXECUTED / Q2_BUDGET) * 100}%`,
                background: "linear-gradient(90deg, #10b981, #059669)",
              }}
            />
            <div
              className="h-full rounded-full -mt-3"
              style={{
                width: `${((PREV_EXECUTED + EXPENSE_SUBTOTAL) / Q2_BUDGET) * 100}%`,
                background: "linear-gradient(90deg, #3b82f6 40%, #f59e0b)",
                opacity: 0.5,
              }}
            />
          </div>
          <div className="flex gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />기집행</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />금회 신청</span>
          </div>
        </div>
      </section>
    </div>
  );
}

/** 일반 양식 (기타) */
function GenericTemplate({
  formType,
  data,
  onChange,
  readonly,
}: {
  formType: FormType;
  data: DocumentData;
  onChange: (key: string, val: string) => void;
  readonly?: boolean;
}) {
  return (
    <div className="space-y-4 text-sm">
      <div className="bg-gray-100 border-l-4 border-blue-600 px-3 py-1.5">
        <p className="text-xs text-gray-700" style={{ fontWeight: 600 }}>1. 요청 사유 및 목적</p>
      </div>
      {readonly ? (
        <div className="border border-gray-200 rounded px-3 py-2 bg-gray-50 text-sm text-gray-800 min-h-[80px] whitespace-pre-wrap">{data.purpose || "—"}</div>
      ) : (
        <textarea
          value={data.purpose || ""}
          onChange={(e) => onChange("purpose", e.target.value)}
          rows={4}
          placeholder={`${formType}의 요청 사유와 목적을 구체적으로 기재하세요.`}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white leading-relaxed"
        />
      )}
      <div className="bg-gray-100 border-l-4 border-blue-600 px-3 py-1.5">
        <p className="text-xs text-gray-700" style={{ fontWeight: 600 }}>2. 세부 내용</p>
      </div>
      {readonly ? (
        <div className="border border-gray-200 rounded px-3 py-2 bg-gray-50 text-sm text-gray-800 min-h-[60px] whitespace-pre-wrap">{data.detail || "—"}</div>
      ) : (
        <textarea
          value={data.detail || ""}
          onChange={(e) => onChange("detail", e.target.value)}
          rows={3}
          placeholder="세부 내용, 일정, 금액, 수량 등 관련 정보를 기재하세요."
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white leading-relaxed"
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   메인 RichEditorPanel 컴포넌트
───────────────────────────────────────────────── */
interface RichEditorPanelProps {
  formType: FormType;
  documentData: DocumentData;
  onChange: (key: string, val: string) => void;
  approvers: Approver[];
  writer?: string;
  dept?: string;
  date?: string;
  docNo?: string;
  readonly?: boolean;
  /** 툴바 숨기기 (읽기 전용 뷰에서 사용) */
  hideToolbar?: boolean;
}

export function RichEditorPanel({
  formType,
  documentData,
  onChange,
  approvers,
  writer = "박도윤",
  dept = "IT 기획팀",
  date = "2026-05-05",
  docNo = "자동 부여",
  readonly = false,
  hideToolbar = false,
}: RichEditorPanelProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* 웹 에디터 헤더 레이블 */}
      <div className="px-3 py-1.5 bg-blue-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <span className="text-xs text-blue-100">
            {readonly ? "문서 뷰어" : "문서 편집기"}
          </span>
        </div>
      </div>

      {/* 툴바 */}
      {!hideToolbar && !readonly && <EditorToolbar />}

      {/* 문서 본문 영역 */}
      <div className="p-5 space-y-5" style={{ background: "#fafafa" }}>
        {/* 문서 헤더 */}
        <DocHeader
          formType={formType}
          approvers={approvers}
          writer={writer}
          dept={dept}
          date={date}
          docNo={docNo}
        />

        {/* 양식별 템플릿 */}
        <div className="bg-white border border-gray-200 rounded-sm px-5 py-4">
          {formType === "장비 구매 요청서" ? (
            <EquipmentPurchaseTemplate data={documentData} onChange={onChange} readonly={readonly} />
          ) : formType === "출장 신청서" ? (
            <BusinessTripTemplate data={documentData} onChange={onChange} readonly={readonly} />
          ) : formType === "지출 결의서" ? (
            <ExpenseResolutionTemplate data={documentData} onChange={onChange} readonly={readonly} />
          ) : (
            <GenericTemplate formType={formType} data={documentData} onChange={onChange} readonly={readonly} />
          )}
        </div>

        {/* 서명란 */}
        <div className="flex justify-end">
          <div className="text-right space-y-1">
            <p className="text-xs text-gray-400">위와 같이 결재를 요청합니다.</p>
            <p className="text-xs text-gray-500">{date}</p>
            <p className="text-sm text-gray-700" style={{ fontWeight: 600 }}>{dept} {writer} 올림</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   유틸: document_data에서 isBodyFilled 계산
───────────────────────────────────────────────── */
export function isDocumentDataFilled(formType: FormType, data: DocumentData): boolean {
  if (formType === "장비 구매 요청서") {
    return (
      (data.purpose || "").trim().length > 0 &&
      (data.itemName || "").trim().length > 0 &&
      (data.quantity || "").trim().length > 0 &&
      (data.unitPrice || "").trim().length > 0
    );
  }
  if (formType === "출장 신청서") {
    return (
      (data.destination || "").trim().length > 0 &&
      (data.period || "").trim().length > 0 &&
      (data.purpose || "").trim().length > 0
    );
  }
  if (formType === "지출 결의서") {
    return (data.purpose || "").trim().length > 0 && (data.period || "").trim().length > 0;
  }
  return (data.purpose || "").trim().length > 0;
}

// 주의: 프론트엔드는 순수 HTML 텍스트만 전송합니다. XSS 방어 및 데이터 정제는 백엔드의 HtmlSanitizerAdapter(Filter Layer)에서 전적으로 수행합니다. (ADR-004 참조)
export function buildContentSnapshot(formType: FormType, data: DocumentData): string {
  const rows = Object.entries(data)
    .map(([k, v]) => `<tr><th>${k}</th><td>${typeof v === "string" ? v : JSON.stringify(v)}</td></tr>`)
    .join("");
  return `<html><body><h1>${formType}</h1><table>${rows}</table></body></html>`;
}
