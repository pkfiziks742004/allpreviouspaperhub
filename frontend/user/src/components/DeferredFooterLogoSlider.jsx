import { lazy, Suspense } from "react";
import { useDeferredUiReady } from "../utils/deferredUi";
import { useNearViewport } from "../utils/useNearViewport";

const FooterLogoSlider = lazy(() => import("./FooterLogoSlider"));

export default function DeferredFooterLogoSlider({
  timeoutMs = 1800,
  enabled = true,
  ...props
}) {
  const { targetRef, isNearViewport } = useNearViewport({ enabled, rootMargin: "420px 0px" });
  const ready = useDeferredUiReady(timeoutMs, enabled && isNearViewport);

  if (!ready) {
    return <div ref={targetRef} aria-hidden="true" style={{ minHeight: "1px" }} />;
  }

  return (
    <div ref={targetRef}>
      <Suspense fallback={null}>
        <FooterLogoSlider {...props} />
      </Suspense>
    </div>
  );
}
