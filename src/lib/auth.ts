import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE = "ar_session";

function secret() {
  return process.env.AUTH_SECRET ?? "dev-secret-change-me";
}

export function sign(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

export async function login(password: string) {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  const ok =
    expected.length > 0 &&
    crypto.timingSafeEqual(
      Buffer.from(sign(password)),
      Buffer.from(sign(expected))
    );
  if (!ok) return false;
  const store = await cookies();
  store.set(COOKIE, sign("admin"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return true;
}

export async function logout() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function isAuthed() {
  const store = await cookies();
  return store.get(COOKIE)?.value === sign("admin");
}
