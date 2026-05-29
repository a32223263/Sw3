import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Info,
  ShieldAlert,
  Save,
  X,
  FileText,
  Settings,
  AlertTriangle,
  Pencil,
  RotateCcw,
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

  const showError = touched && !result.valid && result.type !== "empty";
  const showDupError = !result.valid && result.type === "duplicate";
  const canSave = result.valid;

  const handleSave = () => {
    setTouched(true);
    if (!canSave) return;
    onSave({ field: field as ConditionField, operator: operator as Operator, value: Number(rawValue.replace(/,/g, "")), unit, level });
  };

  return (
    <motion.div
      className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plus size={14} className="text-gray-500" />
          <span className="text-sm text-gray-700" style={{ fontWeight: 600 }}>
            {editTarget ? "리스크 기준 수정" : "고위험 리스크 기준 추가"}
          </span>
        </div>
        <button onClick={onCancel} className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-gray-200 transition-colors">
          <X size={13} />
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Form row */}
        <div className="flex items-start gap-3 flex-wrap">
          {/* Field selector */}
          <div className="space-y-1 min-w-[130px]">
            <label className="text-xs text-gray-500">조건 필드</label>
            <div className="relative">
              <select
                value={field}
                onChange={(e) => { setField(e.target.value as ConditionField); setTouched(false); }}
                className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white transition-all"
              >
                <option value="">조건 선택</option>
                {CONDITION_FIELDS.map((f) => (
                  <option key={f.value} value={f.value}>{f.value}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Operator */}
          <div className="space-y-1 min-w-[120px]">
            <label className="text-xs text-gray-500">연산자</label>
            <div className="relative">
              <select
                value={operator}
                onChange={(e) => { setOperator(e.target.value as Operator); setTouched(false); }}
                className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white transition-all"
              >
                <option value="">연산자 선택</option>
                {OPERATORS.map((op) => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Value input */}
          <div className="space-y-1 flex-1 min-w-[140px]">
            <label className="text-xs text-gray-500">
              기준값 <span className="text-gray-400">{unit && `(${unit})`}</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={rawValue}
                onChange={(e) => { setRawValue(e.target.value); setTouched(true); }}
                placeholder="예: 1000000"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none transition-all ${
                  showDupError || (touched && !result.valid && result.type !== "empty" && rawValue)
                    ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100"
                    : result.valid && rawValue
                    ? "border-emerald-400 bg-emerald-50 focus:ring-2 focus:ring-emerald-100"
                    : "border-gray-300 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                }`}
              />
              {result.valid && rawValue && (
                <CheckCircle2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
              )}
              {(showDupError || (touched && !result.valid && result.type !== "empty" && rawValue)) && (
                <AlertCircle size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />
              )}
            </div>
          </div>

          {/* Risk level */}
          <div className="space-y-1 min-w-[100px]">
            <label className="text-xs text-gray-500">위험 등급</label>
            <div className="flex gap-1.5">
              {(["HIGH", "MEDIUM"] as RiskLevel[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`flex-1 py-2 text-xs rounded-lg border transition-all ${
                    level === l
                      ? l === "HIGH"
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-amber-500 text-white border-amber-500"
                      : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {l === "HIGH" ? "🔴" : "🟡"} {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Inline error — shown as soon as duplicate detected (even before touched) */}
        <AnimatePresence>
          {(showDupError || (touched && !result.valid && result.type !== "empty" && rawValue.trim())) && (
            <motion.div
              className="flex items-start gap-2.5 bg-red-50 border border-red-300 rounded-lg px-4 py-3"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
            >
              <AlertCircle size={14} className="text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-red-700" style={{ fontWeight: 600 }}>
                  {result.valid ? "" : result.message}
                </p>
                {!result.valid && result.type === "duplicate" && (
                  <p className="text-xs text-red-600 mt-0.5">
                    동일한 조건의 리스크 기준이 이미 등록되어 있습니다. 기존 기준을 수정하거나 다른 기준값을 입력하세요.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Defensive design notice */}
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3.5 py-2.5">
          <Info size={12} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700 leading-relaxed">
            중복된 기준을 입력하면 실시간 검증으로 즉시 안내되며, 저장 버튼이 비활성화됩니다.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3.5 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
          취소
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className={`flex items-center gap-2 px-5 py-2 text-sm rounded-lg transition-all ${
            canSave
              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm cursor-pointer"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          <Save size={13} />
          {editTarget ? "수정 저장" : "저장"}
          {!canSave && <span className="text-xs opacity-70">(비활성)</span>}
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
      <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />
      <motion.div
        className="relative bg-white rounded-xl shadow-2xl w-96 overflow-hidden border border-gray-200"
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
      >
        <div className="px-6 py-5 border-b border-gray-200 bg-red-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-100 border border-red-200 flex items-center justify-center">
              <Trash2 size={15} className="text-red-600" />
            </div>
            <div>
              <h4 className="text-gray-800">리스크 기준 삭제</h4>
              <p className="text-xs text-red-600 mt-0.5">삭제 후 복구할 수 없습니다</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4">
            <p className="text-xs text-gray-500 mb-1">삭제 대상 기준</p>
            <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>
              {criterion.field} {criterion.operator} {formatValue(criterion.value, criterion.unit)}
            </p>
            <span className={`text-xs mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${criterion.level === "HIGH" ? "bg-red-50 text-red-700 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
              {criterion.level === "HIGH" ? "🔴" : "🟡"} {criterion.level}
            </span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">이 기준을 삭제하면 이후 제출되는 문서에 해당 조건이 적용되지 않습니다. 정말 삭제하시겠습니까?</p>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">취소</button>
          <button onClick={onConfirm} className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm">
            <Trash2 size={13} /> 삭제 확인
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
      <div className="p-6 space-y-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <span onClick={() => navigate("/dept")} className="hover:text-blue-600 cursor-pointer transition-colors">부서 관리</span>
          <ChevronRight size={13} />
          <span className="text-gray-800" style={{ fontWeight: 600 }}>리스크 기준 및 템플릿 관리</span>
        </div>

        {/* Page title */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <h2 className="text-gray-900">영업본부 전결 규정 및 리스크 설정</h2>
              <span className="inline-flex items-center gap-1.5 text-xs bg-blue-600 text-white px-2.5 py-1 rounded-full shrink-0" style={{ fontWeight: 600 }}>
                💼 영업본부 부서 관리자
              </span>
            </div>
            <p className="text-sm text-gray-500">양식별 고위험 판단 기준을 설정합니다. 기준이 충족되면 해당 문서는 자동으로 고위험으로 분류됩니다.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 shrink-0">
            <Settings size={12} />
            <span>관리자 전용 기능</span>
          </div>
        </div>

        {/* Form selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm text-gray-700 shrink-0" style={{ fontWeight: 600 }}>양식 선택</label>
            <div className="relative min-w-[260px]">
              <select
                value={selectedFormId}
                onChange={(e) => { setSelectedFormId(e.target.value); setShowAddForm(false); setEditTarget(undefined); }}
                className="w-full appearance-none pl-4 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white transition-all"
              >
                {forms.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <FileText size={12} className="text-gray-400" />
              <span>현재 등록된 기준 <strong className="text-gray-700">{selectedForm.criteria.length}개</strong></span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_280px] gap-5 items-start">
          {/* Left: criteria list + form */}
          <div className="space-y-4">
            {/* Criteria list */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={15} className="text-red-500" />
                  <span className="text-sm text-gray-700" style={{ fontWeight: 600 }}>
                    {selectedForm.name} — 리스크 기준 목록
                  </span>
                </div>
                <button
                  onClick={() => { setShowAddForm(true); setEditTarget(undefined); }}
                  className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus size={12} /> 기준 추가
                </button>
              </div>

              {selectedForm.criteria.length === 0 ? (
                <div className="px-5 py-10 text-center text-gray-400">
                  <ShieldAlert size={28} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm">등록된 리스크 기준이 없습니다.</p>
                  <p className="text-xs mt-1">위의 '기준 추가' 버튼을 눌러 새 기준을 추가하세요.</p>
                </div>
              ) : (
                <div>
                  {/* Table header */}
                  <div
                    className="grid gap-4 px-5 py-2.5 bg-gray-50 border-b border-gray-200 text-xs text-gray-500"
                    style={{ gridTemplateColumns: "1fr 1fr 1fr 80px 90px 80px", fontWeight: 600 }}
                  >
                    <span>조건 필드</span>
                    <span>연산자</span>
                    <span>기준값</span>
                    <span>등급</span>
                    <span>등록일</span>
                    <span className="text-center">액션</span>
                  </div>

                  {selectedForm.criteria.map((c, idx) => (
                    <motion.div
                      key={c.id}
                      layout
                      className={`grid gap-4 px-5 py-3.5 items-center border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${editTarget?.id === c.id ? "bg-blue-50/60" : ""}`}
                      style={{ gridTemplateColumns: "1fr 1fr 1fr 80px 90px 80px" }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                        <span className="text-sm text-gray-800">{c.field}</span>
                      </div>
                      <span className="text-sm text-gray-600">{c.operator}</span>
                      <span className="text-sm text-gray-800" style={{ fontWeight: 600 }}>
                        {formatValue(c.value, c.unit)}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border w-fit ${c.level === "HIGH" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                        {c.level === "HIGH" ? "🔴" : "🟡"} {c.level}
                      </span>
                      <span className="text-xs text-gray-400">{c.createdAt}</span>
                      <div className="flex items-center gap-1.5 justify-center">
                        <button
                          onClick={() => { setEditTarget(c); setShowAddForm(false); }}
                          className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                          title="수정"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={12} />
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

          {/* Right: info + stats panel */}
          <div className="space-y-4">
            {/* Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <h4 className="text-gray-700">기준 현황 요약</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "전체 기준", value: selectedForm.criteria.length, color: "text-gray-700", bg: "bg-gray-50 border-gray-200" },
                  { label: "HIGH 등급", value: selectedForm.criteria.filter((c) => c.level === "HIGH").length, color: "text-red-700", bg: "bg-red-50 border-red-200" },
                  { label: "MEDIUM 등급", value: selectedForm.criteria.filter((c) => c.level === "MEDIUM").length, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
                  { label: "금액 조건", value: selectedForm.criteria.filter((c) => c.field === "금액" || c.field === "계약금액").length, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
                ].map((stat) => (
                  <div key={stat.label} className={`rounded-lg border p-3 ${stat.bg}`}>
                    <p className={`text-lg leading-none ${stat.color}`} style={{ fontWeight: 700 }}>{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Defensive design banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info size={13} className="text-blue-600" />
                <span className="text-xs text-blue-700" style={{ fontWeight: 600 }}>입력 안전장치</span>
              </div>
              <p className="text-xs text-blue-700 leading-relaxed mb-3">
                동일한 조건의 기준이 입력될 경우 실시간으로 안내되며, 저장 버튼이 비활성화됩니다.
              </p>
              <div className="space-y-1.5">
                {[
                  "중복 기준 실시간 감지",
                  "음수·비숫자 입력 차단",
                  "저장 전 필드 완전성 검증",
                  "삭제 전 재확인 모달",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-1.5 text-xs text-blue-700">
                    <CheckCircle2 size={11} className="text-blue-500 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* How conditions work */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h4 className="text-gray-700 mb-3">조건 적용 방식</h4>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0 text-xs" style={{ fontWeight: 700 }}>1</span>
                  <p>문서 제출 시 등록된 모든 기준과 자동 비교</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0 text-xs" style={{ fontWeight: 700 }}>2</span>
                  <p>HIGH 기준 1개 이상 충족 시 → 🔴 고위험 분류</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 text-xs" style={{ fontWeight: 700 }}>3</span>
                  <p>MEDIUM 기준만 충족 시 → 🟡 중위험 분류</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0 text-xs" style={{ fontWeight: 700 }}>4</span>
                  <p>조건 미충족 시 → 🟢 저위험(정상) 분류</p>
                </div>
              </div>
            </div>

            {/* Other forms quick stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h4 className="text-gray-700 mb-3">전체 양식 현황</h4>
              <div className="space-y-2">
                {forms.map((f) => (
                  <div
                    key={f.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${f.id === selectedFormId ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"}`}
                    onClick={() => { setSelectedFormId(f.id); setShowAddForm(false); setEditTarget(undefined); }}
                  >
                    <span className={`text-xs ${f.id === selectedFormId ? "text-blue-700" : "text-gray-600"}`} style={{ fontWeight: f.id === selectedFormId ? 600 : 400 }}>
                      {f.name}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${f.id === selectedFormId ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}>
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
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
          >
            <div className="flex items-center gap-2.5 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-2xl">
              <CheckCircle2 size={15} className="text-emerald-400" />
              {savedToast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
