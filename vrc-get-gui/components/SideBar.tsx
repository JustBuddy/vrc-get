"use client";

import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Cloud, Settings, List, AlignLeft, SwatchBook, Package} from "lucide-react";
import React from "react";
import {useQuery} from "@tanstack/react-query";
import {utilGetVersion} from "@/lib/bindings";
import {useTranslation} from "react-i18next";
import {useRouter} from "next/navigation";
import {toastNormal} from "@/lib/toast";
import {ScrollArea} from "@/components/ui/scroll-area";

export function SideBar({className}: { className?: string }) {
	"use client"

	const {t} = useTranslation();

	const currentVersionResult = useQuery({
		queryKey: ["utilGetVersion"],
		queryFn: utilGetVersion,
		refetchOnMount: false,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
		refetchInterval: false,
	});

	const currentVersion = currentVersionResult.status == "success" ? currentVersionResult.data : "Loading...";

	const copyVersionName = () => {
		if (currentVersionResult.status == "success") {
			navigator.clipboard.writeText(currentVersionResult.data);
			toastNormal(t("sidebar:toast:version copied"));
		}
	};
	const isDev = process.env.NODE_ENV == 'development';

	return (
		<Card
			className={`${className} flex w-auto max-w-[20rem] p-2 shadow-xl shadow-primary/5 ml-4 my-4 shrink-0 overflow-auto`}>
			<div className="flex flex-col gap-1 p-2 min-w-[10rem] flex-grow">
				<SideBarItem href={"/projects"} text={t("projects")} icon={List}/>
				<SideBarItem href={"/repositories"} text={t("vpm repositories")} icon={Package}/>
				{isDev && <SideBarItem href={"/settings/palette"} text={"UI Palette"} icon={SwatchBook}/>}
				<div className={'flex-grow'}/>
				<SideBarItem href={"/settings"} text={t("settings")} icon={Settings}/>
				<SideBarItem href={"/log"} text={t("logs")} icon={AlignLeft}/>
				
				<a href="https://buddyworks.wtf" target="_blank"><img src="/bwtext.png" width="100%"/></a>
			</div>
		</Card>
	);
}

function SideBarItem(
	{href, text, icon}: { href: string, text: string, icon: React.ComponentType<{ className?: string }> }
) {
	const router = useRouter();
	const IconElenment = icon;
	return (
		<Button variant={"ghost"} className={"justify-start flex-shrink-0"} onClick={() => router.push(href)}>
			<div className={"mr-4"}>
				<IconElenment className="h-5 w-5"/>
			</div>
			{text}
		</Button>
	);
}
