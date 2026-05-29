import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast, Toaster } from "sonner"; // 💡 [추가] 토스트 메시지용
import {
  Type, Hash, Calendar, ChevronDown, Table as TableIcon,
  AlignLeft, GripVertical, Trash2, Plus, Save, Eye,
  ShieldAlert, Users, AlertTriangle, CheckCircle2, X,
  Layers, PanelLeft, PanelRight, ToggleLeft, ToggleRight,
  ChevronRight, FileText,
} from "lucide-react";

export type FieldType = "text" | "number" | "date" | "select" | "longtext" | "table";

export type FormField = {
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

export type Position = "제한 없음" | "사원" | "대리" | "과장" | "차장" | "부장" | "임원";
export type JobTitle = "제한 없음" | "부서원" | "파트장" | "팀장" | "실장" | "본부장" | "재무 책임자";
export type ApprovalRole = "기안" | "검토" | "결재" | "합의" | "재무합의" | "참조";

export type ApprovalStep = {
  position: Position;
  job_title: JobTitle;
  role: ApprovalRole;
  canJunggyo: boolean;
};

export type TemplateId = "expense" | "equipment" | "business_trip" | "leave" | "overtime";

export type TemplateDefinition = {
  id: TemplateId;
  name: string;
  fields: FormField[];
  defaultApproverLine: ApprovalStep[];
};

const POSITION_OPTIONS: Position[] = [
  "제한 없음", "사원", "대리", "과장", "차장", "부장", "임원",
];
const JOB_TITLE_OPTIONS: JobTitle[] = [
  "제한 없음", "부서원", "파트장", "팀장", "실장", "본부장", "재무 책임자",
];

const FIELD_PRESETS: { type: FieldType; label: string; icon: React.ReactNode; defaultKey: string }[] = [
  { type: "text",     label: "텍스트 입력",  icon: <Type size={14} />,        defaultKey: "text_field" },
  { type: "number",   label: "숫자(금액)",   icon: <Hash size={14} />,        defaultKey: "amount" },
  { type: "date",     label: "날짜 선택",    icon: <Calendar size={14} />,    defaultKey: "date" },
  { type: "select",   label: "드롭다운",     icon: <ChevronDown size={14} />, defaultKey: "selection" },
  { type: "longtext", label: "여러 줄 입력", icon: <AlignLeft size={14} />,   defaultKey: "description" },
  { type: "table",    label: "표 삽입",      icon: <TableIcon size={14} />,   defaultKey: "items" },
];

const FIELD_LABEL: Record<FieldType, string> = {
  text: "텍스트", number: "숫자", date: "날짜", select: "드롭다운", longtext: "장문", table: "표",
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "expense",
    name: "지출결의서",
    defaultApproverLine: [
      { position: "과장", job_title: "팀장", role: "검토", canJunggyo: false },
      { position: "부장", job_title: "재무 책임자", role: "재무합의", canJunggyo: false },
      { position: "임원", job_title: "본부장", role: "결재", canJunggyo: true },
    ],
    fields: [
      { id: "f1", type: "text",     label: "제목",        key: "title",        required: true },
      { id: "f2", type: "date",     label: "집행 예정일", key: "exec_date",    required: true },
      { id: "f3", type: "select",   label: "비용 분류",   key: "expense_type", required: true, options: ["출장비", "회의비", "비품 구매", "외주 용역"] },
      { id: "f4", type: "table",    label: "지출 내역",   key: "items",        required: true, rows: 3, cols: ["적요", "수량", "단가", "금액"] },
      { id: "f5", type: "number",   label: "합계 금액",   key: "total_amount", required: true, placeholder: "원" },
      { id: "f6", type: "longtext", label: "지출 사유",   key: "reason",       required: false, rows: 4 },
    ],
  },
  {
    id: "equipment",
    name: "장비구매요청서",
    defaultApproverLine: [
      { position: "과장", job_title: "팀장", role: "검토", canJunggyo: false },
      { position: "팀장", job_title: "실장", role: "합의", canJunggyo: false },
      { position: "부장", job_title: "본부장", role: "결재", canJunggyo: true },
    ],
    fields: [
      { id: "g1", type: "text",     label: "요청 제목",     key: "title",          required: true },
      { id: "g2", type: "text",     label: "요청 부서",     key: "dept",           required: true },
      { id: "g3", type: "date",     label: "납기 요청일",   key: "due_date",       required: true },
      { id: "g4", type: "table",    label: "구매 품목",     key: "items",          required: true, rows: 3, cols: ["품목명", "규격", "수량", "단가", "금액"] },
      { id: "g5", type: "number",   label: "총 예상 금액",  key: "total_amount",   required: true, placeholder: "원" },
      { id: "g6", type: "longtext", label: "구매 사유",     key: "reason",         required: true, rows: 4 },
    ],
  },
  {
    id: "business_trip",
    name: "출장신청서",
    defaultApproverLine: [
      { position: "대리", job_title: "팀장", role: "결재", canJunggyo: false },
      { position: "부장", job_title: "본부장", role: "결재", canJunggyo: true },
    ],
    fields: [
      { id: "h1", type: "text",     label: "출장 목적",    key: "purpose",       required: true },
      { id: "h2", type: "date",     label: "출발일",       key: "start_date",    required: true },
      { id: "h3", type: "date",     label: "귀환일",       key: "end_date",      required: true },
      { id: "h4", type: "text",     label: "출장지",       key: "destination",   required: true },
      { id: "h5", type: "table",    label: "예상 경비",    key: "expenses",      required: true, rows: 3, cols: ["항목", "예상 금액"] },
      { id: "h6", type: "longtext", label: "출장 상세 내용",key: "description",  required: false, rows: 4 },
    ],
  },
  {
    id: "leave",
    name: "휴가신청서",
    defaultApproverLine: [
      { position: "제한 없음", job_title: "팀장", role: "결재", canJunggyo: true },
    ],
    fields: [
      { id: "i1", type: "select",   label: "휴가 종류",      key: "leave_type",  required: true, options: ["연차", "반차(오전)", "반차(오후)", "병가", "경조사"] },
      { id: "i2", type: "date",     label: "휴가 시작일",    key: "start_date",  required: true },
      { id: "i3", type: "date",     label: "휴가 종료일",    key: "end_date",    required: true },
      { id: "i4", type: "number",   label: "총 사용 일수",   key: "total_days",  required: true, placeholder: "일" },
      { id: "i5", type: "text",     label: "업무 인수인계자",key: "handover_to", required: true },
      { id: "i6", type: "longtext", label: "사유",           key: "reason",      required: false, rows: 3 },
    ],
  },
];

