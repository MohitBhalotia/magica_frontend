import { EmptyState } from "@/features/chat/EmptyState";

/** `/chat`: the empty state. Fully static; the layout (sidebar, top bar) is shared with chats. */
export default function NewChatPage() {
  return <EmptyState />;
}
