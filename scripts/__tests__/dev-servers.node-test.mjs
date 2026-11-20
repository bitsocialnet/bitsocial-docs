import assert from "node:assert/strict";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const baseEnv = { ...process.env, BITSOCIAL_PINNED_NODE_REEXEC: "1", BROWSER: "none" };
for (const name of [
  "PORTLESS",
  "PORTLESS_URL",
  "PORT",
  "HOST",
  "DOCS_DEV_PROXY_TARGET",
  "DOCS_DEV_URL_FILE",
]) {
  delete baseEnv[name];
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitUntil(predicate, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return true;
    await delay(50);
  }
  return false;
}

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return port;
}

function groupAlive(pid) {
  try {
    process.kill(-pid, 0);
    return true;
  } catch (error) {
    if (error.code === "ESRCH") return false;
    throw error;
  }
}

// Each script runs in its own process group so a test can signal exactly one PID, and cleanup
// still reaches every descendant it left behind.
function launch(t, script, env = {}, root = repoRoot) {
  const child = spawn(process.execPath, [path.join(root, "scripts", script)], {
    cwd: root,
    env: { ...baseEnv, ...env },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });
  let output = "";
  child.stdout.on("data", (chunk) => (output += chunk));
  child.stderr.on("data", (chunk) => (output += chunk));
  const exited = new Promise((resolve) =>
    child.once("exit", (code, signal) => resolve({ code, signal })),
  );
  t.after(() => {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {
      /* Already gone. */
    }
  });
  return {
    pid: child.pid,
    output: () => output,
    async waitForOutput(text, timeoutMs = 30_000) {
      const seen = await waitUntil(() => output.includes(text), timeoutMs);
      assert.ok(seen, `${script} never printed "${text}":\n${output}`);
    },
    async waitForExit(timeoutMs) {
      let timer;
      const timeout = new Promise((resolve) => {
        timer = setTimeout(() => resolve(null), timeoutMs);
      });
      try {
        return await Promise.race([exited, timeout]);
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

function fakeBin(t, name, script) {
  const dir = mkdtempSync(path.join(tmpdir(), "dev-servers-test-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, name);
  writeFileSync(file, script);
  chmodSync(file, 0o755);
  return { dir, log: path.join(dir, `${name}.log`) };
}

test("start-docs stops the docs build when only the launcher is signalled", async (t) => {
  const yarn = fakeBin(
    t,
    "yarn",
    `#!/bin/sh
trap 'echo "TERM $*" >> "$FAKE_LOG"; exit 143' TERM
echo "run $*" >> "$FAKE_LOG"
while :; do sleep 0.1; done
`,
  );
  const port = await freePort();
  const run = launch(t, "start-docs.mjs", {
    PORTLESS: "0",
    PORT: String(port),
    PATH: `${yarn.dir}${path.delimiter}${process.env.PATH}`,
    FAKE_LOG: yarn.log,
  });
  const building = await waitUntil(
    () => existsSync(yarn.log) && readFileSync(yarn.log, "utf8").includes("run build"),
    10_000,
  );
  assert.ok(building, `start-docs never started the docs build:\n${run.output()}`);

  process.kill(run.pid, "SIGTERM");

  const stopped = await waitUntil(() => !groupAlive(run.pid), 10_000);
  assert.ok(stopped, `start-docs left the docs build running:\n${run.output()}`);
  assert.match(readFileSync(yarn.log, "utf8"), /^TERM build$/m);
});

// Copies the launchers into a scratch checkout whose node_modules/.bin/portless is a stub: `list`
// prints the routes in $FAKE_ROUTES, and running an app logs its name and the docs hand-off env.
// `run` waits for a launcher whose app exits at once; `start` leaves the app running.
function portlessCheckout(t, branch) {
  const root = mkdtempSync(path.join(tmpdir(), "dev-servers-portless-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, "scripts"));
  for (const file of ["dev-server-utils.mjs", "start-docs.mjs"]) {
    copyFileSync(path.join(repoRoot, "scripts", file), path.join(root, "scripts", file));
  }
  mkdirSync(path.join(root, "node_modules/.bin"), { recursive: true });
  const portless = path.join(root, "node_modules/.bin/portless");
  writeFileSync(
    portless,
    `#!/bin/sh
case "$1" in
  proxy) exit 0 ;;
  list) cat "$FAKE_ROUTES"; exit 0 ;;
esac
printf '%s|%s|%s\\n' "$1" "$DOCS_DEV_PROXY_TARGET" "$DOCS_DEV_URL_FILE" >> "$FAKE_LOG"
[ -n "$FAKE_STAY_UP" ] || exit 0
trap 'echo TERM >> "$FAKE_SIGNALS"; exit 143' TERM
trap 'echo HUP >> "$FAKE_SIGNALS"; exit 129' HUP
while :; do sleep 0.1; done
`,
  );
  chmodSync(portless, 0o755);
  execFileSync("git", ["init", "--quiet", "--initial-branch", branch], { cwd: root });
  const routes = path.join(root, "routes");
  const log = path.join(root, "apps.log");
  const signalLog = path.join(root, "signals.log");
  writeFileSync(routes, "");
  const env = { FAKE_ROUTES: routes, FAKE_LOG: log, FAKE_SIGNALS: signalLog };
  const appLines = () => (existsSync(log) ? readFileSync(log, "utf8").trim().split("\n") : []);
  const lastApp = () => {
    const [name, docsTarget, docsUrlFile] = appLines().at(-1).split("|");
    return { name, docsTarget, docsUrlFile };
  };
  const run = (script) => {
    const result = spawnSync(process.execPath, [path.join(root, "scripts", script)], {
      cwd: root,
      env: { ...baseEnv, ...env },
      encoding: "utf8",
      timeout: 30_000,
    });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    return lastApp();
  };
  const start = async (script) => {
    const before = appLines().length;
    const launcher = launch(t, script, { ...env, FAKE_STAY_UP: "1" }, root);
    const started = await waitUntil(() => appLines().length > before, 10_000);
    assert.ok(started, `${script} never started its app:\n${launcher.output()}`);
    return { ...launcher, ...lastApp() };
  };
  const urlRecord = (name) => path.join(root, ".dev-servers", `${name}-url`);
  const signals = () => (existsSync(signalLog) ? readFileSync(signalLog, "utf8").trim() : "");
  return { routes, run, start, urlRecord, signals };
}

for (const [branch, docsHost] of [
  ["master", "docs.bitsocial.localhost"],
  ["feature/new-page", "feature-new-page.docs.bitsocial.localhost"],
]) {
  test(`start-docs on ${branch} claims ${docsHost}`, async (t) => {
    const checkout = portlessCheckout(t, branch);
    const docs = await checkout.start("start-docs.mjs");
    assert.equal(`${docs.name}.localhost`, docsHost);
  });
}

// Once a server stops, its host can be claimed by another checkout, so a leftover record would
// send /docs (or agent-init) there.
for (const [launcher, record] of [["start-docs.mjs", "docs"]]) {
  test(`${launcher} removes its URL record when its server stops, but not a newer launcher's`, async (t) => {
    const checkout = portlessCheckout(t, "master");
    const file = checkout.urlRecord(record);

    const first = await checkout.start(launcher);
    assert.ok(existsSync(file), `${launcher} recorded no URL:\n${first.output()}`);
    process.kill(first.pid, "SIGTERM");
    assert.ok(await first.waitForExit(10_000), `${launcher} did not exit:\n${first.output()}`);
    assert.equal(existsSync(file), false, `${launcher} left its ${record} URL record behind`);

    const second = await checkout.start(launcher);
    writeFileSync(file, "https://newer.bitsocial.localhost\n");
    process.kill(second.pid, "SIGTERM");
    assert.ok(await second.waitForExit(10_000), `${launcher} did not exit:\n${second.output()}`);
    assert.equal(readFileSync(file, "utf8"), "https://newer.bitsocial.localhost\n");
  });

  // `kill -HUP` reaches the launcher alone; closing its terminal sends SIGHUP to its whole group.
  // Portless only removes its route and stops its detached server on SIGINT or SIGTERM.
  test(`${launcher} stops its server with SIGTERM and removes its URL record on SIGHUP`, async (t) => {
    const checkout = portlessCheckout(t, "master");
    const file = checkout.urlRecord(record);

    const alone = await checkout.start(launcher);
    process.kill(alone.pid, "SIGHUP");
    const stopped = await waitUntil(() => !groupAlive(alone.pid), 10_000);
    assert.ok(stopped, `${launcher} left its server running after SIGHUP:\n${alone.output()}`);
    assert.equal(checkout.signals(), "TERM");
    assert.equal(existsSync(file), false, `${launcher} left its ${record} URL record behind`);

    const group = await checkout.start(launcher);
    process.kill(-group.pid, "SIGHUP");
    assert.ok(await group.waitForExit(10_000), `${launcher} did not exit:\n${group.output()}`);
    assert.equal(
      existsSync(file),
      false,
      `${launcher} left its ${record} URL record behind when its terminal closed`,
    );
  });
}
