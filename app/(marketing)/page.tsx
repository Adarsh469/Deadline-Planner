"use client";

import { motion } from "framer-motion";
import { useSession, signOut, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const glow = "radial-gradient(circle at 20% 20%, rgba(56,189,248,0.18), transparent 55%), radial-gradient(circle at 80% 10%, rgba(99,102,241,0.18), transparent 40%), radial-gradient(circle at 50% 80%, rgba(34,197,94,0.16), transparent 55%)";

export default function MarketingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const goToDashboard = () => router.push("/dashboard");
  const goToSignIn = () => signIn();

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0" style={{ backgroundImage: glow }} />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <div className="absolute right-6 top-6 flex items-center gap-3 text-sm">
          {status === "authenticated" ? (
            <>
              <button onClick={goToDashboard} className="text-slate-200 hover:text-white">
                Dashboard
              </button>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="text-slate-200 hover:text-white">
                Sign out
              </button>
            </>
          ) : (
            <button onClick={goToSignIn} className="text-slate-200 hover:text-white">
              Sign in
            </button>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Deadline Manager</p>
          <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-6xl">
            Deadlines that stay ahead of you, not behind you.
          </h1>
          <p className="mt-6 text-lg text-slate-300">
            A production-ready command center for time-critical work. Urgency-aware views, smart reminders,
            and analytics that show exactly where time leaks.
          </p>
          <div className="mt-8">
            <Button variant="secondary" onClick={status === "authenticated" ? goToDashboard : goToSignIn}>
              Get Started
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.12 } },
          }}
          className="mt-12 grid gap-6 md:grid-cols-3"
        >
          {[
            { title: "Urgency-first", body: "Real-time scoring so you always know what is burning." },
            { title: "Zero noise", body: "Focused views that surface only deadlines that need action." },
            { title: "Predictable habits", body: "Recurring deadlines plus dependency intelligence." },
          ].map((item) => (
            <motion.div
              key={item.title}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            >
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm text-slate-300">{item.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
