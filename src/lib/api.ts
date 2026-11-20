import { authClient } from "@/lib/auth-client";


export async function apiFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);


  try {
    const result = await authClient.token();
    const token = result.data?.token;


    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    } else {
      headers.delete("Authorization");
    }
  } catch {
    headers.delete("Authorization");
  }


  return apiFetch(url, {
    ...init,
    headers,
    credentials: "include",
  });
}