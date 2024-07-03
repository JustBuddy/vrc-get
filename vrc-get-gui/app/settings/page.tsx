"use client"

import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Checkbox} from "@/components/ui/checkbox";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select"
import Link from "next/link";
import {useQuery} from "@tanstack/react-query";
import {
	CheckForUpdateResponse,
	deepLinkInstallVcc,
	environmentGetSettings,
	environmentLanguage,
	environmentPickProjectBackupPath,
	environmentPickProjectDefaultPath,
	environmentPickUnity,
	environmentPickUnityHub,
	environmentSetBackupFormat,
	environmentSetLanguage,
	environmentSetReleaseChannel,
	environmentSetShowPrereleasePackages,
	environmentSetTheme,
	environmentTheme,
	TauriEnvironmentSettings,
	utilCheckForUpdate,
	utilGetVersion,
	utilOpen,
} from "@/lib/bindings";
import {HNavBar, VStack} from "@/components/layout";
import React, {useState} from "react";
import {toastError, toastNormal, toastSuccess, toastThrownError} from "@/lib/toast";
import i18next, {languages, tc, tt} from "@/lib/i18n";
import {useFilePickerFunction} from "@/lib/use-file-picker-dialog";
import {shellOpen} from "@/lib/shellOpen";
import {loadOSApi} from "@/lib/os";
import type {OsType} from "@tauri-apps/api/os";
import {ScrollableCardTable} from "@/components/ScrollableCardTable";
import {ToastContent} from "react-toastify";
import {assertNever} from "@/lib/assert-never";
import {ScrollPageContainer} from "@/components/ScrollPageContainer";
import {CheckForUpdateMessage} from "@/components/CheckForUpdateMessage";

export default function Page() {
	const result = useQuery({
		queryKey: ["environmentGetSettings"],
		queryFn: environmentGetSettings
	})

	let body;
	switch (result.status) {
		case "error":
			body = <Card className={"p-4"}>{tc("settings:error:load error")}</Card>;
			break;
		case "pending":
			body = <Card className={"p-4"}>{tc("general:loading...")}</Card>;
			break;
		case "success":
			body = <Settings settings={result.data} refetch={result.refetch}/>;
			break;
		default:
			assertNever(result);
	}

	return (
		<VStack>
			<HNavBar className={"flex-shrink-0"}>
				<p className="cursor-pointer py-1.5 font-bold flex-grow-0">
					{tc("settings")}
				</p>
			</HNavBar>
			{body}
		</VStack>
	);
}

function Settings(
	{
		settings,
		refetch,
	}: {
		settings: TauriEnvironmentSettings,
		refetch: () => void
	}
) {
	const [osType, setOsType] = React.useState<OsType>("Windows_NT");

	React.useEffect(() => {
		(async () => {
			const os = await loadOSApi();
			setOsType(await os.type());
		})();
	}, [])

	return (
		<ScrollPageContainer>
			<main className="flex flex-col gap-2 flex-shrink flex-grow">
				<Card className={"flex-shrink-0 p-4"}>
					<h2 className={"pb-2"}>{tc("settings:unity hub path")}</h2>
					<FilePathRow
						withoutSelect
						path={settings.unity_hub}
						pick={environmentPickUnityHub}
						refetch={refetch}
						notFoundMessage={"Unity Hub Not Found"}
						successMessage={tc("settings:toast:unity hub path updated")}
					/>
				</Card>
				<UnityInstallationsCard refetch={refetch} unityPaths={settings.unity_paths}/>
				<Card className={"flex-shrink-0 p-4"}>
					<h2>{tc("settings:default project path")}</h2>
					<p className={"whitespace-normal"}>
						{tc("settings:default project path description")}
					</p>
					<FilePathRow
						path={settings.default_project_path}
						pick={environmentPickProjectDefaultPath}
						refetch={refetch}
						successMessage={tc("settings:toast:default project path updated")}
					/>
				</Card>
				<BackupCard
					projectBackupPath={settings.project_backup_path}
					backupFormat={settings.backup_format}
					refetch={refetch}
				/>
				<PrereleasePackagesCard showPrereleasePackages={settings.show_prerelease_packages} refetch={refetch}/>
				<AppearanceCard/>
				{osType != "Darwin" && <VccSchemeCard/>}
				<AlcomCard releaseChannel={settings.release_channel} refetch={refetch}/>
			</main>
		</ScrollPageContainer>
	)
}

