import { loginAction } from "../actions";

export const metadata = { title: "Login" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 pt-20">
      <h1 className="text-2xl font-bold">área administrativa</h1>
      {erro && <p className="text-sm text-red-500">Senha incorreta.</p>}
      <form action={loginAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Senha
          <input
            type="password"
            name="password"
            required
            className="rounded-lg border border-neutral-300 bg-transparent px-4 py-2 dark:border-[#2a2a30]"
          />
        </label>
        <button className="rounded-lg bg-neutral-900 px-4 py-2 text-white dark:bg-neutral-100 dark:text-neutral-900">
          entrar
        </button>
      </form>
    </div>
  );
}
