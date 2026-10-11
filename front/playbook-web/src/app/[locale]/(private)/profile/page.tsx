import { cookies } from "next/headers";
import { ProfilePageContent } from "./components/profilePage";

export const ProfilePage = async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("user_session");

  return <ProfilePageContent sessionCookie={sessionCookie} />;
};

export default ProfilePage;
