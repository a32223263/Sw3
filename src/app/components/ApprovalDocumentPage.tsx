import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  ChevronDown, Paperclip, CheckCircle2, ChevronRight, User, X, AlertCircle,
  Lock, Info, Clock, Check, Building2, Calendar, Shield, FileText, Hash, Send,
  AlertTriangle, ArrowDown, Plus, Zap, Search
} from "lucide-react";
import {
  RichEditorPanel, isDocumentDataFilled, buildContentSnapshot, type DocumentData,
} from "./RichEditorPanel";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
// 💡 Form Engine 의 핵심: 스키마 단일 참조
import { TEMPLATES, TemplateDefinition, ApprovalRole } from "./FormBuilderPage";

/* ─── 타입 정의 ─── */
type Approver = {
  id: number;
  name: string;
  title: string;
  dept: string;
  order: number;
  initials: string;
  role: ApprovalRole;
  canJunggyo?: boolean;
  parallelGroup?: number;
};

const MOCK_EMPLOYEES = [
  { id: "e1", name: "유제형", title: "본부장", dept: "경영지원본부", initials: "유" },
  { id: "e2", name: "강현후", title: "팀장", dept: "재무팀", initials: "강" },
  { id: "e3", name: "신아람", title: "부장", dept: "인사팀", initials: "신" },
];

type FileItem = { id: number; name: string; size: string; isPdf?: boolean };
type OcrStatus = "processing" | "done";

