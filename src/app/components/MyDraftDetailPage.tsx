import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { toast, Toaster } from "sonner"; // Toaster 명시적 임포트
import {
  ChevronRight,
  CheckCircle2,
  Clock,
  Circle,
  Pencil,
  RotateCcw,
  User,
  Paperclip,
  Eye,
  EyeOff,
  X,
  ArrowRight,
  CalendarDays,
  FileText,
  Hash,
  Save,
} from "lucide-react";
import {
  RichEditorPanel,
  isDocumentDataFilled,
  type FormType,
  type DocumentData,
} from "./RichEditorPanel";
import { TEMPLATES } from "./FormBuilderPage";
/* ─────────────────────────────────────────────────
   Types & Mock Data Registry
───────────────────────────────────────────────── */
type ApprovalStatus = "done" | "viewing" | "pending" | "unread";
type ApprovalStep = { id: number; order: number; name: string; title: string; dept: string; status: ApprovalStatus; date?: string; };

// 💡 E4 (권한 검증) 테스트를 위한 현재 로그인된 사용자 ID 가정
const CURRENT_USER_ID = "user123";

const ALL_MOCK_DOCUMENTS: Record<string, any> = {
  "1": {
    docNo: "2026-IT-00123",
    title: "신규 장비 구매 요청",
    formType: "장비 구매 요청서" as FormType,
    date: "2026-05-05",
    authorId: "user123", // 기안자 본인
    approvers: [
      { id: 0, order: 0, name: "박도윤", title: "사원", dept: "IT 기획팀", status: "done", date: "2026-05-05 09:22" },
      { id: 1, order: 1, name: "김기훈", title: "팀장", dept: "IT 기획팀", status: "unread" },
      { id: 2, order: 2, name: "이수연", title: "부장", dept: "전략기획본부", status: "pending" },
    ],
    data: {
      purpose: "팀 업무 효율화를 위한 신규 장비 구매를 요청드립니다.\n현재 사용 중인 개발 PC의 노후화로 인해 업무 속도 저하 및 잦은 장애가 발생하고 있어, 업무 손실을 방지하고자 신규 장비 구매를 요청합니다.",
      itemName: "개발용 고성능 노트북",
      spec: "Intel i9 / 64GB RAM / 2TB NVMe SSD",
      quantity: "3",
      unitPrice: "2500000",
      notes: "견적서 및 제품 스펙 비교표를 첨부파일로 첨부하였으니 검토 부탁드립니다.",
    }
  },
  "2": {
    docNo: "2026-IT-00118",
    title: "5월 부산 출장 신청",
    formType: "출장 신청서" as FormType,
    date: "2026-04-28",
    authorId: "user123", // 기안자 본인
    approvers: [
      { id: 0, order: 0, name: "박도윤", title: "사원", dept: "IT 기획팀", status: "done", date: "2026-04-28 09:00" },
      { id: 1, order: 1, name: "김기훈", title: "팀장", dept: "IT 기획팀", status: "done", date: "2026-04-29 10:30" },
      { id: 2, order: 2, name: "이수연", title: "부장", dept: "전략기획본부", status: "done", date: "2026-04-30 14:20" },
    ],
    data: { purpose: "B2B 파트너사 현장 미팅 및 신규 계약 조건 조율을 위한 부산 지역 출장 신청입니다.", notes: "교통비 영수증 별도 첨부 예정" }
  },
  "3": {
    docNo: "2026-IT-00115",
    title: "4월 업무 식대 지출 결의",
    formType: "지출 결의서" as FormType,
    date: "2026-04-22",
    authorId: "user123", // 기안자 본인
    approvers: [
      { id: 0, order: 0, name: "박도윤", title: "사원", dept: "IT 기획팀", status: "done", date: "2026-04-22 18:00" },
      { id: 1, order: 1, name: "김기훈", title: "팀장", dept: "IT 기획팀", status: "viewing", date: "2026-04-23 09:10" },
      { id: 2, order: 2, name: "이수연", title: "부장", dept: "전략기획본부", status: "pending" },
    ],
    data: { purpose: "IT 기획팀 4월 야근 식대 및 부서 간담회 비용 청구 건입니다.", notes: "법인카드 전표 첨부 완료" }
  },
  "5": {
    docNo: "2026-IT-00107",
    title: "1분기 성과 보고서 협조 요청",
    formType: "업무 협조 요청서" as FormType,
    date: "2026-04-18",
    authorId: "other456", // 💡 타인의 문서 (E4 권한 없음 테스트용)
    approvers: [
      { id: 0, order: 0, name: "최유리", title: "사원", dept: "IT 기획팀", status: "done", date: "2026-04-18 11:00" },
      { id: 1, order: 1, name: "김기훈", title: "팀장", dept: "IT 기획팀", status: "unread" },
    ],
    data: { purpose: "1분기 프로젝트 성과 지표 취합을 위해 각 부서의 데이터 협조를 요청합니다.", notes: "기한: 4월 25일까지" }
  }
};

