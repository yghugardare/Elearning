import React from "react";
import { Provider } from "react-redux";
import { store } from "../redux/store";

interface ProvidersProps {
  children: any;
}

export function Providers({ children }: ProvidersProps) {
  return <Provider store={store}>{children}</Provider>;
}
