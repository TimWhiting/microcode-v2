# Copilot Instructions for microcode-v2

These instructions orient AI coding agents to be immediately productive in this repo.
Keep changes minimal, consistent with existing patterns, and validate by building.

## Big Picture
- MicroCode is a MakeCode extension app for the micro:bit V2, providing an icon-based editor that runs on-device and in web sim.
- Core TypeScript sources live at repo root (e.g., `app.ts`, `editor.ts`, `interpreter.ts`, `tiles.ts`). UI assets under `assets/` drive the web UX (`assets/index.html`, `assets/css/style.scss`, loader and custom JS).
- Runtime and hardware APIs come from MakeCode `pxt_modules/*` dependencies and targets configured by `pxt.json`.
- The language/editor flow: tiles → parse/compile (`exprparser.ts`, `jacs.ts`) → runtime execution (`interpreter.ts`) → sensors/robot integrations (`sensors.ts`, `robot.ts`) → host/UI (`host.ts`, `navigator.ts`).

## Build, Serve, Deploy
- Primary toolchain: MakeCode (`pxt`). Target site in `mkc.json` is `https://makecode.microbit.org/beta`.
- Make targets:
  - `make build` → `pxt build`
  - `make deploy` → `pxt deploy`
  - `make test` → `pxt test` (no `testFiles` currently)
- VS Code tasks:
  - `makecode build -d` via task "build & deploy"
  - `makecode serve` via task "watch & serve" (starts local web server)
- Built artifacts in `built/` (e.g., `binary.js`, `codal.json`) are generated; do not hand-edit.

## Project Conventions
- Keep one-feature-per-file changes; avoid broad refactors. Follow existing naming and file organization in `pxt.json.files`.
- No inline comments unless requested; prefer small, focused PRs.
- UI strings and localization live in `assets/strings/*` and `locales/tooltips.json`. Add keys consistently; avoid hardcoded text in TS.
- Styles: edit `assets/css/style.scss` then ensure any pipeline that compiles CSS remains compatible with current loaders.
- Assets loading: `assets/js/loader.js` initializes web assets; avoid breaking load order (`binary-en.js`, `custom.js`).

## Integration Points
- Hardware APIs via `pxt_modules/core/*` and related modules (`radio`, `microphone`, `settings`, `datalogger`, `microgui`). Respect shim boundaries (`*.d.ts`, `*.cpp`/`*.ts`).
- Display Shield is an external MakeCode package; MicroCode UI assumes that accessory when running on-device.
- Jacscript/DeviceScript note: `scripts/README.md` pins to `devicescript` branch `jacs_for_microcode` at commit `66237c5b09...`. Maintain compatibility if touching `jacs.ts`/compiler-related code.

## Editing Patterns
- Editor flow:
  - Tiles/blocks: `tiles.ts` and `gallery.ts` define available actions.
  - Editing UI: `editor.ts`, `fieldeditors.ts`, `ruleeditor.ts` manage interactions.
  - Parsing/Expressions: `exprparser.ts`, `decimal.ts` convert UI to runtime forms.
  - Execution: `interpreter.ts` coordinates evaluation, sensors (`sensors.ts`), and host (`host.ts`).
- Configuration: `config.ts`, `options.ts`, `settings.ts` drive feature flags and persistence.
- Navigation/UX: `home.ts`, `navigator.ts`, `tooltips.ts`, `assets/index.html` and `assets/js/*` scripts.

## External Workflows (Agents)
- Agentic workflows in `.github/workflows/*.md` use GitHub Agentic Workflows. After editing, compile:
  - `gh aw compile` (or `gh aw compile <workflow-id>`) to emit `.lock.yml`.
  - Use `--strict` and scanners when modifying workflows: `--actionlint --zizmor --poutine`.

## Examples
- Adding a new sensor tile:
  - Define tile in `tiles.ts` and `gallery.ts`.
  - Map to runtime in `sensors.ts` and ensure `interpreter.ts` dispatches events.
  - Provide localized label in `assets/strings/<lang>/` and tooltips in `locales/tooltips.json`.
- Tweaking editor behavior:
  - Update `fieldeditors.ts` for input handling; ensure `exprparser.ts` accepts resulting tokens.
  - If decimal vs dots mode: see `decimal.ts` and related config in `settings.ts`.

## Gotchas
- Do not edit `pxt_modules/*` unless you understand MakeCode shims; changes may require rebuilding native parts and break compatibility.
- `pxt.json.files` list controls bundling; new TS files must be added there to be built.
- Built `assets/microcode-v2.hex` is a distribution artifact; maintain via normal build/deploy workflows.
- Localization folders contain many locales; keep keys aligned across languages and fallback to `en`.

## Quick Commands
```sh
make build
make deploy
# VS Code tasks: "build & deploy" and "watch & serve"
# Compile agentic workflows after edits
gh aw compile --strict --actionlint --zizmor --poutine
```

If any section is unclear or missing (e.g., testing strategy, CSS build specifics), tell me which part you want expanded and we’ll iterate.