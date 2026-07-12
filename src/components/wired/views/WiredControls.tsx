import { ButtonHTMLAttributes, CSSProperties, FC, forwardRef, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ReactSlider from 'react-slider';
import { LocalizeText } from '../../../api';
import { BitmapFontName, Flex, Text } from '../../../common';
import { WiredIcon, wiredIconUrl } from './WiredIcons';

// All icon urls resolve through the central registry (WiredIcons.ts).
export const WiredDirectionIconNames = {
    north: WiredIcon.moveNorth,
    northEast: WiredIcon.moveNorthEast,
    east: WiredIcon.moveEast,
    southEast: WiredIcon.moveSouthEast,
    south: WiredIcon.moveSouth,
    southWest: WiredIcon.moveSouthWest,
    west: WiredIcon.moveWest,
    northWest: WiredIcon.moveNorthWest,
    horizontal: WiredIcon.moveHorizontal,
    vertical: WiredIcon.moveVertical,
    all: WiredIcon.moveAll
};

export const WiredRotationIconNames = {
    clockwise: WiredIcon.rotateClockwise,
    counterClockwise: WiredIcon.rotateCounterClockwise
};

// ─────────────────────────────────────────────────────────────
//  Shared wired constants — variable types / sources
// ─────────────────────────────────────────────────────────────

export const WIRED_VARIABLE_FURNI = 0;
export const WIRED_VARIABLE_GLOBAL = 1;
export const WIRED_VARIABLE_USER = 2;
export const WIRED_VARIABLE_CONTEXT = 3;

export const WIRED_SOURCE_TRIGGER = 0;
export const WIRED_SOURCE_CLICKED_AVATAR = 11;
export const WIRED_SOURCE_SELECTED = 100;
export const WIRED_SOURCE_SECONDARY_SELECTED = 101;
export const WIRED_SOURCE_SELECTOR = 200;
export const WIRED_SOURCE_SIGNAL = 201;
export const WIRED_SOURCE_STACK_FURNI = 901;

export const WIRED_REFERENCE_SET_VALUE = 0;
export const WIRED_REFERENCE_FROM_VARIABLE = 1;

export const wiredUserSourceOptions = (includeClickedAvatar = false) => [
    WIRED_SOURCE_TRIGGER,
    ...(includeClickedAvatar ? [ WIRED_SOURCE_CLICKED_AVATAR ] : []),
    WIRED_SOURCE_SELECTOR,
    WIRED_SOURCE_SIGNAL
];

const CLICKED_AVATAR_SOURCE_KEYS = [
    'clickedUserSourceAvailable',
    'hasClickedAvatarTrigger',
    'hasClickAvatarTrigger',
    'clickAvatarTriggerAvailable'
];

const CLICKED_AVATAR_SOURCE_ARRAY_KEYS = [
    'availableUserSources',
    'userSources',
    'userSourceOptions'
];

const CLICKED_AVATAR_TRIGGER_ARRAY_KEYS = [
    'conflictingTriggers',
    'executionTriggerTypes',
    'executionTriggerCodes',
    'executionSources',
    'availableExecutionSources',
    'stackTriggerTypes',
    'stackTriggerCodes',
    'triggerTypes',
    'triggerCodes'
];

export const wiredClickedAvatarSourceAvailable = (data: Record<string, any> = {}) =>
{
    if(CLICKED_AVATAR_SOURCE_KEYS.some(key => data[key] === true)) return true;
    if(CLICKED_AVATAR_SOURCE_ARRAY_KEYS.some(key => Array.isArray(data[key]) && data[key].includes(WIRED_SOURCE_CLICKED_AVATAR))) return true;
    if(CLICKED_AVATAR_TRIGGER_ARRAY_KEYS.some(key => Array.isArray(data[key]) && data[key].includes(8))) return true;

    return false;
}

export const wiredClickedAvatarSourceAvailableForTrigger = (trigger: any = null) =>
{
    if(!trigger) return false;

    if(wiredClickedAvatarSourceAvailable(trigger as Record<string, any>)) return true;

    const data = parseWiredData<Record<string, any>>(trigger?.stringData ?? '');

    return wiredClickedAvatarSourceAvailable(data);
}

export const wiredUserSourceOptionsForData = (data: Record<string, any> = {}) => wiredUserSourceOptions(wiredClickedAvatarSourceAvailable(data));

export const wiredVariableSourceOptions = (variableType: number, includeClickedAvatar = false) =>
    (variableType === WIRED_VARIABLE_FURNI)
        ? [ WIRED_SOURCE_TRIGGER, WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL ]
        : (variableType === WIRED_VARIABLE_USER)
            ? wiredUserSourceOptions(includeClickedAvatar)
            : (variableType === WIRED_VARIABLE_CONTEXT)
                ? [ WIRED_VARIABLE_CONTEXT ]
                : [ WIRED_VARIABLE_GLOBAL ];

export const normalizeWiredSource = (source: number, options: number[]) => options.includes(source) ? source : options[0];

// ── Shared numeric input helpers ─────────────────────────────

export const clampWiredValue = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const clampWiredText = (value: string, min: number, max: number) =>
{
    if(value === '' || value === '-') return value;

    return String(clampWiredValue(Number(value.replace(/[^0-9-]/g, '')) || 0, min, max));
}

/** Parse the JSON blob wired boxes store in stringData. */
export const parseWiredData = <T,>(value: string): T =>
{
    if(!value || !value.startsWith('{')) return {} as T;

    try
    {
        return JSON.parse(value);
    }
    catch
    {
        return {} as T;
    }
}

export interface WiredOption<T extends string | number = number>
{
    value: T;
    label?: ReactNode;
    icon?: string;
    disabled?: boolean;
}

interface WiredControlSectionProps
{
    title?: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
}

export const WiredControlSection: FC<WiredControlSectionProps> = props =>
{
    const { title = null, description = null, children = null } = props;

    return (
        <div className="nw-control-section">
            { title !== null && <WiredControlTitle>{ title }</WiredControlTitle> }
            { description !== null && <div className="nw-control-desc">{ description }</div> }
            { children }
        </div>
    );
}

export const WiredControlTitle: FC<{ children: ReactNode }> = ({ children }) => (
    <div className="nw-control-title">
        <Text bitmapFont="il_link_strong">{ children }</Text>
    </div>
);

export const WiredControlText: FC<{ children: ReactNode }> = ({ children }) => (
    <span className="nw-control-text">
        <Text bitmapFont="il_regular">{ children }</Text>
    </span>
);

export const WiredButton: FC<ButtonHTMLAttributes<HTMLButtonElement>> = props =>
{
    const { className = '', type = 'button', children, ...rest } = props;

    return (
        <button { ...rest } type={ type } className={ `nw-text-btn nw-inline-btn ${ className }` }>
            <Text bitmapFont="il_button">{ children }</Text>
        </button>
    );
}

type WiredTextInputProps = InputHTMLAttributes<HTMLInputElement> & {
    compact?: boolean;
    bitmapFont?: BitmapFontName;
    bitmapAlign?: 'left' | 'center';
};

export const WiredTextInput: FC<WiredTextInputProps> = props =>
{
    const { compact = false, bitmapFont, bitmapAlign = 'left', className = '', ...rest } = props;
    void bitmapFont;

    return (
        <span className={ `nw-input-wrap ${ bitmapAlign === 'center' ? 'nw-input-align-center' : '' } ${ compact ? 'nw-w-56' : '' } ${ rest.disabled ? 'is-disabled' : '' } ${ className }` }>
            <input
                { ...rest }
                className="nw-input nw-input-native" />
        </span>
    );
}

type WiredTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
    bitmapFont?: BitmapFontName;
};

