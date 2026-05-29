import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Save,
  X,
  FileText,
  Settings,
  Pencil,
  Zap,
} from "lucide-react";

/* ─────────────────────────────────────────────────
   Types
───────────────────────────────────────────────── */
type ConditionField = "금액" | "기간(일)" | "건수" | "계약금액" | "횟수";
type Operator = "이상(≥)" | "초과(>)" | "이하(≤)" | "미만(<)" | "동일(=)";
type RiskLevel = "HIGH" | "MEDIUM";

interface RiskCriterion {
  id: string;
  field: ConditionField;
  operator: Operator;
  value: number;
  unit: string;
  level: RiskLevel;
  createdAt: string;
}

interface FormTemplate {
  id: string;
  name: string;
  criteria: RiskCriterion[];
}

/* ─────────────────────────────────────────────────
   Mock Data
───────────────────────────────────────────────── */
const INITIAL_FORMS: FormTemplate[] = [
  {
    id: "f1",
    name: "법인카드 결재 신청서",
    criteria: [
      { id: "c1", field: "금액", operator: "이상(≥)", value: 500000, unit: "원", level: "MEDIUM", createdAt: "2026-04-01" },
      { id: "c2", field: "건수", operator: "이상(≥)", value: 3, unit: "건", level: "HIGH", createdAt: "2026-04-01" },
      { id: "c3", field: "금액", operator: "이상(≥)", value: 1000000, unit: "원", level: "HIGH", createdAt: "2026-04-15" },
    ],
  },
  {
    id: "f2",
    name: "출장 신청서",
    criteria: [
      { id: "c4", field: "기간(일)", operator: "이상(≥)", value: 3, unit: "일", level: "MEDIUM", createdAt: "2026-03-20" },
      { id: "c5", field: "금액", operator: "이상(≥)", value: 1000000, unit: "원", level: "HIGH", createdAt: "2026-03-20" },
    ],
  },
  {
    id: "f3",
    name: "구매 요청서",
    criteria: [
      { id: "c6", field: "금액", operator: "이상(≥)", value: 3000000, unit: "원", level: "HIGH", createdAt: "2026-02-10" },
    ],
  },
  {
    id: "f4",
    name: "계약 체결 품의서",
    criteria: [
      { id: "c7", field: "계약금액", operator: "이상(≥)", value: 100000000, unit: "원", level: "HIGH", createdAt: "2026-01-05" },
      { id: "c8", field: "횟수", operator: "이상(≥)", value: 2, unit: "회", level: "MEDIUM", createdAt: "2026-01-05" },
    ],
  },
];

const CONDITION_FIELDS: { value: ConditionField; unit: string }[] = [
  { value: "금액", unit: "원" },
  { value: "기간(일)", unit: "일" },
  { value: "건수", unit: "건" },
  { value: "계약금액", unit: "원" },
  { value: "횟수", unit: "회" },
];

const OPERATORS: Operator[] = ["이상(≥)", "초과(>)", "이하(≤)", "미만(<)", "동일(=)"];

/* ─────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────── */
function formatValue(value: number, unit: string): string {
  if (unit === "원") return `${value.toLocaleString()}원`;
  return `${value.toLocaleString()}${unit}`;
}

type ValidationResult =
  | { valid: true }
  | { valid: false; type: "empty" | "invalid_number" | "negative" | "duplicate"; message: string };

function validate(
  field: ConditionField | "",
  operator: Operator | "",
  rawValue: string,
  level: RiskLevel,
  existingCriteria: RiskCriterion[],
  editingId?: string
): ValidationResult {
  if (!field || !operator || !rawValue.trim()) {
    return { valid: false, type: "empty", message: "모든 필드를 입력해 주세요." };
  }
  const num = Number(rawValue.replace(/,/g, ""));
  if (isNaN(num)) {
    return { valid: false, type: "invalid_number", message: "값은 숫자여야 합니다." };
  }
  if (num <= 0) {
    return { valid: false, type: "negative", message: "값은 0보다 커야 합니다." };
  }
  const duplicate = existingCriteria.find(
    (c) => c.id !== editingId && c.field === field && c.operator === operator && c.value === num && c.level === level
  );
  if (duplicate) {
    return { valid: false, type: "duplicate", message: "이미 동일한 리스크 기준이 존재합니다." };
  }
  return { valid: true };
}

