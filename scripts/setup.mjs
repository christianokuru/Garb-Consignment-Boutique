#!/usr/bin/env node
/**
 * One-time setup for running Garb on your computer.
 *
 *   npm run setup            asks a few questions (press Enter for the default)
 *   npm run setup -- --yes   uses all the defaults, no questions
 *
 * It creates the env files and secret keys, creates the database, loads the
 * demo shop, creates an admin login and connects the shop to the backend.
 * It is safe to run again: anything already done is kept.
 */
import { spawnSync } from "node:child_process"
import { randomBytes } from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import net from "node:net"
import { dirname, join } from "node:path"
import { createInterface } from "node:readline/promises"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const backendDir = join(root, "apps/backend")
const storefrontDir = join(root, "apps/storefront")
const backendEnvPath = join(backendDir, ".env")
const storefrontEnvPath = join(storefrontDir, ".env.local")

const useDefaults = process.argv.includes("--yes") || !process.stdin.isTTY

const bold = (s) => `\x1b[1m${s}\x1b[0m`
const green = (s) => `\x1b[32m${s}\x1b[0m`
const yellow = (s) => `\x1b[33m${s}\x1b[0m`
const red = (s) => `\x1b[31m${s}\x1b[0m`
const step = (n, text) => console.log(`\n${bold(`${n}.`)} ${bold(text)}`)
const ok = (text) => console.log(`   ${green("✓")} ${text}`)
const note = (text) => console.log(`   ${yellow("!")} ${text}`)

function fail(message, hint) {
  console.error(`\n${red("✗ " + message)}`)
  if (hint) console.error(`  ${hint}`)
  process.exit(1)
}

// ---------- small env file helpers ----------

function readEnv(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : null
}

function getVar(text, key) {
  const match = text.match(new RegExp(`^${key}=(.*)$`, "m"))
  return match ? match[1].trim() : undefined
}

function setVar(text, key, value) {
  const line = `${key}=${value}`
  const pattern = new RegExp(`^${key}=.*$`, "m")
  if (pattern.test(text)) return text.replace(pattern, line)
  return `${text.replace(/\n*$/, "\n")}${line}\n`
}

const secret = () => randomBytes(32).toString("hex")
const weak = (v) => !v || v === "supersecret"

// ---------- checks ----------

function checkNode() {
  const [major] = process.versions.node.split(".").map(Number)
  if (major < 22) {
    fail(
      `Node ${process.versions.node} is too old.`,
      "Install Node 22 or newer from https://nodejs.org and run this again."
    )
  }
  ok(`Node ${process.versions.node}`)
}

function checkInstalled() {
  if (!existsSync(join(root, "node_modules/@medusajs/medusa"))) {
    fail("The code libraries aren't installed yet.", "Run `npm install` first, then `npm run setup`.")
  }
  ok("Code libraries installed")
}

function canConnect(host, port, timeout = 1500) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port: Number(port) })
    const done = (result) => {
      socket.destroy()
      resolve(result)
    }
    socket.setTimeout(timeout, () => done(false))
    socket.once("connect", () => done(true))
    socket.once("error", () => done(false))
  })
}

// ---------- commands ----------

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  })
  return result.status === 0
}

// ---------- main ----------

