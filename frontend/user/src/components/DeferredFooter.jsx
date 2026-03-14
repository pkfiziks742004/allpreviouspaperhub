import { lazy, Suspense } from "react";
import { useDeferredUiReady } from "../utils/deferredUi";

const Footer = lazy(() => import("./Footer"));

export default function DeferredFooter({ timeoutMs = 1600, enabled = true, ...props }) {
  const ready = useDeferredUiReady(timeoutMs, enabled);

  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <Footer {...props} />
    </Suspense>
  );
}
