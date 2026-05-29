import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  Info,
  Fingerprint,
  Clock,
  FileText,
} from "lucide-react";

const MAX_FAILURES = 5;
const LOCKOUT_SECONDS = 30; // 30초 (데모용, 실제는 30분)

/* 이메일 형식 검증 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* 데모 계정 목록 */
const DEMO_ACCOUNTS = [
  { email: "park.doyoon@company.com", password: "Pass1234!", name: "박도윤", role: "기안자" },
  { email: "kim.kihoon@company.com", password: "Pass1234!", name: "김기훈", role: "결재자/부서 관리자" },
];

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  // [방어적 설계: 명확한 공지] 데모용 초기값 4 — 1회 추가 실패 시 잠금 시연
  const [failCount, setFailCount] = useState(4);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* 이메일 유효성 */
  const emailFormatError = emailTouched && email.length > 0 && !isValidEmail(email);

  /* 로그인 버튼 활성화 조건 */
  const canSubmit =
    email.trim().length > 0 &&
    password.trim().length > 0 &&
    isValidEmail(email) &&
    failCount < MAX_FAILURES &&
    lockoutRemaining === 0 &&
    !loading;

  /* 잠금 타이머 */
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const t = setInterval(() => {
      setLockoutRemaining((p) => {
        if (p <= 1) { clearInterval(t); setFailCount(0); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [lockoutRemaining]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    // Simulate API call
    await new Promise((r) => setTimeout(r, 800));

    const account = DEMO_ACCOUNTS.find(
      (a) => a.email === email && a.password === password
    );

    if (account) {
      setLoading(false);
      // 결재자 → /pending, 기안자 → /
      navigate(account.role.includes("결재자") ? "/pending" : "/");
    } else {
      const newFail = failCount + 1;
      setFailCount(newFail);
      if (newFail >= MAX_FAILURES) {
        setLockoutRemaining(LOCKOUT_SECONDS);
        setError(`로그인 ${MAX_FAILURES}회 실패로 계정이 일시 잠금되었습니다.`);
      } else {
        setError(
          `이메일 또는 비밀번호가 올바르지 않습니다. (${newFail}/${MAX_FAILURES}회 실패)`
        );
      }
      setLoading(false);
    }
  };

  const fillDemo = (acc: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setEmailTouched(false);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-[920px] grid grid-cols-[1fr_420px] gap-0 rounded-2xl overflow-hidden shadow-2xl">

        {/* ── Left panel ── */}
        <div className="bg-gradient-to-br from-blue-700 to-blue-900 p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <FileText size={20} className="text-white" />
              </div>
              <span className="text-white text-xl" style={{ fontWeight: 700 }}>전자결재</span>
            </div>
            <h1 className="text-white mb-3" style={{ fontSize: "1.75rem", fontWeight: 700, lineHeight: 1.2 }}>
              스마트한 결재 관리,<br />한 곳에서 시작하세요
            </h1>
            <p className="text-blue-200 text-sm leading-relaxed">
              직위·직책 기반 결재선 자동 배정과 리스크 기반 차등 승인으로
              업무 효율을 극대화합니다.
            </p>
          </div>

          {/* Feature bullets */}
          <div className="space-y-3">
            {[
              { icon: <CheckCircle2 size={15} />, text: "결재선 자동 매핑 (직위/직책 템플릿)" },
              { icon: <ShieldAlert size={15} />, text: "고위험 문서 2FA 이중 잠금" },
              { icon: <Clock size={15} />, text: "상신 후 즉시 수정 (Hot-fix) 지원" },
              { icon: <Fingerprint size={15} />, text: "위험도 기반 차등 승인 체계" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2.5 text-blue-100 text-sm">
                <span className="text-blue-300">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>

          {/* ADR tag */}
          <div className="mt-6 text-xs text-blue-400 border border-blue-700 rounded-lg px-3 py-2 bg-blue-800/40">
            <span style={{ fontWeight: 600 }}>ADR-002</span>: 위험도 기반 인증 이원화 — 일반 문서는 세션 즉시 승인 / 고위험 문서는 2FA 트리거
          </div>
        </div>

        {/* ── Right panel (form) ── */}
        <div className="bg-white p-8 flex flex-col">
          <div className="mb-7">
            <h2 className="text-gray-900" style={{ fontWeight: 700 }}>로그인</h2>
            <p className="text-sm text-gray-500 mt-1">사내 이메일 계정으로 로그인하세요</p>
          </div>

          {/* Demo quick-fill */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-6 space-y-2">
            <p className="text-xs text-blue-600" style={{ fontWeight: 600 }}>데모 계정 빠른 선택</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => fillDemo(acc)}
                  className="text-left px-3 py-2 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all"
                >
                  <p className="text-xs text-gray-800" style={{ fontWeight: 600 }}>{acc.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{acc.role}</p>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 flex-1">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm text-gray-700" style={{ fontWeight: 500 }}>이메일</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="user@company.com"
                  autoComplete="email"
                  className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-lg focus:outline-none transition-all ${
                    emailFormatError
                      ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100"
                      : "border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  }`}
                />
              </div>
              <AnimatePresence>
                {emailFormatError && (
                  <motion.p
                    className="text-xs text-red-600 flex items-center gap-1"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <AlertCircle size={11} /> 이메일 형식을 확인하세요.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm text-gray-700" style={{ fontWeight: 500 }}>비밀번호</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="비밀번호를 입력하세요"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error / Lockout banner */}
            <AnimatePresence>
              {(error || lockoutRemaining > 0) && (
                <motion.div
                  className={`flex items-start gap-2.5 rounded-lg px-4 py-3 border text-sm ${
                    lockoutRemaining > 0
                      ? "bg-red-50 border-red-200 text-red-700"
                      : "bg-amber-50 border-amber-200 text-amber-800"
                  }`}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs leading-relaxed">{error}</p>
                    {lockoutRemaining > 0 && (
                      <p className="text-xs mt-1">
                        <Clock size={10} className="inline mr-1" />
                        <span style={{ fontWeight: 600 }}>{lockoutRemaining}초</span> 후 다시 시도할 수 있습니다.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* [방어적 설계: 제약 + 명확한 공지] 로그인 실패 카운트 가시화 */}
            {failCount > 0 && failCount < MAX_FAILURES && lockoutRemaining === 0 && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <AlertCircle size={12} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700 leading-relaxed" style={{ fontWeight: 500 }}>
                  ⚠️ 비밀번호를 {failCount}회 잘못 입력하셨습니다. ({MAX_FAILURES - failCount}회 추가 실패 시 30분간 계정이 잠깁니다.)
                </p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full py-3 text-sm rounded-xl transition-all ${
                canSubmit
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200 cursor-pointer"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
              style={{ fontWeight: 600 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  로그인 중...
                </span>
              ) : lockoutRemaining > 0 ? (
                `잠금 중 (${lockoutRemaining}초)`
              ) : (
                "로그인"
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            사내 계정 관련 문의: IT 인프라팀 · help@company.com
          </p>
        </div>
      </div>
    </div>
  );
}
