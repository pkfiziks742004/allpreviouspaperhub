import { lazy, Suspense } from "react";
import { useDeferredUiReady } from "../utils/deferredUi";

const RatingPopup = lazy(() => import("./RatingPopup"));

export default function DeferredRatingPopup({ timeoutMs = 2200, enabled = true }) {
  const ready = useDeferredUiReady(timeoutMs, enabled);

  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <RatingPopup />
    </Suspense>
  );
}