export const WiredTextarea = forwardRef<HTMLTextAreaElement, WiredTextareaProps>((props, ref) =>
{
    const { bitmapFont, className = '', ...rest } = props;
    void bitmapFont;

    return (
        <span className={ `nw-textarea-wrap ${ rest.disabled ? 'is-disabled' : '' } ${ className }` }>
            <textarea
                ref={ ref }
                { ...rest }
                className="nw-input nw-textarea nw-textarea-native" />
        </span>
    );
});

export const WiredRadio: FC<{
    name: string;
    checked: boolean;
    onChange: () => void;
    label?: ReactNode;
    icon?: string;
    className?: string;
}> = props =>
{
    const { name, checked, onChange, label = null, icon = null, className = '' } = props;

    return (
        <label className={ `nw-choice ${ className }` }>
            <input type="radio" name={ name } checked={ checked } onChange={ onChange } />
            <img className="nw-choice-icon" alt="" src={ wiredIconUrl(checked ? WiredIcon.radioSelected : WiredIcon.radioEmpty) } />
            { icon && <WiredAssetIcon name={ icon } /> }
            { label !== null && <WiredControlText>{ label }</WiredControlText> }
        </label>
    );
}

export const WiredRadioInput: FC<InputHTMLAttributes<HTMLInputElement>> = props =>
{
    const { checked = false, className = '', ...rest } = props;

    return (
        <label className={ `nw-choice nw-choice-inline ${ className }` }>
            <input { ...rest } type="radio" checked={ checked } />
            <img className="nw-choice-icon" alt="" src={ wiredIconUrl(checked ? WiredIcon.radioSelected : WiredIcon.radioEmpty) } />
        </label>
    );
}

export const WiredCheckbox: FC<{
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: ReactNode;
    className?: string;
    disabled?: boolean;
}> = props =>
{
    const { checked, onChange, label = null, className = '', disabled = false } = props;

    return (
        <label className={ `nw-choice ${ disabled ? 'is-disabled' : '' } ${ className }` }>
            <input type="checkbox" checked={ checked } disabled={ disabled } onChange={ event => onChange(event.target.checked) } />
            <img className="nw-choice-icon" alt="" src={ wiredIconUrl(checked ? WiredIcon.checkboxSelected : WiredIcon.checkboxEmpty) } />
            { label !== null && <WiredControlText>{ label }</WiredControlText> }
        </label>
    );
}

