import { Suspense } from "react";

import { ChatThread } from "@/features/chat/ChatThread";

/**
 * `/chat/<id>`. Its own route rather than an optional catch-all: on Vercel, `[[...chatId]]` served
 * the prerendered `/chat` (empty state) for every chat URL on a full page load.
 */
export default function ChatPage({ params }: PageProps<"/chat/[chatId]">) {
  return (
    // The id is only known per request: resolve it in a streamed child so the shell prerenders.
    <Suspense>
      <ChatView params={params} />
    </Suspense>
  );
}

async function ChatView({ params }: Pick<PageProps<"/chat/[chatId]">, "params">) {
  const { chatId } = await params;
  return <ChatThread id={chatId} />;
}
