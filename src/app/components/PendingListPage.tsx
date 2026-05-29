import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  ListChecks,
  Eye,
  ShieldAlert,
  X,
  Lock,
  AlertCircle,
  ArrowRight,
  Search,
} from "lucide-react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

/* ─── Types ─── */
type RiskLevel = "HIGH" | "LOW" | "MEDIUM";
type DomainType = "전결 가능" | "합의 요청" | "대결" | "일반";

type PendingDoc = {
  id: string;
  docNo: string;
  title: string;
  form: string;
  requester: string;
  dept: string;
  risk: RiskLevel;
  date: string;
  canBatch: boolean;
  domainType: DomainType;
};

/* ─── Mock Data ─── */
const PENDING_DOCS: PendingDoc[] = [
  {
    id: "1", docNo: "2026-IT-00201",
    title: "2026년 3분기 IT 인프라 고도화 사업 예산 집행 품의",
    form: "예산 집행 품의서", requester: "박도윤", dept: "IT기획팀",
    risk: "HIGH", date: "2026-05-05", canBatch: false, domainType: "일반",
  },
  {
    id: "2", docNo: "2026-IT-00198",
    title: "출장 신청서 — 대전 R&D 센터 방문",
    form: "출장 신청서", requester: "홍길동", dept: "IT기획팀",
    risk: "LOW", date: "2026-05-04", canBatch: true, domainType: "전결 가능",
  },
  {
    id: "3", docNo: "2026-IT-00196",
    title: "비품 구매 요청서 — 사무용 의자 4개",
    form: "구매 요청서", requester: "홍길동", dept: "IT기획팀",
    risk: "LOW", date: "2026-05-03", canBatch: true, domainType: "일반",
  },
  {
    id: "4", docNo: "2026-IT-00194",
    title: "업무 협조 요청 — 회의실 예약 시스템 연동",
    form: "업무 협조 요청서", requester: "이민준", dept: "IT기획팀",
    risk: "LOW", date: "2026-05-02", canBatch: true, domainType: "합의 요청",
  },
  {
    id: "5", docNo: "2026-IT-00190",
    title: "2분기 서버 보안 패치 계획 검토 요청",
    form: "업무 협조 요청서", requester: "최유리", dept: "보안팀",
    risk: "MEDIUM", date: "2026-05-01", canBatch: true, domainType: "합의 요청",
  },
  {
    id: "6", docNo: "2026-IT-00185",
    title: "외부 강사 계약 체결 품의",
    form: "계약 체결 품의서", requester: "김태현", dept: "인재개발팀",
    risk: "MEDIUM", date: "2026-04-30", canBatch: true, domainType: "대결",
  },
];

const RISK_BADGE: Record<RiskLevel, { label: string; color: string }> = {
  HIGH: { label: "🔴 HIGH", color: "bg-red-50 text-red-700 border-red-200" },
  MEDIUM: { label: "🟡 MEDIUM", color: "bg-amber-50 text-amber-700 border-amber-200" },
  LOW: { label: "🟢 LOW", color: "bg-green-50 text-green-700 border-green-200" },
};

const DOMAIN_BADGE: Record<DomainType, { color: string }> = {
  "전결 가능": { color: "bg-purple-50 text-purple-700 border-purple-200" },
  "합의 요청": { color: "bg-blue-50 text-blue-700 border-blue-200" },
  "대결": { color: "bg-amber-50 text-amber-700 border-amber-200" },
  "일반": { color: "" },
};

/* ─── Skeleton ─── */
function ListSkeleton() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="flex gap-3">
        <div className="h-9 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-9 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-9 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-9 flex-1 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="h-10 bg-gray-50 border-b border-gray-200" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-[60px] border-b border-gray-100 flex items-center px-5 gap-4">
            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="flex-[2] h-4 bg-gray-200 rounded animate-pulse" />
            <div className="flex-[1] h-4 bg-gray-200 rounded animate-pulse" />
            <div className="flex-[1] h-5 bg-gray-200 rounded-full animate-pulse" />
            <div className="flex-[1] h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-7 h-7 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}



