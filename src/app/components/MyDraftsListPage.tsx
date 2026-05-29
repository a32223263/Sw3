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
} from "lucide-react";

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
  {
    id: "1",
    docNo: "2026-IT-00123",
    form: "장비 구매 요청서",
    title: "신규 장비 구매 요청",
    status: "in_progress",
    currentApprover: "김기훈 팀장 (미열람)",
    submittedAt: "2026-05-05",
    updatedAt: "2026-05-05",
  },
  {
    id: "2",
    docNo: "2026-IT-00118",
    form: "출장 신청서",
    title: "5월 부산 출장 신청",
    status: "approved",
    currentApprover: "최종 승인",
    submittedAt: "2026-04-28",
    updatedAt: "2026-04-30",
  },
  {
    id: "3",
    docNo: "2026-IT-00115",
    form: "지출 결의서",
    title: "4월 업무 식대 지출 결의",
    status: "rejected",
    currentApprover: "이수연 부장 (반려)",
    submittedAt: "2026-04-22",
    updatedAt: "2026-04-23",
  },
  {
    id: "4",
    docNo: "2026-IT-00110",
    form: "휴가 신청서",
    title: "5월 연차 신청",
    status: "draft",
    currentApprover: "—",
    submittedAt: "—",
    updatedAt: "2026-04-20",
  },
  {
    id: "5",
    docNo: "2026-IT-00107",
    form: "업무 협조 요청서",
    title: "1분기 성과 보고서 협조 요청",
    status: "withdrawn",
    currentApprover: "회수됨",
    submittedAt: "2026-04-18",
    updatedAt: "2026-04-19",
  },
];

const statusConfig: Record<DocStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  in_progress: {
    label: "진행중",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: <Clock size={12} className="text-blue-600" />,
  },
  approved: {
    label: "승인 완료",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: <CheckCircle2 size={12} className="text-emerald-600" />,
  },
  rejected: {
    label: "반려",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: <XCircle size={12} className="text-red-600" />,
  },
  draft: {
    label: "임시저장",
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
    icon: <FileText size={12} className="text-gray-500" />,
  },
  withdrawn: {
    label: "회수됨",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: <RotateCcw size={12} className="text-amber-600" />,
  },
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

  const filtered = activeTab === "all"
    ? draftDocs
    : draftDocs.filter((d) => d.status === activeTab || (activeTab === "draft" && d.status === "withdrawn"));

  const tabCount = (tab: Tab) => {
    if (tab === "all") return draftDocs.length;
    if (tab === "draft") return draftDocs.filter((d) => d.status === "draft" || d.status === "withdrawn").length;
    return draftDocs.filter((d) => d.status === tab).length;
  };

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
        <span className="hover:text-blue-600 cursor-pointer transition-colors">전자결재 홈</span>
        <ChevronRight size={13} />
        <span className="text-gray-800" style={{ fontWeight: 600 }}>내 기안함</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-gray-800">내 기안함</h2>
          <p className="text-sm text-gray-500 mt-0.5">내가 기안한 문서를 확인하고 관리할 수 있습니다.</p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
        >
          + 새 결재 작성
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg overflow-hidden">
          {TABS.map((tab) => {
            const count = tabCount(tab.key);
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/30 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
          최신순 <ChevronDown size={13} />
        </button>
      </div>

      {/* Document List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs text-gray-500" style={{ fontWeight: 600 }}>
          <span>제목</span>
          <span>양식</span>
          <span>결재 상태</span>
          <span>현재 결재자</span>
          <span>상신일</span>
          <span className="text-center">보기</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-10 text-center text-gray-400">
            <FileText size={28} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm">해당 탭에 문서가 없습니다.</p>
          </div>
        ) : (
          filtered.map((doc) => {
            const cfg = statusConfig[doc.status];
            return (
              <div
                key={doc.id}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-4 px-5 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors items-center cursor-pointer"
                onClick={() => doc.id === "1" && navigate("/drafts/1")}
              >
                <div className="min-w-0">
                  <p className="text-sm text-gray-800 truncate" style={{ fontWeight: 500 }}>{doc.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{doc.docNo}</p>
                </div>
                <span className="text-xs text-gray-600">{doc.form}</span>
                <div>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                    {cfg.icon}
                    {cfg.label}
                  </span>
                </div>
                <span className="text-xs text-gray-600">{doc.currentApprover}</span>
                <span className="text-xs text-gray-500">{doc.submittedAt}</span>
                <div className="flex justify-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); doc.id === "1" && navigate("/drafts/1"); }}
                    className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-blue-600 transition-colors"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}