import { LoginForm } from "@/components/login-form"
import { LogoMark } from "@/components/logo-mark"

export const dynamic = "force-dynamic"

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string }
}) {
  const next = searchParams.next ?? "/"

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <div className="flex flex-col items-center gap-3 mb-8">
        <LogoMark size={48} />
        <h1 className="font-display text-2xl font-black tracking-tight">
          MO&apos;S NOT THE BEST<span className="align-super text-base">®</span>
        </h1>
        <p className="text-sm text-center" style={{ color: "var(--ink-soft)" }}>
          Sign in to start (or continue) your own personal dining timeline.
        </p>
      </div>
      <LoginForm next={next} />
    </div>
  )
}
