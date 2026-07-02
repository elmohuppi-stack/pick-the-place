import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  hover?: boolean;
  padded?: boolean;
};

export default function Card({
  hover = false,
  padded = true,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "card backdrop-blur-sm",
        hover && "card-hover",
        padded && "p-6",
        className,
      )}
      {...props}
    />
  );
}
