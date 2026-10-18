import { cookies } from "next/headers";
import { EditProfilePageContent } from "./components/editProfilePage";

export const EditProfilePage = async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("user_session");

  return <EditProfilePageContent sessionCookie={sessionCookie} />;
};

export default EditProfilePage;