function UnityInstallationsCard(
	{
		refetch,
		unityPaths,
	}: {
		refetch: () => void;
		unityPaths: [path: string, version: string, fromHub: boolean][]
	}
) {
	const [pickUnity, unityDialog] = useFilePickerFunction(environmentPickUnity);

	const addUnity = async () => {
		try {
			const result = await pickUnity();
			switch (result) {
				case "NoFolderSelected":
					// no-op
					break;
				case "InvalidSelection":
					toastError(tt("settings:toast:not unity"));
					break;
				case "AlreadyAdded":
					toastError(tt("settings:toast:unity already added"));
					break;
				case "Successful":
					toastSuccess(tt("settings:toast:unity added"));
					refetch()
					break;
				default:
					assertNever(result);
			}
		} catch (e) {
			console.error(e);
			toastThrownError(e)
		}
	}

	const UNITY_TABLE_HEAD = ["settings:unity:version", "settings:unity:path", "general:source"];

	return (
		<Card className={"flex-shrink-0 p-4"}>
			<div className={"pb-2 flex align-middle"}>
				<div className={"flex-grow flex items-center"}>
					<h2>{tc("settings:unity installations")}</h2>
				</div>
				<Button onClick={addUnity} size={"sm"} className={"m-1"}>{tc("settings:button:add unity")}</Button>
			</div>
			<ScrollableCardTable className="w-full min-h-[20vh]">
				<thead>
				<tr>
					{UNITY_TABLE_HEAD.map((head, index) => (
						<th key={index}
								className={`sticky top-0 z-10 border-b border-primary bg-secondary text-secondary-foreground p-2.5`}>
							<small className="font-normal leading-none">{tc(head)}</small>
						</th>
					))}
				</tr>
				</thead>
				<tbody>
				{
					unityPaths.map(([path, version, isFromHub]) => (
						<tr key={path} className="even:bg-secondary/30">
							<td className={"p-2.5"}>{version}</td>
							<td className={"p-2.5"}>{path}</td>
							<td className={"p-2.5"}>
								{isFromHub ? tc("settings:unity:source:unity hub") : tc("settings:unity:source:manual")}
							</td>
						</tr>
					))
				}
				</tbody>
			</ScrollableCardTable>
			{unityDialog}
		</Card>
	)
}

function BackupCard(
	{
		projectBackupPath,
		backupFormat,
		refetch,
	}: {
		projectBackupPath: string;
		backupFormat: string;
		refetch: () => void;
	}
) {
	const setBackupFormat = async (format: string) => {
		try {
			await environmentSetBackupFormat(format)
			refetch()
		} catch (e) {
			console.error(e);
			toastThrownError(e)
		}
	}

	return (
		<Card className={"flex-shrink-0 p-4"}>
			<h2>{tc("projects:backup")}</h2>
			<div className="mt-2">
				<h3>{tc("settings:backup:path")}</h3>
				<p className={"whitespace-normal"}>
					{tc("settings:backup:path description")}
				</p>
				<FilePathRow
					path={projectBackupPath}
					pick={environmentPickProjectBackupPath}
					refetch={refetch}
					successMessage={tc("settings:toast:backup path updated")}
				/>
			</div>
			<div className="mt-2">
				<label className={"flex items-center"}>
					<h3>{tc("settings:backup:format")}</h3>
					<Select defaultValue={backupFormat} onValueChange={setBackupFormat}>
						<SelectTrigger>
							<SelectValue/>
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectItem value={"default"}>{tc("settings:backup:format:default")}</SelectItem>
								<SelectItem value={"zip-store"}>{tc("settings:backup:format:zip-store")}</SelectItem>
								<SelectItem value={"zip-fast"}>{tc("settings:backup:format:zip-fast")}</SelectItem>
								<SelectItem value={"zip-best"}>{tc("settings:backup:format:zip-best")}</SelectItem>
							</SelectGroup>
						</SelectContent>
					</Select>
				</label>
			</div>
		</Card>
	)
}

