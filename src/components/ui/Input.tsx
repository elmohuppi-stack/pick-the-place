import { cn } from "@/lib/utils";

const fieldClass =
  "w-full px-4 py-2.5 rounded-xl border border-revenexx-100 dark:border-white/10 bg-white dark:bg-white/5 text-revenexx-900 dark:text-white placeholder:text-revenexx-400 focus:ring-2 focus:ring-revenexx-500 focus:border-transparent outline-none transition-all";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Input({ className, ...props }: InputProps) {
  return <input className={cn(fieldClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaProps) {
  return <textarea className={cn(fieldClass, className)} {...props} />;
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "block text-sm font-medium text-theme-secondary mb-1",
        className,
      )}
      {...props}
    />
  );
}