export const WiredCheckboxInput: FC<InputHTMLAttributes<HTMLInputElement>> = props =>
{
    const { checked = false, className = '', ...rest } = props;

    return (
        <label className={ `nw-choice nw-choice-inline ${ className }` }>
            <input { ...rest } type="checkbox" checked={ checked } />
            <img className="nw-choice-icon" alt="" src={ wiredIconUrl(checked ? WiredIcon.checkboxSelected : WiredIcon.checkboxEmpty) } />
        </label>
    );
}

export interface WiredRadioOption
{
    value: number | string;
    label?: ReactNode;
    labelKey?: string;
    icon?: string;
}

/** Standard radio list — same markup every box uses for choice rows. */
export const WiredRadioGroup: FC<{
    name: string;
    value: number | string;
    onChange: (value: number | string) => void;
    options: WiredRadioOption[];
    inline?: boolean;
    gap?: number;
}> = props =>
{
    const { name, value, onChange, options, inline = false, gap = 1 } = props;

    const rows = options.map(option =>
        <WiredRadio
            key={ String(option.value) }
            name={ name }
            checked={ value === option.value }
            onChange={ () => onChange(option.value) }
            icon={ option.icon }
            label={ option.labelKey ? LocalizeText(option.labelKey) : option.label } />);

    if(inline) return <Flex gap={ gap }>{ rows }</Flex>;

    return <>{ rows }</>;
}

/** Label + slider row used by movement/distance params. */
export const WiredSliderField: FC<{
    label?: ReactNode;
    labelKey?: string;
    labelReplacements?: string[];
    labelKeys?: string[];
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
}> = props =>
{
    const { label = null, labelKey = null, labelReplacements = [], labelKeys = [], value, onChange, min, max, step = 1 } = props;
    const labelNode = labelKey
        ? LocalizeText(labelKey, labelKeys, labelReplacements)
        : label;

    return (
        <>
            { labelNode !== null && <WiredButtonInfoText>{ labelNode }</WiredButtonInfoText> }
            <WiredSlider min={ min } max={ max } step={ step } value={ value } onChange={ onChange } />
        </>
    );
}

/** Title row + optional compact input + slider — altitude-style params. */
export const WiredParamWithSlider: FC<{
    titleKey?: string;
    title?: ReactNode;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
    showInput?: boolean;
    inputValue?: string;
    onInputChange?: (value: string) => void;
    onInputBlur?: () => void;
    divider?: boolean;
}> = props =>
{
    const {
        titleKey = null,
        title = null,
        value,
        onChange,
        min,
        max,
        step = 1,
        showInput = true,
        inputValue,
        onInputChange,
        onInputBlur,
        divider = true
    } = props;

    const titleNode = titleKey ? LocalizeText(titleKey) : title;

    return (
        <WiredParam divider={ divider }>
            <Flex className="nw-title-input-row" alignItems="center" gap={ 1 }>
                { titleNode !== null && <WiredControlTitle>{ titleNode }</WiredControlTitle> }
                { showInput &&
                    <WiredTextInput
                        compact
                        type="number"
                        min={ min }
                        max={ max }
                        step={ step }
                        value={ inputValue ?? String(value) }
                        onChange={ event => onInputChange?.(event.target.value) }
                        onBlur={ onInputBlur } /> }
            </Flex>
            <WiredSlider min={ min } max={ max } step={ step } value={ value } onChange={ onChange } />
        </WiredParam>
    );
}

type WiredSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
    options: WiredOption<string | number>[];
};

const renderWiredSelectLabel = (label: ReactNode, muted = false) =>
    (typeof label === 'string' || typeof label === 'number')
        ? <Text bitmapFont="button_regular" className={ muted ? 'nw-select-placeholder-text' : '' }>{ label }</Text>
        : label;

export const WiredSelect: FC<WiredSelectProps> = props =>
{
    const { options, className = '', value, onChange, disabled = false, ...rest } = props;
    const [ open, setOpen ] = useState(false);
    const [ listStyle, setListStyle ] = useState<CSSProperties>({});
    const buttonRef = useRef<HTMLButtonElement>(null);
    const selectedOption = options.find(option => String(option.value) === String(value)) ?? options.find(option => !option.disabled) ?? options[0];

    useEffect(() =>
    {
        if (!open) return;
        const onMouseDown = (e: MouseEvent) =>
        {
            const target = e.target as Element;

            // clicks inside the control OR the portaled list must not close
            // the list here — closing on mousedown unmounts the option before
            // its click event can fire, which swallowed selections
            if (buttonRef.current?.closest('.nw-select-wrap')?.contains(target)) return;
            if (target?.closest?.('.nw-select-list')) return;

            setOpen(false);
        };
        document.addEventListener('mousedown', onMouseDown);
        return () => document.removeEventListener('mousedown', onMouseDown);
    }, [ open ]);

    const handleOpen = () =>
    {
        if (!open && buttonRef.current)
        {
            const rect = buttonRef.current.getBoundingClientRect();
            // Overlay the closed control (Habbo style) — the first option
            // sits exactly where the dropdown was.
            setListStyle({
                position: 'fixed',
                top: rect.top,
                left: rect.left,
                width: rect.width,
                zIndex: 9999,
            });
        }
        setOpen(prev => !prev);
    };

    const selectOption = (option: WiredOption<string | number>) =>
    {
        if(option.disabled) return;

        onChange?.({
            target: { value: String(option.value) },
            currentTarget: { value: String(option.value) }
        } as any);
        setOpen(false);
    };

    return (
        <div className={ `nw-select-wrap ${ open ? 'is-open' : '' } ${ className }` }>
            <button
                ref={ buttonRef }
                { ...(rest as unknown as ButtonHTMLAttributes<HTMLButtonElement>) }
                type="button"
                className="nw-select"
                disabled={ disabled }
                onClick={ handleOpen }>
                <span className="nw-select-value">{ renderWiredSelectLabel(selectedOption?.label, String(selectedOption?.value ?? '') === '') }</span>
            </button>

            { open && createPortal(
                <div className={ `nw-select-list ${ className }` } role="listbox" style={ listStyle }>
                    { options.map(option =>
                        <button
                            key={ String(option.value) }
                            type="button"
                            role="option"
                            className={ `nw-select-option ${ String(option.value) === String(value) ? 'is-selected' : '' }` }
                            disabled={ option.disabled }
                            onMouseDown={ event => event.preventDefault() }
                            onClick={ () => selectOption(option) }>
                            { renderWiredSelectLabel(option.label, String(option.value) === '') }
                        </button>) }
                </div>,
                document.body
            ) }
        </div>
    );
}

