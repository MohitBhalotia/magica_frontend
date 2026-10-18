import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ChatThread } from "@/features/chat/ChatThread";
import { EmptyState } from "@/features/chat/EmptyState";

/** `/chat` (empty state) and `/chat/<id>` (a chat). */
export default function ChatPage({ params }: PageProps<"/chat/[[...chatId]]">) {
  return (
    // The chat id is only known per request: resolve it in a streamed child so the shell prerenders.
    <Suspense>
      <ChatView params={params} />
    </Suspense>
  );
}

async function ChatView({ params }: Pick<PageProps<"/chat/[[...chatId]]">, "params">) {
  const { chatId = [] } = await params;
  // The optional catch-all also matches /chat/a/b, which is no chat.
  if (chatId.length > 1) notFound();
  const [id] = chatId;
  return id ? <ChatThread id={id} /> : <EmptyState />;
}
