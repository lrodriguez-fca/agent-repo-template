import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { expect, it } from "vitest";
import { routes } from "./routes";

it("AT-017 (REQ-024, REQ-026): axe reports no WCAG 2.0/2.1/2.2 A/AA violations", async () => {
  const { container } = render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ["/"] })} />);
  const results = await axe(container, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
  });
  expect(results.violations).toEqual([]);
});