async function main() {
  console.log(bold("\nGarb setup\n"))

  const rl = useDefaults ? null : createInterface({ input: process.stdin, output: process.stdout })
  const ask = async (question, fallback) => {
    if (!rl) return fallback
    const answer = (await rl.question(`   ${question} ${yellow(`(${fallback})`)}: `)).trim()
    return answer || fallback
  }

  step(1, "Checking your computer")
  checkNode()
  checkInstalled()

  // --- backend env ---
  step(2, "Backend settings (apps/backend/.env)")
  let backendEnv = readEnv(backendEnvPath)
  const isNewBackendEnv = backendEnv === null
  if (isNewBackendEnv) {
    backendEnv = readFileSync(join(backendDir, ".env.template"), "utf8")
  }

  let databaseUrl = getVar(backendEnv, "DATABASE_URL") || "postgres://postgres:postgres@localhost:5432/garb"
  if (isNewBackendEnv) {
    console.log("   Postgres address, in the form postgres://USER:PASSWORD@HOST:PORT/DATABASE")
    databaseUrl = await ask("Database", process.env.DATABASE_URL || databaseUrl)
  }
  backendEnv = setVar(backendEnv, "DATABASE_URL", databaseUrl)

  for (const key of ["JWT_SECRET", "COOKIE_SECRET", "AUTH_MFA_ENCRYPTION_KEY", "REVALIDATE_SECRET"]) {
    if (weak(getVar(backendEnv, key))) backendEnv = setVar(backendEnv, key, secret())
  }

  // Redis is optional. If it isn't running, use the built-in in-memory version.
  const redisUrl = getVar(backendEnv, "REDIS_URL")
  if (redisUrl) {
    const { hostname, port } = new URL(redisUrl)
    if (await canConnect(hostname, port || 6379)) {
      ok("Redis is running, using it")
    } else {
      backendEnv = setVar(backendEnv, "REDIS_URL", "")
      note("Redis isn't running, so the backend will use its built-in memory version (fine for a demo)")
    }
  }

  writeFileSync(backendEnvPath, backendEnv)
  ok(isNewBackendEnv ? "Created with fresh secret keys" : "Kept your file, filled in any missing secret keys")

  // --- database ---
  step(3, "Database")
  const require = createRequire(join(backendDir, "package.json"))
  const { Client } = require("pg")
  const dbUrl = new URL(databaseUrl)
  const dbName = decodeURIComponent(dbUrl.pathname.replace(/^\//, "")) || "garb"

  const connect = async (url) => {
    const client = new Client({ connectionString: url.toString() })
    await client.connect()
    return client
  }

  try {
    const client = await connect(dbUrl)
    await client.end()
    ok(`Database "${dbName}" found`)
  } catch (error) {
    if (error.code === "3D000") {
      const adminUrl = new URL(dbUrl)
      adminUrl.pathname = "/postgres"
      try {
        const client = await connect(adminUrl)
        await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`)
        await client.end()
        ok(`Created database "${dbName}"`)
      } catch (createError) {
        fail(`Couldn't create the database "${dbName}": ${createError.message}`, "Create it yourself (for example `createdb garb`) and run this again.")
      }
    } else if (error.code === "ECONNREFUSED") {
      fail(
        `Postgres isn't running at ${dbUrl.host}.`,
        "Start Postgres (for example with Postgres.app on Mac, or `brew services start postgresql`) and run this again."
      )
    } else if (error.code === "28P01" || /password/i.test(error.message)) {
      fail(
        "Postgres rejected the username or password.",
        `Fix DATABASE_URL in apps/backend/.env (now ${databaseUrl}) and run this again.`
      )
    } else {
      fail(`Couldn't connect to Postgres: ${error.message}`, `Check DATABASE_URL in apps/backend/.env.`)
    }
  }

  // --- migrations + demo shop ---
  step(4, "Setting up tables and loading the demo shop (takes a minute the first time)")
  if (!run("npx", ["medusa", "db:migrate"], backendDir)) {
    fail("Database setup failed. See the messages above.")
  }
  ok("Tables ready and demo shop loaded")

  const db = await connect(dbUrl)
  const keyResult = await db.query(
    `select token from api_key
     where type = 'publishable' and revoked_at is null and deleted_at is null
     order by (title = 'Garb Storefront') desc, created_at asc limit 1`
  )
  const publishableKey = keyResult.rows[0]?.token
  if (!publishableKey) {
    await db.end()
    fail("Couldn't find the shop's publishable key in the database.")
  }

  // --- admin login ---
  step(5, "Admin login")
  const adminEmail = await ask("Admin email", "admin@garb.test")
  const existing = await db.query(`select id from "user" where email = $1 and deleted_at is null`, [adminEmail])
  await db.end()

  let adminPassword = null
  if (existing.rowCount) {
    ok(`${adminEmail} already exists, keeping its password`)
  } else {
    adminPassword = await ask("Admin password", "garbadmin1")
    if (!run("npx", ["medusa", "user", "-e", adminEmail, "-p", adminPassword], backendDir)) {
      fail("Couldn't create the admin login. See the messages above.")
    }
    ok(`Created ${adminEmail}`)
  }
  rl?.close()

  // --- storefront env ---
  step(6, "Shop settings (apps/storefront/.env.local)")
  let storefrontEnv = readEnv(storefrontEnvPath)
  const isNewStorefrontEnv = storefrontEnv === null
  if (isNewStorefrontEnv) {
    storefrontEnv = readFileSync(join(storefrontDir, ".env.template"), "utf8")
  }
  storefrontEnv = setVar(storefrontEnv, "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY", publishableKey)
  storefrontEnv = setVar(storefrontEnv, "REVALIDATE_SECRET", getVar(backendEnv, "REVALIDATE_SECRET"))
  writeFileSync(storefrontEnvPath, storefrontEnv)
  ok(isNewStorefrontEnv ? "Created and connected to the backend" : "Updated the shop key")

  // --- done ---
  console.log(`\n${green(bold("All set."))}\n`)
  console.log(`  Start it:        ${bold("npm run dev")}`)
  console.log(`  Share it:        ${bold("npm run demo")}  (fast version with a public link)\n`)
  console.log(`  Shop:            http://localhost:8000`)
  console.log(`  Admin:           http://localhost:9000/app`)
  console.log(`                   ${adminEmail}${adminPassword ? ` / ${adminPassword}` : ""}`)
  console.log(`  Demo seller:     http://localhost:8000/seller`)
  console.log(`                   seller@garb.test / garbseller1\n`)
}

main().catch((error) => fail(error.message))
