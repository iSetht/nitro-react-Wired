# Wired UI — Centralization Guide

Everything lives in **3 files**. If a box view contains anything below as local code, delete it and import the central version.

## Read this first before migrating a box

- Treat the per-box text spec (`AllConditions.txt`, `AllTriggers.txt`, `AllEffects.txt`) as the source of truth. Follow its param order, title text, helper text, radio/checkbox grouping, widths, and reference examples literally.
- Do not invent a layout when the text spec already gives one. Example: if team choices are listed as `1 / 2 / 2`, render one radio on the first line, two on the second, and two on the third.
- If the spec names a reference view, open it and copy its centralized structure before adapting payload logic. Useful references include trigger/effect views such as `WiredTriggerRepeater`, `WiredTriggerScoreAchieved`, `WiredEffectPlaceTempFurniView`, `WiredEffectBotGiveHandItemView`, and `WiredEffectJoinTeamView`.
- Every visible param section should be represented by `WiredParam` unless there is a strong existing reference saying otherwise. This keeps title fonts, spacing, dividers, and collapse behavior centralized.
- Use `titleKey`/`title` on `WiredParam`, or `WiredControlTitle` for standalone labels. Do not leave raw bold text titles behind; missed title conversions are one of the easiest ways to make a box look off.
- Use centralized controls for choice text: `WiredRadio`, `WiredCheckbox`, `WiredButtonInfoText`, and `WiredSubInfo`. Do not mix in raw radio inputs, raw checkboxes, or ad hoc text fonts.
- Inputs requested as the default bubble should use `WiredTextInput compact` unless the spec gives a different width. For exact widths, use `nw-w-32`, `nw-w-56`, `nw-w-190`.
- Advanced/source settings attach to the last visual param section in the box. Do not render a standalone divider between that last param section and the advanced/source settings.
- The advanced/source panel owns its own grey-panel boundaries. Do not add local `WiredDivider` elements around advanced settings; use `sourceSelectors`, `advancedSlot`, and the base/furni selector components.
- Check for dead local code after migration: local `iconPath`, local parsing/clamp helpers, local source option helpers, raw selects, manual divider components, and one-off input styling should usually be gone.

## Divider and advanced/source panel rules

- `WiredParam` owns the divider after a normal param section. Use `divider={false}` only when the next content must visually attach to the same section, such as an advanced/source panel attached to the final param section.
- `WiredBaseView` decides how the final source/advanced panel attaches to custom params versus furni selector content. Per-box condition/trigger/effect views should not manually add extra bottom dividers.
- `WiredFurniSelectorView` owns the advanced/source panel dividers via `WiredDivider`:
  - `overlap="top"` is the cap under the advanced link (collapsed) or the panel top edge (open).
  - `inner` separates rows inside the grey panel.
  - `overlap="bottom"` closes the panel with the same body bleed as the panel itself.
- `.nw-source-panel` controls the grey panel padding, min-height, and overlap.
- If a box has furni selection as the final section, let the base/furni selector path place the source panel. If a custom param is the final section, keep that last `WiredParam` attached and let the source/advanced panel finish the section.

| File | Contains |
|---|---|
| `views/WiredControls.tsx` | Every component, constant, and helper |
| `views/WiredIcons.ts` | Icon name registry + `wiredIconUrl()` |
| `WiredView.scss` | All `nw-*` styling (incl. CSS mimics: input, dropdown list, pills) |

---

## Component map

