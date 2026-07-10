import { describe, expect, it } from "vitest";
import { createDiscordMessage } from ".";

describe("createDiscordMessage", () => {
	it("should return a message", () => {
		const inputXMLItems = [
			{
				title: "title1",
				date: "2023-09-20T00:00:00+09:00",
				link: "link1",
				expiration: 1,
			},
		];
		const result = createDiscordMessage("Message Title", inputXMLItems);
		expect(result).toEqual({
			type: "send_message",
			message: {
				content: "# Message Title\n## title1\n2023/9/20\nlink1\n",
			},
		});
	});
});
