"use client";

import { ScrollableCard } from "@/components/ScrollableCard";
import { HNavBar, VStack } from "@/components/layout";
import type { LogEntry } from "@/lib/bindings";
import { commands } from "@/lib/bindings";
import { tc } from "@/lib/i18n";
import { useTauriListen } from "@/lib/use-tauri-listen";
import React, { useCallback, useEffect } from "react";

export default function Page() {
	const [logEntries, setLogEntries] = React.useState<LogEntry[]>([]);

	useEffect(() => {
		commands
			.utilGetLogEntries()
			.then((list) => setLogEntries([...list].reverse()));
	}, []);

	useTauriListen<LogEntry>(
		"log",
		useCallback((event) => {
			setLogEntries((entries) => {
				const entry = event.payload as LogEntry;
				return [entry, ...entries];
			});
		}, []),
	);

	return (
		<VStack>
			<HNavBar className={"flex-shrink-0"}>
				<p className="cursor-pointer py-1.5 font-bold flex-grow-0">
					{tc("logs")}
				</p>
			</HNavBar>
			<ScrollableCard className={"w-full shadow-none"}>
				<pre className="whitespace-pre font-mono text-muted-foreground">
					{logEntries.map((entry) => logEntryToText(entry)).join("\n")}
				</pre>
			</ScrollableCard>
		</VStack>
	);
}

function logEntryToText(entry: LogEntry) {
	return `${entry.time} [${entry.level.padStart(5, " ")}] ${entry.target}: ${entry.message}`;
}
