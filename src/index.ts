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

type Result = {
	start: string;
	end: string;
	items: XMLItem[];
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
		const url = new URL(i.link);
		const link = `${url.origin}${url.pathname}`;
		return {
			title: i.title,
			date: i.date,
			link: link,
			expiration
		};
	});

	const existKeys = (await c.env.BOOK_LAUNCH.list()).keys.reduce((acc, i) => {
		acc[i.name] = true;
		return acc;
	}, {} as Record<string, boolean>);

	const unsavedItems: XMLItem[] = [];

	for (const item of items) {
		const url = new URL(item.link);
		const key = url.pathname;
		if (existKeys[key]) {
			// ignore if already saved
			continue;
		}
		const now = new Date();
		if (item.expiration < Math.floor(now.getTime() / 1000)) {
			// ignore if expired
			continue;
		}

		await c.env.BOOK_LAUNCH.put(key, JSON.stringify(item), {
			expiration: item.expiration,
		});
		unsavedItems.push(item);
	}
	return new Response(JSON.stringify(unsavedItems));
})

app.get("/items", async (c) => {
	const offsetStr = c.req.query("offset") ?? "1";
	const offset = parseInt(offsetStr, 10);
	if (isNaN(offset)) {
		return new Response("offset is not number", { status: 400 });
	}
	const now = new Date();

	// hh:mm:ss -> 00:00:00
	const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
	startDate.setDate(startDate.getDate() + offset);
	// after 1 day
	const endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 1, 0, 0, 0);
	console.info(startDate.toISOString(), endDate.toISOString());

	const start = Math.floor(startDate.getTime() / 1000);
	const end = Math.floor(endDate.getTime() / 1000);

	const items: XMLItem[] = [];
	for (const key of (await c.env.BOOK_LAUNCH.list()).keys.map(i => i.name)) {
		const item = await c.env.BOOK_LAUNCH.get<XMLItem>(key, "json");
		if (!item) {
			// ignore if not found
			continue;
		}
		const unix = Math.floor(new Date(item.date).getTime() / 1000);

		// start <= item.expiration < end -> response
		if (start <= unix && unix < end) {
			items.push(item);
		}
	}
	return new Response(JSON.stringify({
		start: startDate.toISOString(),
		end: endDate.toISOString(),
		items
	} as Result));
})

type Env = {
	CHANNEL: string
	FETCHER: Fetcher
	SLACK_NOTIFIER: Queue
}

export default {
	...app,
	async scheduled(controller: ScheduledController, env: Env): Promise<void> {
		await notifyNewBook(env);
		await notifySoonBook(env);
	},
}

async function notifyNewBook(env: Env) {
	const newItemsResp = await env.FETCHER.fetch("http://localhost:8787/items", { method: "POST" });
	if (!newItemsResp.ok) {
		console.error("failed to post items", newItemsResp.status);
		return;
	}
	const newItems: XMLItem[] = await newItemsResp.json()
	if (newItems.length === 0) {
		console.info("no new items");
		return;
	}


	const blocks = [];
	for (const item of newItems) {
		blocks.push({
			type: "section",
			text: {
				type: "mrkdwn",
				text: `*${item.title}*\n${item.link}`,
			},
		});
	}
	if (blocks.length === 0) {
		return;
	}
	await env.SLACK_NOTIFIER.send({
		type: "chat.postMessage",
		body: {
			channel: env.CHANNEL,
			blocks: [
				{
					type: "header",
					text: {
						type: "plain_text",
						text: "New Books",
					},
				},
				{
					type: "divider",
				},
				...blocks,
			],
		},
	});
}


async function notifySoonBook(env: Env) {
	const newItemsResp = await env.FETCHER.fetch("http://localhost:8787/items");
	if (!newItemsResp.ok) {
		console.error("failed to post items", newItemsResp.status);
		return;
	}
	const newItems: Result = await newItemsResp.json()
	if (newItems.items.length === 0) {
		console.info("no new items");
		return;
	}

	const blocks = [];
	for (const item of newItems.items) {
		blocks.push({
			type: "section",
			text: {
				type: "mrkdwn",
				text: `*${item.title}*\n${item.link}`,
			},
		});
	}
	if (blocks.length === 0) {
		return;
	}
	await env.SLACK_NOTIFIER.send({
		type: "chat.postMessage",
		body: {
			channel: env.CHANNEL,
			blocks: [
				{
					type: "header",
					text: {
						type: "plain_text",
						text: "Soon Books",
					},
				},
				{
					type: "divider",
				},
				...blocks,
			],
		},
	});
}
