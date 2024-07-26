"use client";

import { ScrollPageContainer } from "@/components/ScrollPageContainer";
import { ScrollableCard } from "@/components/ScrollableCard";
import { VStack } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { utilOpenUrl } from "@/lib/bindings";
import type { Licenses } from "@/lib/licenses";

export default function RenderPage({
	licenses,
}: { licenses: Licenses | null }) {
	if (licenses === null) {
		return (
			<div className={"whitespace-normal"}>
				<p>Failed to load licenses.</p>
			</div>
		);
	}

	return (
		<ScrollPageContainer>
			<VStack>
				<Card className={"p-4"}>
					<p>
						This project is built on top of many open-source projects.
						<br />
						Here are the licenses of the projects used in this project:
					</p>
					<ul />
				</Card>

				{licenses.map((license, idx) => (
					<Card className={"p-4"} key={license.text}>
						<h3>{license.name}</h3>
						<h4>Used by:</h4>
						<ul className={"ml-2"}>
							{license.packages.map((pkg) => (
								<li key={`${pkg.name}@${pkg.version}`}>
									<button type="button" onClick={() => utilOpenUrl(pkg.url)}>
										{pkg.name} ({pkg.version})
									</button>
								</li>
							))}
						</ul>
						<ScrollableCard className="max-h-52">
							<pre className={"whitespace-pre-wrap"}>{license.text}</pre>
						</ScrollableCard>
					</Card>
				))}
			</VStack>
		</ScrollPageContainer>
	);
}
