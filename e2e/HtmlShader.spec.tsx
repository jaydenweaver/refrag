import { expect, test } from "@playwright/experimental-ct-react";
import { HtmlShader } from "../src/components/HtmlShader/index.js";

test.use({ viewport: { width: 800, height: 600 } });

test("renders a visible canvas element", async ({ mount }) => {
  const component = await mount(<HtmlShader width={400} height={300} />);
  await expect(component.locator("canvas")).toBeVisible();
});

test("canvas has the correct width and height attributes", async ({ mount }) => {
  const component = await mount(<HtmlShader width={512} height={256} />);
  const canvas = component.locator("canvas");
  await expect(canvas).toHaveAttribute("width", "512");
  await expect(canvas).toHaveAttribute("height", "256");
});

test("uses default 300×300 when no dimensions are provided", async ({ mount }) => {
  const component = await mount(<HtmlShader />);
  const canvas = component.locator("canvas");
  await expect(canvas).toHaveAttribute("width", "300");
  await expect(canvas).toHaveAttribute("height", "300");
});

test("portals children into the canvas as a direct DOM child", async ({ mount, page }) => {
  const component = await mount(
    <HtmlShader width={400} height={300}>
      <div data-testid="html-content">Hello from the DOM</div>
    </HtmlShader>
  );

  // The div must be a descendant of the canvas in the DOM, not a sibling —
  // the HTML-in-Canvas spec requires elements to be direct canvas children.
  const canvas = component.locator("canvas");
  const content = canvas.locator("[data-testid='html-content']");
  await expect(content).toBeAttached();
  await expect(content).toContainText("Hello from the DOM");
});

test("canvas draws without console errors when API is available", async ({ mount, page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await mount(
    <HtmlShader width={400} height={300}>
      <div style={{ width: "100%", height: "100%", background: "red" }} />
    </HtmlShader>
  );

  // Filter out errors unrelated to refrag.
  const refragErrors = errors.filter((e) => e.includes("[refrag]"));
  expect(refragErrors).toHaveLength(0);
});

test("canvas is non-empty after the HTML content is painted", async ({ mount, page }) => {
  await mount(
    <HtmlShader width={200} height={200}>
      <div style={{ width: "200px", height: "200px", background: "rgb(255,0,0)" }} />
    </HtmlShader>
  );

  // Sample the center pixel — it should not be fully transparent once the
  // HTML content has been uploaded as a texture and drawn by the shader.
  const isNonEmpty = await page.evaluate(() => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    if (!canvas) return false;
    const gl = canvas.getContext("webgl2");
    if (!gl) return false;
    const pixel = new Uint8Array(4);
    gl.readPixels(100, 100, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    // Alpha > 0 means something was drawn.
    return (pixel[3] ?? 0) > 0;
  });

  expect(isNonEmpty).toBe(true);
});
