import {Card} from "@/components/ui/card";
import {ScrollArea, ScrollBar} from "@/components/ui/scroll-area";
import {cn} from "@/lib/utils";
import React from "react";

export function ScrollableCard(
	{
		children,
		className,
	}: {
		children: React.ReactNode
		className?: string
	}
) {
	return <Card className={cn("pl-2.5 pt-2.5 overflow-hidden flex", className)}>
		<ScrollArea type="always" className={"w-full flex-shrink overflow-hidden"}
								scrollBarClassName={"bg-background pb-2.5"}>
			{children}
			<div className={"pb-2.5"}/>
			<ScrollBar className={"bg-background"} orientation="horizontal"/>
		</ScrollArea>
	</Card>
}
