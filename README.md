# opencode-ntfy-notify

Audible out-of-band alerts for headless opencode. Server-side mp3 playback
(`attention.sound`) stays on the machine running opencode — on a VPS with no
speakers that is silence. This plugin POSTs to [ntfy](https://ntfy.sh)
instead, so your phone / laptop ntfy app plays the sound. Works over SSH,
tunnel and tmux; no audio stack required.

## Events

| opencode event    | ntfy title               | Priority | Tags          |
| ----------------- | ------------------------ | -------- | ------------- |
| `session.idle`    | session done             | 3 default| `robot`       |
| `session.error`   | session error            | 4 high   | `warning,robot`|
| `permission.asked`| approval needed          | 4 high   | `question`    |

Subagent turns (`properties.parentID` set) are skipped to cut noise. Failures
never throw into the session (8s POST timeout, all errors swallowed).

## Configuration (env)

| Variable               | Required | Default          |
| ---------------------- | -------- | ---------------- |
| `OPENCODE_NTFY_TOPIC`  | yes      | —                |
| `OPENCODE_NTFY_SERVER` | no       | `https://ntfy.sh`|
| `OPENCODE_NTFY_TOKEN`  | no       | — (Bearer token for private servers) |

```bash
echo 'export OPENCODE_NTFY_TOPIC="opencode-<random>"' >> ~/.bashrc
```

Privacy: on public ntfy.sh the topic IS the password — use a long random
topic and never post secrets in titles/messages.

## Install

Copy or symlink the single file (zero runtime dependencies, type-only import):

- Global: `~/.config/opencode/plugins/ntfy-notify.ts`
- Project: `.opencode/plugins/ntfy-notify.ts`

Restart opencode afterwards (plugins load once at startup). If
`OPENCODE_NTFY_TOPIC` is unset the plugin logs a warning via
`client.app.log` and stays idle.

## Verify

1. Subscribe the topic in an ntfy app (sound on).
2. Ask opencode something short → expect a `session done` ding.
3. Trigger a permission prompt → expect `approval needed`.
4. Test the raw path any time:
   `curl -X POST https://ntfy.sh/<topic> -d "hello"`.

Companion client: `vscode-ntfy-client` (toasts + beeps inside VS Code).
