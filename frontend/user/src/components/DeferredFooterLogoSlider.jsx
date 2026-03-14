import { lazy, Suspense } from "react";
import { useDeferredUiReady } from "../utils/deferredUi";

const FooterLogoSlider = lazy(() => import("./FooterLogoSlider"));

export default function DeferredFooterLogoSlider({
  timeoutMs = 1800,
  enabled = true,
  ...props
}) {
  const ready = useDeferredUiReady(timeoutMs, enabled);

  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <FooterLogoSlider {...props} />
    </Suspense>
  );
}
