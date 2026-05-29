import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Type,
  Hash,
  Calendar,
  ChevronDown,
  Table as TableIcon,
  AlignLeft,
  GripVertical,
  Trash2,
  Plus,
  Save,
  Eye,
  ShieldAlert,
  Users,
  AlertTriangle,
  CheckCircle2,
  X,
  Layers,
  PanelLeft,
  PanelRight,
  ToggleLeft,
  ToggleRight,
  Database,
  ChevronRight,
  FileText,
} from "lucide-react";

/* ─────────────────────────────────────────────────
   타입
───────────────────────────────────────────────── */
type FieldType = "text" | "number" | "date" | "select" | "longtext" | "table";

type FormField = {
  id: string;
  type: FieldType;
  label: string;
  key: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  rows?: number;
  cols?: string[];
};

type Position = "제한 없음" | "사원" | "대리" | "과장" | "차장" | "부장" | "임원";
type JobTitle = "제한 없음" | "부서원" | "파트장" | "팀장" | "실장" | "본부장" | "재무 책임자";

type ApprovalStep = {
  position: Position;
  job_title: JobTitle;
};

type SchemaField = {
  key: string;
  label: string;
  type: string;
  required: boolean;
  description: string;
};

type TemplateId =
  | "expense"
  | "equipment"
  | "business_trip"
  | "leave"
  | "overtime";

type TemplateDefinition = {
  id: TemplateId;
  name: string;
  fields: FormField[];
  schema: SchemaField[];
  defaultApproverLine: ApprovalStep[];
};

const POSITION_OPTIONS: Position[] = [
  "제한 없음", "사원", "대리", "과장", "차장", "부장", "임원",
];
const JOB_TITLE_OPTIONS: JobTitle[] = [
  "제한 없음", "부서원", "파트장", "팀장", "실장", "본부장", "재무 책임자",
];

const FIELD_PRESETS: {
  type: FieldType;
  label: string;
  icon: React.ReactNode;
  defaultKey: string;
}[] = [
  { type: "text",     label: "텍스트 입력",  icon: <Type size={14} />,        defaultKey: "text_field" },
  { type: "number",   label: "숫자(금액)",   icon: <Hash size={14} />,        defaultKey: "amount" },
  { type: "date",     label: "날짜 선택",    icon: <Calendar size={14} />,    defaultKey: "date" },
  { type: "select",   label: "드롭다운",     icon: <ChevronDown size={14} />, defaultKey: "selection" },
  { type: "longtext", label: "여러 줄 입력", icon: <AlignLeft size={14} />,   defaultKey: "description" },
  { type: "table",    label: "표 삽입",      icon: <TableIcon size={14} />,   defaultKey: "items" },
];

const FIELD_LABEL: Record<FieldType, string> = {
  text: "텍스트",
  number: "숫자",
  date: "날짜",
  select: "드롭다운",
  longtext: "장문",
  table: "표",
};

