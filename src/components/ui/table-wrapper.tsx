import { cn } from "@/lib/utils";

interface TableWrapperProps extends React.HTMLAttributes<HTMLDivElement> {}

export function TableWrapper({ className, children, ...props }: TableWrapperProps) {
  return (
    <div
      className={cn("w-full overflow-x-auto rounded-md border", className)}
      {...props}
    >
      <div className="min-w-[800px]">
        {children}
      </div>
    </div>
  );
}