export const WiredAdjustButton: FC<{
    direction: 'left' | 'right';
    onClick: () => void;
    className?: string;
    disabled?: boolean;
}> = props =>
{
    const { direction, onClick, className = '', disabled = false } = props;
    const [ hovered, setHovered ] = useState(false);
    const [ flashing, setFlashing ] = useState(false);
    const state = hovered && !flashing && !disabled ? 'hover' : 'unhover';

    const handleClick = () =>
    {
        if(disabled) return;

        setFlashing(true);
        onClick();
        window.setTimeout(() => setFlashing(false), 90);
    };

    return (
        <button
            type="button"
            className={ `nw-adjust nw-adjust-${ direction } ${ className }` }
            disabled={ disabled }
            onMouseEnter={ () => setHovered(true) }
            onMouseLeave={ () => setHovered(false) }
            onClick={ handleClick }>
            <img alt="" src={ wiredIconUrl(`arrow_${ direction }adjust_${ state }`) } />
        </button>
    );
}

export const WiredSlider: FC<{
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
}> = props =>
{
    const { value, min, max, step = 1, onChange } = props;
    const clamp = (nextValue: number) => Math.min(max, Math.max(min, nextValue));
    const adjust = (direction: 'left' | 'right') => onChange(clamp(value + (direction === 'left' ? -step : step)));

    return (
        <div className="nw-slider-row">
            <WiredAdjustButton direction="left" onClick={ () => adjust('left') } />
            <ReactSlider
                className="nw-slider"
                thumbClassName="nw-slider-thumb"
                trackClassName="nw-slider-track"
                min={ min }
                max={ max }
                step={ step }
                value={ value }
                onChange={ nextValue => onChange(Array.isArray(nextValue) ? nextValue[0] : nextValue) } />
            <WiredAdjustButton direction="right" onClick={ () => adjust('right') } />
        </div>
    );
}

export const WiredAssetIcon: FC<{ name: string; className?: string; style?: CSSProperties }> = props =>
{
    const { name, className = '', style = {} } = props;

    return <img className={ `nw-asset-icon ${ className }` } style={ style } alt="" src={ wiredIconUrl(name) } />;
}

export type WiredDividerOverlap = 'top' | 'bottom';

export const WiredDivider: FC<{
    className?: string;
    /** Pull divider up to close section gap — used for source panel caps. */
    overlap?: WiredDividerOverlap;
    /** Panel-local width (no body bleed). */
    inner?: boolean;
}> = props =>
{
    const { className = '', overlap, inner = false } = props;
    const classes = [
        'nw-divider',
        overlap === 'top' && 'nw-divider--overlap-top',
        overlap === 'bottom' && 'nw-divider--overlap-bottom',
        inner && 'nw-divider--inner',
        className
    ].filter(Boolean).join(' ');

    return <div className={ classes } />;
}

export const WiredFurniPickButton: FC<{
    variant: 'primary' | 'secondary';
    selected?: boolean;
    onClick?: () => void;
}> = props =>
{
    const { variant, selected = false, onClick = undefined } = props;
    const [ hovered, setHovered ] = useState(false);
    const icon = variant === 'primary'
        ? ((hovered || selected) ? WiredIcon.furniPickHover : WiredIcon.furniPick)
        : ((hovered || selected) ? WiredIcon.furniPickAltHover : WiredIcon.furniPickAlt);

    return (
        <button
            type="button"
            className={ `nw-furni-pick ${ selected ? 'is-selected' : '' }` }
            onMouseEnter={ () => setHovered(true) }
            onMouseLeave={ () => setHovered(false) }
            onClick={ onClick }>
            <img alt="" src={ wiredIconUrl(icon) } />
        </button>
    );
}

