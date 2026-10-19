import { cookies } from "next/headers";
import { HistoryPageContent } from "./components/historyPage";

export const HistoryPage = async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("user_session");

  return <HistoryPageContent sessionCookie={sessionCookie} />;
};

export default HistoryPage;
