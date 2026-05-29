import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
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
  AlertTriangle,
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

/* ─────────────────────────────────────────────────
   Types
───────────────────────────────────────────────── */
type ApprovalStatus = "done" | "viewing" | "pending" | "unread";

type ApprovalStep = {
  id: number;
  order: number;
  name: string;
  title: string;
  dept: string;
  status: ApprovalStatus;
  date?: string;
};

/* ─────────────────────────────────────────────────
   Mock Data
   ★ document_data (JSON) 구조로 변경
───────────────────────────────────────────────── */
const approvalSteps: ApprovalStep[] = [
  { id: 0, order: 0, name: "박도윤", title: "사원", dept: "IT 기획팀", status: "done", date: "2026-05-05 09:22" },
  { id: 1, order: 1, name: "김기훈", title: "팀장", dept: "IT 기획팀", status: "unread" },
  { id: 2, order: 2, name: "이수연", title: "부장", dept: "전략기획본부", status: "pending" },
];

const INITIAL_DOC_TITLE = "신규 장비 구매 요청";
const INITIAL_FORM_TYPE: FormType = "장비 구매 요청서";

/** 초기 document_data: 기안자가 상신 시 입력한 JSON */
const INITIAL_DOCUMENT_DATA: DocumentData = {
  purpose:
    "팀 업무 효율화를 위한 신규 장비 구매를 요청드립니다.\n현재 사용 중인 개발 PC의 노후화로 인해 업무 속도 저하 및 잦은 장애가 발생하고 있어, 업무 손실을 방지하고자 신규 장비 구매를 요청합니다.",
  itemName: "개발용 고성능 노트북",
  spec: "Intel i9 / 64GB RAM / 2TB NVMe SSD",
  quantity: "3",
  unitPrice: "2500000",
  notes: "견적서 및 제품 스펙 비교표를 첨부파일로 첨부하였으니 검토 부탁드립니다.",
};

const DEFAULT_APPROVERS = [
  { name: "김기훈", title: "팀장", order: 1 },
  { name: "이수연", title: "부장", order: 2 },
];

