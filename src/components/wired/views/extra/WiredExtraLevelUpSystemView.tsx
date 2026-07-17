import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Column, Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredBaseView } from '../WiredBaseView';
import { clampWiredValue, parseWiredData, WiredButtonInfoText, WiredCheckbox, WiredParam, WiredRadio, WiredTextarea, WiredTextInput } from '../WiredControls';

const MODE_MANUAL = 0;
const MODE_LINEAR = 1;
const MODE_EXPONENTIAL = 2;
const DEFAULT_STEP_SIZE = 100;
const DEFAULT_BASE_XP = 100;
const DEFAULT_INCREASE_FACTOR = 20;
const DEFAULT_MAX_LEVEL = 50;
const MAX_LEVEL = 1000;
const MAX_MANUAL_LINES = 1000;
const MAX_MANUAL_CHARACTERS = 5000;

const SUBVARIABLES = [
    [ 'wiredfurni.params.levelup.subvariable.0', 'current_level' ],
    [ 'wiredfurni.params.levelup.subvariable.1', 'current_xp' ],
    [ 'wiredfurni.params.levelup.subvariable.2', 'progress' ],
    [ 'wiredfurni.params.levelup.subvariable.3', 'progress_percentage' ],
    [ 'wiredfurni.params.levelup.subvariable.4', 'xp_required' ],
    [ 'wiredfurni.params.levelup.subvariable.5', 'xp_remaining' ],
    [ 'wiredfurni.params.levelup.subvariable.6', 'is_maxed' ],
    [ 'wiredfurni.params.levelup.subvariable.7', 'max_level' ]
] as const;

const PREVIEW_LEVELS = [ 1, 2, 3, 5, 10, 20 ];

interface LevelUpData
{
    mode?: number;
    stepSize?: number;
    maxLevel?: number;
    baseXp?: number;
    increaseFactor?: number;
    subvariableMask?: number;
    manualText?: string;
}

const hasBit = (mask: number, index: number) => ((mask >> index) & 1) === 1;
const toggleBit = (mask: number, index: number, enabled: boolean) => enabled ? (mask | (1 << index)) : (mask & ~(1 << index));
const normalizeMode = (value: number) => value === MODE_MANUAL || value === MODE_EXPONENTIAL ? value : MODE_LINEAR;
const normalizePositive = (value: string, fallback: number) => Math.max(1, Number(value || fallback) || fallback);
const localizeFallback = (key: string, fallback: string) =>
{
    const value = LocalizeText(key);

    return value && value !== key ? value : fallback;
};

const sanitizeManualText = (value: string) =>
{
    const normalized = (value || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/[^\d=\n]/g, '').slice(0, MAX_MANUAL_CHARACTERS);
    const lines = normalized.split('\n');

    return lines.length <= MAX_MANUAL_LINES ? normalized : lines.slice(0, MAX_MANUAL_LINES).join('\n');
};

const parseManualRequirements = (value: string) =>
{
    const requirements = new Map<number, number>();

    sanitizeManualText(value).split('\n').forEach(rawLine =>
    {
        const line = rawLine.trim();
        const separator = line.indexOf('=');

        if(separator <= 0 || separator === line.length - 1) return;

        const level = Number(line.substring(0, separator).trim());
        const xp = Number(line.substring(separator + 1).trim());

        if(Number.isInteger(level) && Number.isFinite(xp) && level >= 1 && level <= MAX_LEVEL && xp >= 0) requirements.set(level, Math.round(xp));
    });

    return [ ...requirements.entries() ].sort(([ left ], [ right ]) => left - right);
};

const xpForLevel = (level: number, mode: number, stepSize: number, baseXp: number, increaseFactor: number, manualText: string) =>
{
    const normalizedLevel = Math.max(1, Math.round(level));

    if(mode === MODE_MANUAL)
    {
        let previous = 0;

        for(const [ manualLevel, xp ] of parseManualRequirements(manualText))
        {
            if(manualLevel > normalizedLevel) break;

            previous = xp;
        }

        return previous;
    }

    if(mode === MODE_EXPONENTIAL)
    {
        let total = 0;
        let increment = baseXp;

        for(let current = 2; current <= normalizedLevel; current++)
        {
            total += Math.round(increment);
            increment *= 1 + (increaseFactor / 100);
        }

        return total;
    }

    return (normalizedLevel - 1) * stepSize;
};

const previewText = (level: number, xp: number) =>
{
    const localized = LocalizeText('wiredfurni.params.levelup.preview.entry', [ 'lvl', 'xp' ], [ String(level), String(xp) ]);

    return localized && localized !== 'wiredfurni.params.levelup.preview.entry'
        ? localized
        : `Level: ${ level } - XP: ${ xp }`;
};

