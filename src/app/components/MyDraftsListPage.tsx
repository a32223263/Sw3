import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  ChevronDown,
  Eye,
  RotateCcw,
  Search
} from "lucide-react";
import { Toaster } from "sonner"; // Toaster 추가

type DocStatus = "in_progress" | "approved" | "rejected" | "draft" | "withdrawn";
type Tab = "all" | "in_progress" | "approved" | "rejected" | "draft";

type DraftDoc = {
  id: string;
  docNo: string;
  form: string;
  title: string;
  status: DocStatus;
  currentApprover: string;
  submittedAt: string;
  updatedAt: string;
};

const draftDocs: DraftDoc[] = [
  { id: "1", docNo: "2026-IT-00123", form: "장비 구매 요청서", title: "신규 장비 구매 요청", status: "in_progress", currentApprover: "김기훈 팀장 (미열람)", submittedAt: "2026-05-05", updatedAt: "2026-05-05" },
  { id: "2", docNo: "2026-IT-00118", form: "출장 신청서", title: "5월 부산 출장 신청", status: "approved", currentApprover: "최종 승인 완료", submittedAt: "2026-04-28", updatedAt: "2026-04-30" },
  { id: "3", docNo: "2026-IT-00115", form: "지출 결의서", title: "4월 업무 식대 지출 결의", status: "rejected", currentApprover: "이수연 부장 (반려)", submittedAt: "2026-04-22", updatedAt: "2026-04-23" },
  { id: "4", docNo: "2026-IT-00110", form: "휴가 신청서", title: "5월 연차 신청", status: "draft", currentApprover: "—", submittedAt: "—", updatedAt: "2026-04-20" },
  { id: "5", docNo: "2026-IT-00107", form: "업무 협조 요청서", title: "1분기 성과 보고서 협조 요청", status: "withdrawn", currentApprover: "회수됨", submittedAt: "2026-04-18", updatedAt: "2026-04-19" },
];

const statusConfig: Record<DocStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  in_progress: { label: "진행중", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", icon: <Clock size={12} className="text-blue-600" /> },
  approved: { label: "승인 완료", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: <CheckCircle2 size={12} className="text-emerald-600" /> },
  rejected: { label: "반려", color: "text-red-700", bg: "bg-red-50", border: "border-red-200", icon: <XCircle size={12} className="text-red-600" /> },
  draft: { label: "임시저장", color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200", icon: <FileText size={12} className="text-slate-500" /> },
  withdrawn: { label: "회수됨", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", icon: <RotateCcw size={12} className="text-amber-600" /> },
};

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "in_progress", label: "진행중" },
  { key: "approved", label: "승인 완료" },
  { key: "rejected", label: "반려" },
  { key: "draft", label: "임시저장" },
];

export function MyDraftsListPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = draftDocs.filter((d) => {
    const matchTab = activeTab === "all" ? true : (activeTab === "draft" ? (d.status === "draft" || d.status === "withdrawn") : d.status === activeTab);
    const matchSearch = d.title.includes(searchQuery) || d.form.includes(searchQuery);
    return matchTab && matchSearch;
  });

  const tabCount = (tab: Tab) => {
    if (tab === "all") return draftDocs.length;
    if (tab === "draft") return draftDocs.filter((d) => d.status === "draft" || d.status === "withdrawn").length;
    return draftDocs.filter((d) => d.status === tab).length;
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="h-full overflow-y-auto bg-slate-50/50">
        <div className="p-8 max-w-[1400px] mx-auto space-y-6">
          
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <span className="hover:text-blue-600 cursor-pointer transition-colors">전자결재 홈</span>
            <ChevronRight size={13} />
            <span className="text-slate-800 font-semibold">내 기안함</span>
          </div>

          <div className="flex items-end justify-between border-b border-slate-200 pb-5">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">내 기안함</h2>
              <p className="text-sm text-slate-500 mt-1.5 font-medium">내가 기안한 문서를 확인하고 관리할 수 있습니다.</p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm"
            >
              + 새 결재 작성
            </button>
          </div>

          <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex-wrap gap-4">
            <div className="flex items-center gap-1">
              {TABS.map((tab) => {
                const count = tabCount(tab.key);
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all ${
                      isActive ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    }`}
                  >
                    {tab.label}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            
            <div className="flex items-center gap-3 pr-2">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="문서명, 양식 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm font-medium border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all w-60"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>문서 정보</span>
              <span>양식</span>
              <span className="text-center">결재 상태</span>
              <span>현재 결재자</span>
              <span className="text-center">상신일</span>
              <span className="text-center">보기</span>
            </div>

            {filtered.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <FileText size={36} className="mx-auto mb-3 text-slate-300" />
                <p className="text-base font-bold text-slate-600">해당 조건에 맞는 문서가 없습니다.</p>
              </div>
            ) : (
              filtered.map((doc) => {
                const cfg = statusConfig[doc.status];
                return (
                  <div
                    key={doc.id}
                    className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-4 px-6 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors items-center cursor-pointer"
                    onClick={() => navigate(`/drafts/${doc.id}`)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate mb-1 hover:text-blue-600 transition-colors">{doc.title}</p>
                      <p className="text-xs font-medium text-slate-400">{doc.docNo}</p>
                    </div>
                    <span className="text-sm font-medium text-slate-600">{doc.form}</span>
                    <div className="flex justify-center">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md border shadow-sm ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-slate-600">{doc.currentApprover}</span>
                    <span className="text-sm font-medium text-slate-500 text-center">{doc.submittedAt}</span>
                    <div className="flex justify-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/drafts/${doc.id}`); }}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}