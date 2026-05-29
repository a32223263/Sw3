import { useState } from "react";
import { useNavigate } from "react-router";
import {
  AlertTriangle,
  RotateCcw,
  X,
  ChevronRight,
  FileText,
  Clock,
  CheckCircle2,
  Circle,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Hash,
  Info,
  ShieldAlert,
  Pencil,
} from "lucide-react";
import { motion } from "motion/react";

/* ─── Mock doc ─── */
const doc = {
  docNo: "2026-IT-00123",
  form: "장비 구매 요청서",
  title: "신규 장비 구매 요청",
  submittedAt: "2026-05-05 09:22",
  currentApprover: "김기훈 팀장",
};

type ApprovalStatus = "done" | "unread" | "pending";
const timelineSteps: { name: string; title: string; status: ApprovalStatus; order: number }[] = [
  { name: "박도윤", title: "사원 (기안자)", status: "done", order: 0 },
  { name: "김기훈", title: "팀장 · IT기획팀", status: "unread", order: 1 },
  { name: "이수연", title: "부장 · 전략기획본부", status: "pending", order: 2 },
];

const PRESET_REASONS = [
  "금액 오타로 인한 회수 및 재작성",
  "결재선 변경 필요",
  "첨부 서류 누락",
  "내용 수정 후 재상신 예정",
];

