import { describe, it, expect } from "vitest";
import { renderErrorPage } from "./error-page";

describe("renderErrorPage", () => {
  it("returns a valid HTML string", () => {
    const html = renderErrorPage();
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("</html>");
  });

  it("includes the error heading", () => {
    const html = renderErrorPage();
    expect(html).toContain("This page didn't load");
  });

  it("includes a reload button", () => {
    const html = renderErrorPage();
    expect(html).toContain("location.reload()");
    expect(html).toContain("Try again");
  });

  it("includes a link back to home", () => {
    const html = renderErrorPage();
    expect(html).toContain('href="/"');
    expect(html).toContain("Go home");
  });

  it("includes the error description", () => {
    const html = renderErrorPage();
    expect(html).toContain("Something went wrong on our end");
  });
});
