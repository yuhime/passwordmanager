import { AnimatePresence, motion } from "motion/react";
import { Skeleton } from "./components/ui/skeleton";
import { ScrollArea } from "./components/ui/scroll-area";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "./components/ui/button";
import { LucideEdit, LucideLock, LucidePlus, LucideTrash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import { cn } from "./lib/utils";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { PasswordFragment } from "./types";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./components/ui/form";

function LoadingSkeleton() {
  return (
    <ScrollArea>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Skeleton className="w-full h-12"></Skeleton>
        <ul className="mt-5 space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <motion.li
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex items-center gap-4"
            >
              <Skeleton key={i} className="w-full h-18"></Skeleton>
              <Skeleton key={i} className="w-18 h-18"></Skeleton>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </ScrollArea>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [passwords, setPasswords] = useState<PasswordFragment[] | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setTimeout(async () => {
        let passwords = await invoke<PasswordFragment[]>("list_passwords");
        setPasswords(passwords.length > 0 ? passwords : null);
        setLoading(false);
      }, 3000);
    }
    fetchData();
  }, []);

  return (
    <motion.div
      key={"app"}
      initial={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-3 w-full"
    >
      <AnimatePresence>
        {selectedId && (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setSelectedId(null)} // chiude cliccando fuori
          >
            <motion.div
              layoutId={selectedId}
              className="bg-neutral-900 rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()} // previene chiusura se clicchi dentro
            >
              {/* Qui puoi mettere info dettagliate */}
              <h2 className="text-xl font-bold text-white">
                {passwords.find((p) => p.id === selectedId)?.label}
              </h2>
              <p className="text-neutral-400 mt-2">
                Altre informazioni dettagliate qui...
              </p>

              <Button className="mt-4" onClick={() => setSelectedId(null)}>
                Chiudi
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {loading ? (
          <LoadingSkeleton key={"loading"} />
        ) : (
          <>
            {passwords ? (
              <motion.ul
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 mx-auto max-w-3xl"
              >
                {passwords.map((pwdFragment, indx) => (
                  <motion.li
                    key={pwdFragment.id}
                    onClick={() => setSelectedId(pwdFragment.id)}
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    exit={{ opacity: 0, y: -20 }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring" }}
                    className="bg-neutral-800 p-4 rounded-md cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <LucideLock className="w-4 h-4 text-neutral-400" />
                        <div>
                          <p className="text-sm text-neutral-400 tracking-wider">
                            Label
                          </p>
                          <h2 className="text-lg font-medium text-neutral-200">
                            {pwdFragment.label}
                          </h2>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant={"outline"}
                          size={"icon"}
                          onClick={() => {}}
                        >
                          <LucideEdit className="w-4 h-4 text-neutral-400" />
                        </Button>
                        <Button
                          variant={"destructive"}
                          size={"icon"}
                          className="bg-red-500"
                          onClick={() => {}}
                        >
                          <LucideTrash className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={"outline"}
                          size={"icon"}
                          onClick={() => {}}
                        >
                          {pwdFragment.use_count}
                        </Button>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="space-y-1">
                  <h1 className="text-4xl font-bold text-neutral-200">
                    No passwords found.
                  </h1>
                  <p className="text-neutral-200">
                    Let's add something to your encrypted vault!
                  </p>
                  <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className="mt-6"
                        variant={"default"}
                        onClick={() => {}}
                      >
                        <LucidePlus />
                        Add Password
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add Password</DialogTitle>
                        <DialogDescription>
                          Save your password to your encrypted vault!
                        </DialogDescription>
                      </DialogHeader>
                      <ProfileForm />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )}
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ProfileForm({ className }: React.ComponentProps<"form">) {
  const passwordDataSchema = z.object({
    label: z.string().min(1, "Label is required"),
    username: z.string().min(1, "Username is required"),
    email: z.email("Invalid email"),
    secret: z.string().min(6, "Password must be at least 6 characters"),
  });

  type PasswordDataForm = z.infer<typeof passwordDataSchema>;

  const form = useForm<PasswordDataForm>({
    resolver: zodResolver(passwordDataSchema),
  });

  const onSubmit = async (data: PasswordDataForm) => {
    console.log("Saving password:", data);
    await invoke("insert_password", {
      value: data,
    });
    await invoke("save_passwords");
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("grid items-start gap-6", className)}
      >
        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label</FormLabel>
              <FormControl>
                <Input placeholder="Name this password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Your username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="secret"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter password"
                  type="password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" variant="outline">
          Save changes
        </Button>
      </form>
    </Form>
  );
}
