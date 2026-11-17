#!/usr/bin/env node
/**
 * Runs Garb in its fast (production) mode and, if Cloudflare's free tunnel
 * tool is installed, gives you a public link to share for a demo.
 *
 *   npm run demo                  shop + backend + public link
 *   npm run demo -- --no-tunnel   shop + backend only
 *   npm run demo -- --build       rebuild the shop even if nothing changed
 *
 * Press Ctrl+C to stop everything. The link only works while this is running.
 */
import { spawn, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const backendDir = join(root, "apps/backend")
const storefrontDir = join(root, "apps/storefront")
const isWindows = process.platform === "win32"

const args = process.argv.slice(2)
const wantTunnel = !args.includes("--no-tunnel")
const forceBuild = args.includes("--build")

const BACKEND = "http://localhost:9000"
const SHOP = "http://localhost:8000"

const bold = (s) => `\x1b[1m${s}\x1b[0m`
const green = (s) => `\x1b[32m${s}\x1b[0m`
const yellow = (s) => `\x1b[33m${s}\x1b[0m`
const red = (s) => `\x1b[31m${s}\x1b[0m`
const dim = (s) => `\x1b[2m${s}\x1b[0m`
const say = (text) => console.log(`${bold("garb")}  ${text}`)

const children = []

function stopAll(code = 0) {
  for (const child of children) {
    if (child.exitCode !== null) continue
    try {
      if (isWindows) spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" })
      else process.kill(-child.pid, "SIGTERM")
    } catch {
      // already stopped
    }
  }
  process.exit(code)
}

process.on("SIGINT", () => {
  console.log("")
  say("Stopping…")
  stopAll(0)
})
process.on("SIGTERM", () => stopAll(0))

function fail(message, hint) {
  console.error(`\n${red("✗ " + message)}`)
  if (hint) console.error(`  ${hint}`)
  stopAll(1)
}

/** Starts a long-running process. Its output is shown only if asked, with a label. */
function start(label, command, commandArgs, cwd, { showOutput = false, onLine, onExit } = {}) {
  const child = spawn(command, commandArgs, {
    cwd,
    shell: isWindows,
    detached: !isWindows,
    env: { ...process.env, FORCE_COLOR: "1" },
  })
  children.push(child)
  const log = []
  const handle = (chunk) => {
    for (const line of chunk.toString().split(/\r?\n/)) {
      if (!line.trim()) continue
      log.push(line)
      if (log.length > 60) log.shift()
      if (showOutput) console.log(`${dim(label.padEnd(5))} ${line}`)
      onLine?.(line)
    }
  }
  child.stdout.on("data", handle)
  child.stderr.on("data", handle)
  child.on("exit", (code) => {
    if (onExit) return onExit(code, log)
    if (code !== 0 && code !== null) {
      console.error(log.slice(-25).join("\n"))
      fail(`${label} stopped unexpectedly.`)
    }
  })
  return child
}

async function isUp(url) {
  try {
    const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(3000) })
    return res.status < 500
  } catch {
    return false
  }
}

async function waitFor(url, label, seconds) {
  for (let i = 0; i < seconds; i++) {
    if (await isUp(url)) return
    await new Promise((r) => setTimeout(r, 1000))
  }
  fail(`${label} didn't start within ${seconds} seconds.`)
}

function hasCommand(command) {
  const result = spawnSync(command, ["--version"], { stdio: "ignore", shell: isWindows })
  return result.status === 0
}

/** A fingerprint of the code and shop settings, so we only rebuild when something changed. */
function buildFingerprint() {
  const git = spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" })
  const changes = spawnSync("git", ["status", "--porcelain", "apps/storefront"], { cwd: root, encoding: "utf8" })
  const env = existsSync(join(storefrontDir, ".env.local"))
    ? readFileSync(join(storefrontDir, ".env.local"), "utf8")
    : ""
  return createHash("sha256")
    .update(`${git.stdout}|${changes.stdout}|${env}`)
    .digest("hex")
}

