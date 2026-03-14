import { lazy, Suspense } from "react";
import { useDeferredUiReady } from "../utils/deferredUi";
import { useNearViewport } from "../utils/useNearViewport";

const Footer = lazy(() => import("./Footer"));

export default function DeferredFooter({ timeoutMs = 1600, enabled = true, ...props }) {
  const { targetRef, isNearViewport } = useNearViewport({ enabled });
  const ready = useDeferredUiReady(timeoutMs, enabled && isNearViewport);

  if (!ready) {
    return <div ref={targetRef} aria-hidden="true" style={{ minHeight: "1px" }} />;
  }

  return (
    <div ref={targetRef}>
      <Suspense fallback={null}>
        <Footer {...props} />
      </Suspense>
    </div>
  );
}
