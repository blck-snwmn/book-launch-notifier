import { describe, expect, it } from "vitest";
import { createMessage } from ".";

describe("createMessage", () => {
    it("should return a message", () => {
        const inputXMLItems = [
            {
                title: "title1",
                date: "date1",
                link: "link1",
                expiration: 1,
            },
        ]
        const result = createMessage("channelID","Message Title",inputXMLItems);
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
                            text: "*title1*\nlink1",
                        },
                    }
                ],
            },
        });
    });
});
