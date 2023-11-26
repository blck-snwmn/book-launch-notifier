import { XMLParser } from "fast-xml-parser";
import { Hono } from "hono";

export type Bindings = {
	URL: string;
	BOOK_LAUNCH: KVNamespace;
};

type XMLContemt = {
	RDF: {
		item: XMLItem[];
	};
};

type XMLItem = {
	title: string;
	date: string;
	link: string;
	expiration: number
};

const app = new Hono<{ Bindings: Bindings }>();

app.post("/items", async (c) => {
	const resp = await fetch(c.env.URL);
	if (!resp.ok) {
		return new Response("Error");
	}
	const text = await resp.text();

	const parser = new XMLParser({
		removeNSPrefix: true,
	});
	const json: XMLContemt = parser.parse(text);
	const items: XMLItem[] = json.RDF.item.map(i => {
		const date = new Date(i.date);
		date.setDate(date.getDate() + 1);
		const expiration = Math.floor(date.getTime() / 1000);
		return {
			title: i.title,
			date: i.date,
			link: i.link,
			expiration
		};
	});

	const keys = (await c.env.BOOK_LAUNCH.list()).keys.reduce((acc, i) => {
		acc[i.name] = true;
		return acc;
	}, {} as Record<string, boolean>);

	const unsavedItems: XMLItem[] = [];

	for (const item of items) {
		const url = new URL(item.link);
		const key = url.pathname;
		if (keys[key]) {
			// ignore if already saved
			continue;
		}
		await c.env.BOOK_LAUNCH.put(key, JSON.stringify(item), {});
		unsavedItems.push(item);
	}
	return new Response(JSON.stringify(unsavedItems));
})

const scheduled = {
	async scheduled(controller: ScheduledController, env: Bindings): Promise<void> {
	},
};


export default {
	...app,
	...scheduled,
}
