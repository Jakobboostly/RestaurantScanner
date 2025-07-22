import { Info, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePlayfulTooltip } from "@/hooks/usePlayfulTooltips";
import { cn } from "@/lib/utils";

interface PlayfulTooltipProps {
  context: string;
  element: string;
  data?: any;
  children?: React.ReactNode;
  className?: string;
  iconClassName?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
  enabled?: boolean;
}

export function PlayfulTooltip({
  context,
  element,
  data,
  children,
  className,
  iconClassName,
  side = "top",
  align = "center",
  delayDuration = 300,
  enabled = true,
}: PlayfulTooltipProps) {
  const { tooltip, isLoading } = usePlayfulTooltip(context, element, data, enabled);

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || (
            <button
              className={cn(
                "inline-flex items-center justify-center p-1 rounded-full",
                "text-muted-foreground hover:text-foreground transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                className
              )}
              aria-label="More information"
            >
              {isLoading ? (
                <Loader2 className={cn("h-4 w-4 animate-spin", iconClassName)} />
              ) : (
                <Info className={cn("h-4 w-4", iconClassName)} />
              )}
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          align={align}
          className="max-w-xs text-sm font-normal leading-relaxed bg-popover text-popover-foreground border shadow-md"
        >
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Convenience component for common use cases
export function PlayfulInfoIcon({
  context,
  element,
  data,
  className,
  ...props
}: Omit<PlayfulTooltipProps, 'children'>) {
  return (
    <PlayfulTooltip
      context={context}
      element={element}
      data={data}
      className={cn("ml-1", className)}
      {...props}
    />
  );
}