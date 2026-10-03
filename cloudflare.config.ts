import { bindings, defineConfig, triggers } from "cf/config";

export default defineConfig({
	worker: {
		name: "book-launch-notifier",
		compatibilityDate: "2024-12-24",
		entrypoint: "src/index.ts",
		workersDev: false,
		observability: {
			enabled: true,
		},
		triggers: [
			triggers.scheduled({
				schedule: "0 15 * * *",
			}),
		],
		env: {
			URL: bindings.secret(),
			BOOK_LAUNCH: bindings.kv({
				id: "6c6c2407e70d40c3946e67bea876d22a",
			}),
			DQUEUE: bindings.queue({
				name: "discordqueue",
			}),
			FETCHER: bindings.worker({
				worker: "book-launch-notifier",
			}),
		},
	},
});