// ─────────────────────────────────────────────────────────────
//  WiredParam — the normalized param section every box uses.
//
//  - title always renders with il_link_strong (nw-furni-caption look)
//  - chevron=true collapses to title + chevron; clicking expands
//  - a divider is applied under the param when it's done
//    (pass divider={ false } on the last param — the base view
//    already draws the divider before Ready/Cancel)
// ─────────────────────────────────────────────────────────────

export interface WiredParamProps
{
    /** Localization key for the param title (il_link_strong). */
    titleKey?: string;
    /** Pre-localized/custom title node. Used when titleKey is not set. */
    title?: ReactNode;
    /** Collapsible chevron dropdown? If false, content is always shown. */
    chevron?: boolean;
    /** Controlled expanded state (chevron only). */
    expanded?: boolean;
    /** Controlled toggle (chevron only). Omit to let WiredParam manage state. */
    onToggle?: () => void;
    /** Initial state when uncontrolled. */
    defaultExpanded?: boolean;
    /** Divider under the param. Defaults to true. */
    divider?: boolean;
    children?: ReactNode;
}

export const WiredParam: FC<WiredParamProps> = props =>
{
    const { titleKey = null, title = null, chevron = false, expanded, onToggle, defaultExpanded = false, divider = true, children = null } = props;
    const [ internalExpanded, setInternalExpanded ] = useState(defaultExpanded);
    const isExpanded = (expanded !== undefined) ? expanded : internalExpanded;
    const toggle = onToggle ?? (() => setInternalExpanded(value => !value));
    const hasTitle = !!titleKey || title !== null;
    const titleNode = hasTitle ? <WiredControlTitle>{ titleKey ? LocalizeText(titleKey) : title }</WiredControlTitle> : null;

    return (
        <>
            <div className="nw-param">
                { chevron && hasTitle
                    ? (
                        <button type="button" className="nw-param-header" onClick={ toggle }>
                            { titleNode }
                            <img className={ `nw-param-chevron ${ isExpanded ? 'is-expanded' : '' }` } alt="" src={ wiredIconUrl(WiredIcon.chevron) } />
                        </button>
                    )
                    : titleNode }
                { (!chevron || isExpanded) && children !== null &&
                    <div className="nw-param-body">{ children }</div> }
            </div>
            { divider && <WiredDivider /> }
        </>
    );
}

// ─────────────────────────────────────────────────────────────
//  WiredInfoDesc — large descriptive text inside a param
//  (il_regular / nw-furni-desc). Handles \n + literal "\n"
//  linebreaks, blank lines become spacing breaks.
// ─────────────────────────────────────────────────────────────