const statusConfig: Record<ApprovalStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  done: { label: "승인 완료", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: <CheckCircle2 size={14} className="text-emerald-600" /> },
  viewing: { label: "열람 중", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", icon: <Eye size={14} className="text-blue-600" /> },
  unread: { label: "미열람", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", icon: <EyeOff size={14} className="text-amber-600" /> },
  pending: { label: "대기", color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-200", icon: <Circle size={14} className="text-slate-400" /> },
};

/* ─────────────────────────────────────────────────
   즉시 수정 모달
───────────────────────────────────────────────── */
function EditModal({ title, formType, documentData, onSave, onClose }: any) {
  const [editTitle, setEditTitle] = useState(title);
  const [editData, setEditData] = useState<DocumentData>({ ...documentData });

  // 💡 해결 1: formType(문자열)을 기반으로 실제 TemplateSchema 객체를 찾아옵니다.
  const templateSchema = TEMPLATES.find((t) => t.name === formType) || TEMPLATES[0];

  const handleFieldChange = (key: string, val: string) => setEditData((prev) => ({ ...prev, [key]: val }));
  
  // 💡 해결 2: isDocumentDataFilled 에 문자열이 아닌 templateSchema 객체를 전달합니다.
  const canSave = editTitle.trim().length > 0 && isDocumentDataFilled(templateSchema, editData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[780px] max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center">
              <Pencil size={15} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-slate-900 font-bold text-lg">기안 문서 즉시 수정</h3>
              <p className="text-xs text-blue-600 font-medium">결재자가 열람하기 전이므로 즉시 수정(Hot-fix)이 가능합니다.</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">제목 <span className="text-red-500">*</span></label>
            <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-4 py-2.5 text-sm font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">문서 내용 (서식 기반 수정) <span className="text-red-500">*</span></label>
            
            {/* 💡 해결 3: formType={formType} 대신 templateSchema={templateSchema} 를 전달합니다. */}
            <RichEditorPanel
              templateSchema={templateSchema}
              documentData={editData}
              onChange={handleFieldChange}
              approvers={[{ name: "김기훈", title: "팀장", order: 1 }]}
              writer="박도윤"
              dept="IT 기획팀"
              date="2026-05-05"
              docNo="2026-IT-00123"
            />
            
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors">취소</button>
          <button onClick={() => canSave && onSave(editTitle, editData)} disabled={!canSave} className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-sm">
            <Save size={16} /> 수정 내용 저장
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   회수 모달
───────────────────────────────────────────────── */
function WithdrawModal({ onConfirm, onClose }: any) {
  const PRESET_REASONS = ["금액 오타로 인한 회수", "결재선 변경 필요함", "추가 첨부 서류 누락", "내용 수정 후 재상신"];
  const [reason, setReason] = useState("");
  const MIN = 10;

  // 💡 E2 (회수 사유 미입력) 로직: disabled를 풀고 버튼 클릭 시 에러 토스트를 발생시켜 UI 차단
  const handleConfirmClick = () => {
    if (reason.trim().length === 0) {
      toast.error("회수 사유를 입력해야 합니다.");
      return;
    }
    if (reason.trim().length < MIN) {
      toast.error(`회수 사유는 최소 ${MIN}자 이상이어야 합니다.`);
      return;
    }
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />
      <motion.div className="relative bg-white rounded-2xl shadow-2xl w-[520px] overflow-hidden border border-slate-200" initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }}>
        <div className="px-6 py-5 border-b border-slate-100 bg-red-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 border border-red-200 flex items-center justify-center">
              <RotateCcw size={18} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-slate-900 font-bold text-lg">문서 회수</h3>
              <p className="text-xs text-red-600 font-medium">회수 즉시 결재 진행이 중단됩니다.</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700">회수 사유 <span className="text-red-500">*</span><span className="text-xs text-slate-400 font-medium ml-2">(최소 10자 이상)</span></label>
            <div className="flex flex-wrap gap-2">
              {PRESET_REASONS.map((p) => (
                <button key={p} onClick={() => setReason(p)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${reason === p ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:bg-slate-50"}`}>
                  {p}
                </button>
              ))}
            </div>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="회수 사유를 상세히 작성해 주세요." rows={4} className={`w-full px-4 py-3 text-sm font-medium border rounded-xl resize-none focus:outline-none transition-all ${reason.trim().length >= MIN ? "border-slate-300 focus:border-slate-800 focus:ring-2 focus:ring-slate-100" : "border-slate-300 focus:border-slate-400"}`} />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors">취소</button>
          <button onClick={handleConfirmClick} className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all shadow-sm">
            <RotateCcw size={16} /> 회수 실행
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   DocumentTableView
───────────────────────────────────────────────── */
function DocumentTableView({ title, docNo, date, formType, data, approvers }: any) {
  const totalAmount = Number(data.unitPrice || 0) * Number(data.quantity || 0);
  const fmtKRW = (n: number) => n > 0 ? `${n.toLocaleString("ko-KR")}원` : "-";

  return (
    <div className="bg-white border-2 border-slate-800 p-10 min-h-[600px] shadow-sm relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[120px] font-black text-slate-50 opacity-50 select-none pointer-events-none z-0">결재문서</div>

      <div className="relative z-10 space-y-8 text-slate-900">
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6">
          <div className="pt-2">
            <h1 className="text-3xl font-black tracking-widest text-slate-900">{formType}</h1>
            <div className="mt-4 space-y-1 text-sm font-medium text-slate-600">
              <p>문서번호 : <span className="text-slate-900 font-bold">{docNo}</span></p>
              <p>기안일자 : <span className="text-slate-900 font-bold">{date}</span></p>
              <p>기안부서 : <span className="text-slate-900 font-bold">IT 기획팀</span></p>
            </div>
          </div>
          
          <table className="border-collapse border-2 border-slate-800 text-center text-sm">
            <tbody>
              <tr>
                <td rowSpan={3} className="bg-slate-100 border-2 border-slate-800 px-3 py-6 font-bold w-10 writing-vertical-rl">결재</td>
                {approvers.map((a: any, i: number) => (
                  <td key={a.order} className="bg-slate-100 border border-slate-800 px-4 py-1.5 font-bold w-20">
                    {i === 0 ? "기안" : "결재"}
                  </td>
                ))}
              </tr>
              <tr>
                {approvers.map((a: any) => (
                  <td key={`n-${a.order}`} className="border border-slate-800 px-2 py-1 font-medium h-20 align-bottom pb-2 relative">
                    <span className="absolute top-2 left-0 w-full text-center text-xs text-slate-500">{a.title}</span>
                    <span className="font-bold text-slate-800">{a.name}</span>
                  </td>
                ))}
              </tr>
              <tr>
                {approvers.map((a: any) => (
                  <td key={`s-${a.order}`} className="border border-slate-800 px-2 py-1 text-xs text-slate-500 bg-slate-50">
                    {a.status === "done" ? "완료" : a.status === "unread" ? "미열람" : "대기중"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-bold flex items-center gap-2"><span className="text-blue-600">1.</span> 제목 및 사유</h3>
            <div className="min-h-[80px] border border-slate-300 p-4 leading-relaxed whitespace-pre-wrap font-medium">
              <p className="font-bold mb-2">[{title}]</p>
              {data.purpose || "내용 없음"}
            </div>
          </div>

          {data.itemName && (
            <div className="space-y-2">
              <h3 className="text-lg font-bold flex items-center gap-2"><span className="text-blue-600">2.</span> 명세서</h3>
              <table className="w-full border-collapse border-2 border-slate-800 text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border border-slate-800 px-4 py-2.5 font-bold w-[30%]">항목</th>
                    <th className="border border-slate-800 px-4 py-2.5 font-bold w-[30%]">내용</th>
                    <th className="border border-slate-800 px-4 py-2.5 font-bold w-[10%]">수량</th>
                    <th className="border border-slate-800 px-4 py-2.5 font-bold w-[15%]">단가</th>
                    <th className="border border-slate-800 px-4 py-2.5 font-bold w-[15%]">합계</th>
                  </tr>
                </thead>
                <tbody className="text-center font-medium">
                  <tr>
                    <td className="border border-slate-800 px-4 py-3">{data.itemName}</td>
                    <td className="border border-slate-800 px-4 py-3 text-left">{data.spec || "-"}</td>
                    <td className="border border-slate-800 px-4 py-3">{data.quantity || "-"}</td>
                    <td className="border border-slate-800 px-4 py-3 text-right">{data.unitPrice ? `${Number(data.unitPrice).toLocaleString("ko-KR")}원` : "-"}</td>
                    <td className="border border-slate-800 px-4 py-3 text-right font-bold bg-blue-50/50">{fmtKRW(totalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {data.notes && (
            <div className="space-y-2">
              <h3 className="text-lg font-bold flex items-center gap-2"><span className="text-blue-600">{data.itemName ? "3." : "2."}</span> 비고 및 특이사항</h3>
              <div className="border border-slate-300 p-4 leading-relaxed font-medium bg-slate-50">
                {data.notes}
              </div>
            </div>
          )}
        </div>

        <div className="pt-10 text-center font-bold text-slate-500">
          - 위와 같이 품의하오니 재가하여 주시기 바랍니다 -
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────── */
export function MyDraftDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const sourceDoc = ALL_MOCK_DOCUMENTS[id as string] || ALL_MOCK_DOCUMENTS["1"];
  const [docTitle, setDocTitle] = useState(sourceDoc.title);
  const [documentData, setDocumentData] = useState<DocumentData>(sourceDoc.data);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const approvalSteps = sourceDoc.approvers as ApprovalStep[];
  
  // 💡 방어적 로직 적용
  // 1. E4: 기안자 권한 확인 (본인이 기안한 문서인지)
  const isAuthor = CURRENT_USER_ID === sourceDoc.authorId;
  
  // 2. E3: 최종 승인 완료된 문서인지 확인 (모든 결재자가 done 상태인지)
  const isFullyApproved = approvalSteps.filter(a => a.order > 0).every(a => a.status === "done");
  
  // 3. E1: 다음 결재자(1차 결재자)가 열람했는지 확인
  const nextApprover = approvalSteps.find(a => a.order === 1);
  const hasNextApproverViewed = nextApprover && (nextApprover.status === "viewing" || nextApprover.status === "done");

  useEffect(() => {
    // 본인이 쓴 글이 아니면 아예 진입을 거부하거나 경고를 띄울 수 있음 (여기서는 화면 렌더링 내에서 버튼만 숨김 처리)
    if (isAuthor && !hasNextApproverViewed && !isFullyApproved) {
      toast.info("결재자 미열람 상태입니다.", {
        description: "💡 현재 문서를 즉시 수정(Hot-fix)할 수 있습니다.",
        duration: 5000,
      });
    }
  }, [isAuthor, hasNextApproverViewed, isFullyApproved]);

  const handleEditClick = () => {
    // 💡 E1 방어: 다음 결재자가 이미 열람했다면 수정 거부
    if (hasNextApproverViewed) {
      toast.error("다음 결재자가 이미 열람하여 즉시 수정할 수 없습니다.");
      return;
    }
    setShowEditModal(true);
  };

  const handleWithdrawClick = () => {
    // 💡 E3 방어: 최종 승인 완료된 문서 회수 차단
    if (isFullyApproved) {
      toast.error("최종 승인된 문서는 회수할 수 없습니다.");
      return;
    }
    setShowWithdrawModal(true);
  };

  const handleSave = (newTitle: string, newData: DocumentData) => {
    setDocTitle(newTitle);
    setDocumentData(newData);
    setShowEditModal(false);
    toast.success("수정 내용이 성공적으로 반영되었습니다.", {
      description: "기존 결재선과 문서 상태는 유지되며 본문 내용만 즉시 업데이트되었습니다.",
      duration: 4000,
    });
  };

  const handleWithdraw = () => { 
    setShowWithdrawModal(false); 
    toast.success("문서 회수가 완료되었습니다.", {
      description: "해당 문서는 결재 대기열에서 제외되었으며, '임시저장/회수' 상태로 전환되었습니다.",
      duration: 4000,
    });
    setTimeout(() => navigate("/drafts"), 800);
  };
  
  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="h-full overflow-y-auto bg-slate-50/50 p-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-6 font-medium">
            <span onClick={() => navigate("/")} className="hover:text-blue-600 cursor-pointer transition-colors">전자결재 홈</span>
            <ChevronRight size={14} />
            <span onClick={() => navigate("/drafts")} className="hover:text-blue-600 cursor-pointer transition-colors">내 기안함</span>
            <ChevronRight size={14} />
            <span className="text-slate-800 font-bold">문서 상세</span>
          </div>

          <div className="flex gap-6">
            <div className="flex-1 space-y-6 min-w-0">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 text-lg">결재 진행 현황</h3>
                </div>
                <div className="px-8 py-8">
                  <div className="flex items-start">
                    {approvalSteps.map((step, idx) => {
                      const cfg = statusConfig[step.status];
                      const isLast = idx === approvalSteps.length - 1;
                      return (
                        <div key={step.id} className="flex items-start flex-1 min-w-0">
                          <div className="flex flex-col items-center">
                            <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center shrink-0 shadow-sm transition-all ${cfg.bg} ${cfg.border}`}>
                              {step.status === "done" ? <CheckCircle2 size={24} className="text-emerald-600" />
                                : step.status === "unread" ? <Clock size={22} className="text-amber-600" />
                                : step.status === "viewing" ? <Eye size={22} className="text-blue-600" />
                                : <Circle size={22} className="text-slate-300" />}
                            </div>
                            <div className="mt-3 text-center px-1">
                              <p className="text-sm font-bold text-slate-800">{step.name}</p>
                              <p className="text-xs font-medium text-slate-500 mt-0.5">{step.title}</p>
                              <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-1 rounded-md border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                {step.order === 0 ? "기안자" : `${step.order}차 결재`}
                              </span>
                            </div>
                          </div>
                          {!isLast && (
                            <div className="flex-1 flex items-center pt-6 px-3">
                              <div className="w-full flex items-center gap-1">
                                <div className={`h-[3px] flex-1 rounded-full ${step.status === "done" ? "bg-emerald-400" : "bg-slate-200"}`} />
                                <ArrowRight size={14} className={step.status === "done" ? "text-emerald-500" : "text-slate-300"} />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-800 text-lg">기안 내용</h3>
                    {isAuthor && !hasNextApproverViewed && !isFullyApproved && (
                      <span className="flex items-center gap-1.5 text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-md border border-blue-200 shadow-sm animate-pulse">
                        <Pencil size={12} /> 즉시 수정 가능
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="p-8 bg-[#f8fafc]">
                  <DocumentTableView
                    title={docTitle}
                    docNo={sourceDoc.docNo}
                    date={sourceDoc.date}
                    formType={sourceDoc.formType}
                    data={documentData}
                    approvers={approvalSteps}
                  />
                </div>
              </div>
            </div>

            <div className="w-[300px] shrink-0 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h4 className="font-bold text-slate-800 text-base mb-5 border-b border-slate-100 pb-3">문서 요약 정보</h4>
                <div className="space-y-4">
                  {[
                    { icon: <Hash size={16} />, label: "문서번호", value: sourceDoc.docNo },
                    { icon: <FileText size={16} />, label: "사용 양식", value: sourceDoc.formType },
                    { icon: <CalendarDays size={16} />, label: "기안일자", value: sourceDoc.date },
                  ].map((info) => (
                    <div key={info.label} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        {info.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-400">{info.label}</p>
                        <p className="text-sm font-bold text-slate-700 truncate">{info.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 💡 E4 방어: 기안자가 아닌 경우 문서 관리(수정/회수) 버튼 영역 자체를 숨김 */}
              {isAuthor && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-6">
                  <h4 className="font-bold text-slate-800 text-base mb-4">문서 관리 (Action)</h4>
                  <div className="space-y-3">
                    <button
                      onClick={handleEditClick}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all shadow-sm ${
                        !hasNextApproverViewed 
                          ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md" 
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}
                    >
                      <Pencil size={16} /> 수정하기 (Hot-fix)
                    </button>
                    <button
                      onClick={handleWithdrawClick}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold bg-white border-2 border-slate-200 text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all shadow-sm"
                    >
                      <RotateCcw size={16} /> 문서 회수
                    </button>
                    <button 
                      onClick={() => navigate("/drafts")} 
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold bg-white text-slate-500 hover:bg-slate-50 transition-all mt-4"
                    >
                      목록으로 돌아가기
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditModal
          title={docTitle}
          formType={sourceDoc.formType}
          documentData={documentData}
          onSave={handleSave}
          onClose={() => setShowEditModal(false)}
        />
      )}
      {showWithdrawModal && (
        <WithdrawModal onConfirm={handleWithdraw} onClose={() => setShowWithdrawModal(false)} />
      )}
    </>
  );
}