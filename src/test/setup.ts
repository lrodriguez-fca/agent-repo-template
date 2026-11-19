import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

const themeColor = document.createElement("meta");
themeColor.name = "theme-color";
themeColor.content = "#ffffff";
document.head.append(themeColor);

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  themeColor.content = "#ffffff";
});
