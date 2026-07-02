import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  color?: string;
};

export default function Badge({
  color = "bg-revenexx-100 text-revenexx-700 dark:bg-revenexx-500/15 dark:text-revenexx-300",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
        color,
        className,
      )}
      {...props}
    />
  );
}

export function StatusDot({
  color = "bg-revenexx-500",
  pulse = true,
  className,
}: {
  color?: string;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block w-2 h-2 rounded-full",
        color,
        pulse && "animate-pulse",
        className,
      )}
    />
  );
}
