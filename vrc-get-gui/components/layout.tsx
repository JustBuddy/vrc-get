"use client"

import React, {useEffect} from "react";
import {Navbar} from "@material-tailwind/react";
import {listen} from '@tauri-apps/api/event';
import {LogEntry, utilGetLogEntries} from "@/lib/bindings";


export function logEntryToText(entry: LogEntry) {
	
	return `${entry.message}`;
}


export function VStack({className, children}: { className?: string, children: React.ReactNode }) {
	const [logEntries, setLogEntries] = React.useState<LogEntry[]>([]);

	useEffect(() => {
		utilGetLogEntries().then(list => setLogEntries(list.toSorted()));
	}, []);

	useEffect(() => {
		let unlisten: (() => void) | undefined = undefined;
		let unlistened = false;

		listen("log", (event) => {
			setLogEntries((entries) => {
				const entry = event.payload as LogEntry;
				return [entry, ...entries];
			});
		}).then((unlistenFn) => {
			if (unlistened) {
				unlistenFn();
			} else {
				unlisten = unlistenFn;
			}
		});

		return () => {
			unlisten?.();
			unlistened = true;
		};
	}, []);
	return (
		<div className={`flex flex-col overflow-hidden w-full gap-3 ${className}`}>
			{children} 
		</div>
	);
}

export function HNavBar({className, children}: { className?: string, children: React.ReactNode }) {
	return (
		<Navbar className={`${className} mx-auto px-4 py-2`}>
			<div className="container mx-auto flex flex-wrap items-center justify-between text-blue-gray-900 gap-2">
				{children}
			</div>
		</Navbar>
	)
}
