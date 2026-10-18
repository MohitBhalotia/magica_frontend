import { Suspense } from "react";

/** `/chat` (empty state) and `/chat/<id>` (a chat). Real views arrive in F5 and F7. */
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
  return (
    <div className="flex h-full items-center justify-center">
      <h1 className="text-heading-lg font-bold">{id ? `Chat ${id}` : "Your AI worker"}</h1>
    </div>
  );
}