function PrereleasePackagesCard(
	{
		showPrereleasePackages,
		refetch,
	}: {
		showPrereleasePackages: boolean;
		refetch: () => void;
	}
) {
	const toggleShowPrereleasePackages = async (e: "indeterminate" | boolean) => {
		try {
			await environmentSetShowPrereleasePackages(e === true)
			refetch()
		} catch (e) {
			console.error(e);
			toastThrownError(e)
		}
	}

	return (
		<Card className={"flex-shrink-0 p-4"}>
			<p className={"whitespace-normal"}>
				{tc("settings:show prerelease description")}
			</p>
			<label className={"flex items-center"}>
				<div className={"p-3"}>
					<Checkbox checked={showPrereleasePackages} onCheckedChange={(e) => toggleShowPrereleasePackages(e)}/>
				</div>
				{tc("settings:show prerelease")}
			</label>
		</Card>
	)
}

function AppearanceCard() {
	const {data: lang, refetch: refetchLang} = useQuery({
		queryKey: ["environmentLanguage"],
		queryFn: environmentLanguage
	})

	const [theme, setTheme] = React.useState<string | null>(null);

	const changeLanguage = async (value: string) => {
		await Promise.all([
			i18next.changeLanguage(value),
			environmentSetLanguage(value),
			refetchLang(),
		])
	};

	React.useEffect(() => {
		(async () => {
			const theme = await environmentTheme();
			setTheme(theme);
		})();
	}, [])

	const changeTheme = async (theme: string) => {
		await environmentSetTheme(theme);
		setTheme(theme);
		if (theme === "system") {
			const {appWindow} = await import("@tauri-apps/api/window");
			theme = await appWindow.theme() ?? "light";
		}
		document.documentElement.setAttribute("class", theme);
	};

	return (
		<Card className={"flex-shrink-0 p-4"}>
			<h2>Appearance</h2>
			<label className={"flex items-center"}>
				<h3>{tc("settings:language")}: </h3>
				{lang && (
					<Select defaultValue={lang} onValueChange={changeLanguage}>
						<SelectTrigger>
							<SelectValue/>
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{
									languages.map((lang) => (
										<SelectItem key={lang} value={lang}>{tc("settings:langName", {lng: lang})}</SelectItem>
									))
								}
							</SelectGroup>
						</SelectContent>
					</Select>
				)}
			</label>
			<label className={"flex items-center"}>
				<h3>{tc("settings:theme")}: </h3>
				{theme && (
					<Select defaultValue={theme} onValueChange={changeTheme}>
						<SelectTrigger>
							<SelectValue/>
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectItem value={"system"}>{tc("settings:theme:system")}</SelectItem>
								<SelectItem value={"light"}>{tc("settings:theme:light")}</SelectItem>
								<SelectItem value={"dark"}>{tc("settings:theme:dark")}</SelectItem>
							</SelectGroup>
						</SelectContent>
					</Select>
				)}
			</label>
		</Card>
	)
}

function VccSchemeCard() {
	const installVccProtocol = async () => {
		try {
			await deepLinkInstallVcc();
			toastSuccess(tc("settings:toast:vcc scheme installed"));
		} catch (e) {
			console.error(e);
			toastThrownError(e)
		}
	}

	return (
		<Card className={"flex-shrink-0 p-4"}>
			<h2>{tc("settings:vcc scheme")}</h2>
			<p className={"whitespace-normal"}>
				{tc("settings:vcc scheme description")}
			</p>
			<div>
				<Button onClick={installVccProtocol}>{tc("settings:register vcc scheme")}</Button>
			</div>
		</Card>
	)
}

