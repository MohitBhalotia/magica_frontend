import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";

import { server } from "@/mocks/server";
import { listChatAssets } from "@/services/chats.service";
import { listToolUsage } from "@/services/credits.service";
import { API } from "@/test/render";

/** Answers `path` with an empty page and records the query it was asked with. */
function emptyPage(path: string) {
  const seen: URLSearchParams[] = [];
  server.use(
    http.get(`${API}${path}`, ({ request }) => {
      seen.push(new URL(request.url).searchParams);
      return HttpResponse.json({ items: [], nextCursor: null });
    }),
  );
  return seen;
}

it.each([
  ["the files modal", "/chats/c1/assets", (cursor?: string) => listChatAssets("c1", cursor, "t")],
  [
    "/usage",
    "/credits/usage/gpt_image_2",
    (cursor?: string) => listToolUsage("gpt_image_2", cursor, "t"),
  ],
])("%s asks for the next page with the cursor it was given", async (_name, path, load) => {
  const seen = emptyPage(path);

  await load();
  await load("cur_2");

  expect(seen.map((query) => query.get("cursor"))).toEqual([null, "cur_2"]);
});
