import axiosIns from "./axios";

export const resolveSos = async (sosId: string) => {
  const response = await axiosIns.post("/api/sos/resolve", { sos_id: sosId });
  return response.data;
};

export const getActiveSos = async () => {
  const response = await axiosIns.get("/api/sos/active");
  return response.data;
};

export const getSosHistory = async (params?: { status?: string; user_type?: string; from_date?: string; to_date?: string; page?: number; limit?: number }) => {
  const response = await axiosIns.get("/api/sos/history", { params });
  return response.data;
};