function AlcomCard(
	{
		releaseChannel,
		refetch,
	}: {
		releaseChannel: string;
		refetch: () => void;
	}
) {
	const [updateState, setUpdateState] = useState<CheckForUpdateResponse | null>(null);

	const checkForUpdate = async () => {
		try {
			const checkVersion = await utilCheckForUpdate();
			if (checkVersion.is_update_available) {
				setUpdateState(checkVersion);
			} else {
				toastNormal(tc("check update:toast:no updates"));
			}
		} catch (e) {
			toastThrownError(e)
			console.error(e)
		}
	}

	const reportIssue = async () => {
		const url = new URL("https://github.com/vrc-get/vrc-get/issues/new")
		url.searchParams.append("labels", "bug,vrc-get-gui")
		url.searchParams.append("template", "01_gui_bug-report.yml")
		const osApi = await loadOSApi();
		url.searchParams.append("os", `${await osApi.type()} - ${await osApi.platform()} - ${await osApi.version()} - ${await osApi.arch()}`)
		const appVersion = await utilGetVersion();
		url.searchParams.append("version", appVersion)
		url.searchParams.append("version", appVersion)

		void shellOpen(url.toString())
	}

	const changeReleaseChannel = async (value: "indeterminate" | boolean) => {
		await environmentSetReleaseChannel(value === true ? "beta" : "stable");
		refetch();
	};

	const currentVersionResult = useQuery({
		queryKey: ["utilGetVersion"],
		queryFn: utilGetVersion,
		refetchOnMount: false,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
		refetchInterval: false,
	});

	const currentVersion = currentVersionResult.status == "success" ? currentVersionResult.data : "Loading...";

	return (
		<Card className={"flex-shrink-0 p-4 flex flex-col gap-4"}>
			{updateState && <CheckForUpdateMessage response={updateState} close={() => setUpdateState(null)}/>}
			<h2>ALCOM {currentVersion}</h2>
			<div className={"flex flex-row flex-wrap gap-2"}>
				<Button onClick={checkForUpdate}>{tc("settings:check update")}</Button>
				<Button onClick={reportIssue}>{tc("settings:button:open issue")}</Button>
			</div>
			<div>
				<label className={"flex items-center gap-2"}>
					<Checkbox checked={releaseChannel == "beta"} onCheckedChange={(e) => changeReleaseChannel(e)}/>
					{tc("settings:receive beta updates")}
				</label>
				<p className={"text-sm whitespace-normal"}>{tc("settings:beta updates description")}</p>
			</div>
			<p className={"whitespace-normal"}>
				{tc("settings:licenses description", {}, {
					components: {l: <Link href={"/settings/licenses"} className={"underline"}/>}
				})}
			</p>
		</Card>
	)
}

function FilePathRow(
	{
		path,
		notFoundMessage,
		pick,
		refetch,
		successMessage,
		withoutSelect = false,
	}: {
		path: string;
		notFoundMessage?: string;
		pick: () => Promise<{ type: "NoFolderSelected" | "InvalidSelection" | "Successful" }>;
		refetch: () => void;
		successMessage: ToastContent;
		withoutSelect?: boolean;
	}) {
	const [pickPath, dialog] = useFilePickerFunction(pick);

	const selectFolder = async () => {
		try {
			const result = await pickPath();
			switch (result.type) {
				case "NoFolderSelected":
					// no-op
					break;
				case "InvalidSelection":
					toastError(tc("general:toast:invalid directory"));
					break;
				case "Successful":
					toastSuccess(successMessage);
					refetch()
					break;
				default:
					assertNever(result.type);
			}
		} catch (e) {
			console.error(e);
			toastThrownError(e)
		}
	};

	const openFolder = async () => {
		try {
			await utilOpen(path)
		} catch (e) {
			console.error(e);
			toastThrownError(e)
		}
	};

	return (
		<div className={"flex gap-1 items-center"}>
			{
				!path && notFoundMessage
					? <Input className="flex-auto text-destructive" value={notFoundMessage} disabled/>
					: <Input className="flex-auto" value={path} disabled/>
			}
			<Button className={"flex-none px-4"} onClick={selectFolder}>
				{tc("general:button:select")}
			</Button>
			{withoutSelect || <Button className={"flex-none px-4"} onClick={openFolder}>
				{tc("settings:button:open location")}
			</Button>}
			{dialog}
		</div>
	)
}
