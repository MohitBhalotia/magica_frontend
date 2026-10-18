import { Suspense } from "react";

import { SearchDialog } from "@/features/chats/SearchDialog";
import { AppSidebar } from "@/features/shell/AppSidebar";
import { TopBar } from "@/features/shell/TopBar";

/** App shell (DESIGN §3.1): floating sidebar card + main column, inset 8px. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh gap-space-03 p-space-03">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Auth controls read the request cookie: streamed so the shell still prerenders. */}
        <Suspense>
          <TopBar />
        </Suspense>
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
      <SearchDialog />
    </div>
  );
}