/* ─────────────────────────────────────────────────
   Status Config
───────────────────────────────────────────────── */
const statusConfig: Record<ApprovalStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  done: { label: "승인 완료", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: <CheckCircle2 size={14} className="text-emerald-600" /> },
  viewing: { label: "열람 중", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", icon: <Eye size={14} className="text-blue-600" /> },
  unread: { label: "미열람", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", icon: <EyeOff size={14} className="text-amber-600" /> },
  pending: { label: "대기", color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200", icon: <Circle size={14} className="text-gray-400" /> },
};

/* ─────────────────────────────────────────────────
   즉시 수정 모달 — 웹 에디터 기반
───────────────────────────────────────────────── */
function EditModal({
  title,
  formType,
  documentData,
  onSave,
  onClose,
}: {
  title: string;
  formType: FormType;
  documentData: DocumentData;
  onSave: (newTitle: string, newData: DocumentData) => void;
  onClose: () => void;
}) {
  const [editTitle, setEditTitle] = useState(title);
  const [editData, setEditData] = useState<DocumentData>({ ...documentData });

  const handleFieldChange = (key: string, val: string) => {
    setEditData((prev) => ({ ...prev, [key]: val }));
  };

  const canSave = editTitle.trim().length > 0 && isDocumentDataFilled(formType, editData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-[780px] max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center">
              <Pencil size={13} className="text-white" />
            </div>
            <div>
              <h3 className="text-gray-800">문서 수정</h3>
              <p className="text-xs text-blue-600">다음 결재자가 아직 열람하지 않아 즉시 수정이 가능합니다.</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Warning banner */}
        <div className="px-6 pt-4 shrink-0">
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-md px-3.5 py-3">
            <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed">
              수정 후 저장하면 <strong>결재선은 그대로 유지</strong>됩니다. 결재자가 열람을 시작하면 더 이상 수정할 수 없습니다.
            </p>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* 제목 */}
          <div className="space-y-1.5">
            <label className="text-sm text-gray-700">제목 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors bg-white"
            />
          </div>

          {/* 본문 수정 */}
          <div className="space-y-1.5">
            <label className="text-sm text-gray-700">문서 내용 <span className="text-red-500">*</span></label>
            <RichEditorPanel
              formType={formType}
              documentData={editData}
              onChange={handleFieldChange}
              approvers={DEFAULT_APPROVERS}
              writer="박도윤"
              dept="IT 기획팀"
              date="2026-05-05"
              docNo="2026-IT-00123"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors">
            취소
          </button>
          <button
            onClick={() => canSave && onSave(editTitle, editData)}
            disabled={!canSave}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <Save size={13} /> 수정 저장
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   회수 모달 (방어적 설계 3 — 재확인 패턴)
───────────────────────────────────────────────── */
const PRESET_REASONS = ["금액 오타로 인한 회수 및 재작성", "결재선 변경이 필요하여 회수합니다", "첨부 서류 누락으로 재작성 필요", "내용 수정 후 재상신 예정입니다"];

function WithdrawModal({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const MAX = 200;
  const MIN = 10;
  const canConfirm = reason.trim().length >= MIN;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl w-[520px] max-h-[90vh] flex flex-col overflow-hidden border border-gray-200"
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 bg-red-50 shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 border border-red-200 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-gray-900">문서 회수</h3>
                <p className="text-xs text-red-600 mt-0.5">회수 후에는 결재 진행이 중단됩니다. 실행 전 확인해 주세요.</p>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-red-100 hover:text-gray-600 transition-colors mt-0.5">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* 결과 안내 */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3.5 space-y-2">
            <p className="text-sm text-amber-900" style={{ fontWeight: 600 }}>회수 후 발생하는 변경사항</p>
            <ul className="space-y-1.5">
              {[
                "결재 진행이 즉시 중단됩니다.",
                "문서 상태가 '회수됨'으로 변경됩니다.",
                "문서가 임시저장함으로 이동됩니다.",
                "결재자에게 회수 알림이 발송됩니다.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
                  <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 text-xs" style={{ fontWeight: 700 }}>{i + 1}</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* 사유 입력 */}
          <div className="space-y-2">
            <label className="text-sm text-gray-700">
              회수 사유 <span className="text-red-500">*</span>
              <span className="text-xs text-gray-400 ml-1" style={{ fontWeight: 400 }}>(최소 10자 이상)</span>
            </label>
            {/* 사유 템플릿 칩 */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_REASONS.map((p) => (
                <button
                  key={p}
                  onClick={() => setReason(p)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${reason === p ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600"}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, MAX))}
              placeholder="회수 사유를 직접 입력하거나 위에서 선택하세요."
              rows={3}
              className={`w-full px-3 py-2.5 text-sm border rounded-lg resize-none focus:outline-none transition-all ${reason.trim().length >= MIN ? "border-blue-400 bg-white focus:ring-2 focus:ring-blue-100" : "border-gray-300 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100"}`}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {reason.trim().length > 0 && reason.trim().length < MIN && (
                  <><AlertTriangle size={11} className="text-amber-500" /><span className="text-xs text-amber-600">{MIN - reason.trim().length}자 더 입력하면 회수 실행이 가능합니다.</span></>
                )}
                {reason.trim().length >= MIN && (
                  <><CheckCircle2 size={11} className="text-emerald-500" /><span className="text-xs text-emerald-600">사유가 입력되었습니다.</span></>
                )}
              </div>
              <span className={`text-xs ${reason.length >= MAX * 0.9 ? "text-amber-500" : "text-gray-400"}`}>{reason.length}/{MAX}</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">취소</button>
          <button
            onClick={() => canConfirm && onConfirm()}
            disabled={!canConfirm}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm rounded-lg transition-all ${canConfirm ? "bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-200 cursor-pointer" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
          >
            <RotateCcw size={13} /> 회수 실행
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   DocumentTableView — SRP: HTML 테이블 기반 문서 뷰어
   서식(template HTML) + 데이터(JSON) 분리 아키텍처를 시각적으로 증명
───────────────────────────────────────────────── */
function DocumentTableView({
  data,
  approvers,
}: {
  data: DocumentData;
  approvers: { name: string; title: string; order: number }[];
}) {
  const totalAmount = Number(data.unitPrice || 0) * Number(data.quantity || 0);
  const fmtKRW = (n: number) =>
    n > 0 ? `${n.toLocaleString("ko-KR")}원` : "-";

  return (
    <div className="space-y-5 text-sm text-gray-800">
      {/* 문서 헤더 */}
      <div className="text-center border-b border-gray-300 pb-4">
        <p className="text-base text-gray-900" style={{ fontWeight: 700 }}>장비 구매 요청서</p>
        <div className="flex justify-center gap-6 mt-2 text-xs text-gray-500">
          <span>문서번호: 2026-IT-00123</span>
          <span>기안일: 2026-05-05</span>
          <span>기안부서: IT 기획팀</span>
        </div>
      </div>

      {/* 결재란 */}
      <div className="flex justify-end">
        <div className="border border-gray-300 rounded overflow-hidden text-xs">
          <div className="grid" style={{ gridTemplateColumns: `repeat(${approvers.length + 1}, 72px)` }}>
            <div className="bg-gray-50 px-2 py-1.5 border-r border-gray-200 text-center text-gray-500" style={{ fontWeight: 600 }}>구분</div>
            {approvers.map((a) => (
              <div key={a.order} className="bg-gray-50 px-2 py-1.5 border-r border-gray-200 last:border-r-0 text-center text-gray-500" style={{ fontWeight: 600 }}>
                {a.order === 0 ? "기안" : `${a.order}차 결재`}
              </div>
            ))}
            <div className="bg-gray-50 px-2 py-1.5 border-r border-gray-200 text-center text-gray-500" style={{ fontWeight: 600 }}>직책</div>
            {approvers.map((a) => (
              <div key={`t-${a.order}`} className="px-2 py-1.5 border-r border-gray-200 last:border-r-0 text-center text-gray-600">{a.title}</div>
            ))}
            <div className="bg-gray-50 px-2 py-1.5 border-r border-gray-200 text-center text-gray-500" style={{ fontWeight: 600 }}>성명</div>
            {approvers.map((a) => (
              <div key={`n-${a.order}`} className="px-2 py-1.5 border-r border-gray-200 last:border-r-0 text-center text-gray-700" style={{ fontWeight: 600 }}>{a.name}</div>
            ))}
          </div>
        </div>
      </div>

      {/* 구매 목적 */}
      <div className="space-y-1">
        <p className="text-xs text-gray-500" style={{ fontWeight: 600 }}>1. 구매 목적</p>
        <div className="bg-gray-50 border border-gray-200 rounded px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
          {data.purpose || "-"}
        </div>
      </div>

      {/* 구매 품목 테이블 */}
      <div className="space-y-1">
        <p className="text-xs text-gray-500" style={{ fontWeight: 600 }}>2. 구매 품목 명세</p>
        <div className="border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600 border-b border-gray-200">
                <th className="px-3 py-2 text-left border-r border-gray-200" style={{ fontWeight: 600 }}>품목명</th>
                <th className="px-3 py-2 text-left border-r border-gray-200" style={{ fontWeight: 600 }}>규격</th>
                <th className="px-3 py-2 text-center border-r border-gray-200 w-16" style={{ fontWeight: 600 }}>수량</th>
                <th className="px-3 py-2 text-right border-r border-gray-200 w-28" style={{ fontWeight: 600 }}>단가</th>
                <th className="px-3 py-2 text-right w-28" style={{ fontWeight: 600 }}>금액</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="px-3 py-2.5 border-r border-gray-100 text-gray-700">{data.itemName || "-"}</td>
                <td className="px-3 py-2.5 border-r border-gray-100 text-gray-600">{data.spec || "-"}</td>
                <td className="px-3 py-2.5 border-r border-gray-100 text-center text-gray-700">{data.quantity || "-"}</td>
                <td className="px-3 py-2.5 border-r border-gray-100 text-right text-gray-700">
                  {data.unitPrice ? `${Number(data.unitPrice).toLocaleString("ko-KR")}원` : "-"}
                </td>
                <td className="px-3 py-2.5 text-right text-gray-700">{fmtKRW(totalAmount)}</td>
              </tr>
              <tr className="bg-blue-50 border-t border-blue-100">
                <td colSpan={4} className="px-3 py-2 text-right text-blue-700 border-r border-blue-100" style={{ fontWeight: 600 }}>합계</td>
                <td className="px-3 py-2 text-right text-blue-800" style={{ fontWeight: 700 }}>{fmtKRW(totalAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 비고 */}
      {data.notes && (
        <div className="space-y-1">
          <p className="text-xs text-gray-500" style={{ fontWeight: 600 }}>3. 비고</p>
          <div className="bg-gray-50 border border-gray-200 rounded px-4 py-3 text-sm text-gray-700 leading-relaxed">
            {data.notes}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────── */
export function MyDraftDetailPage() {
  const navigate = useNavigate();
  const [docTitle, setDocTitle] = useState(INITIAL_DOC_TITLE);
  const [documentData, setDocumentData] = useState<DocumentData>(INITIAL_DOCUMENT_DATA);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [editSaved, setEditSaved] = useState(false);

  const currentApprover = approvalSteps.find((s) => s.status === "unread");
  const canEdit = currentApprover?.status === "unread";

  const handleSave = (newTitle: string, newData: DocumentData) => {
    setDocTitle(newTitle);
    setDocumentData(newData);
    setShowEditModal(false);
    setEditSaved(true);
  };
  const handleWithdraw = () => { setShowWithdrawModal(false); navigate("/drafts"); };

  return (
    <>
      <div className="p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
          <span onClick={() => navigate("/")} className="hover:text-blue-600 cursor-pointer transition-colors">전자결재 홈</span>
          <ChevronRight size={13} />
          <span onClick={() => navigate("/drafts")} className="hover:text-blue-600 cursor-pointer transition-colors">내 기안함</span>
          <ChevronRight size={13} />
          <span className="text-gray-800" style={{ fontWeight: 600 }}>진행중 문서 상세</span>
        </div>

        {/* 상태 배너 */}
        {canEdit ? (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-5 py-3.5 mb-5">
            <span className="text-base">💡</span>
            <p className="text-sm text-blue-800 leading-relaxed flex-1">
              아직 다음 결재자가 문서를 열람하지 않아 즉시 수정 및 회수가 가능합니다.
            </p>
            <div className="flex items-center gap-1.5 text-xs bg-white border border-blue-200 text-blue-700 px-2.5 py-1 rounded-full shrink-0"><EyeOff size={11} /> 미열람</div>
          </div>
        ) : (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-lg px-5 py-4 mb-5">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800" style={{ fontWeight: 600 }}>수정 불가 — 결재자가 이미 문서를 열람하였습니다</p>
              <p className="text-sm text-amber-700 mt-0.5">수정이 필요하다면 문서를 회수 후 재상신해 주세요.</p>
            </div>
          </div>
        )}

        {editSaved && (
          <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 mb-5">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <p className="text-sm text-emerald-700">수정 내용이 저장되었습니다. 결재선은 그대로 유지됩니다.</p>
            <button onClick={() => setEditSaved(false)} className="ml-auto text-emerald-500 hover:text-emerald-700 transition-colors"><X size={13} /></button>
          </div>
        )}

        <div className="flex gap-5">
          <div className="flex-1 space-y-4 min-w-0">
            {/* 결재 진행 현황 */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-gray-800">결재 진행 현황</h3>
              </div>
              <div className="px-6 py-5">
                <div className="flex items-start gap-0">
                  {approvalSteps.map((step, idx) => {
                    const cfg = statusConfig[step.status];
                    const isLast = idx === approvalSteps.length - 1;
                    return (
                      <div key={step.id} className="flex items-start flex-1 min-w-0">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.border}`}>
                            {step.status === "done" ? <CheckCircle2 size={18} className="text-emerald-600" />
                              : step.status === "unread" ? <Clock size={17} className="text-amber-600" />
                              : step.status === "viewing" ? <Eye size={17} className="text-blue-600" />
                              : <Circle size={17} className="text-gray-400" />}
                          </div>
                          <div className="mt-2 text-center px-1">
                            <p className="text-xs text-gray-800" style={{ fontWeight: 600 }}>{step.name}</p>
                            <p className="text-xs text-gray-500">{step.title}</p>
                            <span className={`inline-block mt-1 text-xs px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                              {step.order === 0 ? "기안자" : `${step.order}차 결재`}
                            </span>
                            {step.date && <p className="text-xs text-gray-400 mt-1">{step.date}</p>}
                            {step.status === "unread" && <p className="text-xs text-amber-600 mt-0.5">미열람</p>}
                            {step.status === "pending" && <p className="text-xs text-gray-400 mt-0.5">대기 중</p>}
                          </div>
                        </div>
                        {!isLast && (
                          <div className="flex-1 flex items-center pt-5 px-1">
                            <div className="w-full flex items-center gap-1">
                              <div className={`h-0.5 flex-1 ${step.status === "done" ? "bg-emerald-400" : "bg-gray-200"}`} />
                              <ArrowRight size={12} className={step.status === "done" ? "text-emerald-400" : "text-gray-300"} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ★ 핵심: 문서 내용 — HTML 테이블 구조로 서식/데이터 분리 아키텍처 증명 */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-gray-800">문서 내용</h3>
                  {/* [서식/데이터 분리 아키텍처] 문서 서식 버전 배지 */}
                  <span className="inline-flex items-center gap-1 text-xs bg-violet-50 border border-violet-200 text-violet-700 px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>
                    <FileText size={10} /> 문서 서식: 장비 구매 요청서 v1.2
                  </span>
                </div>
                {editSaved && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200"><CheckCircle2 size={11} /> 수정됨</span>
                )}
              </div>
              <div className="px-6 py-5">
                <DocumentTableView
                  data={documentData}
                  approvers={approvalSteps.map((s) => ({ name: s.name, title: s.title, order: s.order }))}
                />

                {/* 첨부파일 */}
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <p className="text-xs text-gray-400 mb-2">첨부파일</p>
                  {[{ name: "장비_견적서_2026.pdf", size: "1.2 MB" }, { name: "스펙_비교표.xlsx", size: "320 KB" }].map((file) => (
                    <div key={file.name} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 cursor-pointer py-1">
                      <Paperclip size={13} className="text-gray-400" />
                      <span className="underline underline-offset-2">{file.name}</span>
                      <span className="text-xs text-gray-400">({file.size})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-6 py-4">
              <button onClick={() => navigate("/drafts")} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">← 목록으로</button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-red-300 hover:text-red-600 transition-all"
                >
                  <RotateCcw size={13} /> 문서 회수
                </button>
                <button
                  onClick={() => canEdit && setShowEditModal(true)}
                  disabled={!canEdit}
                  className={`flex items-center gap-2 px-5 py-2 text-sm rounded-md transition-all shadow-sm ${canEdit ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                >
                  <Pencil size={13} /> 수정하기
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-60 space-y-4 shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
              <h4 className="text-gray-700">문서 정보</h4>
              {[
                { icon: <Hash size={12} />, label: "문서번호", value: "2026-IT-00123" },
                { icon: <FileText size={12} />, label: "양식", value: "장비 구매 요청서" },
                { icon: <User size={12} />, label: "기안자", value: "박도윤 (IT기획팀)" },
                { icon: <CalendarDays size={12} />, label: "기안일", value: "2026-05-05" },
                { icon: <Clock size={12} />, label: "상태", value: "결재 진행중" },
              ].map((info) => (
                <div key={info.label} className="flex items-start gap-2">
                  <div className="text-gray-400 mt-0.5">{info.icon}</div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">{info.label}</p>
                    <p className="text-xs text-gray-700">{info.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="text-gray-700 mb-3">가능한 작업</h4>
              <div className="space-y-2">
                <button
                  onClick={() => canEdit && setShowEditModal(true)}
                  disabled={!canEdit}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-md border transition-colors text-left ${canEdit ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" : "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"}`}
                >
                  <Pencil size={12} />
                  <span className="text-xs" style={{ fontWeight: 600 }}>수정하기</span>
                </button>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md border bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-red-200 hover:text-red-600 transition-colors text-left"
                >
                  <RotateCcw size={12} />
                  <span className="text-xs" style={{ fontWeight: 600 }}>문서 회수</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditModal
          title={docTitle}
          formType={INITIAL_FORM_TYPE}
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
