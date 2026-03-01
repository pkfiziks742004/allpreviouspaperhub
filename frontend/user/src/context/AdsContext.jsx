import { createContext, useContext } from "react";

const AdsContext = createContext({
  enabled: false,
  headScript: "",
  bodyScript: "",
  adsTxt: ""
});

export function AdsProvider({ value, children }) {
  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>;
}

export function useAds() {
  return useContext(AdsContext);
}

