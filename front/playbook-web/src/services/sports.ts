import { Sport } from "@/types/api";
import { api } from "./api";

export const getSports = async () => {
  const response = await api.get<Sport[]>("/sports");
  return response.data;
};
