import { describe, expect, it } from "vitest";
import { createSlackMessage } from ".";

describe("createMessage", () => {
	it("should return a message", () => {
		const inputXMLItems = [
			{
				title: "title1",
				date: "2023-09-20T00:00:00+09:00",
				link: "link1",
				expiration: 1,
			},
		];
		const result = createSlackMessage(
			"channelID",
			"Message Title",
			inputXMLItems,
		);
		expect(result).toEqual({
			type: "chat.postMessage",
			body: {
				channel: "channelID",
				blocks: [
					{
						type: "header",
						text: {
							type: "plain_text",
							text: "Message Title",
						},
					},
					{
						type: "divider",
					},
					{
						type: "section",
						text: {
							type: "mrkdwn",
							text: "*title1*\n2023/9/20\nlink1",
						},
					},
				],
			},
		});
	});
});
