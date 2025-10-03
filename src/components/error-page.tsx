import { X, XCircle } from "lucide-react";
import { motion } from "motion/react";

export default function ErrorPage({ error }: { error: string | null }) {
  return (
    <div className="h-[80vh] w-screen overflow-hidden grid place-content-center space-y-2">
      <div className="flex flex-col items-center max-w-md text-center space-y-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-full bg-destructive/10 p-4"
        >
          <svg
            className="h-8 w-8 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </motion.div>
        <div className="space-y-1">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * 2 }}
            className="text-2xl font-semibold text-foreground"
          >
            Something went wrong
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * 3 }}
            className="text-base text-muted-foreground"
          >
            {error}
          </motion.p>
        </div>
      </div>
    </div>
  );
}
