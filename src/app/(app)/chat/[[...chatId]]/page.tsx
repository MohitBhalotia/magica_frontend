import { Suspense } from "react";

import { EmptyState } from "@/features/chat/EmptyState";

/** `/chat` (empty state) and `/chat/<id>` (a chat; the real view arrives in F7). */
export default function ChatPage({ params }: PageProps<"/chat/[[...chatId]]">) {
  return (
    // The chat id is only known per request: resolve it in a streamed child so the shell prerenders.
    <Suspense>
      <ChatView params={params} />
    </Suspense>
  );
}

async function ChatView({ params }: Pick<PageProps<"/chat/[[...chatId]]">, "params">) {
  const { chatId } = await params;
  const id = chatId?.[0];
  if (!id) return <EmptyState />;
  return (
    <div className="flex h-full items-center justify-center">
      <h1 className="text-heading-lg font-bold">Chat {id}</h1>
    </div>
  );
}
