import type { Metadata } from "next";

import { UsagePage } from "@/features/credits/UsagePage";

export const metadata: Metadata = { title: "AI Credits Overview" };

export default function Page() {
  return <UsagePage />;
}
