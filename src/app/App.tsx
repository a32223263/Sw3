import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "sonner"; // 임포트된 Toaster를 아래 return문에서 사용합니다.

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      {/* 👇 토스트 메시지를 화면에 띄워주는 역할을 하는 컨테이너를 추가합니다. */}
      <Toaster position="bottom-right" richColors />
    </>
  );
}