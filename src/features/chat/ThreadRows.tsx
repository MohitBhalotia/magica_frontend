"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { useStickToBottomContext } from "use-stick-to-bottom";

/** A first guess for a row's height; each row is measured once it renders. */
const ESTIMATED_ROW_PX = 180;
/** Rows kept rendered above and below the visible ones. */
const OVERSCAN = 6;
/** How close to the top (px) the reader gets before older messages load. */
const LOAD_OLDER_PX = 600;

/**
 * The thread's rows, virtualized (PRD §8.1): only the rows on screen (plus a few) are in the DOM,
 * however long the chat. It scrolls inside `Conversation`, so sticking to the bottom while a reply
 * streams and the scroll-to-bottom button keep working. Older rows prepended at the top keep the
 * reader's place, and `onNearTop` asks for more when the reader scrolls up.
 */
export function ThreadRows<T>({
  rows,
  rowKey,
  renderRow,
  onNearTop,
}: {
  rows: T[];
  rowKey: (row: T) => string;
  renderRow: (row: T) => ReactNode;
  onNearTop: () => void;
}) {
  const { scrollRef } = useStickToBottomContext();
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ESTIMATED_ROW_PX,
    getItemKey: (index) => rowKey(rows[index] as T),
    overscan: OVERSCAN,
    // Before the first layout (and in tests) assume a typical viewport, so rows render at once.
    initialRect: { width: 900, height: 800 },
  });

  // Older rows arrived at the top: shift the scroll by the height they added, so the rows the
  // reader was looking at stay put instead of jumping down.
  const first = rows[0] === undefined ? undefined : rowKey(rows[0]);
  const previous = useRef({ first, height: 0 });
  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    if (previous.current.first !== undefined && first !== previous.current.first) {
      scroller.scrollTop += scroller.scrollHeight - previous.current.height;
    }
    previous.current = { first, height: scroller.scrollHeight };
  }, [first, scrollRef]);

  const items = virtualizer.getVirtualItems();
  // Only when the reader scrolls up: the first paint (scrollTop 0, before sticking to the bottom)
  // and the prepend shift above both move down, so they never chain loads.
  const nearTop =
    virtualizer.scrollDirection === "backward" && (virtualizer.scrollOffset ?? 0) < LOAD_OLDER_PX;
  useEffect(() => {
    if (nearTop) onNearTop();
  }, [nearTop, onNearTop]);

  return (
    <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
      {items.map((item) => (
        <div
          key={item.key}
          data-index={item.index}
          ref={virtualizer.measureElement}
          // The gap between messages (24px, DESIGN §4.5) lives inside each row, so it's measured.
          className="absolute top-0 left-0 w-full pb-space-07"
          style={{ transform: `translateY(${String(item.start)}px)` }}
        >
          {renderRow(rows[item.index] as T)}
        </div>
      ))}
    </div>
  );
}