function FieldPreview({ field }: { field: FormField }) {
  const baseInput = "w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded bg-white";
  if (field.type === "text") return <input type="text" className={baseInput} placeholder={field.placeholder ?? `${field.label}을(를) 입력`} disabled />;
  if (field.type === "number") return <div className="flex items-center gap-2"><input type="text" className={`${baseInput} flex-1`} placeholder="0" disabled /><span className="text-xs text-gray-500">{field.placeholder ?? "원"}</span></div>;
  if (field.type === "date") return <input type="date" className={baseInput} disabled />;
  if (field.type === "longtext") return <textarea className={`${baseInput} resize-none`} rows={field.rows ?? 3} placeholder={field.placeholder ?? "내용을 입력하세요"} disabled />;
  if (field.type === "select") return <select className={baseInput} disabled>{(field.options ?? []).map((o) => <option key={o}>{o}</option>)}</select>;
  if (field.type === "table") {
    const cols = field.cols ?? ["항목", "값"];
    const rows = field.rows ?? 2;
    return (
      <div className="border border-gray-300 rounded overflow-hidden">
        <div className="grid bg-gray-50 border-b border-gray-300" style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}>
          {cols.map((c, i) => <div key={i} className={`px-2.5 py-1.5 text-xs text-gray-600 ${i < cols.length - 1 ? "border-r border-gray-300" : ""}`} style={{ fontWeight: 600 }}>{c.trim() || "새 열"}</div>)}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className={`grid ${r < rows - 1 ? "border-b border-gray-200" : ""}`} style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}>
            {cols.map((_, c) => <div key={c} className={`px-2.5 py-1.5 ${c < cols.length - 1 ? "border-r border-gray-200" : ""}`}><div className="h-4 bg-gray-100 rounded" /></div>)}
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export function FormBuilderPage() {
  const [templateId, setTemplateId] = useState<TemplateId>("expense");
  const currentTemplate = TEMPLATES.find((t) => t.id === templateId)!;

  const [formTitle, setFormTitle] = useState(currentTemplate.name);
  const [fields, setFields] = useState<FormField[]>(currentTemplate.fields);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highRiskAmount, setHighRiskAmount] = useState("1,000,000");
  const [approverLine, setApproverLine] = useState<ApprovalStep[]>(currentTemplate.defaultApproverLine);
  const [saving, setSaving] = useState(false);

  // 💡 [E1, E2 방어 로직] 컴포넌트 마운트 시 소관 부서 및 관리자 권한을 강제 검증합니다.
  useEffect(() => {
    // 💡 시연용 Mock 데이터 (일반 USER 권한이라고 가정)
    const mockUser = { role: "USER", departmentId: "sales_dept" }; 
    const currentFormDeptId = "sales_dept"; 

    if (mockUser.role !== "DEPT_ADMIN") {
      toast.error("접근 권한 없음", { description: "결재 양식을 수정할 부서 관리자 권한이 없습니다." });
    } else if (mockUser.departmentId !== currentFormDeptId) {
      toast.error("타 부서 소관 거부", { description: "해당 부서의 양식을 관리할 수 없습니다." });
    }
  }, [templateId]);

  const selected = useMemo(() => fields.find((f) => f.id === selectedId) ?? null, [fields, selectedId]);

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
      id: uid(), type, label: preset.label, key: `${preset.defaultKey}_${fields.length + 1}`, required: false,
      ...(type === "select" ? { options: ["옵션 1", "옵션 2"] } : {}),
      ...(type === "table" ? { rows: 2, cols: ["항목", "값"] } : {}),
    };
    setFields([...fields, newField]);
    setSelectedId(newField.id);
  };

  const updateField = (id: string, patch: Partial<FormField>) => setFields(fields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const removeField = (id: string) => { setFields(fields.filter((f) => f.id !== id)); if (selectedId === id) setSelectedId(null); };
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
    setFormTitle(prev => prev.trim());
    
    if (!formTitle.trim()) { 
      toast.error("서식 제목이 비어 있습니다."); 
      return; 
    }

    // 💡 [E4 방어 로직] 회사의 필수 결재 통제 단계(팀장/본부장 등) 누락 여부 검증
    const hasRequiredControlStep = approverLine.some(step => 
      step.job_title === "팀장" || step.job_title === "본부장" || step.job_title === "재무 책임자"
    );

    if (!hasRequiredControlStep) {
      toast.error("필수 결재 단계가 누락되었습니다.", { 
        description: "사내 규정에 따라 팀장 또는 본부장 이상의 결재선을 반드시 포함해야 합니다." 
      });
      return; // 조건 불충족 시 저장 트랜잭션을 원천 차단
    }

    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success(`"${formTitle}" 서식이 성공적으로 저장되었습니다.`, { description: "기안자 화면에서 즉시 적용됩니다." });
    }, 700);
  };

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: "calc(100vh - 3.5rem)" }}>
      <Toaster position="top-center" richColors /> {/* 💡 [추가] 토스트 컨테이너 */}

      {/* ── Page Header ── */}
      <div className="px-6 pt-5 pb-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
          <span>부서 관리</span> <ChevronRight size={12} className="text-gray-300" />
          <span className="text-gray-800" style={{ fontWeight: 600 }}>영업본부 결재 양식 관리</span>
          <span className="inline-flex items-center gap-1.5 text-xs bg-blue-600 text-white px-2.5 py-0.5 rounded-full ml-1" style={{ fontWeight: 600 }}>💼 영업본부 부서 관리자</span>
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-gray-400 shrink-0" />
              <label className="text-xs text-gray-500 shrink-0">문서 양식 템플릿</label>
              <select value={templateId} onChange={(e) => handleTemplateChange(e.target.value as TemplateId)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 cursor-pointer" style={{ fontWeight: 500 }}>
                {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="h-5 w-px bg-gray-200" />
            <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none px-1 -mx-1" style={{ fontSize: "1rem", fontWeight: 700, minWidth: 180 }} placeholder="서식 제목" />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleSave} disabled={saving} className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition-all ${saving ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"}`}>
              <Save size={13} /> {saving ? "저장 중..." : "서식 저장"}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">부서 관리자가 사내 고유 서식과 결재 라인을 정의합니다. 저장 즉시 기안자 화면에 반영됩니다.</p>
      </div>

      {/* ── Three-column workspace ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* ─── 좌측: 도구상자 + 결재선 ─── */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
            <PanelLeft size={13} className="text-gray-500" />
            <span className="text-xs text-gray-700" style={{ fontWeight: 600 }}>입력 도구</span>
          </div>
          <div className="p-3 space-y-1.5 overflow-y-auto">
            {FIELD_PRESETS.map((p) => (
              <button key={p.type} onClick={() => addField(p.type)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-left transition-colors group">
                <span className="w-7 h-7 rounded bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center text-gray-600 group-hover:text-blue-600 transition-colors">{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-800">{p.label}</p>
                  <p className="text-xs text-gray-400">+ 캔버스에 추가</p>
                </div>
                <Plus size={12} className="text-gray-400 group-hover:text-blue-600" />
              </button>
            ))}
          </div>

          <div className="mt-auto border-t border-gray-200 p-3 space-y-2.5 overflow-y-auto max-h-[45%]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-gray-700" style={{ fontWeight: 600 }}>
                <Users size={12} /> 결재선 템플릿
              </div>
            </div>

            <div className="space-y-2">
              {approverLine.map((step, i) => (
                <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs text-blue-700">
                      <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center">{i + 1}</span>
                      <span style={{ fontWeight: 600 }}>{i + 1}차 결재</span>
                    </span>
                    <button onClick={() => setApproverLine(approverLine.filter((_, x) => x !== i))} className="text-gray-300 hover:text-red-500"><X size={11} /></button>
                  </div>
                  <div className="space-y-1 pt-1">
                    <label className="text-xs text-gray-500 font-medium">요구 직위 (Position)</label>
                    <select value={step.position} onChange={(e) => updateApprover(i, { position: e.target.value as Position })} className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-400">
                      {POSITION_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-medium">요구 직책 (Job Title)</label>
                    <select value={step.job_title} onChange={(e) => updateApprover(i, { job_title: e.target.value as JobTitle })} className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-400">
                      {JOB_TITLE_OPTIONS.map((j) => <option key={j} value={j}>{j}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1 pt-1">
                    <label className="text-xs text-gray-500 font-medium">결재 방식 (Role)</label>
                    <select value={step.role ?? "결재"} onChange={(e) => updateApprover(i, { role: e.target.value as ApprovalRole })} className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-400">
                      <option value="결재">순차 결재 (결재)</option>
                      <option value="검토">사전 검토</option>
                      <option value="합의">병렬 합의 (동시 진행)</option>
                      <option value="재무합의">재무 합의</option>
                      <option value="참조">참조 (합의 후 공유)</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-1.5">
                    <input type="checkbox" id={`junggyo-${i}`} checked={step.canJunggyo ?? false} onChange={(e) => updateApprover(i, { canJunggyo: e.target.checked })} className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded cursor-pointer" />
                    <label htmlFor={`junggyo-${i}`} className="text-xs text-gray-600 cursor-pointer">해당 단계에 <span className="text-purple-600 font-bold">전결 권한</span> 부여</label>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setApproverLine([...approverLine, { position: "제한 없음", job_title: "제한 없음", role: "결재", canJunggyo: false }])} className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-blue-600 border border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors">
              <Plus size={11} /> 결재 단계 추가
            </button>
          </div>
        </aside>

        {/* ─── 중앙: WYSIWYG 서식 캔버스 ─── */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-gray-100">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white border border-gray-300 rounded shadow-sm">
                <div className="flex items-start justify-between px-6 py-4 border-b border-gray-300 bg-white gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded bg-blue-700 flex items-center justify-center shrink-0">
                      <span className="text-white text-xs" style={{ fontWeight: 700 }}>CORP</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">전자결재 · 사내 고유 서식</p>
                      <h3 className="text-gray-900" style={{ fontWeight: 700 }}>{formTitle || "(제목 없음)"}</h3>
                    </div>
                  </div>
                </div>

                {fields.length === 0 ? (
                  <div className="px-6 py-16 text-center text-gray-400">
                    <Layers size={32} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">좌측 도구상자에서 입력 필드를 추가해 양식을 구성하세요.</p>
                  </div>
                ) : (
                  <div className="p-6 space-y-3">
                    {fields.map((f) => {
                      const isSel = f.id === selectedId;
                      return (
                        <motion.div key={f.id} layout onClick={() => setSelectedId(f.id)} className={`relative group rounded-lg border transition-colors cursor-pointer ${isSel ? "border-blue-400 ring-2 ring-blue-100 bg-blue-50/30" : "border-transparent hover:border-gray-300"} p-3`}>
                          <div className={`absolute -left-9 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 transition-opacity ${isSel ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                            <button onClick={(e) => { e.stopPropagation(); move(f.id, -1); }} className="w-6 h-5 text-gray-400 hover:text-gray-700 text-xs">▲</button>
                            <GripVertical size={12} className="text-gray-300" />
                            <button onClick={(e) => { e.stopPropagation(); move(f.id, 1); }} className="w-6 h-5 text-gray-400 hover:text-gray-700 text-xs">▼</button>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{f.label}</span>
                                {f.required && <span className="text-xs text-red-500">*</span>}
                                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{FIELD_LABEL[f.type]}</span>
                              </div>
                              <FieldPreview field={f} />
                            </div>
                            {isSel && (
                              <button onClick={(e) => { e.stopPropagation(); removeField(f.id); }} className="shrink-0 w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
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

        {/* ─── 우측: 속성 패널 ─── */}
        <aside className="w-80 bg-white border-l border-gray-200 flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 shrink-0">
            <span className="flex items-center gap-1.5 text-sm text-gray-700" style={{ fontWeight: 600 }}>
              <PanelRight size={14} className="text-gray-500" /> 필드 속성 설정
            </span>
          </div>
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selected ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-700 font-bold">표시 이름 (Label)</label>
                    <input value={selected.label} onChange={(e) => updateField(selected.id, { label: e.target.value })} className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                  </div>
                  {(selected.type === "text" || selected.type === "number" || selected.type === "longtext") && (
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-700 font-bold">입력 가이드 (Placeholder)</label>
                      <input value={selected.placeholder ?? ""} onChange={(e) => updateField(selected.id, { placeholder: e.target.value }) } className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-400" />
                    </div>
                  )}
                  <button onClick={() => updateField(selected.id, { required: !selected.required }) } className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all cursor-pointer ${selected.required ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                    <div className="flex items-center gap-2">
                      {selected.required ? <ToggleRight size={16} className="text-blue-600" /> : <ToggleLeft size={16} className="text-gray-400" />}
                      <span className="text-xs font-bold">필수 입력</span>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${selected.required ? "bg-blue-100 text-blue-700 font-bold" : "bg-gray-200 text-gray-500"}`}>{selected.required ? "필수" : "선택"}</span>
                  </button>
                  {selected.type === "select" && (
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-700 font-bold">선택 옵션 (줄바꿈 구분)</label>
                      <textarea value={(selected.options ?? []).join("\n")} onChange={(e) => updateField(selected.id, { options: e.target.value.split("\n").filter(Boolean) }) } rows={4} className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:border-blue-400" />
                    </div>
                  )}
                  {selected.type === "table" && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs text-gray-700 font-bold">열 헤더 (쉼표 구분)</label>
                        <input value={(selected.cols ?? []).join(",")} onChange={(e) => updateField(selected.id, { cols: e.target.value.split(",") }) } className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-400 font-medium" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-gray-700 font-bold">기본 표기 행 수</label>
                        <input type="number" min={1} value={selected.rows ?? 2} onChange={(e) => updateField(selected.id, { rows: Math.max(1, Number(e.target.value)) }) } className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-400" />
                      </div>
                    </>
                  )}
                  <div className="border-t border-gray-200 pt-3">
                    <button onClick={() => removeField(selected.id)} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                      <Trash2 size={12} /> 이 필드 삭제
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <Eye size={24} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-xs">캔버스에서 필드를 선택하면 상세 속성을 설정할 수 있습니다.</p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 p-4 space-y-3 bg-gray-50 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-gray-700" style={{ fontWeight: 600 }}>
                <ShieldAlert size={12} className="text-red-500" /> 보안·위험도 기준 설정
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500">고위험 문서 분류 기준 (금액)</label>
                <div className="flex items-center gap-1.5">
                  <input value={highRiskAmount} onChange={(e) => setHighRiskAmount(e.target.value.replace(/[^\d,]/g, "")) } className="flex-1 min-w-0 px-2.5 py-1.5 text-sm font-bold border border-gray-300 rounded bg-white focus:outline-none focus:border-red-400" />
                  <span className="text-xs text-gray-500 shrink-0 font-medium">원 초과 시</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed pt-1">
                  이 기준을 초과하는 기안은 자동으로 <strong>고위험으로 분류</strong>되어, 이중 인증(2FA) 및 보안 열람 조건이 강제 적용됩니다.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}