const NumberBubble: FC<{ value: string; onChange: (value: string) => void; min?: number; max?: number; disabled?: boolean }> = props =>
{
    const { value, onChange, min = 1, max = 1000000000, disabled = false } = props;

    return (
        <WiredTextInput
            type="number"
            min={ min }
            max={ max }
            value={ value }
            disabled={ disabled }
            bitmapAlign="center"
            className="nw-levelup-input"
            onChange={ event => onChange(event.target.value.replace(/[^0-9]/g, '')) } />
    );
};

const SettingRow: FC<{ titleKey: string; fallback: string; value: string; onChange: (value: string) => void; disabled?: boolean }> = props =>
{
    const { titleKey, fallback, value, onChange, disabled = false } = props;

    return (
        <Flex className="nw-indent-1 nw-levelup-setting-row" alignItems="center" gap={ 1 }>
            <WiredButtonInfoText>{ localizeFallback(titleKey, fallback) }</WiredButtonInfoText>
            <NumberBubble value={ value } onChange={ onChange } disabled={ disabled } />
        </Flex>
    );
};

export const WiredExtraLevelUpSystemView: FC<{}> = props =>
{
    const [ mode, setMode ] = useState(MODE_LINEAR);
    const [ stepSize, setStepSize ] = useState(String(DEFAULT_STEP_SIZE));
    const [ maxLevel, setMaxLevel ] = useState(String(DEFAULT_MAX_LEVEL));
    const [ baseXp, setBaseXp ] = useState(String(DEFAULT_BASE_XP));
    const [ increaseFactor, setIncreaseFactor ] = useState(String(DEFAULT_INCREASE_FACTOR));
    const [ subvariableMask, setSubvariableMask ] = useState(0);
    const [ manualText, setManualText ] = useState('');
    const [ modeExpanded, setModeExpanded ] = useState(true);
    const [ previewExpanded, setPreviewExpanded ] = useState(true);
    const [ subvariablesExpanded, setSubvariablesExpanded ] = useState(true);
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired() as any;

    const data = useMemo(() => parseWiredData<LevelUpData>(trigger?.stringData ?? ''), [ trigger ]);
    const preview = useMemo(() =>
    {
        const normalizedMode = normalizeMode(mode);
        const normalizedStep = normalizePositive(stepSize, DEFAULT_STEP_SIZE);
        const normalizedBaseXp = normalizePositive(baseXp, DEFAULT_BASE_XP);
        const normalizedIncreaseFactor = clampWiredValue(Number(increaseFactor || 0) || 0, 0, 10000);

        return PREVIEW_LEVELS.map(level => ({
            level,
            xp: xpForLevel(level, normalizedMode, normalizedStep, normalizedBaseXp, normalizedIncreaseFactor, manualText)
        }));
    }, [ mode, stepSize, baseXp, increaseFactor, manualText ]);

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];

        setMode(normalizeMode(intData[0] ?? data.mode ?? MODE_LINEAR));
        setStepSize(String(intData[1] ?? data.stepSize ?? DEFAULT_STEP_SIZE));
        setMaxLevel(String(intData[2] ?? data.maxLevel ?? DEFAULT_MAX_LEVEL));
        setBaseXp(String(intData[3] ?? data.baseXp ?? DEFAULT_BASE_XP));
        setIncreaseFactor(String(intData[4] ?? data.increaseFactor ?? DEFAULT_INCREASE_FACTOR));
        setSubvariableMask(intData[5] ?? data.subvariableMask ?? 0);
        setManualText(sanitizeManualText(data.manualText ?? ''));
    }, [ trigger, data ]);

    const save = () =>
    {
        const normalizedMode = normalizeMode(mode);
        const normalizedStep = normalizePositive(stepSize, DEFAULT_STEP_SIZE);
        const normalizedMaxLevel = clampWiredValue(normalizePositive(maxLevel, DEFAULT_MAX_LEVEL), 1, MAX_LEVEL);
        const normalizedBaseXp = normalizePositive(baseXp, DEFAULT_BASE_XP);
        const normalizedIncreaseFactor = clampWiredValue(Number(increaseFactor || 0) || 0, 0, 10000);
        const normalizedManualText = sanitizeManualText(manualText);

        setIntParams([ normalizedMode, normalizedStep, normalizedMaxLevel, normalizedBaseXp, normalizedIncreaseFactor, subvariableMask ]);
        setStringParam(JSON.stringify({
            mode: normalizedMode,
            stepSize: normalizedStep,
            maxLevel: normalizedMaxLevel,
            baseXp: normalizedBaseXp,
            increaseFactor: normalizedIncreaseFactor,
            subvariableMask,
            manualText: normalizedManualText
        }));
    };

    return (
        <WiredBaseView
            wiredType="extra"
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }>
            <WiredParam chevron titleKey="wiredfurni.params.levelup.mode" expanded={ modeExpanded } onToggle={ () => setModeExpanded(value => !value) }>
                <Column gap={ 1 }>
                    <WiredRadio name="level-up-mode" checked={ mode === MODE_LINEAR } onChange={ () => setMode(MODE_LINEAR) } label={ localizeFallback('wiredfurni.params.levelup.mode.1', 'Linear') } />
                    <SettingRow titleKey="wiredfurni.params.levelup.step_size" fallback="Step size:" value={ stepSize } onChange={ setStepSize } disabled={ mode !== MODE_LINEAR } />
                    <SettingRow titleKey="wiredfurni.params.levelup.max_level" fallback="Max level:" value={ maxLevel } onChange={ setMaxLevel } disabled={ mode !== MODE_LINEAR } />

                    <WiredRadio name="level-up-mode" checked={ mode === MODE_EXPONENTIAL } onChange={ () => setMode(MODE_EXPONENTIAL) } label={ localizeFallback('wiredfurni.params.levelup.mode.2', 'Exponential') } />
                    <SettingRow titleKey="wiredfurni.params.levelup.first_level_xp" fallback="Base XP:" value={ baseXp } onChange={ setBaseXp } disabled={ mode !== MODE_EXPONENTIAL } />
                    <SettingRow titleKey="wiredfurni.params.levelup.increase_factor" fallback="Increase factor (%):" value={ increaseFactor } onChange={ setIncreaseFactor } disabled={ mode !== MODE_EXPONENTIAL } />
                    <SettingRow titleKey="wiredfurni.params.levelup.max_level" fallback="Max level:" value={ maxLevel } onChange={ setMaxLevel } disabled={ mode !== MODE_EXPONENTIAL } />

                    <WiredRadio name="level-up-mode" checked={ mode === MODE_MANUAL } onChange={ () => setMode(MODE_MANUAL) } label={ localizeFallback('wiredfurni.params.levelup.mode.0', 'Manual') } />
                    <div className="nw-indent-1 nw-textarea-placeholder-wrap nw-levelup-manual-wrap">
                        <WiredTextarea
                            className="nw-selector-names-input nw-levelup-manual-input"
                            disabled={ mode !== MODE_MANUAL }
                            maxLength={ MAX_MANUAL_CHARACTERS }
                            value={ manualText }
                            onChange={ event => setManualText(sanitizeManualText(event.target.value)) } />
                        { !manualText && <div className="nw-textarea-placeholder">
                            { localizeFallback('wiredfurni.params.levelup.interpolation_placeholder', '1=500\\n2=1200\\n5=15959').replace(/\\n/g, '\n').split('\n').map((line, index, lines) =>
                                <span key={ index }>{ line }{ index < lines.length - 1 && <br /> }</span>) }
                        </div> }
                    </div>
                </Column>
            </WiredParam>

            <WiredParam chevron titleKey="wiredfurni.params.levelup.preview" expanded={ previewExpanded } onToggle={ () => setPreviewExpanded(value => !value) }>
                <Column gap={ 1 }>
                    { preview.map(entry => <WiredButtonInfoText key={ entry.level }>{ previewText(entry.level, entry.xp) }</WiredButtonInfoText>) }
                </Column>
            </WiredParam>

            <WiredParam chevron titleKey="wiredfurni.params.create_subvariables" expanded={ subvariablesExpanded } onToggle={ () => setSubvariablesExpanded(value => !value) } divider={ false }>
                <Column gap={ 1 }>
                    { SUBVARIABLES.map(([ labelKey, name ], index) => <Flex key={ name } className="nw-time-util-row" alignItems="center" gap={ 1 }>
                        <WiredCheckbox
                            className="nw-time-util-choice"
                            checked={ hasBit(subvariableMask, index) }
                            onChange={ checked => setSubvariableMask(value => toggleBit(value, index, checked)) }
                            label={ localizeFallback(labelKey, name) } />
                        <WiredTextInput
                            className="nw-time-util-input"
                            readOnly
                            disabled={ !hasBit(subvariableMask, index) }
                            value={ name } />
                    </Flex>) }
                </Column>
            </WiredParam>
        </WiredBaseView>
    );
};
