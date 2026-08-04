# Prettier Setup — Frontend

Shared formatting rules so all developers produce the same code style.

## One-time setup (each developer)

### 1. Install dependencies

```bash
cd DP-SMS-FRONTEND
pnpm install
```

### 2. Install VS Code / Cursor extension

Install **Prettier - Code formatter** (`esbenp.prettier-vscode`).

When you open the project, Cursor/VS Code will suggest it via `.vscode/extensions.json`.

### 3. Verify format on save

Open any `.tsx` file → make a small edit → save. The file should auto-format.

If not, check: **Settings → Format On Save** is enabled (already set in `.vscode/settings.json`).

---

## Commands

| Command             | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `pnpm format`       | Format all files in the project                     |
| `pnpm format:check` | Check formatting without changing files (use in CI) |

---

## Config files (do not change individually)

| File                    | Purpose                                |
| ----------------------- | -------------------------------------- |
| `.prettierrc`           | Formatting rules — **same as backend** |
| `.prettierignore`       | Files Prettier should skip             |
| `.vscode/settings.json` | Format on save for the team            |

---

## Rules summary

| Rule            | Value          |
| --------------- | -------------- |
| Semicolons      | Yes            |
| Quotes          | Double `"`     |
| Trailing commas | Always         |
| Line width      | 100 characters |
| Indent          | 2 spaces       |
| Line endings    | LF (Unix)      |

---

## Before committing

Run:

```bash
pnpm format:check
```

If it fails, run `pnpm format` and commit the formatted files.

---

## Important

- Never change `.prettierrc` alone — update **both** backend and frontend together.
- Do not use personal Prettier settings that override the project config.
