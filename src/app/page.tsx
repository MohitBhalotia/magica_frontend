import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { Suspense } from "react";

// M0 placeholder proving Clerk works; the chat shell replaces it in M1.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4">
      <h1>Agent Chat</h1>
      {/* Auth reads the request cookie: stream it in so the static shell still prerenders. */}
      <Suspense>
        <Show when="signed-out">
          <SignInButton mode="modal" />
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </Suspense>
    </main>
  );
}