async function main() {
  console.log("")
  if (!existsSync(join(backendDir, ".env")) || !existsSync(join(storefrontDir, ".env.local"))) {
    fail("Garb isn't set up on this computer yet.", "Run `npm run setup` first.")
  }

  // 1. Backend
  if (await isUp(`${BACKEND}/health`)) {
    say("Backend already running")
  } else {
    say("Starting the backend…")
    start("api", "npx", ["medusa", "develop"], backendDir)
    await waitFor(`${BACKEND}/health`, "The backend", 240)
  }
  say(green("Backend ready"))

  // 2. Shop (production build is much faster than dev mode)
  if (await isUp(SHOP)) {
    fail("Something is already using port 8000.", "Stop `npm run dev` (or whatever uses it) and try again.")
  }
  const stampPath = join(storefrontDir, ".next", "garb-build-stamp")
  const fingerprint = buildFingerprint()
  const upToDate =
    !forceBuild &&
    existsSync(join(storefrontDir, ".next", "BUILD_ID")) &&
    existsSync(stampPath) &&
    readFileSync(stampPath, "utf8") === fingerprint

  if (upToDate) {
    say("Shop build is up to date")
  } else {
    say("Building the shop (a minute or two)…")
    const build = spawnSync("npx", ["next", "build"], {
      cwd: storefrontDir,
      stdio: "inherit",
      shell: isWindows,
    })
    if (build.status !== 0) fail("The shop build failed. See the messages above.")
    writeFileSync(stampPath, fingerprint)
  }

  say("Starting the shop…")
  start("shop", "npx", ["next", "start", "-p", "8000"], storefrontDir)
  await waitFor(SHOP, "The shop", 60)
  say(green("Shop ready"))

  // 3. Public link
  let link = null
  if (wantTunnel) {
    if (!hasCommand("cloudflared")) {
      console.log(`\n${yellow("No public link:")} Cloudflare's free tunnel tool isn't installed.`)
      console.log("  Install it once, then run `npm run demo` again:")
      console.log(`    Mac:      ${bold("brew install cloudflared")}`)
      console.log(`    Windows:  ${bold("winget install --id Cloudflare.cloudflared")}`)
      console.log("    Linux:    https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/")
    } else {
      say("Creating a public link…")
      let connected = false
      let tunnelError = null
      link = await new Promise((resolve) => {
        let found = null
        const timer = setTimeout(() => resolve(found), 45000)
        start("link", "cloudflared", ["tunnel", "--no-autoupdate", "--url", SHOP], root, {
          onLine: (line) => {
            const match = line.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)
            if (match && !found) found = match[0]
            if (/Registered tunnel connection/i.test(line)) {
              connected = true
              clearTimeout(timer)
              resolve(found)
            }
            if (/\bERR\b/.test(line) && !tunnelError) tunnelError = line.replace(/^\S+\s+ERR\s+/, "")
          },
          onExit: () => {
            clearTimeout(timer)
            if (connected) {
              console.log(yellow("\nThe public link stopped. The shop still works on this computer."))
              console.log("  Press Ctrl+C and run `npm run demo` again for a new link.")
            }
            resolve(null)
          },
        })
      })
      if (!connected) {
        link = null
        console.log(yellow("\nCouldn't create a public link. Check your internet connection and try again."))
        if (tunnelError) console.log(dim(`  Cloudflare said: ${tunnelError}`))
        console.log("  The shop still works on this computer.")
      }
    }
  }

  console.log("")
  console.log(green(bold("Garb is running.")))
  console.log("")
  if (link) {
    console.log(`  ${bold("Share this link:")}  ${bold(green(link))}`)
    console.log(dim("  (it can take up to a minute to start working, and it changes every time)"))
    console.log("")
  }
  console.log(`  Shop on this computer:   ${SHOP}`)
  console.log(`  Admin (show on screen):  ${BACKEND}/app`)
  console.log(`  Demo seller login:       seller@garb.test / garbseller1`)
  console.log("")
  console.log(dim("  Press Ctrl+C to stop."))
}

main().catch((error) => fail(error.message))