/* ─────────────────────────────────────────────────
   Withdraw Modal
───────────────────────────────────────────────── */
function WithdrawModal({
  onConfirm,
  onClose,
}: {
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [showPresets, setShowPresets] = useState(false);
  const canConfirm = reason.trim().length >= 5;
  const MAX = 200;

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Dim layer */}
      <motion.div
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />

      {/* Modal Card */}
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl w-[520px] max-h-[90vh] flex flex-col overflow-hidden border border-gray-200"
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
      >
        {/* ── Modal Header ── */}
        <div className="px-6 py-5 border-b border-gray-200 bg-red-50 shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 border border-red-200 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-gray-900">문서 회수</h3>
                <p className="text-xs text-red-600 mt-0.5">파괴적 작업 — 실행 전 반드시 확인하세요</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-red-100 hover:text-gray-600 transition-colors mt-0.5"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Consequence notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3.5 space-y-2">
            <p className="text-sm text-amber-900" style={{ fontWeight: 600 }}>
              회수 후 발생하는 변경사항
            </p>
            <ul className="space-y-1.5">
              {[
                "결재 프로세스가 즉시 중단됩니다.",
                "문서가 임시저장함으로 이동됩니다.",
                "수정 후 다시 상신할 수 있습니다.",
                "결재자에게 회수 알림이 발송됩니다.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
                  <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 text-xs" style={{ fontWeight: 700 }}>
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Document summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 space-y-2">
            <p className="text-xs text-gray-500" style={{ fontWeight: 600 }}>회수 대상 문서</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center shrink-0">
                <FileText size={14} className="text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{doc.title}</p>
                <p className="text-xs text-gray-500">{doc.docNo} · {doc.form}</p>
              </div>
            </div>
            {/* Mini timeline */}
            <div className="flex items-center gap-1 pt-1">
              {timelineSteps.map((step, idx) => (
                <div key={step.name} className="flex items-center gap-1">
                  {idx > 0 && <ArrowRight size={10} className="text-gray-300" />}
                  <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                    step.status === "done"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : step.status === "unread"
                      ? "bg-amber-50 border-amber-200 text-amber-700"
                      : "bg-gray-100 border-gray-200 text-gray-500"
                  }`}>
                    {step.status === "done" && <CheckCircle2 size={9} />}
                    {step.status === "unread" && <EyeOff size={9} />}
                    {step.status === "pending" && <Circle size={9} />}
                    {step.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reason input */}
          <div className="space-y-2">
            <label className="text-sm text-gray-700">
              회수 사유 <span className="text-red-500">*</span>
              <span className="text-xs text-gray-400 ml-1" style={{ fontWeight: 400 }}>
                (최소 5자 이상 입력)
              </span>
            </label>

            {/* Preset chips */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_REASONS.map((p) => (
                <button
                  key={p}
                  onClick={() => setReason(p)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    reason === p
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600"
                  }`}
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
              className={`w-full px-3 py-2.5 text-sm border rounded-lg resize-none focus:outline-none transition-all ${
                reason.trim().length >= 5
                  ? "border-blue-400 bg-white focus:ring-2 focus:ring-blue-100"
                  : "border-gray-300 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              }`}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {reason.trim().length > 0 && reason.trim().length < 5 && (
                  <>
                    <AlertTriangle size={11} className="text-amber-500" />
                    <span className="text-xs text-amber-600">
                      {5 - reason.trim().length}자 더 입력하면 회수 실행이 가능합니다.
                    </span>
                  </>
                )}
                {reason.trim().length >= 5 && (
                  <>
                    <CheckCircle2 size={11} className="text-emerald-500" />
                    <span className="text-xs text-emerald-600">사유가 입력되었습니다.</span>
                  </>
                )}
              </div>
              <span className={`text-xs ${reason.length >= MAX * 0.9 ? "text-amber-500" : "text-gray-400"}`}>
                {reason.length}/{MAX}
              </span>
            </div>
          </div>

        </div>

        {/* ── Modal Footer ── */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => canConfirm && onConfirm(reason)}
            disabled={!canConfirm}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm rounded-lg transition-all ${
              canConfirm
                ? "bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-200 cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <RotateCcw size={13} />
            회수 실행
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Success State
───────────────────────────────────────────────── */
function WithdrawSuccessOverlay({ onGoBack }: { onGoBack: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl w-96 overflow-hidden border border-gray-200 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 340, damping: 26 }}
      >
        <div className="bg-emerald-50 px-6 pt-8 pb-6">
          <div className="w-14 h-14 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-emerald-600" />
          </div>
          <h3 className="text-gray-800 mb-1">회수 완료</h3>
          <p className="text-sm text-gray-600">
            문서가 성공적으로 회수되었습니다.<br />
            임시저장함에서 수정 후 재상신할 수 있습니다.
          </p>
        </div>
        <div className="px-6 py-4">
          <button
            onClick={onGoBack}
            className="w-full py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            내 기안함으로 이동
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Background (blurred draft page mockup)
───────────────────────────────────────────────── */
function DraftDetailBackground() {
  return (
    <div className="p-6 select-none pointer-events-none">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
        <span>전자결재 홈</span>
        <ChevronRight size={13} />
        <span>내 기안함</span>
        <ChevronRight size={13} />
        <span className="text-gray-800" style={{ fontWeight: 600 }}>진행중 문서 상세</span>
      </div>

      {/* Notice banner */}
      <div className="flex items-start gap-3 bg-blue-600 text-white rounded-lg px-5 py-4 mb-5">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Info size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm" style={{ fontWeight: 600 }}>즉시 수정 가능한 상태입니다</p>
          <p className="text-sm text-blue-100">다음 결재자 김기훈 팀장이 아직 문서를 열람하지 않았습니다.</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs bg-white/20 border border-white/30 text-white px-2.5 py-1 rounded-full ml-auto shrink-0">
          <EyeOff size={11} /> 미열람
        </div>
      </div>

      <div className="flex gap-5">
        <div className="flex-1 space-y-4">
          {/* Timeline */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-gray-800">결재 진행 현황</h3>
            </div>
            <div className="px-6 py-5 flex items-start gap-0">
              {timelineSteps.map((step, idx) => (
                <div key={step.name} className="flex items-start flex-1 min-w-0">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                      step.status === "done" ? "bg-emerald-50 border-emerald-200"
                      : step.status === "unread" ? "bg-amber-50 border-amber-200"
                      : "bg-gray-50 border-gray-200"
                    }`}>
                      {step.status === "done" ? <CheckCircle2 size={18} className="text-emerald-600" />
                       : step.status === "unread" ? <Clock size={17} className="text-amber-600" />
                       : <Circle size={17} className="text-gray-400" />}
                    </div>
                    <div className="mt-2 text-center px-1">
                      <p className="text-xs text-gray-800" style={{ fontWeight: 600 }}>{step.name}</p>
                      <p className="text-xs text-gray-500">{step.title}</p>
                    </div>
                  </div>
                  {idx < timelineSteps.length - 1 && (
                    <div className="flex-1 flex items-center pt-5 px-1">
                      <div className={`h-0.5 flex-1 ${step.status === "done" ? "bg-emerald-400" : "bg-gray-200"}`} />
                      <ArrowRight size={12} className={step.status === "done" ? "text-emerald-400" : "text-gray-300"} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Document content stub */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-gray-800">문서 내용</h3>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">제목</p>
                <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>신규 장비 구매 요청</p>
              </div>
              <div className="h-px bg-gray-100" />
              <div>
                <p className="text-xs text-gray-400 mb-2">본문</p>
                <div className="bg-gray-50 rounded-md p-4 border border-gray-100">
                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                    안녕하세요. IT 기획팀 박도윤입니다. 팀 업무 효율화를 위한 신규 장비 구매를 요청드립니다. 현재 사용 중인 개발 PC의 노후화로 인해 업무 속도 저하 및 잦은 장애가 발생하고 있습니다...
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-6 py-4">
            <button className="text-sm text-gray-500">← 목록으로</button>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md">
                <RotateCcw size={13} /> 회수
              </button>
              <button className="flex items-center gap-2 px-5 py-2 text-sm bg-blue-600 text-white rounded-md">
                <Pencil size={13} /> 즉시 수정
              </button>
            </div>
          </div>
        </div>

        {/* Right panel stub */}
        <div className="w-60 space-y-4 shrink-0">
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <h4 className="text-gray-700">문서 정보</h4>
            {[
              { icon: <Hash size={12} />, label: "문서번호", value: "2026-IT-00123" },
              { icon: <FileText size={12} />, label: "양식", value: "장비 구매 요청서" },
              { icon: <User size={12} />, label: "기안자", value: "박도윤 (IT기획팀)" },
              { icon: <Clock size={12} />, label: "상태", value: "결재 진행중" },
            ].map((info) => (
              <div key={info.label} className="flex items-start gap-2">
                <div className="text-gray-400 mt-0.5">{info.icon}</div>
                <div>
                  <p className="text-xs text-gray-400">{info.label}</p>
                  <p className="text-xs text-gray-700">{info.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Screen 3 — Main Export
───────────────────────────────────────────────── */
export function WithdrawModalScreen() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<"modal" | "success" | "closed">("modal");

  return (
    <div className="relative min-h-full">
      {/* ── Background: Dimmed draft detail ── */}
      <DraftDetailBackground />

      {/* ── Modal Layer ── */}
      {stage === "modal" && (
        <WithdrawModal
          onConfirm={() => setStage("success")}
          onClose={() => { setStage("closed"); navigate("/drafts/1"); }}
        />
      )}

      {stage === "success" && (
        <WithdrawSuccessOverlay onGoBack={() => navigate("/drafts")} />
      )}

      {/* ── Closed state: subtle re-open prompt ── */}
      {stage === "closed" && null}
    </div>
  );
}