/* ─────────────────────────────────────────────────
   Add / Edit Criterion Form
───────────────────────────────────────────────── */
function CriterionForm({
  existingCriteria,
  editTarget,
  onSave,
  onCancel,
}: {
  existingCriteria: RiskCriterion[];
  editTarget?: RiskCriterion;
  onSave: (c: Omit<RiskCriterion, "id" | "createdAt">) => void;
  onCancel: () => void;
}) {
  const [field, setField] = useState<ConditionField | "">(editTarget?.field ?? "");
  const [operator, setOperator] = useState<Operator | "">(editTarget?.operator ?? "");
  const [rawValue, setRawValue] = useState(editTarget ? String(editTarget.value) : "");
  const [level, setLevel] = useState<RiskLevel>(editTarget?.level ?? "HIGH");
  const [touched, setTouched] = useState(false);

  const unit = CONDITION_FIELDS.find((f) => f.value === field)?.unit ?? "원";
  const result = validate(field, operator, rawValue, level, existingCriteria, editTarget?.id);

  const showDupError = !result.valid && result.type === "duplicate";
  const canSave = result.valid;

  const handleSave = () => {
    setTouched(true);
    if (!canSave) return;
    onSave({ field: field as ConditionField, operator: operator as Operator, value: Number(rawValue.replace(/,/g, "")), unit, level });
  };

  return (
    <motion.div
      className="bg-white rounded-xl border border-blue-100 overflow-hidden shadow-md"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <div className="px-6 py-4 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plus size={16} className="text-blue-600" />
          <span className="text-sm text-blue-900" style={{ fontWeight: 600 }}>
            {editTarget ? "리스크 기준 수정" : "고위험 리스크 기준 추가"}
          </span>
        </div>
        <button onClick={onCancel} className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 transition-colors">
          <X size={15} />
        </button>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Form row */}
        <div className="flex items-start gap-4 flex-wrap">
          {/* Field selector */}
          <div className="space-y-1.5 min-w-[140px]">
            <label className="text-xs text-slate-500 font-medium">조건 필드</label>
            <div className="relative">
              <select
                value={field}
                onChange={(e) => { setField(e.target.value as ConditionField); setTouched(false); }}
                className="w-full appearance-none pl-3 pr-8 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white transition-all shadow-sm"
              >
                <option value="">조건 선택</option>
                {CONDITION_FIELDS.map((f) => (
                  <option key={f.value} value={f.value}>{f.value}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Operator */}
          <div className="space-y-1.5 min-w-[130px]">
            <label className="text-xs text-slate-500 font-medium">연산자</label>
            <div className="relative">
              <select
                value={operator}
                onChange={(e) => { setOperator(e.target.value as Operator); setTouched(false); }}
                className="w-full appearance-none pl-3 pr-8 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white transition-all shadow-sm"
              >
                <option value="">연산자 선택</option>
                {OPERATORS.map((op) => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Value input */}
          <div className="space-y-1.5 flex-1 min-w-[160px]">
            <label className="text-xs text-slate-500 font-medium">
              기준값 <span className="text-slate-400">{unit && `(${unit})`}</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={rawValue}
                onChange={(e) => { setRawValue(e.target.value); setTouched(true); }}
                placeholder="예: 1000000"
                className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none transition-all shadow-sm ${
                  showDupError || (touched && !result.valid && result.type !== "empty" && rawValue)
                    ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100 text-red-900"
                    : result.valid && rawValue
                    ? "border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    : "border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                }`}
              />
              {result.valid && rawValue && (
                <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
              )}
              {(showDupError || (touched && !result.valid && result.type !== "empty" && rawValue)) && (
                <AlertCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />
              )}
            </div>
          </div>

          {/* Risk level */}
          <div className="space-y-1.5 min-w-[140px]">
            <label className="text-xs text-slate-500 font-medium">위험 등급</label>
            <div className="flex gap-2">
              {(["HIGH", "MEDIUM"] as RiskLevel[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`flex-1 py-2.5 text-xs rounded-lg border transition-all shadow-sm font-semibold ${
                    level === l
                      ? l === "HIGH"
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-amber-500 text-white border-amber-500"
                      : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {l === "HIGH" ? "🔴" : "🟡"} {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Inline error */}
        <AnimatePresence>
          {(showDupError || (touched && !result.valid && result.type !== "empty" && rawValue.trim())) && (
            <motion.div
              className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-4 py-3 shadow-sm"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2 }}
            >
              <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-red-800 font-semibold">
                  {result.valid ? "" : result.message}
                </p>
                {!result.valid && result.type === "duplicate" && (
                  <p className="text-xs text-red-600 mt-0.5">
                    동일한 조건의 리스크 기준이 이미 등록되어 있습니다. 다른 기준값을 입력하세요.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
        <button onClick={onCancel} className="px-5 py-2.5 text-sm text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-sm font-medium">
          취소
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className={`flex items-center gap-2 px-6 py-2.5 text-sm rounded-lg transition-all shadow-sm font-medium ${
            canSave
              ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          <Save size={15} />
          {editTarget ? "수정 사항 저장" : "새 기준 저장"}
        </button>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────
   Delete Confirm Modal
───────────────────────────────────────────────── */
function DeleteConfirmModal({
  criterion,
  onConfirm,
  onClose,
}: {
  criterion: RiskCriterion;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl w-[400px] overflow-hidden border border-slate-200"
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
      >
        <div className="px-6 py-5 border-b border-slate-200 bg-red-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 border border-red-200 flex items-center justify-center">
              <Trash2 size={16} className="text-red-600" />
            </div>
            <div>
              <h4 className="text-slate-900 font-bold">리스크 기준 삭제</h4>
              <p className="text-xs text-red-600 mt-0.5">삭제 후 복구할 수 없습니다</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 mb-4">
            <p className="text-xs text-slate-500 mb-1.5 font-medium">삭제 대상 기준</p>
            <p className="text-sm text-slate-800 font-bold">
              {criterion.field} {criterion.operator} {formatValue(criterion.value, criterion.unit)}
            </p>
            <span className={`text-xs mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold ${criterion.level === "HIGH" ? "bg-red-50 text-red-700 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
              {criterion.level === "HIGH" ? "🔴" : "🟡"} {criterion.level}
            </span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">이 기준을 삭제하면 이후 제출되는 문서에 해당 조건이 적용되지 않습니다. 정말 삭제하시겠습니까?</p>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors font-medium shadow-sm">취소</button>
          <button onClick={onConfirm} className="flex items-center gap-2 px-5 py-2.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm font-medium">
            <Trash2 size={15} /> 삭제 확인
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────── */
export function RiskCriteriaPage() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormTemplate[]>(INITIAL_FORMS);
  const [selectedFormId, setSelectedFormId] = useState("f1");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editTarget, setEditTarget] = useState<RiskCriterion | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<RiskCriterion | undefined>();
  const [savedToast, setSavedToast] = useState<string | null>(null);

  const selectedForm = forms.find((f) => f.id === selectedFormId)!;

  // 시뮬레이터 상태 관리 및 계산 로직
  const [simField, setSimField] = useState<ConditionField>("금액");
  const [simValue, setSimValue] = useState("");

  const getSimulatedRisk = () => {
    if (!simValue) return null;
    const val = Number(simValue.replace(/,/g, ""));
    if (isNaN(val)) return null;

    const relevant = selectedForm.criteria.filter((c) => c.field === simField);
    let detectedLevel: RiskLevel | "LOW" = "LOW";

    for (const c of relevant) {
      let matched = false;
      if (c.operator === "이상(≥)") matched = val >= c.value;
      else if (c.operator === "초과(>)") matched = val > c.value;
      else if (c.operator === "이하(≤)") matched = val <= c.value;
      else if (c.operator === "미만(<)") matched = val < c.value;
      else if (c.operator === "동일(=)") matched = val === c.value;

      if (matched) {
        if (c.level === "HIGH") return "HIGH";
        detectedLevel = "MEDIUM";
      }
    }
    return detectedLevel;
  };

  const simResult = getSimulatedRisk();

  const showToast = (msg: string) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(null), 3000);
  };

  const handleAdd = (data: Omit<RiskCriterion, "id" | "createdAt">) => {
    setForms((prev) =>
      prev.map((f) =>
        f.id !== selectedFormId ? f : {
          ...f,
          criteria: [...f.criteria, { ...data, id: `c${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) }],
        }
      )
    );
    setShowAddForm(false);
    showToast("리스크 기준이 추가되었습니다.");
  };

  const handleEdit = (data: Omit<RiskCriterion, "id" | "createdAt">) => {
    if (!editTarget) return;
    setForms((prev) =>
      prev.map((f) =>
        f.id !== selectedFormId ? f : {
          ...f,
          criteria: f.criteria.map((c) => c.id === editTarget.id ? { ...c, ...data } : c),
        }
      )
    );
    setEditTarget(undefined);
    showToast("리스크 기준이 수정되었습니다.");
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setForms((prev) =>
      prev.map((f) =>
        f.id !== selectedFormId ? f : { ...f, criteria: f.criteria.filter((c) => c.id !== deleteTarget.id) }
      )
    );
    setDeleteTarget(undefined);
    showToast("리스크 기준이 삭제되었습니다.");
  };

  return (
    <>
      <div className="p-8 max-w-[1400px] mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span onClick={() => navigate("/dept")} className="hover:text-blue-600 cursor-pointer transition-colors">부서 관리</span>
          <ChevronRight size={14} />
          <span className="text-slate-800 font-semibold">리스크 기준 및 템플릿 관리</span>
        </div>

        {/* Page title */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">영업본부 전결 규정 및 리스크 설정</h2>
              <span className="inline-flex items-center gap-1.5 text-xs bg-slate-800 text-white px-3 py-1 rounded-full shrink-0 font-medium shadow-sm">
                💼 영업본부 부서 관리자
              </span>
            </div>
            <p className="text-sm text-slate-500">양식별 고위험 판단 기준을 설정합니다. 기준이 충족되면 해당 문서는 자동으로 리스크 등급이 부여됩니다.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 shadow-sm rounded-lg px-4 py-2 shrink-0">
            <Settings size={14} className="text-slate-400" />
            <span className="font-medium">관리자 전용 기능</span>
          </div>
        </div>

        {/* Form selector */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-sm text-slate-700 font-bold shrink-0">관리 대상 양식</label>
            <div className="relative min-w-[300px]">
              <select
                value={selectedFormId}
                onChange={(e) => { setSelectedFormId(e.target.value); setShowAddForm(false); setEditTarget(undefined); setSimValue(""); }}
                className="w-full appearance-none pl-4 pr-10 py-3 text-sm font-medium border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-all shadow-sm"
              >
                {forms.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
              <FileText size={15} className="text-slate-400" />
              <span>등록된 리스크 기준 <strong className="text-blue-600">{selectedForm.criteria.length}개</strong></span>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-[1fr_320px] gap-6 items-start">
          
          {/* Left: criteria list + form */}
          <div className="space-y-6">
            
            {/* Criteria list */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert size={18} className="text-blue-600" />
                  <span className="text-base text-slate-800 font-bold">
                    리스크 판별 기준 목록
                  </span>
                </div>
                <button
                  onClick={() => { setShowAddForm(true); setEditTarget(undefined); }}
                  className="flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                  <Plus size={16} /> 새 기준 추가
                </button>
              </div>

              {selectedForm.criteria.length === 0 ? (
                <div className="px-6 py-16 text-center text-slate-400 bg-slate-50/50">
                  <ShieldAlert size={36} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-base font-medium text-slate-600">등록된 리스크 기준이 없습니다.</p>
                  <p className="text-sm mt-1">상단의 '새 기준 추가' 버튼을 눌러 조건을 설정해 주세요.</p>
                </div>
              ) : (
                <div>
                  {/* Table header */}
                  <div
                    className="grid gap-4 px-6 py-3 bg-slate-50/80 border-b border-slate-200 text-xs text-slate-500 font-bold uppercase tracking-wider"
                    style={{ gridTemplateColumns: "1.2fr 1fr 1.5fr 95px 90px 70px" }}
                  >
                    <span>조건 필드</span>
                    <span>연산자</span>
                    <span className="text-right pr-2">기준값</span>
                    <span className="text-center">등급</span>
                    <span className="text-center">등록일</span>
                    <span className="text-center">액션</span>
                  </div>

                  {selectedForm.criteria.map((c) => (
                    <motion.div
                      key={c.id}
                      layout
                      className={`grid gap-4 px-6 py-4 items-center border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${editTarget?.id === c.id ? "bg-blue-50/40" : ""}`}
                      style={{ gridTemplateColumns: "1.2fr 1fr 1.5fr 95px 90px 70px" }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                        <span className="text-sm text-slate-700 font-medium">{c.field}</span>
                      </div>
                      <span className="text-sm text-slate-500 font-medium">{c.operator}</span>
                      
                      <span className="text-sm text-slate-800 font-bold text-right pr-2">
                        {formatValue(c.value, c.unit)}
                      </span>
                      
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold w-fit shadow-sm ${c.level === "HIGH" ? "bg-red-50 text-red-700 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                          {c.level === "HIGH" ? "🔴" : "🟡"} {c.level}
                        </span>
                      </div>
                      
                      <span className="text-xs text-slate-400 font-medium text-center">{c.createdAt}</span>
                      
                      <div className="flex items-center gap-2 justify-center">
                        <button
                          onClick={() => { setEditTarget(c); setShowAddForm(false); }}
                          className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                          title="수정"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Add / Edit form */}
            <AnimatePresence>
              {(showAddForm || editTarget) && (
                <CriterionForm
                  key={editTarget?.id ?? "add"}
                  existingCriteria={selectedForm.criteria}
                  editTarget={editTarget}
                  onSave={editTarget ? handleEdit : handleAdd}
                  onCancel={() => { setShowAddForm(false); setEditTarget(undefined); }}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Right: Simulator + Info Panels */}
          <div className="space-y-6">
            
            {/* 1. 리스크 감지 시뮬레이터 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <h4 className="text-slate-800 font-bold">리스크 감지 시뮬레이터</h4>
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <Zap size={16} className="text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">현재 양식의 등록 기준을 바탕으로 값을 테스트해 보세요.</p>
              
              <div className="space-y-3">
                <select
                  value={simField}
                  onChange={(e) => setSimField(e.target.value as ConditionField)}
                  className="w-full px-4 py-2.5 text-sm font-medium border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50 transition-colors shadow-sm"
                >
                  {CONDITION_FIELDS.map((f) => (
                    <option key={f.value} value={f.value}>{f.value}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={simValue}
                  onChange={(e) => setSimValue(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="테스트할 값을 숫자로 입력"
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors shadow-sm"
                />
              </div>
              
              <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between shadow-inner">
                <span className="text-sm text-slate-600 font-bold">예상 등급</span>
                {simResult === "HIGH" ? (
                  <span className="text-sm bg-red-100 text-red-800 border border-red-200 px-3 py-1 rounded-full font-bold shadow-sm">🔴 HIGH</span>
                ) : simResult === "MEDIUM" ? (
                  <span className="text-sm bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-full font-bold shadow-sm">🟡 MEDIUM</span>
                ) : simResult === "LOW" ? (
                  <span className="text-sm bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-bold shadow-sm">🟢 LOW (정상)</span>
                ) : (
                  <span className="text-sm font-medium text-slate-400">결과 대기 중</span>
                )}
              </div>
            </div>

            {/* 2. 조건 적용 방식 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h4 className="text-slate-800 font-bold border-b border-slate-100 pb-3 mb-4">조건 적용 방식</h4>
              <div className="space-y-3.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-red-600 font-bold flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"/>🔴 고위험</span>
                  <span className="text-slate-600 font-medium">HIGH 기준 ≥ 1건</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-amber-600 font-bold flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"/>🟡 중위험</span>
                  <span className="text-slate-600 font-medium">MEDIUM 기준 ≥ 1건</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-600 font-bold flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"/>🟢 저위험</span>
                  <span className="text-slate-600 font-medium">모든 조건 미충족</span>
                </div>
              </div>
            </div>

            {/* 3. 전체 양식 현황 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h4 className="text-slate-800 font-bold border-b border-slate-100 pb-3 mb-3">전체 양식 현황</h4>
              <div className="space-y-1.5">
                {forms.map((f) => (
                  <div
                    key={f.id}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl cursor-pointer transition-all ${f.id === selectedFormId ? "bg-blue-50 border border-blue-200 shadow-sm" : "border border-transparent hover:bg-slate-50"}`}
                    onClick={() => { setSelectedFormId(f.id); setShowAddForm(false); setEditTarget(undefined); setSimValue(""); }}
                  >
                    <span className={`text-sm ${f.id === selectedFormId ? "text-blue-800 font-bold" : "text-slate-600 font-medium"}`}>
                      {f.name}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${f.id === selectedFormId ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                      {f.criteria.length}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          criterion={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(undefined)}
        />
      )}

      {/* Toast */}
      <AnimatePresence>
        {savedToast && (
          <motion.div
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
          >
            <div className="flex items-center gap-3 bg-slate-900 text-white text-sm font-medium px-6 py-3.5 rounded-2xl shadow-2xl">
              <CheckCircle2 size={18} className="text-emerald-400" />
              {savedToast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}