import { redirect } from "next/navigation";

export const metadata = {
  title: "iPAS AI 應用規劃師模擬考",
  description: "正式模擬考、交卷評分與完整解答檢討。",
};

export default function HomePage() {
  redirect("/index.html");
}
