import { createBrowserRouter, Outlet } from "react-router";
import { AppLayout } from "./components/layout/AppLayout";
import { ApprovalDocumentPage } from "./components/ApprovalDocumentPage";
import { MyDraftsListPage } from "./components/MyDraftsListPage";
import { MyDraftDetailPage } from "./components/MyDraftDetailPage";
import { WithdrawModalScreen } from "./components/WithdrawModalScreen";
import { HighRiskApprovalPage } from "./components/HighRiskApprovalPage";
import { RiskCriteriaPage } from "./components/RiskCriteriaPage";
import { PendingListPage } from "./components/PendingListPage";
import { LoginPage } from "./components/LoginPage";
import { FormBuilderPage } from "./components/FormBuilderPage";

/* ── 기안자 뷰 — 박도윤 ── */
function DrafterRoot() {
  return (
    <AppLayout user={{ name: "박도윤", dept: "IT 기획팀", title: "사원" }}>
      <Outlet />
    </AppLayout>
  );
}

/**
 * 결재자 뷰 — 김기훈
 * contentOverflow="hidden" : HighRiskApprovalPage 내부 스크롤 전용 레이아웃
 * PendingListPage는 자체 overflow-y-auto wrapper를 가집니다.
 */
function ApproverRoot() {
  return (
    <AppLayout
      user={{ name: "김기훈", dept: "IT 기획팀", title: "팀장" }}
      contentOverflow="hidden"
    >
      <Outlet />
    </AppLayout>
  );
}

/* ── 관리자 뷰 — 김기훈 ── */
function AdminRoot() {
  return (
    <AppLayout user={{ name: "김기훈", dept: "IT 기획팀", title: "팀장" }}>
      <Outlet />
    </AppLayout>
  );
}

function NotFound() {
  return (
    <div className="p-10 text-center text-gray-500 text-sm">
      페이지를 찾을 수 없습니다.
    </div>
  );
}

export const router = createBrowserRouter([
  /* ── 로그인 ── */
  { path: "/login", Component: LoginPage },

  /* ── 기안자 (박도윤) ── */
  {
    path: "/",
    Component: DrafterRoot,
    children: [
      { index: true, Component: ApprovalDocumentPage },
      { path: "drafts", Component: MyDraftsListPage },
      { path: "drafts/:id", Component: MyDraftDetailPage },
      { path: "drafts/:id/withdraw", Component: WithdrawModalScreen },
    ],
  },

  /* ── 결재자 (김기훈) — /pending 전체 ── */
  {
    path: "/pending",
    Component: ApproverRoot,
    children: [
      { index: true, Component: PendingListPage },
      { path: ":id", Component: HighRiskApprovalPage },
    ],
  },

  /* ── 부서 관리 ── */
  {
    path: "/dept",
    Component: AdminRoot,
    children: [
      { index: true, Component: RiskCriteriaPage },
      { path: "forms", Component: FormBuilderPage },
    ],
  },

  { path: "*", Component: NotFound },
]);