| Need | Use | Notes |
|---|---|---|
| Window base | `WiredBaseView` (or `WiredTriggerBaseView` / `WiredEffectBaseView` / `WiredConditionBaseView`) | Header (title/row2/row3), bg art, Ready/Cancel, divider, source panel. Effects get the Delay slider free. `extra` type shows **WIRED ADD-ON** |
| Param section | `WiredParam` | `titleKey` or `title`, `chevron` for collapse, `expanded`/`onToggle` (or uncontrolled), `divider={false}` on the LAST param |
| Param title | `WiredParam titleKey` / `WiredControlTitle` | il_link_strong |
| Big descriptive text (general_box_info etc.) | `WiredInfoDesc textKey="..."` | il_regular, handles `\n` linebreaks + blank-line spacing |
| Greyed helper under a checkbox/radio | `WiredSubInfo textKey="..."` | indented to label text; add `className="nw-indent-tab"` for one extra tab |
| Text after checkbox/radio | `WiredButtonInfoText` | same font/scss as choice labels |
| Checkbox | `WiredCheckbox checked onChange label className` | icons auto from registry |
| Radio list block | `WiredRadioGroup name value onChange options=[{value,labelKey?,label?,icon?}]` | inline + gap for icon rows |
| Single radio | `WiredRadio name checked onChange label className` | icons auto from registry |
| Title + input + slider | `WiredParamWithSlider` | altitude-style params |
| Label + slider | `WiredSliderField` | movement distance rows |
| Input bubble (text/int) | `WiredTextInput` (`compact` = 56px) | `wired_window_empty.png` slice via `.nw-input`. Clamp with `clampWiredText(value, min, max)` |
| Textarea | `WiredTextarea` | same bubble styling |
| Dropdown | `WiredSelect value onChange options=[{value,label,disabled?}]` | **never `WiredNativeSelect`/`<select>`** — the native popup is OS-blue and unstylable. Open list = CSS bubble, hover #EBEBEB, selected #DDDDDD |
| Variable name dropdown | `WiredVariableNameSelect` | placeholder + list for the active type |
| Variable type pill (furni/user/global/context) | `WiredVariableTypeSelector value onChange disabledTypes?` | joined pill, per-type hover/selected/border colors. ALL 4 types enabled by default — pass `disabledTypes={[WIRED_VARIABLE_CONTEXT]}` only if a box truly can't support one |
| "Set value / From Variable" block | `WiredValueOrVariable` | the whole pattern: radio+input, radio+pill inline right-aligned, indented name dropdown. Feed `variables={{ global, furni, user, context }}` |
| Type row + name dropdown only (no radios) | `WiredVariablePicker` | same props minus radio/mode |
| Delay Effect slider | `WiredDelaySlider` | already rendered by `WiredEffectBaseView` — never add per-box |
| Slider (with arrows) | `WiredSlider min max value onChange` | arrows + bar + pill from registry, bar auto #989898 |
| Adjust arrows alone | `WiredAdjustButton direction onClick` | hover/unhover states automatic |
| Divider | `WiredDivider` | optional `overlap="top"|"bottom"`, `inner` for inside source panel. `WiredParam` adds one after each param by default. |
| Dim + disable a region | `WiredDisabled disabled className` | standard 0.45 opacity + pointer-events |
| Any icon | `wiredIconUrl(WiredIcon.xxx)` or `<WiredAssetIcon name={...} />` | add new names to `WiredIcons.ts`, never hardcode paths |
| Furni pick button | `WiredFurniPickButton variant selected onClick` | |
| Advanced source selectors panel | `sourceSelectors={[...]}` prop on the base views | titleKey/labelPrefix/options/optionLabels per selector |

## Constants & helpers (import from WiredControls)

- Types: `WIRED_VARIABLE_FURNI / _GLOBAL / _USER / _CONTEXT`
- Sources: `WIRED_SOURCE_TRIGGER / _SELECTED / _SELECTOR / _SIGNAL / _STACK_FURNI`
- Modes: `WIRED_REFERENCE_SET_VALUE / _FROM_VARIABLE`
- `wiredVariableSourceOptions(type)` — valid sources per type (context → context)
- `normalizeWiredSource(source, options)`
- `wiredVariablesForType(type, variables)`
- `clampWiredValue(n, min, max)` / `clampWiredText(str, min, max)`
- `parseWiredData<T>(trigger.stringData)` — safe JSON parse of the box payload

## SCSS utility classes

- `nw-indent-1` — one tab (align with a choice label), `nw-indent-2` — two tabs, `nw-indent-sm` — 10px, `nw-indent-tab` — label + small tab
- `--nw-choice-indent` (root var, 20px) controls the tab unit everywhere
- `nw-variable-name-gap` — gap above the variable name dropdown (already applied by `WiredValueOrVariable`)

## Migration checklist (per box)

1. Delete local `iconPath` consts → registry handles paths
2. Delete local panel/chevron components → `WiredParam`
3. Delete local `SourceIconRow`, variable pickers, `VARIABLE_TYPES`, source-option helpers → `WiredVariableTypeSelector` / `WiredValueOrVariable` + central constants
4. Delete local `clamp` / `parseData` → `clampWired*` / `parseWiredData`
5. Replace `WiredNativeSelect` / raw `<select>` → `WiredSelect`
6. Replace raw `<Text bold>` titles → `WiredControlTitle` / `WiredParam`
7. Replace inline `opacity/pointerEvents` dimming → `WiredDisabled`
8. Variables payload: pass all four lists incl. `context` (backend must send `contextVariables` in stringData, like GiveVariable)
