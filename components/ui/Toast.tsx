"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, AlertCircle } from "lucide-react";

type ToastState = { message: string; tone: "success" | "error" } | null;

// Local toast: const { toast, showToast } = useToast(); render {toast} once.
export function useToast() {
  const [state, setState] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showToast = useCallback((message: string, tone: "success" | "error" = "success") => {
    clearTimeout(timer.current);
    setState({ message, tone });
    timer.current = setTimeout(() => setState(null), 4000);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const toast = (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {state && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-2xl"
          >
            {state.tone === "success" ? <CheckCircle2 className="size-[18px] text-lime" /> : <AlertCircle className="size-[18px] text-danger" />}
            {state.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return { toast, showToast };
}
