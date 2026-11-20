async function typeAndClear({
  page,
  measure,
  selector,
  component,
  text = "Alice",
  queryNavigation = false,
}) {
  const input = page.locator(selector).first();
  await input.waitFor({ state: "visible" });
  await input.fill("");
  await measure(
    "type-five-characters",
    async () => {
      if (queryNavigation) {
        // This input is controlled by asynchronous router state. Each test step
        // waits for its committed URL/input value before sending the next key.
        // Rapid-typing responsiveness requires a separate interaction scenario.
        for (let length = 1; length <= text.length; length += 1) {
          await input.pressSequentially(text[length - 1]);
          await page.waitForFunction(
            ({ selector, expected }) =>
              document.querySelector(selector)?.value === expected &&
              new URL(location.href).searchParams.get("q") === expected,
            { selector, expected: text.slice(0, length) },
          );
        }
      } else await input.pressSequentially(text, { delay: 60 });
      await page.waitForFunction(
        ({ selector, text }) => document.querySelector(selector)?.value === text,
        { selector, text },
      );
    },
    {
      components: { [component]: { minUpdates: 5, maxUpdates: 5 } },
      maxCommits: queryNavigation ? 20 : 8,
      maxRenderMs: queryNavigation ? 1000 : 200,
      maxActionMs: queryNavigation ? 5000 : 4000,
    },
  );
  await measure(
    "clear-input",
    async () => {
      await input.fill("");
      await page.waitForFunction(
        (selector) => document.querySelector(selector)?.value === "",
        selector,
      );
    },
    {
      components: { [component]: { minUpdates: 1, maxUpdates: 1 } },
      maxCommits: queryNavigation ? 8 : 3,
      maxRenderMs: queryNavigation ? 1000 : 200,
      maxActionMs: queryNavigation ? 3000 : 2000,
    },
  );
}

export default {
  doctorProjects: [{ cwd: "." }],
  targets: [
    {
      name: "docs",
      server: {
        command: [
          "corepack",
          "yarn",
          "start",
          "--host",
          "127.0.0.1",
          "--port",
          "{port}",
          "--locale",
          "en",
          "--no-open",
        ],
        env: { DOCS_START_MODE: "multilocale" },
      },
      scenarios: [
        {
          name: "language-search",
          path: "/",
          async run({ page, measure }) {
            await page.locator('button.navbar__link[aria-haspopup="dialog"]').click();
            await typeAndClear({
              page,
              measure,
              selector: 'input[aria-label="Search languages"]',
              component: "LocaleDropdownNavbarItem",
              text: "Itali",
            });
          },
        },
      ],
    },
  ],
};
