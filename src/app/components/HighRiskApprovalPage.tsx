import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  ChevronRight,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  X,
  Eye,
  ArrowDown,
  Clock,
  Paperclip,
  User,
  Hash,
  FileText,
  CalendarDays,
  ThumbsDown,
  ThumbsUp,
  ShieldCheck,
  Lock,
  Unlock,
  ChevronUp,
} from "lucide-react";
import { Drawer } from "vaul";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

/* ─── Document content sections ─── */
const DOC_SECTIONS = [
  {
    heading: "1. 개요",
    body: `본 품의서는 2026년 3분기(7월~9월) IT 인프라 고도화 사업의 예산 집행을 위해 작성되었습니다. 해당 예산은 전사 핵심 시스템의 안정성 향상 및 사이버 보안 강화를 목적으로 하며, 이사회 승인을 통해 반영된 연간 예산 범위 내에서 집행됩니다.`,
  },
  {
    heading: "2. 집행 배경 및 필요성",
    body: `현재 운영 중인 온프레미스(On-Premise) 서버 인프라는 2019년 도입 이후 7년째 운영되어 노후화가 심각한 수준입니다. 전년도 가용성 SLA 목표치 99.9% 대비 실제 달성률이 98.7%에 그쳐 연간 약 112시간의 비계획 다운타임이 발생하였으며, 이로 인한 업무 손실 및 기회비용이 연 2억 3천만 원으로 추산됩니다.

또한 보안 감사 결과, 레거시 OS 및 미패치 취약점으로 인한 위험 수준이 '높음(High)' 등급을 유지하고 있어 즉각적인 조치가 필요한 상황입니다.`,
  },
  {
    heading: "3. 예산 집행 상세",
    body: `아래 표는 3분기 IT 인프라 고도화 사업의 항목별 예산 내역입니다.

  ■ 서버 인프라 교체 (하이퍼컨버지드 인프라)
    - 벤더: Dell Technologies / HPE
    - 수량: 12노드 클러스터 구성
    - 예산: 4억 8,000만 원

  ■ 네트워크 장비 업그레이드 (SDN 전환)
    - 벤더: Cisco / Arista
    - 구성: Core 2대, Distribution 4대, Access 24대
    - 예산: 1억 9,500만 원

  ■ 사이버보안 강화 (EDR/XDR 솔루션 도입)
    - 대상: 전사 엔드포인트 1,240대
    - 예산: 1억 2,000만 원

  ──────────────────────────────────
  합계 (VAT 별도): 12억 4,950만 원`,
  },
  {
    heading: "4. 조달 계획 및 일정",
    body: `조달은 사내 IT 구매 규정에 따라 공개경쟁입찰을 원칙으로 진행합니다.

  • 2026.07.01 ~ 07.15: RFP 발송 및 벤더 제안서 접수
  • 2026.07.16 ~ 07.25: 기술평가 및 가격협상
  • 2026.07.28: 최종 벤더 선정 및 계약 체결
  • 2026.08.01 ~ 09.30: 장비 납품 및 설치/구성
  • 2026.10.01 ~ 10.15: 안정화 테스트 및 인수 검사`,
  },
  {
    heading: "5. 위험 요인 분석",
    body: `[위험 수준: 🔴 높음]
  - 단일 집행 금액 12억 원 초과 → 이사회 사전 승인 필요 (완료)
  - 핵심 운영 시스템 마이그레이션 포함 → 업무 중단 가능성 존재
  - 글로벌 공급망 이슈로 인한 납기 지연 위험

  [위험 완화 방안]
  - 단계적 마이그레이션 적용 (블루/그린 배포 전략)
  - 납기 지연 패널티 조항 계약서 명시`,
  },
  {
    heading: "6. 결론 및 요청사항",
    body: `상기 내용을 충분히 검토하신 후, 2026년 3분기 IT 인프라 고도화 사업 예산 집행에 대한 결재를 요청드립니다.

본 사업은 전사 디지털 전환(DX) 로드맵의 핵심 마일스톤이며, 7월 이내 집행이 이루어지지 않을 경우 연내 구축 완료가 불가능합니다.

모든 관련 근거 자료는 첨부파일을 통해 확인하실 수 있습니다.

감사합니다.

IT 인프라팀 박도윤 드림`,
  },
];

