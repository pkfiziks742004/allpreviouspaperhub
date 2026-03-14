import { lazy, Suspense } from "react";
import { useDeferredUiReady } from "../utils/deferredUi";

const AdSlot = lazy(() => import("./AdSlot"));

export default function DeferredAdSlot({ timeoutMs = 1200, enabled = true, ...props }) {
  const ready = useDeferredUiReady(timeoutMs, enabled);

  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <AdSlot {...props} />
    </Suspense>
  );
}