export const WiredInfoDesc: FC<{ text?: string; textKey?: string; children?: ReactNode }> = props =>
{
    const { text = null, textKey = null, children = null } = props;
    const resolved = textKey ? LocalizeText(textKey) : text;

    if(resolved === null) return <div className="nw-info-desc"><Text bitmapFont="il_regular" className="nw-furni-desc">{ children }</Text></div>;

    const lines = resolved.replace(/\\n/g, '\n').split('\n');

    return (
        <div className="nw-info-desc">
            { lines.map((line, index) => line.length
                ? <Text key={ index } bitmapFont="il_regular" className="nw-furni-desc">{ line }</Text>
                : <div key={ index } className="nw-info-desc-break" />) }
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  WiredButtonInfoText — text rendered after a checkbox/radio
//  (same font/scss as the WiredCheckbox label).
// ─────────────────────────────────────────────────────────────

export const WiredButtonInfoText = WiredControlText;

/** Renders placeholder preview with highlighted token (bitmap-safe). */
export const WiredPlaceholderPreview: FC<{ placeholder: string }> = ({ placeholder }) =>
{
    const raw = LocalizeText('wiredfurni.params.texts.placeholder_preview', [ 'placeholder' ], [ placeholder ]);
    const match = raw.match(/^(.*?)<font\s+color=["']([^"']+)["']\s*>(.*?)<\/font>(.*)$/is);

    if(!match)
    {
        const plain = raw.replace(/<[^>]+>/g, '');

        return <WiredButtonInfoText>{ plain }</WiredButtonInfoText>;
    }

    const [ , before, color, highlighted, after ] = match;

    return (
        <span className="nw-control-text nw-placeholder-preview">
            { before.length > 0 && <Text bitmapFont="il_regular">{ before }</Text> }
            <span className="nw-placeholder-highlight" style={ { ['--nw-placeholder-color' as string]: color } }>
                <Text bitmapFont="il_regular">{ highlighted }</Text>
            </span>
            { after.length > 0 && <Text bitmapFont="il_regular">{ after }</Text> }
        </span>
    );
}

// ─────────────────────────────────────────────────────────────
//  WiredDisabled — standard disabled (dimmed + unclickable)
//  wrapper for conditional controls.
// ─────────────────────────────────────────────────────────────

export const WiredDisabled: FC<{ disabled: boolean; className?: string; children: ReactNode }> = props =>
{
    const { disabled, className = '', children } = props;

    return (
        <div className={ `nw-disabled-wrap ${ disabled ? 'is-disabled' : '' } ${ className }`.trim() }>
            { children }
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  WiredSubInfo — greyed-but-readable helper text rendered
//  under a checkbox/radio, indented to align with its label.
// ─────────────────────────────────────────────────────────────

export const WiredSubInfo: FC<{ textKey?: string; text?: string; className?: string }> = props =>
{
    const { textKey = null, text = null, className = '' } = props;
    const resolved = (textKey ? LocalizeText(textKey) : text) ?? '';
    const lines = resolved.replace(/\\n/g, '\n').split('\n');

    return (
        <div className={ `nw-sub-info ${ className }` }>
            { lines.map((line, index) => <Text key={ index } bitmapFont="il_regular">{ line }</Text>) }
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  WiredVariableTypeSelector — furni / user / global / context
//  icon row used by every "From Variable" flow.
// ─────────────────────────────────────────────────────────────

const WIRED_VARIABLE_TYPE_OPTIONS = [
    { type: WIRED_VARIABLE_FURNI, icon: WiredIcon.variableFurni, key: 'furni' },
    { type: WIRED_VARIABLE_USER, icon: WiredIcon.variableUser, key: 'user' },
    { type: WIRED_VARIABLE_GLOBAL, icon: WiredIcon.variableGlobal, key: 'global' },
    { type: WIRED_VARIABLE_CONTEXT, icon: WiredIcon.variableContext, key: 'context' }
];

export const WiredVariableTypeSelector: FC<{
    value: number;
    onChange: (value: number) => void;
    /** Types a specific box doesn't support (all 4 enabled by default). */
    disabledTypes?: number[];
    /** Types a specific box should not show at all. */
    hiddenTypes?: number[];
}> = props =>
{
    const { value, onChange, disabledTypes = [], hiddenTypes = [] } = props;

    return (
        <div className="nw-variable-type-pill">
            { WIRED_VARIABLE_TYPE_OPTIONS.filter(option => !hiddenTypes.includes(option.type)).map(option =>
            {
                const isDisabled = disabledTypes.includes(option.type);

                return (
                    <button
                        key={ option.type }
                        type="button"
                        className={ `nw-variable-type-btn nw-vt-${ option.key } ${ value === option.type ? 'is-selected' : '' }` }
                        disabled={ isDisabled }
                        onClick={ () => !isDisabled && onChange(option.type) }>
                        <img alt="" src={ wiredIconUrl(option.icon) } />
                    </button>
                );
            }) }
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  WiredVariablePicker — type icon row + variable name dropdown.
//  Switching type resets the selected name and re-normalizes
//  the source so every box behaves identically.
// ─────────────────────────────────────────────────────────────

export interface WiredVariableLists
{
    global?: string[];
    furni?: string[];
    user?: string[];
    context?: string[];
}

export type WiredSubVariableLists = Record<string, string[]>;

export interface WiredVariableOptionNode
{
    value: string;
    label: string;
    children: WiredVariableOptionNode[];
}

export const wiredVariablesForType = (variableType: number, variables: WiredVariableLists) =>
    (variableType === WIRED_VARIABLE_FURNI)
        ? (variables.furni ?? [])
        : (variableType === WIRED_VARIABLE_USER)
            ? (variables.user ?? [])
            : (variableType === WIRED_VARIABLE_CONTEXT)
                ? (variables.context ?? [])
                : (variables.global ?? []);

export interface WiredVariablePickerProps
{
    variableType: number;
    onVariableTypeChange: (type: number) => void;
    variableName: string;
    onVariableNameChange: (name: string) => void;
    variables: WiredVariableLists;
    variableSource?: number;
    onVariableSourceChange?: (source: number) => void;
    /** Variable types this box doesn't support (all enabled by default). */
    disabledTypes?: number[];
    /** Variable types this box should hide completely. */
    hiddenTypes?: number[];
    includeClickedAvatarSource?: boolean;
    subVariables?: WiredSubVariableLists;
    titleKey?: string;
    title?: ReactNode;
}

const wiredVariableLabel = (name: string, isRoot = false) =>
{
    if(isRoot) return name;

    const index = name.lastIndexOf('.');
    return index === -1 ? name : name.slice(index + 1);
};

export const wiredBuildVariableTree = (options: string[] = [], subVariables: WiredSubVariableLists = {}): WiredVariableOptionNode[] =>
{
    const nodes = new Map<string, WiredVariableOptionNode>();
    const roots: WiredVariableOptionNode[] = [];

    const ensureNode = (value: string, isRoot = false) =>
    {
        let node = nodes.get(value);

        if(!node)
        {
            node = { value, label: wiredVariableLabel(value, isRoot), children: [] };
            nodes.set(value, node);
        }

        return node;
    };

    const addChild = (parent: WiredVariableOptionNode, child: WiredVariableOptionNode) =>
    {
        if(!parent.children.some(node => node.value === child.value)) parent.children.push(child);
    };

    const addRoot = (node: WiredVariableOptionNode) =>
    {
        if(!roots.some(root => root.value === node.value)) roots.push(node);
    };

    const addPath = (name: string) =>
    {
        if(!name) return;

        const parts = name.split('.');
        let current = parts[0];
        let parent = ensureNode(current, true);

        addRoot(parent);

        for(let index = 1; index < parts.length; index++)
        {
            current = `${ current }.${ parts[index] }`;
            const child = ensureNode(current);

            addChild(parent, child);
            parent = child;
        }
    };

    const addSubVariables = (parentName: string, seen: Set<string>) =>
    {
        if(seen.has(parentName)) return;

        seen.add(parentName);

        const children = subVariables[parentName] ?? [];

        children.forEach(child =>
        {
            addPath(child);
            addSubVariables(child, seen);
        });
    };

    options.forEach(option =>
    {
        addPath(option);
        addSubVariables(option, new Set());
    });

    return roots;
};

const wiredFindVariableNode = (name: string, nodes: WiredVariableOptionNode[]): WiredVariableOptionNode | null =>
{
    for(const node of nodes)
    {
        if(node.value === name) return node;

        const child = wiredFindVariableNode(name, node.children);
        if(child) return child;
    }

    return null;
};

export const wiredVariableExists = (name: string, options: string[] = [], subVariables: WiredSubVariableLists = {}) =>
    !!wiredFindVariableNode(name, wiredBuildVariableTree(options, subVariables));

export const wiredVariableHasChildren = (name: string, options: string[] = [], subVariables: WiredSubVariableLists = {}) =>
    (wiredFindVariableNode(name, wiredBuildVariableTree(options, subVariables))?.children.length ?? 0) > 0;

export const wiredVariableIsSelectable = (name: string, options: string[] = [], subVariables: WiredSubVariableLists = {}) =>
    !!name && wiredVariableExists(name, options, subVariables) && !wiredVariableHasChildren(name, options, subVariables);

const WiredNestedVariableOption: FC<{
    node: WiredVariableOptionNode;
    variableName: string;
    onSelect: (name: string) => void;
}> = props =>
{
    const { node, variableName, onSelect } = props;
    const hasChildren = node.children.length > 0;

    return (
        <div className="nw-echo-option-wrap">
            <button
                type="button"
                role="option"
                aria-disabled={ hasChildren }
                className={ `nw-select-option nw-echo-select-option ${ variableName === node.value ? 'is-selected' : '' } ${ hasChildren ? 'has-children' : '' }` }
                onMouseDown={ event => event.preventDefault() }
                onClick={ () =>
                {
                    if(!hasChildren) onSelect(node.value);
                } }>
                <Text bitmapFont="button_regular">{ node.label }</Text>
                { hasChildren && <img className="nw-echo-sub-chevron" alt="" src={ wiredIconUrl(WiredIcon.subvariableChevron) } /> }
            </button>
            { hasChildren &&
                <div className="nw-select-list nw-echo-select-list nw-echo-sub-list">
                    { node.children.map(child =>
                        <WiredNestedVariableOption
                            key={ child.value }
                            node={ child }
                            variableName={ variableName }
                            onSelect={ onSelect } />) }
                </div> }
        </div>
    );
};

export const WiredVariableNameSelect: FC<{
    variableType: number;
    variableName: string;
    onVariableNameChange: (name: string) => void;
    variables: WiredVariableLists;
    subVariables?: WiredSubVariableLists;
    disabled?: boolean;
}> = props =>
{
    const { variableType, variableName, onVariableNameChange, variables, subVariables = {}, disabled = false } = props;
    const nodes = useMemo(() => wiredBuildVariableTree(wiredVariablesForType(variableType, variables), subVariables), [ variableType, variables, subVariables ]);
    const [ open, setOpen ] = useState(false);
    const [ listStyle, setListStyle ] = useState<CSSProperties>({});
    const buttonRef = useRef<HTMLButtonElement>(null);
    const selectedLabel = variableName || LocalizeText('wiredfurni.variable_picker.search');

    useEffect(() =>
    {
        if(!open) return;

        const onMouseDown = (event: MouseEvent) =>
        {
            const target = event.target as Element;

            if(buttonRef.current?.closest('.nw-select-wrap')?.contains(target)) return;
            if(target?.closest?.('.nw-echo-select-list')) return;

            setOpen(false);
        };

        document.addEventListener('mousedown', onMouseDown);
        return () => document.removeEventListener('mousedown', onMouseDown);
    }, [ open ]);

    const handleOpen = () =>
    {
        if(disabled) return;

        if(!open && buttonRef.current)
        {
            const rect = buttonRef.current.getBoundingClientRect();

            setListStyle({
                position: 'fixed',
                top: rect.top,
                left: rect.left,
                width: rect.width,
                zIndex: 9999
            });
        }

        setOpen(value => !value);
    };

    const selectVariable = (name: string) =>
    {
        onVariableNameChange(name);
        setOpen(false);
    };

    return (
        <div className={ `nw-select-wrap ${ open ? 'is-open' : '' }` }>
            <button ref={ buttonRef } type="button" className="nw-select" disabled={ disabled } onClick={ handleOpen }>
                <span className="nw-select-value">
                    <Text bitmapFont="button_regular" className={ variableName ? '' : 'nw-select-placeholder-text' }>{ selectedLabel }</Text>
                </span>
            </button>

            { open && createPortal(
                <div className="nw-select-list nw-echo-select-list" role="listbox" style={ listStyle }>
                    <button type="button" role="option" className="nw-select-option" disabled>
                        <Text bitmapFont="button_regular" className="nw-select-placeholder-text">{ LocalizeText('wiredfurni.variable_picker.search') }</Text>
                    </button>
                    { nodes.map(node =>
                        <WiredNestedVariableOption
                            key={ node.value }
                            node={ node }
                            variableName={ variableName }
                            onSelect={ selectVariable } />) }
                </div>,
                document.body
            ) }
        </div>
    );
}

export const wiredVariableTypeChange = (props: WiredVariablePickerProps) => (type: number) =>
{
    props.onVariableTypeChange(type);
    props.onVariableNameChange('');

    if((props.variableSource !== undefined) && props.onVariableSourceChange) props.onVariableSourceChange(normalizeWiredSource(props.variableSource, wiredVariableSourceOptions(type, props.includeClickedAvatarSource)));
}

export const WiredVariablePicker: FC<WiredVariablePickerProps> = props =>
{
    const { variableType, variableName, onVariableNameChange, variables, titleKey = null, title = null } = props;
    const titleNode = titleKey ? LocalizeText(titleKey) : title;

    return (
        <>
            <Flex alignItems="center" justifyContent={ titleNode ? 'between' : undefined } gap={ 1 }>
                { titleNode && <WiredControlTitle>{ titleNode }</WiredControlTitle> }
                <WiredVariableTypeSelector value={ variableType } onChange={ wiredVariableTypeChange(props) } disabledTypes={ props.disabledTypes } hiddenTypes={ props.hiddenTypes } />
            </Flex>
            <WiredVariableNameSelect variableType={ variableType } variableName={ variableName } onVariableNameChange={ onVariableNameChange } variables={ variables } subVariables={ props.subVariables } />
        </>
    );
}

// ─────────────────────────────────────────────────────────────
//  WiredValueOrVariable — the standard "Set value [input] /
//  From variable [picker]" block (animation distance, time per
//  tile, jump strength, ...). One look everywhere.
// ─────────────────────────────────────────────────────────────

export interface WiredValueOrVariableProps extends WiredVariablePickerProps
{
    /** Unique radio group name for this block. */
    radioName: string;
    mode: number; // WIRED_REFERENCE_SET_VALUE | WIRED_REFERENCE_FROM_VARIABLE
    onModeChange: (mode: number) => void;
    value: string;
    onValueChange: (value: string) => void;
    min: number;
    max: number;
}

export const WiredValueOrVariable: FC<WiredValueOrVariableProps> = props =>
{
    const { radioName, mode, onModeChange, value, onValueChange, min, max, ...pickerProps } = props;
    const { variableType, variableName, onVariableNameChange, variables } = pickerProps;
    const variableDisabled = mode !== WIRED_REFERENCE_FROM_VARIABLE;

    return (
        <>
            <Flex alignItems="center" gap={ 1 }>
                <WiredRadio name={ radioName } checked={ mode === WIRED_REFERENCE_SET_VALUE } onChange={ () => onModeChange(WIRED_REFERENCE_SET_VALUE) } label={ LocalizeText('wiredfurni.params.variables.reference_value.set_value') } />
                <WiredTextInput compact type="number" min={ min } max={ max } value={ value } onChange={ event => onValueChange(clampWiredText(event.target.value, min, max)) } />
            </Flex>
            <Flex alignItems="center" justifyContent="between" gap={ 1 }>
                <WiredRadio name={ radioName } checked={ mode === WIRED_REFERENCE_FROM_VARIABLE } onChange={ () => onModeChange(WIRED_REFERENCE_FROM_VARIABLE) } label={ LocalizeText('wiredfurni.params.variables.reference_value.from_variable') } />
                <WiredDisabled disabled={ variableDisabled }>
                    <WiredVariableTypeSelector value={ variableType } onChange={ wiredVariableTypeChange(pickerProps) } disabledTypes={ pickerProps.disabledTypes } hiddenTypes={ pickerProps.hiddenTypes } />
                </WiredDisabled>
            </Flex>
            <WiredDisabled disabled={ variableDisabled } className="nw-indent-1 nw-variable-name-gap">
                <WiredVariableNameSelect variableType={ variableType } variableName={ variableName } onVariableNameChange={ onVariableNameChange } variables={ variables } subVariables={ pickerProps.subVariables } disabled={ variableDisabled } />
            </WiredDisabled>
        </>
    );
}

// ─────────────────────────────────────────────────────────────
//  WiredDelaySlider — the "Delay Effect" baked into every
//  effect. Centralized so all effects share one look.
// ─────────────────────────────────────────────────────────────

export const WiredDelaySlider: FC<{ value: number; onChange: (value: number) => void; label: string; min?: number; max?: number; divider?: boolean }> = props =>
{
    const { value, onChange, label, min = 0, max = 20, divider = true } = props;

    return (
        <WiredParam title={ label } divider={ divider }>
            <WiredSlider min={ min } max={ max } value={ value } onChange={ onChange } />
        </WiredParam>
    );
}