/* ─── Approve Confirm Modal (OTP 추가) ─── */
function ApproveConfirmModal({
  onConfirm,
  onClose,
}: {
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [comment, setComment] = useState("");
  const [otp, setOtp] = useState("");

  // OTP가 4자리 이상 입력되어야 승인 버튼 활성화
  const canConfirm = otp.length >= 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl w-[460px] overflow-hidden border border-gray-200"
        initial={{ opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 30,
        }}
      >
        <div className="px-6 py-5 border-b border-gray-200 bg-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center">
              <ShieldAlert
                size={18}
                className="text-emerald-600"
              />
            </div>
            <div>
              <h3 className="text-gray-800">
                결재 승인 (2차 인증)
              </h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                2026년 3분기 예산 집행 품의
              </p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3.5 py-3 text-xs text-blue-800 leading-relaxed">
            고위험 문서 결재를 위해{" "}
            <strong>OTP 또는 간편 비밀번호</strong> 입력이
            필요합니다. <br />
            승인 후 다음 결재자 <strong>이수연 부장</strong>에게
            자동 전달됩니다.
          </div>

          {/* OTP 입력란 */}
          <div className="space-y-1.5">
            <label
              className="text-sm text-gray-700"
              style={{ fontWeight: 600 }}
            >
              2차 인증 비밀번호{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              maxLength={6}
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/[^0-9]/g, ""))
              }
              placeholder="숫자 4~6자리 입력"
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-gray-700">
              의견 (선택)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="승인 의견을 남길 수 있습니다."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-blue-400 transition-all"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className={`flex items-center gap-2 px-6 py-2.5 text-sm rounded-lg transition-colors shadow-sm ${
              canConfirm
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <CheckCircle2 size={13} /> 인증 및 승인
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Reject Modal ─── */
const REJECT_REASONS = [
  "예산 규모 재검토 필요",
  "근거 자료 보완 요청",
  "상위 기관 승인 선행 필요",
  "직접 입력",
];
type RejectTarget = "WRITER" | "PREV_APPROVER";

