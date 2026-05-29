import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router";
import {
  FileText,
  FolderOpen,
  Inbox,
  Settings,
  Bell,
  Search,
  ChevronDown,
  User,
  Sparkles,
  Shield,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

type NavItem = {
  id: string;
  path: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
};

const navItems: NavItem[] = [
  {
    id: "write",
    path: "/",
    icon: <FileText size={16} />,
    label: "결재 작성",
  },
  {
    id: "draft",
    path: "/drafts",
    icon: <FolderOpen size={16} />,
    label: "내 기안함",
  },
  {
    id: "pending",
    path: "/pending",
    icon: <Inbox size={16} />,
    label: "결재 대기함",
  },
  {
    id: "dept",
    path: "/dept",
    icon: <Settings size={16} />,
    label: "부서 관리",
  },
  {
    id: "forms",
    path: "/dept/forms",
    icon: <Sparkles size={16} />,
    label: "양식 빌더",
  },
];

const NOTIFICATIONS = [
  {
    id: 1,
    text: "최상훈님이 지출결의서를 합의 요청했습니다.",
    time: "5분 전",
    unread: true,
    type: "request" as const,
  },
  {
    id: 2,
    text: "품의서가 최종 승인되었습니다.",
    time: "1시간 전",
    unread: true,
    type: "approved" as const,
  },
  {
    id: 3,
    text: "이정수님이 휴가신청서를 반려했습니다.",
    time: "2시간 전",
    unread: true,
    type: "rejected" as const,
  },
];

export function AppLayout({
  children,
  user = { name: "박도윤", dept: "IT 기획팀", title: "사원" },
  contentOverflow = "scroll",
}: {
  children: React.ReactNode;
  user?: { name: string; dept: string; title: string };
  contentOverflow?: "scroll" | "hidden";
}) {
  const location = useLocation();
  const [sessionTimer, setSessionTimer] = useState(1799); // 29:59
  const [showNotifications, setShowNotifications] =
    useState(false);
  const [notifications, setNotifications] =
    useState(NOTIFICATIONS);
  const notifRef = useRef<HTMLDivElement>(null);

  // 보안 세션 카운트다운
  useEffect(() => {
    const t = setInterval(
      () => setSessionTimer((p) => Math.max(0, p - 1)),
      1000,
    );
    return () => clearInterval(t);
  }, []);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () =>
      document.removeEventListener("mousedown", handler);
  }, []);

  const fmtTimer = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const unreadCount = notifications.filter(
    (n) => n.unread,
  ).length;

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    if (path === "/dept") return location.pathname === "/dept";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* ─── Sidebar ─── */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="h-14 flex items-center px-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center">
              <FileText size={14} className="text-white" />
            </div>
            <span
              className="text-sm text-gray-800"
              style={{ fontWeight: 600 }}
            >
              전자결재
            </span>
          </div>
        </div>

        <nav className="flex-1 py-3">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                isActive(item.path)
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              <span className="flex items-center gap-2.5">
                {item.icon}
                {item.label}
              </span>
              {item.badge && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive(item.path)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center">
              <User size={13} className="text-gray-600" />
            </div>
            <div>
              <p
                className="text-xs text-gray-800"
                style={{ fontWeight: 600 }}
              >
                {user.name}
              </p>
              <p className="text-xs text-gray-500">
                {user.dept} · {user.title}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Main Area ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-5 gap-3 shrink-0">
          <div className="flex-1 max-w-sm relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="검색어를 입력하세요..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 border border-transparent rounded-md focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
            />
          </div>
          <div className="flex-1" />

          {/* [방어적 설계: 명확한 공지] 보안 세션 타이머 */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border"
            style={{
              background:
                sessionTimer > 300 ? "#f0fdf4" : "#fef2f2",
              borderColor:
                sessionTimer > 300 ? "#bbf7d0" : "#fecaca",
              color: sessionTimer > 300 ? "#15803d" : "#dc2626",
              fontWeight: 600,
            }}
          >
            <Shield size={12} />
            <span>
              보안 세션 유효 ({fmtTimer(sessionTimer)})
            </span>
          </div>

          {/* [SRP 증명] 시스템 알림 센터 */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications((p) => !p)}
              className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <Bell size={17} className="text-gray-600" />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center"
                  style={{ fontSize: 10, fontWeight: 700 }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span
                    className="text-sm text-gray-800"
                    style={{ fontWeight: 600 }}
                  >
                    알림
                    {unreadCount > 0 && (
                      <span className="ml-2 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() =>
                      setNotifications((n) =>
                        n.map((item) => ({
                          ...item,
                          unread: false,
                        })),
                      )
                    }
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    모두 읽음
                  </button>
                </div>
                <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`px-4 py-3 flex items-start gap-3 hover:bg-gray-50 cursor-pointer transition-colors ${notif.unread ? "bg-blue-50/40" : ""}`}
                      onClick={() =>
                        setNotifications((n) =>
                          n.map((item) =>
                            item.id === notif.id
                              ? { ...item, unread: false }
                              : item,
                          ),
                        )
                      }
                    >
                      <div className="mt-1 shrink-0">
                        {notif.type === "approved" && (
                          <CheckCircle2
                            size={14}
                            className="text-emerald-500"
                          />
                        )}
                        {notif.type === "rejected" && (
                          <AlertTriangle
                            size={14}
                            className="text-red-500"
                          />
                        )}
                        {notif.type === "request" && (
                          <div className="w-3.5 h-3.5 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {notif.text}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notif.time}
                        </p>
                      </div>
                      {notif.unread && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
              <User size={12} className="text-blue-600" />
            </div>
            <span className="text-sm text-gray-700">
              {user.name}
            </span>
            <ChevronDown size={13} className="text-gray-400" />
          </button>
        </header>

        <div
          className={`flex-1 ${contentOverflow === "hidden" ? "overflow-hidden flex flex-col" : "overflow-y-auto"}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}