/* ─── [방어적 설계: 재확인] 일괄 승인 확인 모달 (OTP 없이 단순 확인) ─── */
function BatchConfirmDialog({
  count,
  onConfirm,
  onClose,
}: {
  count: number;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl w-[400px] overflow-hidden border border-gray-200"
        initial={{ opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
      >
        <div className="px-6 py-5 border-b border-gray-200 bg-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center">
              <ListChecks size={18} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-gray-800">일괄 승인</h3>
              <p className="text-xs text-emerald-700 mt-0.5">선택한 {count}건의 문서를 승인합니다</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm text-gray-700">
            선택한 <strong className="text-emerald-700">{count}건</strong>의 문서를 일괄 승인하시겠습니까?
          </p>
          <p className="text-xs text-gray-500">승인 후 각 문서는 다음 결재자에게 자동 전달됩니다.</p>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-2 px-5 py-2.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <CheckCircle2 size={13} /> 승인 확정
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main Page ─── */
export function PendingListPage() {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const [isLoading, setIsLoading] = useState(true);
  const [docs, setDocs] = useState(PENDING_DOCS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  // 다중 필터 상태
  const [dateFilter, setDateFilter] = useState("1month");
  const [formFilter, setFormFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");

  // 오프라인 감지
  useEffect(() => {
    if (!isOnline) {
      toast.warning("⚠️ 네트워크 연결이 불안정합니다. 오프라인 모드로 전환됩니다.");
    }
  }, [isOnline]);

  // Skeleton 로딩 (0.5초)
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const filteredDocs = docs.filter((d) => {
    if (searchQuery && !d.title.includes(searchQuery) && !d.requester.includes(searchQuery)) return false;
    if (formFilter !== "all" && !d.form.includes(formFilter)) return false;
    return true;
  });

  const batchableDocs = filteredDocs.filter((d) => d.canBatch);
  const batchableIds = new Set(batchableDocs.map((d) => d.id));
  const selectedBatchable = [...selected].filter((id) => batchableIds.has(id));
  const hasHighRiskSelected = [...selected].some(
    (id) => docs.find((d) => d.id === id)?.risk === "HIGH"
  );

  const toggleDoc = (id: string) => {
    const doc = docs.find((d) => d.id === id);
    if (!doc || !doc.canBatch) return;
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const allBatchSelected = batchableDocs.length > 0 && selectedBatchable.length === batchableDocs.length;
  const someBatchSelected = selectedBatchable.length > 0 && !allBatchSelected;

  const toggleAll = () => {
    if (allBatchSelected) {
      setSelected(new Set());
    } else {
      // [방어적 설계: 제약] 의도적으로 전체 선택을 시도하게 한 뒤, 
      // 배열에 고위험(canBatch: false) 문서가 섞여 있으면 상태를 업데이트하여 경고 배너를 유도합니다.
      setSelected(new Set([...docs.map((d) => d.id)]));
    }
  };

  const handleBatchClick = () => {
    // [추적성: UC-APP-01 E6] 고위험 문서가 포함되어 있으면 일괄 승인 모달 대신 차단 모달을 띄움
    if (hasHighRiskSelected) {
      setShowBlockModal(true);
      return;
    }
    if (selectedBatchable.length === 0) return;
    setShowBatchConfirm(true);
  };

  const handleBatchConfirm = () => {
    if (!isOnline) {
      toast.success("승인 내용이 대기열에 저장되었습니다. 네트워크 복구 시 자동 전송됩니다.");
      setShowBatchConfirm(false);
      return;
    }
    const count = selectedBatchable.length;
    setDocs((prev) => prev.filter((d) => !selectedBatchable.includes(d.id)));
    setSelected(new Set());
    setShowBatchConfirm(false);
    toast.success(`${count}건이 승인되었습니다.`, {
      description: "각 문서가 다음 결재자에게 자동 전달됩니다.",
    });
  };

  if (isLoading) return <ListSkeleton />;

  return (
    <>
      <div className="h-full overflow-y-auto">
        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-gray-900">결재 대기함</h2>
              <p className="text-sm text-gray-500 mt-1">내 결재 순서의 대기 문서 목록입니다.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <Clock size={12} />
              <span>총 {docs.length}건 대기</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "전체 대기", value: docs.length, color: "bg-blue-50 border-blue-200 text-blue-700" },
              { label: "🔴 고위험", value: docs.filter((d) => d.risk === "HIGH").length, color: "bg-red-50 border-red-200 text-red-700" },
              { label: "🟡 중위험", value: docs.filter((d) => d.risk === "MEDIUM").length, color: "bg-amber-50 border-amber-200 text-amber-700" },
              { label: "🟢 저위험", value: docs.filter((d) => d.risk === "LOW").length, color: "bg-green-50 border-green-200 text-green-700" },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-xl border p-4 ${stat.color}`}>
                <p style={{ fontWeight: 700, fontSize: "1.5rem", lineHeight: 1 }}>{stat.value}</p>
                <p className="text-xs mt-1 opacity-80">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* [요구사항 D] 다중 검색 필터 바 */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={13} className="text-gray-400 shrink-0" />

            {/* 기안일 Select */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:border-blue-400 cursor-pointer"
            >
              <option value="1week">지난 1주일</option>
              <option value="1month">지난 1개월</option>
              <option value="3months">지난 3개월</option>
              <option value="1year">지난 1년</option>
            </select>

            {/* 양식 유형 Select */}
            <select
              value={formFilter}
              onChange={(e) => setFormFilter(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:border-blue-400 cursor-pointer"
            >
              <option value="all">전체 양식</option>
              <option value="품의서">품의서</option>
              <option value="지출결의서">지출결의서</option>
              <option value="휴가신청서">휴가신청서</option>
            </select>

            {/* 결재 상태 Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:border-blue-400 cursor-pointer"
            >
              <option value="pending">대기</option>
              <option value="in_progress">진행 중</option>
              <option value="rejected">반려</option>
              <option value="done">완료</option>
            </select>

            {/* 검색창 */}
            <div className="relative flex-1 min-w-40">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="문서명, 기안자 검색..."
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-400 transition-colors"
              />
            </div>

            {/* 일괄 승인 버튼 */}
            <div className="flex items-center gap-2 ml-auto">
              {selected.size > 0 && (
                <motion.span
                  className="text-xs text-gray-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <strong className="text-emerald-600">{selected.size}건</strong> 선택됨
                </motion.span>
              )}
              <button
                onClick={handleBatchClick}
                disabled={selected.size === 0}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all ${
                  selected.size > 0
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                <ListChecks size={14} />
                일괄 승인 {selected.size > 0 && `(${selected.size}건)`}
              </button>
            </div>
          </div>

          {/* [방어적 설계: 명확한 공지] 고위험 선택 경고 */}
          <AnimatePresence>
            {hasHighRiskSelected && (
              <motion.div
                className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <ShieldAlert size={14} className="text-red-600 shrink-0" />
                <p className="text-xs text-red-700">
                  <strong>고위험 문서가 선택에 포함되어 있습니다.</strong> 일괄 승인 클릭 시 차단됩니다.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Document List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Table header */}
            <div className="flex items-center gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs text-gray-500" style={{ fontWeight: 600 }}>
              <div
                className={`w-4 h-4 rounded border cursor-pointer flex items-center justify-center shrink-0 transition-all ${
                  allBatchSelected ? "bg-emerald-500 border-emerald-500" : "border-gray-400"
                }`}
                onClick={toggleAll}
              >
                {allBatchSelected && <CheckCircle2 size={11} className="text-white" />}
                {someBatchSelected && <div className="w-2 h-0.5 bg-gray-500 rounded" />}
              </div>
              <span className="flex-[2]">제목</span>
              <span className="flex-[1]">기안자</span>
              <span className="flex-[1]">위험 등급</span>
              <span className="flex-[1]">기안일</span>
              <span className="w-16 text-center">열람</span>
            </div>

            {filteredDocs.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Clock size={28} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">해당 조건의 대기 문서가 없습니다.</p>
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const isSelected = selected.has(doc.id);
                const badge = RISK_BADGE[doc.risk];
                const domainBadge = DOMAIN_BADGE[doc.domainType];
                return (
                  <motion.div
                    key={doc.id}
                    layout
                    className={`flex items-center gap-4 px-5 py-4 border-b border-gray-100 last:border-0 transition-colors ${
                      isSelected ? "bg-emerald-50" : "hover:bg-gray-50"
                    }`}
                  >
                    {/* Checkbox */}
                    {/* Checkbox */}
                    <div
                      title={!doc.canBatch ? "고위험 문서는 개별 열람 후 승인해야 합니다." : "일괄 승인 선택"}
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                        !doc.canBatch
                          ? "border-gray-200 bg-gray-100 cursor-not-allowed"
                          : isSelected
                          ? "bg-emerald-500 border-emerald-500 cursor-pointer"
                          : "border-gray-300 cursor-pointer hover:border-emerald-400"
                      }`}
                      onClick={() => doc.canBatch && toggleDoc(doc.id)}
                    >
                      {isSelected && <CheckCircle2 size={11} className="text-white" />}
                      {!doc.canBatch && <Lock size={9} className="text-gray-400" />}
                    </div>

                    {/* Title */}
                    <div
                      className="flex-[2] min-w-0 cursor-pointer"
                      onClick={() => doc.id === "1" && navigate("/pending/1")}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-gray-800 truncate" style={{ fontWeight: 500 }}>
                          {doc.title}
                        </p>
                        {/* [요구사항 B] 도메인 뱃지 */}
                        {doc.domainType !== "일반" && (
                          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${domainBadge.color}`}>
                            {doc.domainType}
                          </span>
                        )}
                        {doc.risk === "HIGH" && (
                          <span className="shrink-0 flex items-center gap-1 text-xs bg-red-600 text-white px-1.5 py-0.5 rounded-full">
                            <AlertTriangle size={9} /> 고위험
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{doc.docNo} · {doc.form}</p>
                    </div>

                    {/* Requester */}
                    <span className="flex-[1] text-xs text-gray-600">{doc.requester} ({doc.dept})</span>

                    {/* Risk badge */}
                    <div className="flex-[1]">
                      <span className={`inline-flex text-xs px-2 py-0.5 rounded-full border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Date */}
                    <span className="flex-[1] text-xs text-gray-500">{doc.date}</span>

                    {/* Action */}
                    <div className="w-16 flex justify-center">
                      <button
                        onClick={() => doc.id === "1" && navigate("/pending/1")}
                        className={`w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-blue-100 hover:text-blue-600 transition-colors ${doc.id === "1" ? "" : "opacity-50 cursor-default"}`}
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* [방어적 설계: 재확인] 일괄 승인 확인 모달 */}
      {showBatchConfirm && (
        <BatchConfirmDialog
          count={selectedBatchable.length}
          onConfirm={handleBatchConfirm}
          onClose={() => setShowBatchConfirm(false)}
        />
      )}

      {/* [방어적 설계: 제약] 고위험 차단 모달 */}
      {showBlockModal && (
        <HighRiskBlockModal
          highRiskCount={[...selected].filter((id) => docs.find((d) => d.id === id)?.risk === "HIGH").length}
          onClose={() => setShowBlockModal(false)}
        />
      )}
    </>
  );
}
