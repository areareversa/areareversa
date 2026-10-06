import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import AiForm from "./AiForm";

export const metadata = { title: "Escrever com IA" };

export default async function AiPage() {
  if (!(await isAuthed())) redirect("/admin/login");
  return <AiForm />;
}
