import type { Plugin } from "@opencode-ai/plugin"

// NtfyNotify — audible out-of-band alerts for headless opencode.
//
// Server-side mp3 playback (attention.sound) stays on the VPS where there
// are no speakers, so this plugin POSTs to ntfy instead. Your phone / laptop
// ntfy app plays the sound. Works over SSH, tunnel, tmux — no audio stack.
//
// Events: session.idle (turn done), session.error, permission.asked.
// Subagent turns (properties.parentID set) are skipped to cut noise.
//
// Env (export in ~/.bashrc, restart opencode after changing):
//   OPENCODE_NTFY_TOPIC   required, e.g. "opencode-x7q2-alerts" (random!)
//   OPENCODE_NTFY_SERVER  optional, default "https://ntfy.sh"
//   OPENCODE_NTFY_TOKEN   optional, Bearer token for private servers
//
// Privacy: on public ntfy.sh the topic IS the password — use a long random
// topic and never post secrets in titles/messages.

const SERVER = (process.env.OPENCODE_NTFY_SERVER ?? "https://ntfy.sh").replace(/\/+$/, "")
const TOPIC = process.env.OPENCODE_NTFY_TOPIC ?? ""
const TOKEN = process.env.OPENCODE_NTFY_TOKEN ?? ""

function propsOf(event: unknown): Record<string, unknown> {
  if (typeof event === "object" && event !== null && "properties" in event) {
    const p = (event as { properties?: unknown }).properties
    if (typeof p === "object" && p !== null) return p as Record<string, unknown>
  }
  return {}
}

function typeOf(event: unknown): string {
  if (typeof event === "object" && event !== null && "type" in event) {
    const t = (event as { type?: unknown }).type
    return typeof t === "string" ? t : ""
  }
  return ""
}

function str(v: unknown): string {
  return typeof v === "string" ? v : ""
}

async function post(title: string, message: string, priority: string, tags: string): Promise<void> {
  if (!TOPIC) return
  try {
    const headers: Record<string, string> = { Title: title, Priority: priority, Tags: tags }
    if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`
    await fetch(`${SERVER}/${encodeURIComponent(TOPIC)}`, {
      method: "POST",
      headers,
      body: message,
      signal: AbortSignal.timeout(8000),
    })
  } catch {
    // Never crash or stall the session on notifier failure.
  }
}

export const NtfyNotify: Plugin = async ({ client, directory }) => {
  if (!TOPIC) {
    try {
      await client.app.log({
        body: {
          service: "ntfy-notify",
          level: "warn",
          message: "OPENCODE_NTFY_TOPIC unset, ntfy notifications disabled",
        },
      })
    } catch {
      // Logging must never break plugin load.
    }
  }
  return {
    event: async ({ event }) => {
      try {
        const props = propsOf(event)
        if (props.parentID) return
        const type = typeOf(event)
        const session = str(props.sessionID)
        const where = session ? ` (${directory}, ${session.slice(0, 8)})` : ` (${directory})`
        if (type === "session.idle") {
          await post("opencode: session done", `Turn finished${where}`, "3", "robot")
        } else if (type === "session.error") {
          const err = str(props.error).slice(0, 200)
          await post("opencode: session error", `Error${where}${err ? `: ${err}` : ""}`, "4", "warning,robot")
        } else if (type === "permission.asked") {
          await post("opencode: approval needed", `Permission waiting${where}`, "4", "question")
        }
      } catch {
        // Never crash the session from a notifier hook.
      }
    },
  }
}
