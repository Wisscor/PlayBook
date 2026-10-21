import { api } from "./api";
import { User } from "@/types/user";

export interface SignUpData {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
}

export interface SignInData {
  username_or_email: string;
  password: string;
}

export const signUp = async (data: SignUpData) => {
  const response = await api.post<User>("/auth/signup", data);
  return response.data;
};

export const signIn = async (data: SignInData) => {
  const response = await api.post<User>("/auth/login", data);
  return response.data;
};

export const signOut = async () => {
  await api.post("/auth/logout");
};

export const getCurrentUser = async () => {
  const response = await api.get<User>("/auth/me");
  return response.data;
};
