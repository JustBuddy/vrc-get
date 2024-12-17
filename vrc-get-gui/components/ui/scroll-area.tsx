import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import * as React from "react";

import { cn } from "@/lib/utils";

const ScrollArea = React.forwardRef<
	React.ElementRef<typeof ScrollAreaPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
		scrollBarClassName?: string;
		viewportClassName?: string;
	}
>(({ className, children, ...props }, ref) => (
	<ScrollAreaPrimitive.Root
		className={cn("relative overflow-hidden", className)}
		{...props}
	>
		<ScrollAreaPrimitive.Viewport
			className={`h-full w-full rounded-[inherit] scroll-smooth ${props.viewportClassName}`}
			ref={ref}
		>
			{children}
		</ScrollAreaPrimitive.Viewport>
		<ScrollBar className={props.scrollBarClassName} />
		<ScrollAreaPrimitive.Corner />
	</ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
	React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
	React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
	<ScrollAreaPrimitive.ScrollAreaScrollbar
		ref={ref}
		orientation={orientation}
		className={cn(
			"flex touch-none select-none transition-colors z-20",
			orientation === "vertical" &&
				"h-full w-2.5 border-l border-l-transparent p-[1px]",
			orientation === "horizontal" &&
				"h-2.5 flex-col border-t border-t-transparent p-[1px]",
			className,
		)}
		{...props}
	>
		<ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
	</ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
