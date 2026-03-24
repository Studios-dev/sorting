import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import App from "./App.tsx";
import { algorithms } from "./algorithms.ts";

test("renders each sorting algorithm card", () => {
  const markup = renderToStaticMarkup(<App />);

  expect(markup).toContain("sorting");

  for (const algorithm of algorithms) {
    expect(markup).toContain(`data-algo="${algorithm.id}"`);
    expect(markup).toContain(algorithm.name);
  }
});