const SCHEMA_TYPE_COLOR: Record<string, string> = {
  string:  "bg-blue-50 text-blue-700",
  number:  "bg-emerald-50 text-emerald-700",
  date:    "bg-violet-50 text-violet-700",
  enum:    "bg-amber-50 text-amber-700",
  array:   "bg-orange-50 text-orange-700",
  text:    "bg-gray-100 text-gray-600",
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

/* ─────────────────────────────────────────────────
   템플릿 정의
───────────────────────────────────────────────── */
const TEMPLATES: TemplateDefinition[] = [
  /* ① 지출결의서 */
  {
    id: "expense",
    name: "지출결의서",
    defaultApproverLine: [
      { position: "과장", job_title: "팀장" },
      { position: "부장", job_title: "본부장" },
    ],
    fields: [
      { id: "f1", type: "text",     label: "제목",        key: "title",        required: true },
      { id: "f2", type: "date",     label: "집행 예정일", key: "exec_date",    required: true },
      { id: "f3", type: "select",   label: "비용 분류",   key: "expense_type", required: true, options: ["출장비", "회의비", "비품 구매", "외주 용역"] },
      { id: "f4", type: "table",    label: "지출 내역",   key: "items",        required: true, rows: 3, cols: ["적요", "수량", "단가", "금액"] },
      { id: "f5", type: "number",   label: "합계 금액",   key: "total_amount", required: true, placeholder: "원" },
      { id: "f6", type: "longtext", label: "지출 사유",   key: "reason",       required: false, rows: 4 },
    ],
    schema: [
      { key: "title",        label: "제목",        type: "string", required: true,  description: "문서 제목 (검색 인덱스 대상)" },
      { key: "exec_date",    label: "집행 예정일", type: "date",   required: true,  description: "ISO 8601 형식 저장 (YYYY-MM-DD)" },
      { key: "expense_type", label: "비용 분류",   type: "enum",   required: true,  description: "비용 카테고리 코드 (예: TRAVEL, MEETING)" },
      { key: "items",        label: "지출 내역",   type: "array",  required: true,  description: "행 단위 JSON 배열 [{적요, 수량, 단가, 금액}]" },
      { key: "total_amount", label: "합계 금액",   type: "number", required: true,  description: "정수형 원화 금액 · 위험도 분류 기준값" },
      { key: "reason",       label: "지출 사유",   type: "text",   required: false, description: "자유 입력 장문 텍스트" },
    ],
  },

  /* ② 장비구매요청서 */
  {
    id: "equipment",
    name: "장비구매요청서",
    defaultApproverLine: [
      { position: "과장", job_title: "팀장" },
      { position: "부장", job_title: "본부장" },
      { position: "임원", job_title: "재무 책임자" },
    ],
    fields: [
      { id: "g1", type: "text",     label: "요청 제목",     key: "title",          required: true },
      { id: "g2", type: "text",     label: "요청 부서",     key: "dept",           required: true },
      { id: "g3", type: "date",     label: "납기 요청일",   key: "due_date",       required: true },
      { id: "g4", type: "table",    label: "구매 품목",     key: "items",          required: true, rows: 3, cols: ["품목명", "규격", "수량", "단가", "금액"] },
      { id: "g5", type: "number",   label: "총 예상 금액",  key: "total_amount",   required: true, placeholder: "원" },
      { id: "g6", type: "longtext", label: "구매 사유",     key: "reason",         required: true, rows: 4 },
    ],
    schema: [
      { key: "title",        label: "요청 제목",   type: "string", required: true,  description: "문서 제목 (검색 인덱스 대상)" },
      { key: "dept",         label: "요청 부서",   type: "string", required: true,  description: "부서 코드 또는 부서명 문자열" },
      { key: "due_date",     label: "납기 요청일", type: "date",   required: true,  description: "ISO 8601 형식 저장 (YYYY-MM-DD)" },
      { key: "items",        label: "구매 품목",   type: "array",  required: true,  description: "행 단위 JSON 배열 [{품목명, 규격, 수량, 단가, 금액}]" },
      { key: "total_amount", label: "총 예상 금액",type: "number", required: true,  description: "정수형 원화 금액 · 위험도 분류 기준값" },
      { key: "reason",       label: "구매 사유",   type: "text",   required: true,  description: "자유 입력 장문 텍스트" },
    ],
  },

  /* ③ 출장신청서 */
  {
    id: "business_trip",
    name: "출장신청서",
    defaultApproverLine: [
      { position: "대리", job_title: "팀장" },
      { position: "부장", job_title: "본부장" },
    ],
    fields: [
      { id: "h1", type: "text",     label: "출장 목적",    key: "purpose",       required: true },
      { id: "h2", type: "date",     label: "출발일",       key: "start_date",    required: true },
      { id: "h3", type: "date",     label: "귀환일",       key: "end_date",      required: true },
      { id: "h4", type: "text",     label: "출장지",       key: "destination",   required: true },
      { id: "h5", type: "text",     label: "방문 거래처",  key: "client",        required: false },
      { id: "h6", type: "table",    label: "예상 경비",    key: "expenses",      required: true, rows: 3, cols: ["항목", "예상 금액"] },
      { id: "h7", type: "longtext", label: "출장 상세 내용",key: "description",  required: false, rows: 4 },
    ],
    schema: [
      { key: "purpose",     label: "출장 목적",    type: "string", required: true,  description: "출장 목적 요약 (검색 대상)" },
      { key: "start_date",  label: "출발일",       type: "date",   required: true,  description: "ISO 8601 형식" },
      { key: "end_date",    label: "귀환일",       type: "date",   required: true,  description: "ISO 8601 형식" },
      { key: "destination", label: "출장지",       type: "string", required: true,  description: "국가/도시명 또는 지역 코드" },
      { key: "client",      label: "방문 거래처",  type: "string", required: false, description: "거래처명 자유 입력" },
      { key: "expenses",    label: "예상 경비",    type: "array",  required: true,  description: "행 단위 JSON 배열 [{항목, 예상 금액}]" },
      { key: "description", label: "상세 내용",    type: "text",   required: false, description: "자유 입력 장문 텍스트" },
    ],
  },

  /* ④ 휴가신청서 */
  {
    id: "leave",
    name: "휴가신청서",
    defaultApproverLine: [
      { position: "제한 없음", job_title: "팀장" },
    ],
    fields: [
      { id: "i1", type: "select",   label: "휴가 종류",      key: "leave_type",   required: true, options: ["연차", "반차(오전)", "반차(오후)", "병가", "경조사"] },
      { id: "i2", type: "date",     label: "휴가 시작일",    key: "start_date",   required: true },
      { id: "i3", type: "date",     label: "휴가 종료일",    key: "end_date",     required: true },
      { id: "i4", type: "number",   label: "총 사용 일수",   key: "total_days",   required: true, placeholder: "일" },
      { id: "i5", type: "text",     label: "업무 인수인계자",key: "handover_to",  required: true },
      { id: "i6", type: "longtext", label: "사유",           key: "reason",       required: false, rows: 3 },
    ],
    schema: [
      { key: "leave_type",  label: "휴가 종류",      type: "enum",   required: true,  description: "코드: ANNUAL | HALF_AM | HALF_PM | SICK | SPECIAL" },
      { key: "start_date",  label: "휴가 시작일",    type: "date",   required: true,  description: "ISO 8601 형식" },
      { key: "end_date",    label: "휴가 종료일",    type: "date",   required: true,  description: "ISO 8601 형식" },
      { key: "total_days",  label: "총 사용 일수",   type: "number", required: true,  description: "소수점 허용 (반차 = 0.5)" },
      { key: "handover_to", label: "업무 인수인계자",type: "string", required: true,  description: "직원 ID 또는 이름 문자열" },
      { key: "reason",      label: "사유",           type: "text",   required: false, description: "자유 입력 장문 텍스트" },
    ],
  },

  /* ⑤ 시간외근무신청서 */
  {
    id: "overtime",
    name: "시간외근무신청서",
    defaultApproverLine: [
      { position: "제한 없음", job_title: "팀장" },
      { position: "과장",      job_title: "실장" },
    ],
    fields: [
      { id: "j1", type: "date",     label: "근무 일자",    key: "work_date",     required: true },
      { id: "j2", type: "text",     label: "시작 시각",    key: "start_time",    required: true, placeholder: "예: 18:00" },
      { id: "j3", type: "text",     label: "종료 시각",    key: "end_time",      required: true, placeholder: "예: 22:00" },
      { id: "j4", type: "number",   label: "총 초과 시간", key: "total_hours",   required: true, placeholder: "시간" },
      { id: "j5", type: "select",   label: "근무 장소",    key: "location",      required: true, options: ["사내", "재택", "출장지"] },
      { id: "j6", type: "longtext", label: "업무 내용",    key: "work_content",  required: true, rows: 4 },
    ],
    schema: [
      { key: "work_date",    label: "근무 일자",    type: "date",   required: true,  description: "ISO 8601 형식" },
      { key: "start_time",   label: "시작 시각",    type: "string", required: true,  description: "HH:MM 24시 형식 문자열" },
      { key: "end_time",     label: "종료 시각",    type: "string", required: true,  description: "HH:MM 24시 형식 문자열" },
      { key: "total_hours",  label: "총 초과 시간", type: "number", required: true,  description: "숫자형 (시간 단위, 소수점 허용)" },
      { key: "location",     label: "근무 장소",    type: "enum",   required: true,  description: "코드: OFFICE | REMOTE | BUSINESS_TRIP" },
      { key: "work_content", label: "업무 내용",    type: "text",   required: true,  description: "자유 입력 장문 텍스트" },
    ],
  },
];

function describeApprover(step: ApprovalStep): string {
  const p = step.position === "제한 없음" ? "" : step.position;
  const j = step.job_title === "제한 없음" ? "" : step.job_title;
  if (p && j) return `${p} / ${j}`;
  if (p) return p;
  if (j) return j;
  return "제한 없음";
}

/* ─────────────────────────────────────────────────
   필드 렌더러 (캔버스 미리보기)
───────────────────────────────────────────────── */
function FieldPreview({ field }: { field: FormField }) {
  const baseInput = "w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded bg-white";
  if (field.type === "text") {
    return (
      <input
        type="text"
        className={baseInput}
        placeholder={field.placeholder ?? `${field.label}을(를) 입력`}
        disabled
      />
    );
  }
  if (field.type === "number") {
    return (
      <div className="flex items-center gap-2">
        <input type="text" className={`${baseInput} flex-1`} placeholder="0" disabled />
        <span className="text-xs text-gray-500">{field.placeholder ?? "원"}</span>
      </div>
    );
  }
  if (field.type === "date") {
    return <input type="date" className={baseInput} disabled />;
  }
  if (field.type === "longtext") {
    return (
      <textarea
        className={`${baseInput} resize-none`}
        rows={field.rows ?? 3}
        placeholder={field.placeholder ?? "내용을 입력하세요"}
        disabled
      />
    );
  }
  if (field.type === "select") {
    return (
      <select className={baseInput} disabled>
        {(field.options ?? []).map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    );
  }
  if (field.type === "table") {
    const cols = field.cols ?? ["항목", "값"];
    const rows = field.rows ?? 2;
    return (
      <div className="border border-gray-300 rounded overflow-hidden">
        <div
          className="grid bg-gray-50 border-b border-gray-300"
          style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}
        >
          {cols.map((c, i) => (
            <div
              key={i}
              className={`px-2.5 py-1.5 text-xs text-gray-600 ${i < cols.length - 1 ? "border-r border-gray-300" : ""}`}
              style={{ fontWeight: 600 }}
            >
              {c}
            </div>
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className={`grid ${r < rows - 1 ? "border-b border-gray-200" : ""}`}
            style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}
          >
            {cols.map((_, c) => (
              <div
                key={c}
                className={`px-2.5 py-1.5 ${c < cols.length - 1 ? "border-r border-gray-200" : ""}`}
              >
                <div className="h-4 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }
  return null;
}

type RightPanelTab = "properties" | "schema";

/* ─────────────────────────────────────────────────
   메인 페이지
───────────────────────────────────────────────── */
export function FormBuilderPage() {
  const [templateId, setTemplateId] = useState<TemplateId>("expense");
  const currentTemplate = TEMPLATES.find((t) => t.id === templateId)!;

  const [formTitle, setFormTitle] = useState(currentTemplate.name);
  const [fields, setFields] = useState<FormField[]>(currentTemplate.fields);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highRiskAmount, setHighRiskAmount] = useState("1,000,000");
  const [approverLine, setApproverLine] = useState<ApprovalStep[]>(
    currentTemplate.defaultApproverLine
  );
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [rightTab, setRightTab] = useState<RightPanelTab>("properties");

  const selected = useMemo(
    () => fields.find((f) => f.id === selectedId) ?? null,
    [fields, selectedId]
  );

  const handleTemplateChange = (newId: TemplateId) => {
    const tpl = TEMPLATES.find((t) => t.id === newId)!;
    setTemplateId(newId);
    setFormTitle(tpl.name);
    setFields(tpl.fields);
    setApproverLine(tpl.defaultApproverLine);
    setSelectedId(null);
  };

  const addField = (type: FieldType) => {
    const preset = FIELD_PRESETS.find((p) => p.type === type)!;
    const newField: FormField = {
      id: uid(),
      type,
      label: preset.label,
      key: `${preset.defaultKey}_${fields.length + 1}`,
      required: false,
      ...(type === "select" ? { options: ["옵션 1", "옵션 2"] } : {}),
      ...(type === "table" ? { rows: 2, cols: ["항목", "값"] } : {}),
    };
    setFields([...fields, newField]);
    setSelectedId(newField.id);
    setRightTab("properties");
  };

  const updateField = (id: string, patch: Partial<FormField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const move = (id: string, dir: -1 | 1) => {
    const i = fields.findIndex((f) => f.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= fields.length) return;
    const next = [...fields];
    [next[i], next[j]] = [next[j], next[i]];
    setFields(next);
  };

  const updateApprover = (idx: number, patch: Partial<ApprovalStep>) => {
    const next = [...approverLine];
    next[idx] = { ...next[idx], ...patch };
    setApproverLine(next);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      const dupKey = fields
        .map((f) => f.key)
        .find((k, i, arr) => arr.indexOf(k) !== i);
      if (dupKey) {
        setToast({
          type: "error",
          msg: `필드 키 중복: "${dupKey}". 필드 키는 서식 내에서 고유해야 합니다.`,
        });
        return;
      }
      if (!formTitle.trim()) {
        setToast({ type: "error", msg: "서식 제목이 비어 있습니다." });
        return;
      }
      setToast({
        type: "success",
        msg: `"${formTitle}" 서식이 저장되었습니다. 기안자 화면에서 즉시 적용됩니다.`,
      });
    }, 700);
  };

  return (
    <div
      className="flex flex-col bg-gray-50"
      style={{ height: "calc(100vh - 3.5rem)" }}
    >
      {/* ── Page Header ── */}
      <div className="px-6 pt-5 pb-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
          <span>부서 관리</span>
          <ChevronRight size={12} className="text-gray-300" />
          <span className="text-gray-800" style={{ fontWeight: 600 }}>
            영업본부 결재 양식 관리
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs bg-blue-600 text-white px-2.5 py-0.5 rounded-full ml-1" style={{ fontWeight: 600 }}>
            💼 영업본부 부서 관리자
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* 템플릿 선택 영역 */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-gray-400 shrink-0" />
              <label className="text-xs text-gray-500 shrink-0">
                문서 양식 템플릿
              </label>
              <select
                value={templateId}
                onChange={(e) =>
                  handleTemplateChange(e.target.value as TemplateId)
                }
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                {TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="h-5 w-px bg-gray-200" />
            <input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none px-1 -mx-1"
              style={{ fontSize: "1rem", fontWeight: 700, minWidth: 180 }}
              placeholder="서식 제목"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition-all ${
                saving
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
              }`}
            >
              <Save size={13} /> {saving ? "저장 중..." : "서식 저장"}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          부서 관리자가 사내 고유 서식과 결재 라인을 정의합니다. 저장 즉시
          기안자 화면에 반영됩니다.
        </p>
      </div>

      {/* ── Three-column workspace ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* ─── 좌측: 도구상자 + 결재선 ─── */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
            <PanelLeft size={13} className="text-gray-500" />
            <span
              className="text-xs text-gray-700"
              style={{ fontWeight: 600 }}
            >
              입력 도구
            </span>
          </div>
          <div className="p-3 space-y-1.5 overflow-y-auto">
            {FIELD_PRESETS.map((p) => (
              <button
                key={p.type}
                onClick={() => addField(p.type)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-left transition-colors group"
              >
                <span className="w-7 h-7 rounded bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center text-gray-600 group-hover:text-blue-600 transition-colors">
                  {p.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-800">{p.label}</p>
                  <p className="text-xs text-gray-400">+ 캔버스에 추가</p>
                </div>
                <Plus size={12} className="text-gray-400 group-hover:text-blue-600" />
              </button>
            ))}
          </div>

          {/* 결재선 템플릿 */}
          <div className="mt-auto border-t border-gray-200 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-1.5 text-xs text-gray-700"
                style={{ fontWeight: 600 }}
              >
                <Users size={12} /> 결재선 템플릿
              </div>
              <span className="text-xs text-gray-400">직위 · 직책 기준</span>
            </div>

            <div className="space-y-2">
              {approverLine.map((step, i) => (
                <div
                  key={i}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-2 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs text-blue-700">
                      <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span style={{ fontWeight: 600 }}>{i + 1}차 결재</span>
                    </span>
                    <button
                      onClick={() =>
                        setApproverLine(approverLine.filter((_, x) => x !== i))
                      }
                      className="text-gray-300 hover:text-red-500"
                      title="결재 단계 삭제"
                    >
                      <X size={11} />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">
                      요구 직위 (Position)
                    </label>
                    <select
                      value={step.position}
                      onChange={(e) =>
                        updateApprover(i, {
                          position: e.target.value as Position,
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-400"
                    >
                      {POSITION_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">
                      요구 직책 (Job Title)
                    </label>
                    <select
                      value={step.job_title}
                      onChange={(e) =>
                        updateApprover(i, {
                          job_title: e.target.value as JobTitle,
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-400"
                    >
                      {JOB_TITLE_OPTIONS.map((j) => (
                        <option key={j} value={j}>
                          {j}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() =>
                setApproverLine([
                  ...approverLine,
                  { position: "제한 없음", job_title: "제한 없음" },
                ])
              }
              className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-blue-600 border border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Plus size={11} /> 결재 단계 추가
            </button>
          </div>
        </aside>

        {/* ─── 중앙: WYSIWYG 서식 캔버스 ─── */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white border border-gray-300 rounded shadow-sm">
                {/* 문서 헤더 */}
                <div className="flex items-start justify-between px-6 py-4 border-b border-gray-300 bg-white gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded bg-blue-700 flex items-center justify-center shrink-0">
                      <span
                        className="text-white text-xs"
                        style={{ fontWeight: 700 }}
                      >
                        CORP
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">
                        전자결재 · 사내 고유 서식
                      </p>
                      <h3
                        className="text-gray-900"
                        style={{ fontWeight: 700 }}
                      >
                        {formTitle || "(제목 없음)"}
                      </h3>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <p className="text-xs text-gray-400 mb-1">결재</p>
                    <div className="flex border border-gray-400">
                      <div
                        className="border-r border-gray-400 px-3 py-1 bg-gray-50 text-center"
                        style={{ minWidth: 64 }}
                      >
                        <p
                          className="text-xs text-gray-600"
                          style={{ fontWeight: 600 }}
                        >
                          기안
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">기안자</p>
                      </div>
                      {approverLine.map((step, i) => (
                        <div
                          key={i}
                          className="border-r border-gray-400 last:border-r-0 px-3 py-1 bg-gray-50 text-center"
                          style={{ minWidth: 64 }}
                        >
                          <p
                            className="text-xs text-gray-600"
                            style={{ fontWeight: 600 }}
                          >
                            {i + 1}차
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {describeApprover(step)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 캔버스 */}
                {fields.length === 0 ? (
                  <div className="px-6 py-16 text-center text-gray-400">
                    <Layers
                      size={32}
                      className="mx-auto mb-3 text-gray-300"
                    />
                    <p className="text-sm">
                      좌측 도구상자에서 입력 필드를 추가해 양식을 구성하세요.
                    </p>
                  </div>
                ) : (
                  <div className="p-6 space-y-3">
                    {fields.map((f) => {
                      const isSel = f.id === selectedId;
                      return (
                        <motion.div
                          key={f.id}
                          layout
                          onClick={() => {
                            setSelectedId(f.id);
                            setRightTab("properties");
                          }}
                          className={`relative group rounded-lg border transition-colors cursor-pointer ${
                            isSel
                              ? "border-blue-400 ring-2 ring-blue-100 bg-blue-50/30"
                              : "border-transparent hover:border-gray-300"
                          } p-3`}
                        >
                          <div
                            className={`absolute -left-9 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 transition-opacity ${
                              isSel
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                            }`}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                move(f.id, -1);
                              }}
                              className="w-6 h-5 text-gray-400 hover:text-gray-700 text-xs"
                            >
                              ▲
                            </button>
                            <GripVertical
                              size={12}
                              className="text-gray-300"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                move(f.id, 1);
                              }}
                              className="w-6 h-5 text-gray-400 hover:text-gray-700 text-xs"
                            >
                              ▼
                            </button>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span
                                  className="text-sm text-gray-800"
                                  style={{ fontWeight: 600 }}
                                >
                                  {f.label}
                                </span>
                                {f.required && (
                                  <span className="text-xs text-red-500">
                                    *
                                  </span>
                                )}
                                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                  {FIELD_LABEL[f.type]}
                                </span>
                              </div>
                              <FieldPreview field={f} />
                            </div>
                            {isSel && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeField(f.id);
                                }}
                                className="shrink-0 w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* ─── 우측: 속성 패널 + 스키마 매핑 ─── */}
        <aside className="w-80 bg-white border-l border-gray-200 flex flex-col shrink-0">
          {/* 탭 헤더 */}
          <div className="border-b border-gray-200 flex shrink-0">
            <button
              onClick={() => setRightTab("properties")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs transition-colors border-b-2 ${
                rightTab === "properties"
                  ? "border-blue-500 text-blue-700 bg-blue-50/50"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              style={{ fontWeight: rightTab === "properties" ? 600 : 400 }}
            >
              <PanelRight size={12} />
              필드 속성
            </button>
            <button
              onClick={() => setRightTab("schema")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs transition-colors border-b-2 ${
                rightTab === "schema"
                  ? "border-blue-500 text-blue-700 bg-blue-50/50"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              style={{ fontWeight: rightTab === "schema" ? 600 : 400 }}
            >
              <Database size={12} />
              데이터 필드 바인딩
            </button>
          </div>

          {/* ── 탭: 필드 속성 ── */}
          {rightTab === "properties" && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selected ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-700">
                        표시 이름 (Label)
                      </label>
                      <input
                        value={selected.label}
                        onChange={(e) =>
                          updateField(selected.id, { label: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        placeholder="사용자에게 보여질 이름"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-700">
                        필드 키 (JSON Key)
                      </label>
                      <input
                        value={selected.key}
                        onChange={(e) =>
                          updateField(selected.id, {
                            key: e.target.value
                              .replace(/\s+/g, "_")
                              .toLowerCase(),
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-400 font-mono"
                        placeholder="json_key_name"
                      />
                      <p className="text-xs text-gray-400">
                        DB 저장 시 사용되는 고유 식별자입니다.
                      </p>
                    </div>

                    {(selected.type === "text" ||
                      selected.type === "number" ||
                      selected.type === "longtext") && (
                      <div className="space-y-1.5">
                        <label className="text-xs text-gray-700">
                          플레이스홀더
                        </label>
                        <input
                          value={selected.placeholder ?? ""}
                          onChange={(e) =>
                            updateField(selected.id, {
                              placeholder: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-400"
                          placeholder="입력 안내 텍스트"
                        />
                      </div>
                    )}

                    <button
                      onClick={() =>
                        updateField(selected.id, {
                          required: !selected.required,
                        })
                      }
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all cursor-pointer ${
                        selected.required
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {selected.required ? (
                          <ToggleRight size={16} className="text-blue-600" />
                        ) : (
                          <ToggleLeft size={16} className="text-gray-400" />
                        )}
                        <span className="text-xs">필수 입력</span>
                      </div>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full ${
                          selected.required
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {selected.required ? "필수" : "선택"}
                      </span>
                    </button>

                    {selected.type === "select" && (
                      <div className="space-y-1.5">
                        <label className="text-xs text-gray-700">
                          선택 옵션 (줄바꿈 구분)
                        </label>
                        <textarea
                          value={(selected.options ?? []).join("\n")}
                          onChange={(e) =>
                            updateField(selected.id, {
                              options: e.target.value
                                .split("\n")
                                .filter(Boolean),
                            })
                          }
                          rows={4}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:border-blue-400"
                        />
                      </div>
                    )}

                    {selected.type === "table" && (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-xs text-gray-700">
                            열 헤더 (쉼표 구분)
                          </label>
                          <input
                            value={(selected.cols ?? []).join(", ")}
                            onChange={(e) =>
                              updateField(selected.id, {
                                cols: e.target.value
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-400"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-gray-700">
                            기본 행 수
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={selected.rows ?? 2}
                            onChange={(e) =>
                              updateField(selected.id, {
                                rows: Math.max(1, Number(e.target.value)),
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-400"
                          />
                        </div>
                      </>
                    )}

                    <div className="border-t border-gray-200 pt-3">
                      <button
                        onClick={() => removeField(selected.id)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-red-600 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={12} /> 이 필드 삭제
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <Eye size={24} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-xs">
                      캔버스에서 필드를 선택하면 속성을 설정할 수 있습니다.
                    </p>
                  </div>
                )}
              </div>

              {/* 위험도 기준 */}
              <div className="border-t border-gray-200 p-4 space-y-3 bg-gray-50 shrink-0">
                <div
                  className="flex items-center gap-1.5 text-xs text-gray-700"
                  style={{ fontWeight: 600 }}
                >
                  <ShieldAlert size={12} className="text-red-500" /> 위험도
                  기준 설정
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-500">
                    고위험 자동 분류 금액 (원)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      value={highRiskAmount}
                      onChange={(e) =>
                        setHighRiskAmount(
                          e.target.value.replace(/[^\d,]/g, "")
                        )
                      }
                      className="flex-1 min-w-0 px-2.5 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-red-400"
                    />
                    <span className="text-xs text-gray-500 shrink-0">
                      원 이상
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    이 금액을 초과하는 기안은 자동으로 고위험으로 분류되어
                    2FA·전체 열람 조건이 적용됩니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── 탭: 데이터 필드 바인딩 관리 ── */}
          {rightTab === "schema" && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
                <p className="text-xs text-gray-600 leading-relaxed">
                  각 UI 필드가 데이터베이스에 저장될 때 사용하는 JSON 키와
                  데이터 타입을 관리합니다.
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {currentTemplate.schema.map((s) => (
                  <div
                    key={s.key}
                    className="bg-white border border-gray-200 rounded-lg p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono">
                        {s.key}
                      </code>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                            SCHEMA_TYPE_COLOR[s.type] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {s.type}
                        </span>
                        {s.required ? (
                          <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded">
                            필수
                          </span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">
                            선택
                          </span>
                        )}
                      </div>
                    </div>
                    <p
                      className="text-xs text-gray-700"
                      style={{ fontWeight: 600 }}
                    >
                      {s.label}
                    </p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {s.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <Database size={11} className="text-gray-400" />
                  <span
                    className="text-xs text-gray-600"
                    style={{ fontWeight: 600 }}
                  >
                    스키마 타입 범례
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries(SCHEMA_TYPE_COLOR).map(([type, cls]) => (
                    <span
                      key={type}
                      className={`text-xs px-2 py-0.5 rounded font-mono text-center ${cls}`}
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-6 right-6 z-50"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            onAnimationComplete={() =>
              setTimeout(() => setToast(null), 3200)
            }
          >
            <div
              className={`flex items-start gap-2.5 max-w-sm px-4 py-3 rounded-xl shadow-2xl border ${
                toast.type === "success"
                  ? "bg-emerald-600 border-emerald-700 text-white"
                  : "bg-red-600 border-red-700 text-white"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs leading-relaxed">{toast.msg}</div>
              <button
                onClick={() => setToast(null)}
                className="text-white/70 hover:text-white shrink-0"
              >
                <X size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
