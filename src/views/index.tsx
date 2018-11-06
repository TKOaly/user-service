import { Response } from "express";
import React from "react";
import ReactDOMServer from "react-dom/server";
import I18nContext from "./I18nContext";

export default function view<P>(res: Response, Component: React.ComponentType<P>, props: P): string {
  return ReactDOMServer.renderToStaticMarkup(
    <I18nContext.Provider value={(res as any).t}>
      <Component {...props} />
    </I18nContext.Provider>,
  );
}

export function t(id: string): JSX.Element {
  return <I18nContext.Consumer>{f => f(id)}</I18nContext.Consumer>;
}