/* ─── 결재자 추가 모달 (사용자 검색 기능) ─── */
function AddApproverModal({ onClose, onAdd }: { onClose: () => void; onAdd: (emp: typeof MOCK_EMPLOYEES[0]) => void; }) {
  const [searchTerm, setSearchTerm] = useState("");
  const filtered = MOCK_EMPLOYEES.filter((e) => e.name.includes(searchTerm) || e.dept.includes(searchTerm));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />
      <motion.div className="relative bg-white rounded-2xl shadow-2xl w-[400px] max-h-[80vh] flex flex-col overflow-hidden border border-gray-200" initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}>
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h3 className="text-gray-800 font-bold text-sm">결재자 수동 추가</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
        </div>
        <div className="p-4 border-b border-gray-100 bg-white">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="이름 또는 부서 검색" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 transition-colors" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 bg-white min-h-[250px]">
          {filtered.map((emp) => (
            <div key={emp.id} className="flex items-center justify-between p-3 hover:bg-blue-50 rounded-lg transition-colors group cursor-pointer" onClick={() => { onAdd(emp); onClose(); }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200"><span className="text-xs text-blue-700 font-bold">{emp.initials}</span></div>
                <div><p className="text-sm font-bold text-gray-800">{emp.name} <span className="text-xs font-medium text-gray-500">{emp.title}</span></p><p className="text-[11px] text-gray-400 mt-0.5">{emp.dept}</p></div>
              </div>
              <button className="text-xs font-bold text-blue-600 bg-white border border-blue-200 px-3 py-1.5 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">추가</button>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-center py-10 text-sm text-gray-400">검색 결과가 없습니다.</div>}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── 상신 확인 모달 ─── */
function SubmitConfirmModal({ formType, approvers, onConfirm, onClose }: { formType: string; approvers: { name: string; title: string }[]; onConfirm: () => void; onClose: () => void; }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />
      <motion.div className="relative bg-white rounded-2xl shadow-2xl w-[480px] overflow-hidden border border-gray-200" initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 380, damping: 30 }}>
        <div className="px-6 py-5 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0"><Send size={18} className="text-blue-600" /></div>
            <div><h3 className="text-gray-800">결재 상신 확인</h3><p className="text-xs text-blue-600 mt-0.5">상신 전 아래 내용을 확인해 주세요.</p></div>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 space-y-2">
            <div className="flex items-center justify-between text-xs"><span className="text-gray-500">양식</span><span className="text-gray-800" style={{ fontWeight: 600 }}>{formType}</span></div>
            <div className="flex items-center justify-between text-xs"><span className="text-gray-500">결재선</span><div className="flex items-center gap-1.5 flex-wrap justify-end pl-4">{approvers.map((a, i) => (<span key={i} className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full whitespace-nowrap mb-1">{a.name} {a.title}</span>))}</div></div>
          </div>
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3.5">
            <AlertTriangle size={15} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-1"><p className="text-sm text-amber-900" style={{ fontWeight: 600 }}>상신 후 유의사항</p><p className="text-xs text-amber-800 leading-relaxed">결재자가 문서를 열람한 이후에는 내용 변경이 불가능합니다.</p></div>
          </div>
          <div className="space-y-1.5">
            {["상신 즉시 1차 결재자에게 알림이 발송됩니다.", "문서 상태가 '결재 진행 중'으로 변경됩니다."].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-600"><CheckCircle2 size={11} className="text-emerald-500 shrink-0" /><span>{item}</span></div>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">돌아가기</button>
          <button onClick={onConfirm} className="flex items-center gap-2 px-6 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"><Send size={13} /> 상신하기</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Skeleton ─── */
function Sk({ w = "w-full", h = "h-4", cls = "" }: { w?: string; h?: string; cls?: string }) {
  return <div className={`${w} ${h} bg-gray-200 rounded animate-pulse ${cls}`} />;
}
function PageSkeleton() { return (<div className="p-6 space-y-5"><div className="flex items-center gap-2 mb-4"><Sk w="w-20" h="h-3" /><Sk w="w-2" h="h-3" /><Sk w="w-28" h="h-3" /></div><div className="flex gap-5"><div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden"><div className="px-6 py-4 border-b border-gray-200"><Sk w="w-36" h="h-5" /></div><div className="px-6 py-5 space-y-5"><div className="space-y-1.5"><Sk w="w-16" h="h-3" /><Sk h="h-10" cls="rounded-md" /></div><div className="space-y-2"><Sk w="w-20" h="h-3" /><Sk h="h-10" cls="rounded-md" /><Sk h="h-14" cls="rounded-md" /></div><div className="space-y-1.5"><Sk w="w-8" h="h-3" /><Sk h="h-10" cls="rounded-md" /></div><div className="space-y-1.5"><Sk w="w-20" h="h-3" /><div className="border border-gray-200 rounded-lg h-64 bg-gray-50" /></div></div></div><div className="w-60 space-y-4 shrink-0"><div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3"><Sk w="w-28" h="h-4" />{[...Array(6)].map((_, i) => (<div key={i} className="flex justify-between"><Sk w="w-16" h="h-3" /><Sk w="w-20" h="h-3" /></div>))}</div><div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4"><Sk w="w-28" h="h-4" />{[...Array(3)].map((_, i) => (<div key={i} className="flex items-center gap-3"><Sk w="w-9" h="h-9" cls="rounded-full" /><div className="flex-1 space-y-1.5"><Sk w="w-16" h="h-3" /><Sk w="w-24" h="h-2.5" /></div></div>))}</div></div></div></div>); }

/* ─── [요구사항 F] 동적 병렬 결재선 트리 렌더러 ─── */
function ApprovalTreeRenderer({ approvers }: { approvers: Approver[] }) {
  const stages: Array<{ type: "serial"; approver: Approver } | { type: "parallel"; approvers: Approver[] }> = [];
  const groups = new Map<number, Approver[]>();
  const serials: Approver[] = [];

  for (const a of approvers) {
    if (a.parallelGroup !== undefined) {
      const g = groups.get(a.parallelGroup) ?? [];
      g.push(a);
      groups.set(a.parallelGroup, g);
    } else {
      serials.push(a);
    }
  }

  const allOrders = new Set([...approvers.map((a) => a.order)]);
  for (const order of [...allOrders].sort()) {
    const serialAtOrder = serials.filter((a) => a.order === order);
    const parallelAtOrder = approvers.filter((a) => a.parallelGroup !== undefined && a.order === order);

    if (parallelAtOrder.length > 0) {
      const alreadyAdded = stages.some((s) => s.type === "parallel" && s.approvers.some((a) => a.order === order));
      if (!alreadyAdded) stages.push({ type: "parallel", approvers: parallelAtOrder });
    }
    for (const a of serialAtOrder) stages.push({ type: "serial", approver: a });
  }

  const ROLE_COLOR: Record<ApprovalRole, string> = {
    "기안": "bg-gray-100 text-gray-600 border-gray-200",
    "검토": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "결재": "bg-blue-50 text-blue-700 border-blue-200",
    "합의": "bg-purple-50 text-purple-700 border-purple-200",
    "재무합의": "bg-amber-50 text-amber-700 border-amber-200",
    "참조": "bg-gray-50 text-gray-500 border-gray-200",
  };

  return (
    <div className="flex flex-col items-center gap-0">
      {stages.map((stage, idx) => (
        <div key={idx} className="flex flex-col items-center w-full">
          {idx > 0 && (
            <div className="flex flex-col items-center py-1">
              <div className="w-px h-4 bg-gray-300" />
              <ArrowDown size={12} className="text-gray-400" />
            </div>
          )}

          {stage.type === "serial" ? (
            <div className="flex flex-col items-center">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3 shadow-sm min-w-[160px]">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-xs text-blue-700" style={{ fontWeight: 700 }}>{stage.approver.initials}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs text-gray-800" style={{ fontWeight: 600 }}>{stage.approver.name}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${ROLE_COLOR[stage.approver.role]}`}>
                      {stage.approver.role}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{stage.approver.title} · {stage.approver.dept}</p>
                  {stage.approver.canJunggyo && <span className="text-xs text-purple-600 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full mt-1 inline-block">전결 가능</span>}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full">
              <div className="border border-dashed border-blue-300 bg-blue-50/30 rounded-xl p-3">
                <p className="text-xs text-blue-600 text-center mb-2" style={{ fontWeight: 600 }}>병렬 합의 (동시 진행)</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  {stage.approvers.map((a) => (
                    <div key={a.id} className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 flex items-center gap-2 shadow-sm">
                      <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                        <span className="text-xs text-purple-700" style={{ fontWeight: 700 }}>{a.initials}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <p className="text-xs text-gray-800" style={{ fontWeight: 600 }}>{a.name}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${ROLE_COLOR[a.role]}`}>{a.role}</span>
                        </div>
                        <p className="text-xs text-gray-400">{a.title} · {a.dept}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Main Page ─── */
export function ApprovalDocumentPage() {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const [isLoading, setIsLoading] = useState(true);
  
  // 💡 [해결 1] FormBuilder의 TEMPLATES 스키마를 유일한 기준으로 사용합니다.
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition>(TEMPLATES[0]);
  const [isFormDropdownOpen, setIsFormDropdownOpen] = useState(false);
  const [title, setTitle] = useState(`2026년 2분기 ${TEMPLATES[0].name} 기안`);
  
  // 💡 [해결 3] 템플릿(FormBuilder)에 정의된 직위/직책/역할/전결 기준 결재선 자동 생성
  // 1. generateApproversFromTemplate 함수 수정 (약 205번 라인 부근)
  const generateApproversFromTemplate = (tpl: TemplateDefinition): Approver[] => {
    const ts = Date.now();
    return tpl.defaultApproverLine.map((step, idx) => {
      // 하드코딩 제거: 실제 시스템에서는 GET /api/v1/users?job_title=... 를 호출함을 가정
      const matchedEmployee = MOCK_EMPLOYEES.find(e => e.title === step.job_title);
    
      return {
        id: ts + idx,
        name: matchedEmployee ? matchedEmployee.name : `[${step.job_title} 자동할당]`,
        title: step.job_title,
        dept: matchedEmployee ? matchedEmployee.dept : "관련부서",
        order: idx + 1,
        initials: matchedEmployee ? matchedEmployee.initials : step.job_title.charAt(0),
        role: step.role ?? "결재",
        canJunggyo: step.canJunggyo ?? false,
        parallelGroup: step.role === "합의" || step.role === "재무합의" ? 1 : undefined,
      };
    });
  };

  const [approvers, setApprovers] = useState<Approver[]>(generateApproversFromTemplate(TEMPLATES[0]));
  const [showAddApproverModal, setShowAddApproverModal] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [ocrStatus, setOcrStatus] = useState<Record<number, OcrStatus>>({});
  const [showConstraintTooltip, setShowConstraintTooltip] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [roleLineApplied, setRoleLineApplied] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentData, setDocumentData] = useState<DocumentData>({});

  useEffect(() => {
    if (!isOnline) toast.warning("⚠️ 네트워크 연결이 불안정합니다. 오프라인 모드로 전환됩니다.");
  }, [isOnline]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleFieldChange = (key: string, val: string) => {
    setDocumentData((prev) => ({ ...prev, [key]: val }));
  };

  const isTitleFilled = title.trim().length > 0;
  const hasApprovers = approvers.length > 0;
  // 💡 [해결 1] 하드코딩된 체크 대신 JSON 스키마를 순회하여 동적으로 검증합니다.
  const isBodyFilled = isDocumentDataFilled(selectedTemplate, documentData);
  const isSubmitEnabled = isTitleFilled && isBodyFilled && hasApprovers;

  const missingFields: string[] = [];
  if (!hasApprovers) missingFields.push("결재선이 지정되지 않았습니다. 결재자를 추가해 주세요.");
  if (!isTitleFilled) missingFields.push("제목을 입력해주세요.");
  if (!isBodyFilled) missingFields.push("서식 필수 항목을 완성해주세요.");

  const removeApprover = (id: number) => {
    const removed = approvers.find((a) => a.id === id);
    setApprovers((prev) => prev.filter((a) => a.id !== id));
    if (removed) {
      toast("결재자를 삭제했습니다.", {
        description: `${removed.name} ${removed.title}`,
        action: {
          label: "실행 취소",
          onClick: () => setApprovers((prev) => {
            const exists = prev.find((a) => a.id === id);
            if (exists) return prev;
            return [...prev, removed].sort((a, b) => a.order - b.order);
          }),
        },
        duration: 3000,
      });
    }
  };

  const handleAddManualApprover = (emp: typeof MOCK_EMPLOYEES[0]) => {
    const maxOrder = approvers.length > 0 ? Math.max(...approvers.map((a) => a.order)) : 0;
    const newApprover: Approver = {
      id: Date.now(), name: emp.name, title: emp.title, dept: emp.dept, initials: emp.initials,
      order: maxOrder + 1, role: "결재",
    };
    setApprovers((prev) => [...prev, newApprover]);
    setRoleLineApplied(false);
    toast.success(`${emp.name} ${emp.title}님이 결재선에 추가되었습니다.`);
  };

  const handleFormChange = (tpl: TemplateDefinition) => {
    setSelectedTemplate(tpl);
    setIsFormDropdownOpen(false);
    setDocumentData({});
    setApprovers(generateApproversFromTemplate(tpl));
    setRoleLineApplied(true);
    setTitle(`2026년 2분기 ${tpl.name} 기안`);
  };

  const handleFakeOcrUpload = () => {
    const fakeFile: FileItem = { id: Date.now(), name: "견적서_2026.pdf", size: "1.2 MB", isPdf: true };
    setFiles((prev) => [...prev, fakeFile]);
    setOcrStatus((prev) => ({ ...prev, [fakeFile.id]: "processing" }));

    setTimeout(() => {
      setOcrStatus((prev) => ({ ...prev, [fakeFile.id]: "done" }));
      // 동적 스키마 중 number 필드를 찾아 값을 채우는 시뮬레이션
      const targetKey = selectedTemplate.fields.find(f => f.type === "number")?.key;
      if (targetKey) setDocumentData((prev) => ({ ...prev, [targetKey]: "1,500,000" }));
      toast.success("OCR 텍스트 추출 완료", { description: "금액 필드에 1,500,000원이 자동 입력되었습니다." });
    }, 1500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    const newFiles: FileItem[] = Array.from(fileList).map((f, i) => ({
      id: Date.now() + i, name: f.name, isPdf: f.name.toLowerCase().endsWith(".pdf"),
      size: f.size < 1024 * 1024 ? `${(f.size / 1024).toFixed(1)} KB` : `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    newFiles.forEach((f) => {
      if (f.isPdf) {
        setOcrStatus((prev) => ({ ...prev, [f.id]: "processing" }));
        setTimeout(() => setOcrStatus((prev) => ({ ...prev, [f.id]: "done" })), 1500);
      }
    });
    e.target.value = "";
  };

  const removeFile = (id: number) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const handleSubmit = () => { if (!isSubmitEnabled) return; setShowSubmitModal(true); };

  const handleConfirmSubmit = () => {
    if (!isOnline) {
      toast.success("상신 내용이 대기열에 저장되었습니다. 네트워크 복구 시 자동 전송됩니다.");
      setShowSubmitModal(false);
      return;
    }
    buildContentSnapshot(selectedTemplate, documentData);
    setShowSubmitModal(false);
    navigate("/drafts/1");
  };

  const approvalTimeline = [
    { name: "박도윤", title: "사원", dept: "IT 기획팀", role: "기안자", initials: "도", status: "done" as const },
    ...approvers.map((a) => ({ name: a.name, title: a.title, dept: a.dept, role: `${a.order}차 ${a.role}`, initials: a.initials, status: "pending" as const })),
  ];

  const hasParallel = approvers.some(a => a.parallelGroup !== undefined);

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="skeleton" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <PageSkeleton />
          </motion.div>
        ) : (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
            <div className="p-6">
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
                <span className="hover:text-blue-600 cursor-pointer">전자결재 홈</span><ChevronRight size={13} />
                <span className="text-gray-800" style={{ fontWeight: 600 }}>결재 작성</span><ChevronRight size={13} />
                <span className="text-blue-600">{selectedTemplate.name}</span>
              </div>

              <div className="flex gap-5">
                <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden min-w-0">
                  <div className="px-6 py-4 border-b border-gray-200"><h2 className="text-gray-800">결재 문서 작성</h2></div>
                  <div className="px-6 py-5 space-y-5">
                    
                    <div className="space-y-1.5">
                      <label className="text-sm text-gray-700">양식 선택 <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <button onClick={() => setIsFormDropdownOpen((p) => !p)} className="w-full flex items-center justify-between px-3 py-2.5 text-sm bg-white border border-gray-300 rounded-md hover:border-blue-400 transition-colors">
                          <span className="text-gray-800">{selectedTemplate.name}</span>
                          <ChevronDown size={14} className={`text-gray-400 transition-transform ${isFormDropdownOpen ? "rotate-180" : ""}`} />
                        </button>
                        {isFormDropdownOpen && (
                          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
                            {TEMPLATES.map((tpl) => (
                              <button key={tpl.id} onClick={() => handleFormChange(tpl)} className={`w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors ${selectedTemplate.id === tpl.id ? "bg-blue-50 text-blue-700" : "text-gray-700"}`}>
                                {tpl.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm text-gray-700">결재선 <span className="text-red-500">*</span></label>
                        <div className="flex items-center gap-2">
                          {roleLineApplied && <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200"><CheckCircle2 size={11} /> Role 자동 매핑</span>}
                        </div>
                      </div>

                      {roleLineApplied && (
                        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                          <Info size={12} className="text-blue-500 mt-0.5 shrink-0" />
                          <p className="text-xs text-blue-700">선택하신 양식({selectedTemplate.name})에 맞추어 결재선이 자동 설정되었습니다.</p>
                        </div>
                      )}

                      {/* 💡 템플릿의 속성(parallelGroup 유무)에 따라 트리 혹은 선형으로 렌더링 분기 */}
                      {hasParallel ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <ApprovalTreeRenderer approvers={approvers} />
                          <div className="flex justify-center mt-4">
                            <button onClick={() => setShowAddApproverModal(true)} className="flex items-center gap-1 text-xs text-blue-600 border border-dashed border-blue-300 px-4 py-2 rounded-md hover:bg-blue-50 transition-colors"><Plus size={12} /> 결재자 추가</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          {approvers.map((approver, idx) => (
                            <div key={approver.id} className="flex items-center gap-2">
                              {idx > 0 && <ChevronRight size={14} className="text-gray-400" />}
                              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-md shadow-sm group relative">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0"><User size={11} className="text-blue-600" /></div>
                                <div><p className="text-xs text-gray-800" style={{ fontWeight: 600 }}>{approver.name}</p><p className="text-xs text-gray-500">{approver.title} · {approver.dept}</p></div>
                                <span className={`ml-1 text-xs border px-1.5 py-0.5 rounded ${approver.role === "검토" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : approver.role === "합의" || approver.role === "재무합의" ? "bg-purple-50 text-purple-600 border-purple-200" : "bg-blue-50 text-blue-600 border-blue-200"}`}>{approver.role}</span>
                                {approver.canJunggyo && <span className="text-xs bg-purple-50 text-purple-600 border border-purple-200 px-1.5 py-0.5 rounded ml-1">전결</span>}
                                <button onClick={() => removeApprover(approver.id)} className="ml-1 w-4 h-4 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"><X size={10} /></button>
                              </div>
                            </div>
                          ))}
                          <button onClick={() => setShowAddApproverModal(true)} className="flex items-center gap-1 text-xs text-blue-600 border border-dashed border-blue-300 px-3 py-2 rounded-md hover:bg-blue-50 transition-colors"><Plus size={11} /> 결재자 추가</button>
                        </div>
                      )}

                      {!hasApprovers && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} /> 결재선이 지정되지 않았습니다. 결재자를 추가해 주세요.</p>}
                    </div>

                    <div className="border-t border-gray-100" />

                    <div className="space-y-1.5">
                      <label className="text-sm text-gray-700">제목 <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="문서 제목을 입력하세요" maxLength={100} className={`w-full px-3 py-2.5 text-sm border rounded-md focus:outline-none transition-colors ${title.length > 0 ? "border-blue-400 bg-white" : "border-gray-300 bg-white focus:border-blue-400"}`} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{title.length}/100</span>
                      </div>
                    </div>

                    {/* 💡 OCP 적용: 선택된 스키마를 Form Engine 으로 주입 */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-sm text-gray-700">문서 내용 <span className="text-red-500">*</span></label>
                        {isBodyFilled && <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"><CheckCircle2 size={11} /> 서식 입력 완료</span>}
                      </div>
                      <RichEditorPanel
                        templateSchema={selectedTemplate}
                        documentData={documentData}
                        onChange={handleFieldChange}
                        approvers={approvers.map((a) => ({ name: a.name, title: a.title, order: a.order }))}
                        writer="박도윤" dept="IT 기획팀" date="2026-05-05" docNo="자동 부여"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-gray-700">증빙 서류 첨부 (OCR 자동 입력)</label>
                      <div className="flex gap-2">
                        <button onClick={handleFakeOcrUpload} className="flex items-center gap-2 px-4 py-2.5 text-sm border border-dashed border-purple-300 text-purple-600 rounded-md hover:bg-purple-50 hover:border-purple-400 transition-colors"><Zap size={14} /> 견적서/영수증 업로드 (OCR)</button>
                        <div onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center gap-2 px-3 py-2.5 border border-dashed border-gray-300 rounded-md cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors group">
                          <Paperclip size={14} className="text-gray-400 group-hover:text-blue-500" />
                          <span className="text-sm text-gray-500 group-hover:text-blue-600">일반 파일 첨부</span>
                          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
                        </div>
                      </div>

                      {files.length > 0 && (
                        <div className="space-y-1.5">
                          {files.map((file) => {
                            const ocr = ocrStatus[file.id];
                            return (
                              <div key={file.id} className={`flex items-center justify-between px-3 py-2.5 border rounded-md transition-colors ${ocr === "processing" ? "bg-purple-50 border-purple-200" : "bg-gray-50 border-gray-200"}`}>
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <Paperclip size={13} className={ocr === "processing" ? "text-purple-500" : "text-gray-400"} />
                                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                                  <span className="text-xs text-gray-400 shrink-0">({file.size})</span>
                                  {ocr === "processing" && <span className="flex items-center gap-1.5 text-xs bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full shrink-0 ml-1"><motion.div className="w-2.5 h-2.5 border-2 border-purple-500 border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} />⏳ 텍스트 추출 및 분석 중...</span>}
                                  {ocr === "done" && <span className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0 ml-1"><CheckCircle2 size={10} /> OCR 완료</span>}
                                </div>
                                <button onClick={() => removeFile(file.id)} className="text-gray-400 hover:text-red-500 transition-colors ml-2 shrink-0"><X size={14} /></button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                    <button className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors">임시저장</button>
                    <div className="relative" onMouseEnter={() => !isSubmitEnabled && setShowConstraintTooltip(true)} onMouseLeave={() => setShowConstraintTooltip(false)}>
                      <button onClick={handleSubmit} disabled={!isSubmitEnabled} className={`flex items-center gap-2 px-6 py-2 text-sm rounded-md transition-all ${isSubmitEnabled ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm cursor-pointer" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                        {!isSubmitEnabled && <Lock size={13} />}
                        상신하기
                      </button>
                      {showConstraintTooltip && !isSubmitEnabled && (
                        <div className="absolute bottom-full right-0 mb-2 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl z-30">
                          <div className="flex items-start gap-2 mb-2"><AlertCircle size={13} className="text-amber-400 mt-0.5 shrink-0" /><p className="text-gray-100">다음 항목을 완성해야 상신이 가능합니다:</p></div>
                          <ul className="space-y-1 pl-4">{missingFields.map((f) => (<li key={f} className="text-red-300 text-xs list-disc">{f}</li>))}</ul>
                          <div className="absolute bottom-[-5px] right-6 w-2.5 h-2.5 bg-gray-900 rotate-45" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ─── 우측 패널 ─── */}
                <div className="w-60 space-y-4 shrink-0">
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-3"><FileText size={14} className="text-blue-500" /><h4 className="text-gray-700 text-sm" style={{ fontWeight: 600 }}>문서 기본 정보</h4></div>
                    <div className="space-y-2">
                      {[
                        { icon: <Hash size={11} />, label: "기안 번호", value: "상신 시 자동 부여" },
                        { icon: <Building2 size={11} />, label: "기안 부서", value: "IT 기획팀" },
                        { icon: <User size={11} />, label: "기안자", value: "박도윤 (사원)" },
                        { icon: <Calendar size={11} />, label: "기안 일자", value: "2026-05-05" },
                        { icon: <Shield size={11} />, label: "보존 기한", value: "5년" },
                        { icon: <FileText size={11} />, label: "비밀 등급", value: "일반" },
                      ].map((info) => (
                        <div key={info.label} className="flex items-center justify-between gap-2 py-1 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-center gap-1.5 text-gray-400 shrink-0">{info.icon}<p className="text-xs text-gray-400">{info.label}</p></div>
                          <p className="text-xs text-gray-700 text-right truncate">{info.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-4"><Clock size={14} className="text-blue-500" /><h4 className="text-gray-700 text-sm" style={{ fontWeight: 600 }}>결재 진행 현황</h4></div>
                    <div className="relative">
                      <div className="absolute left-[17px] top-9 bottom-9 w-px bg-gray-200 z-0" />
                      <div className="space-y-4 relative z-10">
                        {approvalTimeline.map((person, idx) => {
                          const isDone = person.status === "done";
                          const isPending = person.status === "pending";
                          return (
                            <div key={idx} className="flex items-start gap-3">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs border-2 ${isDone ? "bg-blue-600 border-blue-600 text-white" : isPending ? "bg-amber-50 border-amber-400 text-amber-700" : "bg-gray-100 border-gray-300 text-gray-500"}`} style={{ fontWeight: 700 }}>{person.initials}</div>
                              <div className="flex-1 min-w-0 pt-0.5">
                                <div className="flex items-center justify-between gap-1">
                                  <p className="text-xs text-gray-800" style={{ fontWeight: 600 }}>{person.name}</p>
                                  {isDone && <span className="flex items-center gap-0.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full shrink-0"><Check size={9} />기안</span>}
                                  {isPending && <span className="flex items-center gap-0.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full shrink-0"><Clock size={9} />대기</span>}
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">{person.role} · {person.title}</p>
                                <p className="text-xs text-gray-400">{person.dept}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showAddApproverModal && <AddApproverModal onClose={() => setShowAddApproverModal(false)} onAdd={handleAddManualApprover} />}
      {showSubmitModal && <SubmitConfirmModal formType={selectedTemplate.name} approvers={approvers.map((a) => ({ name: a.name, title: a.title }))} onConfirm={handleConfirmSubmit} onClose={() => setShowSubmitModal(false)} />}
    </>
  );
}