import { FormEvent, useState, MouseEvent } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  ArrowRight,
  Check,
  Eye,
  EyeClosed,
  Loader2,
  Unlock,
  UnlockIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { invoke } from "@tauri-apps/api/core";

export default function RequestPasswordPage({
  setShowMain,
}: {
  setShowMain: (show: boolean) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);
    let element = document.getElementById("masterPassword") as HTMLInputElement;

    try {
      await invoke("decrypt", { password: element.value });
      setShowMain(true);
    } catch (error) {
      setError(String(error));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-bl from-white/10 w-screen">
      <div className="space-y-10">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold">Master password required</h1>
          <p className="text-center">
            Insert your master password to decrypt your data
          </p>
        </div>

        <div>
          {error ? (
            <div className="max-w-md grid grid-cols-[auto_1fr] items-center gap-2 text-destructive mx-auto bg-destructive/20 py-2 px-3 rounded-md mb-3">
              <svg
                className="h-6 w-6 text-destructive"
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
              <p>{error}</p>
            </div>
          ) : null}
          <div className="flex mx-auto w-full max-w-md items-center gap-2 relative">
            <motion.div
              initial={{ width: "100%" }}
              animate={{
                width: loading ? 0 : "100%",
                opacity: loading ? 0 : 1,
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`relative overflow-hidden focus-within:overflow-visible`}
            >
              <div
                className="absolute right-1 rounded-full transition-colors top-0.5 p-1 hover:bg-background cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeClosed className=" text-neutral-500" />
                ) : (
                  <Eye className="text-neutral-500" />
                )}
              </div>
              <Input
                id="masterPassword"
                type={showPassword ? "text" : "password"}
                placeholder="NextgenProtection"
                className="pr-10"
              />
            </motion.div>
            <Button
              onClick={onSubmit}
              // onClick={(e) => {
              //   onSubmit(e);
              //   setLoading(true);
              //   setTimeout(() => setLoading(false), 5000);
              // }}
              disabled={loading}
              type="submit"
              variant="outline"
              className={`relative ${loading ? "w-full" : "w-32"} mx-auto duration-300 overflow-hidden cursor-pointer`}
            >
              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                      repeat: Infinity,
                      repeatType: "loop",
                      duration: 1.5,
                      ease: "linear",
                    }}
                    className="absolute inset-0 z-0 pointer-events-none"
                  >
                    <div className="w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent blur-xl" />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative w-full h-full flex items-center justify-center">
                <AnimatePresence mode="sync" initial={false}>
                  {loading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{
                        opacity: { duration: 0.2 },
                        y: { duration: 0.2 },
                      }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Decrypting your data...
                    </motion.div>
                  ) : (
                    <motion.div
                      key="getAccess"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{
                        opacity: { duration: 0.2 },
                        y: { duration: 0.2 },
                      }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Unlock className="mr-2 h-4 w-4" />
                      Access
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
