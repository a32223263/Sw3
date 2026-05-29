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
  LOW: { label: "🟢 LOW", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const DOMAIN_BADGE: Record<DomainType, { color: string }> = {
  "전결 가능": { color: "bg-purple-50 text-purple-700 border-purple-200" },
  "합의 요청": { color: "bg-blue-50 text-blue-700 border-blue-200" },
  "대결": { color: "bg-amber-50 text-amber-700 border-amber-200" },
  "일반": { color: "" },
};

/* ─── Skeleton (Modernized) ─── */
function ListSkeleton() {
  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="space-y-3">
          <div className="h-7 w-40 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4 w-56 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="flex gap-3 mt-4">
        <div className="h-10 w-32 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-10 w-32 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-10 flex-1 bg-slate-200 rounded-xl animate-pulse" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mt-4">
        <div className="h-12 bg-slate-50 border-b border-slate-200" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-[70px] border-b border-slate-100 flex items-center px-6 gap-4">
            <div className="w-5 h-5 bg-slate-200 rounded-md animate-pulse" />
            <div className="flex-[2] h-5 bg-slate-200 rounded animate-pulse" />
            <div className="flex-[1] h-4 bg-slate-200 rounded animate-pulse" />
            <div className="flex-[1] h-6 bg-slate-200 rounded-full animate-pulse" />
            <div className="flex-[1] h-4 bg-slate-200 rounded animate-pulse" />
            <div className="w-8 h-8 bg-slate-200 rounded-md animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── [방어적 설계: 재확인] 일괄 승인 확인 모달 ─── */
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
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl w-[420px] overflow-hidden border border-slate-200"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
      >
        <div className="px-6 py-5 border-b border-slate-100 bg-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center">
              <ListChecks size={18} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-slate-900 font-bold text-lg">일괄 승인 재확인</h3>
              <p className="text-xs text-blue-600 font-medium mt-0.5">선택한 {count}건의 문서를 승인(전결) 처리합니다</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-6 space-y-3">
          <p className="text-sm text-slate-700 leading-relaxed">
            선택하신 <strong className="text-blue-700 font-bold">{count}건</strong>의 일반 문서를 일괄 승인하시겠습니까? <br/>
            (현재 로그인된 세션 인증이 유효하여 즉시 승인됩니다.)
          </p>
          <p className="text-xs text-slate-500 font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">
            승인 완료 후 각 문서는 다음 결재자에게 자동으로 전달됩니다.
          </p>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors font-semibold">
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-2 px-6 py-2.5 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-bold"
          >
            <CheckCircle2 size={16} /> 승인 확정
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

  // 필터 적용
  const filteredDocs = docs.filter((d) => {
    if (searchQuery && !d.title.includes(searchQuery) && !d.requester.includes(searchQuery)) return false;
    if (formFilter !== "all" && !d.form.includes(formFilter)) return false;
    return true;
  });

  // 일괄 처리가 가능한(일반) 문서들만 별도 추출
  const batchableDocs = filteredDocs.filter((d) => d.canBatch && d.risk !== "HIGH");
  const batchableIds = new Set(batchableDocs.map((d) => d.id));
  const selectedBatchable = [...selected].filter((id) => batchableIds.has(id));

  // 💡 [피드백 반영] 개별 선택 토글: 고위험 문서는 선택 원천 차단
  const toggleDoc = (id: string) => {
    const doc = docs.find((d) => d.id === id);
    if (!doc) return;
    
    // 고위험 문서는 체크 불가 & 토스트 안내 (모달 대신)
    if (doc.risk === "HIGH" || !doc.canBatch) {
      toast.error("고위험 문서는 일괄 승인이 불가하며, 개별 2FA 인증이 필요합니다.", {
        icon: <ShieldAlert size={16} className="text-red-500" />
      });
      return;
    }

    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const allBatchSelected = batchableDocs.length > 0 && selectedBatchable.length === batchableDocs.length;
  const someBatchSelected = selectedBatchable.length > 0 && !allBatchSelected;

  // 💡 [피드백 반영] 전체 선택 시: 일반 문서들만 선택되게 처리
  const toggleAll = () => {
    if (allBatchSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(batchableDocs.map((d) => d.id)));
    }
  };

  const handleBatchClick = () => {
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
      description: "선택된 일반 문서가 정상적으로 다음 결재자에게 전달되었습니다.",
    });
  };

  if (isLoading) return <ListSkeleton />;

  return (
    <>
      <div className="h-full overflow-y-auto bg-slate-50/50">
        <div className="p-8 max-w-[1400px] mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-end justify-between border-b border-slate-200 pb-5">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">결재 대기함</h2>
              <p className="text-sm text-slate-500 mt-1.5 font-medium">내 결재 순서가 도래한 대기 문서 목록입니다.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
              <Clock size={14} className="text-blue-500" />
              <span>진행 대기 총 {docs.length}건</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "전체 대기", value: docs.length, color: "bg-white border-slate-200 text-slate-800" },
              { label: "🔴 고위험 (개별 심사)", value: docs.filter((d) => d.risk === "HIGH").length, color: "bg-red-50 border-red-200 text-red-700" },
              { label: "🟡 중위험", value: docs.filter((d) => d.risk === "MEDIUM").length, color: "bg-amber-50 border-amber-200 text-amber-700" },
              { label: "🟢 저위험", value: docs.filter((d) => d.risk === "LOW").length, color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-2xl border p-5 shadow-sm ${stat.color}`}>
                <p className="font-extrabold text-3xl">{stat.value}</p>
                <p className="text-xs mt-2 font-bold opacity-80">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* [요구사항 D] 다중 검색 필터 바 */}
          <div className="flex items-center gap-3 flex-wrap bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 px-3 border-r border-slate-100">
              <Filter size={16} className="text-slate-400 shrink-0" />
              <span className="text-sm font-bold text-slate-600">필터</span>
            </div>

            {/* 기안일 Select */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="text-sm font-medium border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer hover:bg-slate-100 transition-colors"
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
              className="text-sm font-medium border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <option value="all">전체 양식</option>
              <option value="예산 집행 품의서">예산 집행 품의서</option>
              <option value="출장 신청서">출장 신청서</option>
              <option value="구매 요청서">구매 요청서</option>
              <option value="업무 협조 요청서">업무 협조 요청서</option>
              <option value="계약 체결 품의서">계약 체결 품의서</option>
            </select>

            {/* 결재 상태 Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm font-medium border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <option value="pending">결재 대기</option>
              <option value="in_progress">진행 중</option>
              <option value="rejected">반려됨</option>
            </select>

            {/* 검색창 */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="문서명, 기안자 검색..."
                className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* 일괄 승인 버튼 */}
            <div className="flex items-center gap-3 ml-auto px-2">
              {selected.size > 0 && (
                <motion.span
                  className="text-sm text-slate-500 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <strong className="text-blue-600 font-bold">{selected.size}건</strong> 선택됨
                </motion.span>
              )}
              <button
                onClick={handleBatchClick}
                disabled={selected.size === 0}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${
                  selected.size > 0
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md cursor-pointer"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                }`}
              >
                <ListChecks size={16} />
                일괄 승인 {selected.size > 0 && `(${selected.size})`}
              </button>
            </div>
          </div>

          {/* Document List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Table Header */}
            <div className="flex items-center gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                  allBatchSelected ? "bg-blue-500 border-blue-500 cursor-pointer" : "border-slate-300 bg-white cursor-pointer hover:border-blue-400"
                }`}
                onClick={toggleAll}
                title="일반 문서 전체 선택"
              >
                {allBatchSelected && <CheckCircle2 size={14} className="text-white" />}
                {someBatchSelected && <div className="w-2.5 h-0.5 bg-blue-500 rounded" />}
              </div>
              <span className="flex-[2.5] ml-2">문서 정보</span>
              <span className="flex-[1]">기안자 / 부서</span>
              <span className="flex-[1] text-center">위험 등급</span>
              <span className="flex-[1] text-center">기안일</span>
              <span className="w-16 text-center">상세</span>
            </div>

            {filteredDocs.length === 0 ? (
              <div className="py-20 text-center text-slate-400 bg-slate-50/50">
                <Search size={36} className="mx-auto mb-3 text-slate-300" />
                <p className="text-base font-bold text-slate-600">조건에 맞는 대기 문서가 없습니다.</p>
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const isSelected = selected.has(doc.id);
                const isHighRisk = doc.risk === "HIGH" || !doc.canBatch;
                const badge = RISK_BADGE[doc.risk];
                const domainBadge = DOMAIN_BADGE[doc.domainType];

                return (
                  <motion.div
                    key={doc.id}
                    layout
                    className={`flex items-center gap-4 px-6 py-5 border-b border-slate-100 last:border-0 transition-all ${
                      isSelected ? "bg-blue-50/50" : "hover:bg-slate-50"
                    } ${isHighRisk ? "bg-red-50/10" : ""}`}
                  >
                    {/* Checkbox */}
                    <div
                      title={isHighRisk ? "고위험 문서는 개별 심사가 필요합니다." : "일괄 승인 선택"}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                        isHighRisk
                          ? "border-slate-200 bg-slate-100 cursor-not-allowed opacity-70"
                          : isSelected
                          ? "bg-blue-500 border-blue-500 cursor-pointer shadow-sm"
                          : "border-slate-300 bg-white cursor-pointer hover:border-blue-400"
                      }`}
                      onClick={() => toggleDoc(doc.id)}
                    >
                      {isSelected && <CheckCircle2 size={14} className="text-white" />}
                      {isHighRisk && <Lock size={12} className="text-slate-400" />}
                    </div>

                    {/* Title & Info */}
                    <div
                      className="flex-[2.5] min-w-0 cursor-pointer ml-2"
                      onClick={() => navigate(`/pending/${doc.id}`)}
                    >
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <p className="text-base font-bold text-slate-800 truncate hover:text-blue-600 transition-colors">
                          {doc.title}
                        </p>
                        {doc.domainType !== "일반" && (
                          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-md border font-bold ${domainBadge.color}`}>
                            {doc.domainType}
                          </span>
                        )}
                        {isHighRisk && (
                          <span className="shrink-0 flex items-center gap-1 text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-md border border-red-200">
                            <AlertTriangle size={12} /> 개별 심사 
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{doc.form}</span>
                        <span className="text-xs text-slate-400 font-medium">{doc.docNo}</span>
                      </div>
                    </div>

                    {/* Requester */}
                    <div className="flex-[1]">
                      <p className="text-sm font-bold text-slate-700">{doc.requester}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{doc.dept}</p>
                    </div>

                    {/* Risk badge */}
                    <div className="flex-[1] flex justify-center">
                      <span className={`inline-flex items-center justify-center text-xs font-bold px-3 py-1 rounded-full border shadow-sm ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Date */}
                    <span className="flex-[1] text-sm font-medium text-slate-500 text-center">{doc.date}</span>

                    {/* Action */}
                    <div className="w-16 flex justify-center">
                      <button
                        onClick={() => navigate(`/pending/${doc.id}`)}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                          doc.id === "1"
                            ? "bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                            : "bg-slate-50 border border-slate-200 text-slate-400 hover:bg-slate-100"
                        }`}
                        title="문서 상세 열람"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 일괄 승인 재확인 모달 */}
      {showBatchConfirm && (
        <BatchConfirmDialog
          count={selectedBatchable.length}
          onConfirm={handleBatchConfirm}
          onClose={() => setShowBatchConfirm(false)}
        />
      )}
    </>
  );
}