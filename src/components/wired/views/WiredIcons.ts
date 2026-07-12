// ─────────────────────────────────────────────────────────────
//  Wired Icons — single source of truth for every wired asset.
//
//  Usage:
//      import { WiredIcon, wiredIconUrl } from './WiredIcons';
//      <img src={ wiredIconUrl(WiredIcon.radioOn) } />
//
//  All assets live in @/assets/images/wired (same place as
//  catalog, bubbles, etc). Never hardcode an asset path in a
//  box view — add the name here and reference it semantically.
// ─────────────────────────────────────────────────────────────

// Vite resolves the @ alias inside import.meta.glob, bundles every
// icon and hands back its final URL. Keyed by file basename so a
// lookup works no matter how Vite formats the glob keys.
const ICON_MODULES = import.meta.glob('@/assets/images/wired/*.{png,gif}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

const ICON_URLS: Record<string, string> = {};

for(const path of Object.keys(ICON_MODULES)) ICON_URLS[path.split('/').pop()] = ICON_MODULES[path];

/**
 * Resolve a wired icon name (with or without extension) to its bundled URL.
 */
export const wiredIconUrl = (name?: string) =>
{
    if(!name) return '';

    return ICON_URLS[name.includes('.') ? name : `${ name }.png`] ?? '';
}

export const WiredIcon = {
    // ── Form controls ─────────────────────────
    checkboxEmpty: 'wired_uncheckedbox',
    checkboxSelected: 'wired_checkedbox',
    radioEmpty: 'wired_radio_off',
    radioSelected: 'wired_radio_on',
    // (input bubble is a pure-CSS mimic in WiredView.scss — no asset)
    sliderBar: 'wired_slider_bar',
    sliderPill: 'wired_slider_pill',

    // ── Selection / adjust arrows ─────────────
    arrowRight: 'arrow_rightadjust_unhover',
    arrowRightHover: 'arrow_rightadjust_hover',
    arrowLeft: 'arrow_leftadjust_unhover',
    arrowLeftHover: 'arrow_leftadjust_hover',

    // ── Param section chevron ─────────────────
    chevron: 'menu_arrow_down_up',
    subvariableChevron: 'subvariable_chevron',

    // ── Window chrome ─────────────────────────
    bgLeft: 'wired_bg_left',
    bgRight: 'wired_bg_right',
    menuButton: 'wired_enter_settings_nohover',
    menuButtonHover: 'wired_enter_settings_hover',
    closeButton: 'cancel_wired_menu_nohover',
    closeButtonHover: 'cancel_wired_menu_hover',
    leaderboardTrophy: 'leaderboard_trophy',

    // ── Dropdowns ─────────────────────────────
    dropdown: 'wired_dropdown_unhover',
    dropdownHover: 'wired_dropdown_hover',

    // ── Variable type selectors ───────────────
    variableFurni: 'furniSourceSelector',
    variableUser: 'userSourceSelector',
    variableGlobal: 'globalSourceSelector',
    variableContext: 'contextSourceSelector',

    // Tile / selector tools
    emptyButton: 'wired_button_empty',
    addTileSelector: 'addTileSelector',
    removeTileSelector: 'removeTileSelector',
    changeOriginSelector: 'changeOriginSelector',
    maximizeSelector: 'maximizeSelector',
    minimizeSelector: 'minimizeSelector',

    // ── Furni pick buttons ────────────────────
    furniPick: 'wired_furni_picks',
    furniPickHover: 'wired_furni_picks_hover',
    furniPickAlt: 'wired_furni_picks2',
    furniPickAltHover: 'wired_furni_picks2_hover',

    // ── Movement / direction arrows ───────────
    moveNorth: 'move_0_arrow',
    moveNorthEast: 'move_1_arrow',
    moveEast: 'move_2_arrow',
    moveSouthEast: 'move_3_arrow',
    moveSouth: 'move_4_arrow',
    moveSouthWest: 'move_5_arrow',
    moveWest: 'move_6_arrow',
    moveNorthWest: 'move_7_arrow',
    moveHorizontal: 'move_horz_arrow',
    moveVertical: 'move_vert_arrow',
    moveAll: 'move_multi_arrow',
    rotateClockwise: 'rotate_clockwise_arrow',
    rotateCounterClockwise: 'rotate_counterclockwise_arrow'
} as const;

export type WiredIconName = typeof WiredIcon[keyof typeof WiredIcon];

/** Direction index (0-7, matching wired rotation values) → icon name. */
export const wiredDirectionIcon = (direction: number) => `move_${ ((direction % 8) + 8) % 8 }_arrow`;