function RejectModal({
  onConfirm,
  onClose,
}: {
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [target, setTarget] = useState<RejectTarget>("WRITER");
  const MIN_LENGTH = 10;
  const canConfirm = reason.trim().length >= MIN_LENGTH;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl w-[500px] overflow-hidden border border-gray-200"
        initial={{ opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 30,
        }}
      >
        <div className="px-6 py-5 border-b border-gray-200 bg-red-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 border border-red-200 flex items-center justify-center">
              <ThumbsDown size={18} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-gray-800">결재 반려</h3>
              <p className="text-xs text-red-600 mt-0.5">
                반려 사유를 필수로 입력해야 합니다 (최소 10자)
              </p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {REJECT_REASONS.map((r) => (
              <button
                key={r}
                onClick={() =>
                  setReason(r === "직접 입력" ? "" : r)
                }
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${reason === r ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-600 border-gray-300 hover:border-red-400 hover:text-red-600"}`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* [요구사항 G] 반려 대상 라디오 선택 */}
          <div className="space-y-2">
            <label className="text-sm text-gray-700">
              반려 대상 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label
                className={`flex items-start gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${target === "WRITER" ? "bg-red-50 border-red-300" : "bg-white border-gray-200 hover:border-gray-300"}`}
              >
                <input
                  type="radio"
                  name="rejectTarget"
                  checked={target === "WRITER"}
                  onChange={() => setTarget("WRITER")}
                  className="mt-0.5"
                />
                <div>
                  <p
                    className="text-xs text-gray-800"
                    style={{ fontWeight: 600 }}
                  >
                    기안자에게 반려 (상신 취소 및 전면 재작성)
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    기안자 박도윤에게 반려 알림이 발송됩니다.
                  </p>
                </div>
              </label>
              <label
                className={`flex items-start gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${target === "PREV_APPROVER" ? "bg-amber-50 border-amber-300" : "bg-white border-gray-200 hover:border-gray-300"}`}
              >
                <input
                  type="radio"
                  name="rejectTarget"
                  checked={target === "PREV_APPROVER"}
                  onChange={() => setTarget("PREV_APPROVER")}
                  className="mt-0.5"
                />
                <div>
                  <p
                    className="text-xs text-gray-800"
                    style={{ fontWeight: 600 }}
                  >
                    이전 단계로 반려 (직전 결재자에게 재검토
                    요청)
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    이 문서는 1차 결재이므로 기안자에게
                    반려됩니다.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">
                반려 사유{" "}
                <span className="text-red-500">*</span>
              </label>
              <span
                className={`text-xs ${reason.trim().length >= MIN_LENGTH ? "text-emerald-600" : "text-gray-400"}`}
              >
                {reason.trim().length}/{MIN_LENGTH}자 이상
              </span>
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="반려 사유를 입력하세요 (최소 10자)"
              className={`w-full px-3 py-2.5 text-sm border rounded-lg resize-none focus:outline-none transition-all ${
                canConfirm
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-gray-300 focus:border-red-400"
              }`}
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => canConfirm && onConfirm()}
            disabled={!canConfirm}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm rounded-lg transition-all ${canConfirm ? "bg-red-600 text-white hover:bg-red-700 shadow-sm" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
          >
            <ThumbsDown size={13} /> 반려 확정
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Approval Condition Panel (SRP 컴포넌트) ─── */
function ApprovalConditionPanel({
  scrollDone,
  scrollPct,
  canApprove,
  onApprove,
  onReject,
}: {
  scrollDone: boolean;
  scrollPct: number;
  canApprove: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="space-y-3">
      {/* 승인 조건 체크리스트 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert size={14} className="text-blue-500" />
          <span
            className="text-sm text-gray-700"
            style={{ fontWeight: 600 }}
          >
            승인 조건 확인
          </span>
        </div>
        <div className="space-y-2.5">
          {/* [방어적 설계: 제약] 조건 1 — 보안 세션 (Mock: 항상 true) */}
          <div className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 border bg-emerald-50 border-emerald-200">
            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-emerald-500">
              <CheckCircle2 size={12} className="text-white" />
            </div>
            <div>
              <p
                className="text-xs text-emerald-700"
                style={{ fontWeight: 600 }}
              >
                보안 세션 유효함
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                최종 승인 시 2차 인증 필수
              </p>
            </div>
          </div>

          {/* [방어적 설계: 제약] 조건 2 — 본문 스크롤 확인 */}
          <div
            className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 border transition-colors ${
              scrollDone
                ? "bg-emerald-50 border-emerald-200"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                scrollDone ? "bg-emerald-500" : "bg-gray-300"
              }`}
            >
              {scrollDone ? (
                <CheckCircle2
                  size={12}
                  className="text-white"
                />
              ) : (
                <Eye size={11} className="text-white" />
              )}
            </div>
            <div>
              <p
                className={`text-xs ${scrollDone ? "text-emerald-700" : "text-gray-500"}`}
                style={{ fontWeight: 600 }}
              >
                {scrollDone
                  ? "본문 스크롤 확인 완료"
                  : "본문 스크롤 확인 미완료"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {scrollDone
                  ? "전체 열람 완료"
                  : `현재 ${scrollPct}% 열람`}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`mt-3 rounded-md px-3 py-2 text-xs flex items-center gap-2 border ${
            canApprove
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-gray-50 border-gray-200 text-gray-500"
          }`}
        >
          {canApprove ? (
            <Unlock size={11} />
          ) : (
            <Lock size={11} />
          )}
          <span style={{ fontWeight: 600 }}>
            {canApprove
              ? "승인 버튼이 활성화되었습니다"
              : "문서를 끝까지 스크롤해주세요"}
          </span>
        </div>
      </div>

      {/* 결재 정보 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2.5">
        <h4
          className="text-gray-700 text-sm"
          style={{ fontWeight: 600 }}
        >
          결재 정보
        </h4>
        {[
          { label: "내 역할", value: "1차 결재자" },
          { label: "다음 결재자", value: "이수연 부장" },
          { label: "예산 규모", value: "12억 4,950만원" },
          { label: "위험 등급", value: "🔴 HIGH" },
        ].map((item) => (
          <div key={item.label}>
            <p className="text-xs text-gray-400">
              {item.label}
            </p>
            <p
              className="text-xs text-gray-700"
              style={{ fontWeight: 500 }}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* 액션 버튼 */}
      <button
        onClick={() => canApprove && onReject()}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-red-300 hover:text-red-600 transition-all"
      >
        <ThumbsDown size={13} /> 반려
      </button>
      <button
        onClick={() => canApprove && onApprove()}
        disabled={!canApprove}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-lg transition-all ${
          canApprove
            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        {canApprove ? <Unlock size={13} /> : <Lock size={13} />}
        승인
      </button>
    </div>
  );
}

/* ─── Main Page ─── */
export function HighRiskApprovalPage() {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const scrollRef = useRef<HTMLDivElement>(null);
  const drawerScrollRef = useRef<HTMLDivElement>(null);

  const [scrollPct, setScrollPct] = useState(0);
  const [scrollDone, setScrollDone] = useState(false);
  const [drawerScrollDone, setDrawerScrollDone] =
    useState(false);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [showApproveModal, setShowApproveModal] =
    useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [done, setDone] = useState<
    "approved" | "rejected" | null
  >(null);

  // 오프라인 감지
  useEffect(() => {
    if (!isOnline) {
      toast.warning(
        "⚠️ 네트워크 연결이 불안정합니다. 오프라인 모드로 전환됩니다.",
      );
    }
  }, [isOnline]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const pct = Math.round(
      (scrollTop / (scrollHeight - clientHeight)) * 100,
    );
    setScrollPct(Math.min(pct, 100));
    if (pct >= 95) {
      setScrollDone(true);
      setShowScrollHint(false);
    }
  }, []);

  const handleDrawerScroll = useCallback(() => {
    const el = drawerScrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const pct = Math.round(
      (scrollTop / (scrollHeight - clientHeight)) * 100,
    );
    if (pct >= 90) setDrawerScrollDone(true);
  }, []);

  // [방어적 설계: 제약] 승인 조건 1단계: 본문 100% 스크롤 필수 (이후 2단계로 2FA 인증 진행 - 2차 보고서 UC-APP-01 반영)
  const canApprove = scrollDone;
  const canApproveDrawer = drawerScrollDone;

  const handleApprove = () => {
    if (!canApprove) return;
    if (!isOnline) {
      toast.success(
        "승인 내용이 대기열에 저장되었습니다. 네트워크 복구 시 자동 전송됩니다.",
      );
      return;
    }
    setShowApproveModal(true);
  };

  if (done) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-full">
        <motion.div
          className="bg-white rounded-2xl border border-gray-200 shadow-xl p-10 text-center w-96"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 320,
            damping: 26,
          }}
        >
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              done === "rejected"
                ? "bg-red-100 border-2 border-red-200"
                : "bg-emerald-100 border-2 border-emerald-200"
            }`}
          >
            {done === "rejected" ? (
              <ThumbsDown size={30} className="text-red-600" />
            ) : (
              <CheckCircle2
                size={32}
                className="text-emerald-600"
              />
            )}
          </div>
          <h3 className="text-gray-800 mb-1">
            {done === "approved" ? "승인 완료" : "반려 완료"}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {done === "approved"
              ? "다음 결재자 이수연 부장에게 자동 전달됩니다."
              : "기안자 박도윤에게 반려 알림이 발송됩니다."}
          </p>
          <button
            onClick={() => navigate("/pending")}
            className="w-full py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            결재 대기함으로 이동
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Page Header */}
        <div className="px-6 pt-5 pb-0 shrink-0">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
            <span
              onClick={() => navigate("/pending")}
              className="hover:text-blue-600 cursor-pointer transition-colors"
            >
              결재 대기함
            </span>
            <ChevronRight size={13} />
            <span
              className="text-gray-800"
              style={{ fontWeight: 600 }}
            >
              2026년 3분기 예산 집행 품의
            </span>
            <span className="flex items-center gap-1 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full ml-1">
              <AlertTriangle size={10} /> 고위험
            </span>
          </div>

          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-gray-900">
                2026년 3분기 IT 인프라 고도화 사업 예산 집행
                품의
              </h2>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <User size={11} /> 기안자: 박도윤 대리 ·
                  IT기획팀
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <CalendarDays size={11} /> 2026-05-05
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Hash size={11} /> 2026-IT-00201
                </span>
                <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full">
                  <FileText size={10} /> 예산 집행 품의서
                </span>
                <span className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <ShieldCheck size={10} /> 2차 인증 대상
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area — 데스크탑: 좌우 분할, 모바일: 단일 컬럼 */}
        <div className="flex flex-1 gap-5 px-6 pb-0 min-h-0">
          {/* Document Viewer */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="bg-white rounded-t-lg border border-gray-200 border-b-0 shrink-0">
              <div className="px-5 py-3 flex items-center justify-between border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Eye size={14} className="text-gray-500" />
                  <span
                    className="text-sm text-gray-700"
                    style={{ fontWeight: 600 }}
                  >
                    문서 본문
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-28 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full transition-colors ${scrollDone ? "bg-emerald-500" : "bg-blue-500"}`}
                      animate={{ width: `${scrollPct}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                  <span
                    className={`text-xs ${scrollDone ? "text-emerald-600" : "text-gray-500"}`}
                  >
                    {scrollDone
                      ? "✓ 전체 열람"
                      : `${scrollPct}%`}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative flex-1 min-h-0">
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="absolute inset-0 overflow-y-auto bg-gray-50 border border-gray-200 border-t-0 rounded-b-lg"
              >
                <div className="p-5 space-y-4">
                  {/* 공문서 헤더 */}
                  <div className="border border-gray-300 overflow-hidden rounded-sm bg-white">
                    <div className="flex items-start justify-between px-6 py-4 border-b border-gray-300 bg-white gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded bg-blue-700 flex items-center justify-center shrink-0">
                          <span
                            className="text-white text-xs"
                            style={{ fontWeight: 700 }}
                          >
                            CORP
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">
                            전자결재 시스템 · 고위험 문서
                          </p>
                          <h3
                            className="text-gray-900"
                            style={{ fontWeight: 700 }}
                          >
                            예산 집행 품의서
                          </h3>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <p className="text-xs text-gray-400 mb-1">
                          결재
                        </p>
                        <div className="border border-gray-400 overflow-hidden">
                          <div className="flex">
                            {[
                              "기안자",
                              "1차 결재",
                              "2차 결재",
                            ].map((label) => (
                              <div
                                key={label}
                                className="border-r border-gray-400 last:border-r-0 px-3 py-1 bg-gray-50 text-center"
                                style={{ minWidth: 56 }}
                              >
                                <p
                                  className="text-xs text-gray-600"
                                  style={{ fontWeight: 600 }}
                                >
                                  {label}
                                </p>
                              </div>
                            ))}
                          </div>
                          <div
                            className="flex"
                            style={{ minHeight: 36 }}
                          >
                            {[
                              { name: "박도윤", title: "대리" },
                              { name: "김기훈", title: "팀장" },
                              { name: "이수연", title: "부장" },
                            ].map((person) => (
                              <div
                                key={person.name}
                                className="flex-1 border-r border-gray-400 last:border-r-0 bg-white flex items-center justify-center py-1 px-2"
                              >
                                <div className="text-center">
                                  <p
                                    className="text-xs text-gray-800"
                                    style={{ fontWeight: 600 }}
                                  >
                                    {person.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {person.title}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 text-xs border-b border-gray-300">
                      {[
                        {
                          label: "작 성 일",
                          value: "2026-05-05",
                        },
                        {
                          label: "부 서 명",
                          value: "IT 기획팀",
                        },
                        {
                          label: "기 안 자",
                          value: "박도윤 대리",
                        },
                        {
                          label: "문서 번호",
                          value: "2026-IT-00201",
                        },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className={`flex ${i < 3 ? "border-r border-gray-300" : ""}`}
                        >
                          <div
                            className="bg-gray-50 border-r border-gray-300 px-2 py-1.5 shrink-0 flex items-center text-gray-600"
                            style={{
                              fontWeight: 600,
                              minWidth: 58,
                            }}
                          >
                            {item.label}
                          </div>
                          <div className="flex-1 px-2 py-1.5 bg-white text-gray-800 flex items-center">
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border-b border-red-200">
                      <ShieldAlert
                        size={13}
                        className="text-red-600"
                      />
                      <span
                        className="text-xs text-red-700"
                        style={{ fontWeight: 600 }}
                      >
                        고위험 문서 — 본문 전체 열람 후 승인
                        가능
                      </span>
                      <span className="ml-auto text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
                        12억 4,950만원 규모
                      </span>
                    </div>
                  </div>

                  {/* 본문 섹션 */}
                  <div className="bg-white border border-gray-200 rounded-sm px-6 py-5 space-y-6">
                    {DOC_SECTIONS.map((sec, i) => (
                      <div key={i}>
                        <div className="bg-gray-100 border-l-4 border-blue-600 px-3 py-1.5 mb-3">
                          <h4
                            className="text-gray-800 text-sm"
                            style={{ fontWeight: 600 }}
                          >
                            {sec.heading}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap pl-2">
                          {sec.body}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* 서명란 */}
                  <div className="flex justify-end bg-white border border-gray-200 rounded-sm px-6 py-4">
                    <div className="text-right space-y-1">
                      <p className="text-xs text-gray-400">
                        위와 같이 결재를 요청합니다.
                      </p>
                      <p className="text-xs text-gray-500">
                        2026년 5월 5일
                      </p>
                      <p
                        className="text-sm text-gray-700"
                        style={{ fontWeight: 600 }}
                      >
                        IT 기획팀 박도윤 대리 올림
                      </p>
                    </div>
                  </div>

                  {/* 첨부파일 */}
                  <div className="bg-white border border-gray-200 rounded-sm px-6 py-4">
                    <p
                      className="text-xs text-gray-500 mb-3"
                      style={{ fontWeight: 600 }}
                    >
                      첨부파일
                    </p>
                    {[
                      {
                        name: "이사회의결서_2026Q3.pdf",
                        size: "2.1 MB",
                      },
                      {
                        name: "예산배정공문_IT인프라.pdf",
                        size: "890 KB",
                      },
                      {
                        name: "벤더견적서_비교표.xlsx",
                        size: "1.4 MB",
                      },
                      {
                        name: "보안감사결과보고서.pdf",
                        size: "3.2 MB",
                      },
                    ].map((f) => (
                      <div
                        key={f.name}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 cursor-pointer py-1"
                      >
                        <Paperclip
                          size={13}
                          className="text-gray-400"
                        />
                        <span className="underline underline-offset-2">
                          {f.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({f.size})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="h-4" />
              </div>

              {/* 스크롤 힌트 */}
              <AnimatePresence>
                {showScrollHint && !scrollDone && (
                  <motion.div
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none z-10"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                  >
                    <div className="flex items-center gap-2 bg-gray-900/90 text-white text-xs px-4 py-2.5 rounded-full shadow-lg backdrop-blur-sm">
                      <motion.div
                        animate={{ y: [0, 3, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.4,
                        }}
                      >
                        <ArrowDown size={13} />
                      </motion.div>
                      <span>
                        스크롤을 끝까지 내려야 승인할 수
                        있습니다 ({scrollPct}%)
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* [요구사항 A] 데스크탑 우측 패널 — md 이상에서만 표시 */}
          <div className="hidden md:flex w-64 flex-col gap-4 shrink-0 overflow-y-auto pb-4">
            <ApprovalConditionPanel
              scrollDone={scrollDone}
              scrollPct={scrollPct}
              canApprove={canApprove}
              onApprove={handleApprove}
              onReject={() => setShowRejectModal(true)}
            />
          </div>
        </div>

        {/* [요구사항 A] 모바일 하단 Floating Action Bar */}
        <div className="md:hidden shrink-0 px-4 py-3 bg-white border-t border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRejectModal(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg"
            >
              <ThumbsDown size={13} /> 반려
            </button>
            <Drawer.Root
              open={drawerOpen}
              onOpenChange={setDrawerOpen}
            >
              <Drawer.Trigger asChild>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg">
                  <ChevronUp size={13} /> 승인 조건 확인하기
                </button>
              </Drawer.Trigger>
              <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
                <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[85vh] flex flex-col">
                  <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-4" />
                  <div className="px-5 pb-2">
                    <h3
                      className="text-gray-900 text-sm"
                      style={{ fontWeight: 600 }}
                    >
                      승인 조건 확인
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      아래 내용을 끝까지 스크롤하면 승인 버튼이
                      활성화됩니다.
                    </p>
                  </div>
                  {/* 모바일 Drawer 내부 스크롤 요약 */}
                  <div
                    ref={drawerScrollRef}
                    onScroll={handleDrawerScroll}
                    className="flex-1 overflow-y-auto px-5 pb-4 space-y-4"
                  >
                    {/* 조건 체크리스트 */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 border bg-emerald-50 border-emerald-200">
                        <CheckCircle2
                          size={14}
                          className="text-emerald-600 shrink-0"
                        />
                        <p
                          className="text-xs text-emerald-700"
                          style={{ fontWeight: 600 }}
                        >
                          고위험 보안 정책 적용
                        </p>
                      </div>
                      <div
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 border transition-colors ${
                          drawerScrollDone
                            ? "bg-emerald-50 border-emerald-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        {drawerScrollDone ? (
                          <CheckCircle2
                            size={14}
                            className="text-emerald-600 shrink-0"
                          />
                        ) : (
                          <Eye
                            size={14}
                            className="text-gray-400 shrink-0"
                          />
                        )}
                        <p
                          className={`text-xs ${drawerScrollDone ? "text-emerald-700" : "text-gray-500"}`}
                          style={{ fontWeight: 600 }}
                        >
                          {drawerScrollDone
                            ? "본문 요약 확인 완료"
                            : "본문 요약 확인 미완료"}
                        </p>
                      </div>
                    </div>
                    {/* 문서 요약 */}
                    <div className="space-y-3">
                      {DOC_SECTIONS.map((sec, i) => (
                        <div
                          key={i}
                          className="bg-gray-50 rounded-lg p-3"
                        >
                          <p
                            className="text-xs text-gray-700 mb-1"
                            style={{ fontWeight: 600 }}
                          >
                            {sec.heading}
                          </p>
                          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap line-clamp-4">
                            {sec.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* 모바일 승인 버튼 */}
                  <div className="px-5 py-4 border-t border-gray-100">
                    <button
                      onClick={() => {
                        if (!canApproveDrawer) return;
                        setDrawerOpen(false);
                        handleApprove();
                      }}
                      disabled={!canApproveDrawer}
                      className={`w-full flex items-center justify-center gap-2 py-3 text-sm rounded-xl transition-all ${
                        canApproveDrawer
                          ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                      style={{ fontWeight: 600 }}
                    >
                      {canApproveDrawer ? (
                        <Unlock size={14} />
                      ) : (
                        <Lock size={14} />
                      )}
                      {canApproveDrawer
                        ? "승인하기"
                        : "본문을 끝까지 스크롤해주세요"}
                    </button>
                  </div>
                </Drawer.Content>
              </Drawer.Portal>
            </Drawer.Root>
          </div>
        </div>

        {/* 데스크탑 하단 액션바 */}
        <div className="hidden md:block shrink-0 mx-6 mb-5 mt-4">
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-4 flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3 flex-wrap">
              {/* 보안 세션 상태 */}
              <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-700">
                <ShieldCheck size={13} />{" "}
                <span>보안 세션 유효 (Session-Based)</span>
              </div>
              {/* 스크롤 상태 */}
              <div
                className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border ${
                  scrollDone
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-gray-50 border-gray-200 text-gray-500"
                }`}
              >
                {scrollDone ? (
                  <>
                    <CheckCircle2 size={13} /> 전체 열람 완료
                  </>
                ) : (
                  <>
                    <ArrowDown size={13} /> 스크롤 {scrollPct}%
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setShowRejectModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-red-300 hover:text-red-600 transition-all"
              >
                <ThumbsDown size={13} /> 반려
              </button>
              <button
                onClick={handleApprove}
                disabled={!canApprove}
                className={`flex items-center gap-2 px-6 py-2.5 text-sm rounded-lg transition-all ${
                  canApprove
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200 cursor-pointer"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {canApprove ? (
                  <Unlock size={13} />
                ) : (
                  <Lock size={13} />
                )}
                승인
              </button>
            </div>
          </div>
        </div>
      </div>

      {showApproveModal && (
        <ApproveConfirmModal
          onConfirm={() => {
            setShowApproveModal(false);
            setDone("approved");
            toast.success("승인 완료", {
              description: "결재가 정상적으로 처리되었습니다.",
            });
          }}
          onClose={() => setShowApproveModal(false)}
        />
      )}
      {showRejectModal && (
        <RejectModal
          onConfirm={() => {
            setShowRejectModal(false);
            setDone("rejected");
          }}
          onClose={() => setShowRejectModal(false)}
        />
      )}
    </>
  );
}