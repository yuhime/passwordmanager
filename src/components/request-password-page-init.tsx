import { FormEvent, MouseEvent, useRef, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  AlertCircleIcon,
  ArrowRight,
  Check,
  Eye,
  EyeClosed,
  Loader2,
  Terminal,
  TriangleAlertIcon,
  UnlockIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { invoke } from "@tauri-apps/api/core";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

export default function InitializationPage({
  setError,
  setShowMain,
}: {
  setError: (error: string) => void;
  setShowMain: (showMain: boolean) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [shouldHide, setShouldHide] = useState(false);

  const onSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setWarning(null);
    setLoading(true);
    let element = document.getElementById("masterPassword") as HTMLInputElement;

    if (element.value.trim().length == 0) {
      setWarning("Master password must not be empty");
      setLoading(false);
      return;
    }

    try {
      await invoke("initialize", { masterPassword: element.value });

      setShowMain(true);
    } catch (error) {
      console.error(error);
      setError("Failed to initialize");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-bl from-white/10 w-screen">
      <motion.div
        animate={{
          opacity: shouldHide ? 0 : 1,
          display: shouldHide ? "none" : "block",
        }}
        className="space-y-10"
      >
        <div className="space-y-3">
          <h1 className="text-5xl font-bold text-center">Welcome</h1>
          <p className="text-center max-w-[65ch]">
            Register your master password to start securely <br /> save your
            passwords
          </p>
          <AnimatePresence mode="popLayout">
            {warning ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Alert variant="destructive">
                  <AlertCircleIcon />
                  <AlertTitle>Cannot be empty</AlertTitle>
                  <AlertDescription>
                    <p>Your master password must not be empty.</p>
                  </AlertDescription>
                </Alert>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        <div className="flex mx-auto w-full max-w-sm items-center gap-2 relative">
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: loading ? 0 : "100%", opacity: loading ? 0 : 1 }}
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
                    initializing...
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
                    className="absolute inset-0 flex items-center justify-between"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
