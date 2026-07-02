import { cn } from "@/lib/utils";

type Tone = "success" | "error" | "warning" | "info";

const toneClass: Record<Tone, string> = {
  success:
    "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  error: "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
  warning:
    "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  info: "bg-revenexx-50 dark:bg-revenexx-500/15 text-revenexx-700 dark:text-revenexx-300",
};

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: Tone;
};

export default function Alert({
  tone = "info",
  className,
  ...props
}: AlertProps) {
  return (
    <div
      className={cn("p-3 rounded-xl text-sm", toneClass[tone], className)}
      {...props}
    />
  );
}
