import { useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredSelectionVisualizer } from '../../../../api';
import {
    normalizeWiredSource,
    wiredVariableIsSelectable,
    wiredVariableSourceOptions,
    WIRED_REFERENCE_FROM_VARIABLE,
    WIRED_REFERENCE_SET_VALUE,
    WIRED_SOURCE_CLICKED_AVATAR,
    WIRED_SOURCE_SECONDARY_SELECTED,
    WIRED_SOURCE_SELECTED,
    WIRED_SOURCE_SELECTOR,
    WIRED_SOURCE_SIGNAL,
    WIRED_SOURCE_TRIGGER,
    WIRED_VARIABLE_CONTEXT,
    WIRED_VARIABLE_FURNI,
    WIRED_VARIABLE_GLOBAL,
    WIRED_VARIABLE_USER,
    WiredOption,
    WiredVariableLists
} from '../WiredControls';
import type { WiredSourcePickerConfig } from '../WiredFurniSelectorView';

export const CHEST_SOURCE_OPTIONS = [ WIRED_SOURCE_TRIGGER, WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL ];
export const CHEST_SOURCE_OPTIONS_WITH_SECONDARY = [ WIRED_SOURCE_TRIGGER, WIRED_SOURCE_SELECTED, WIRED_SOURCE_SECONDARY_SELECTED, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL ];
export const CONTRACT_SOURCE_OPTIONS = CHEST_SOURCE_OPTIONS_WITH_SECONDARY;
export const CONTRACT_SELECTED_SOURCE_OPTIONS = [ WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR ];
export const ITEM_TYPE_SOURCE_OPTIONS = CHEST_SOURCE_OPTIONS_WITH_SECONDARY;
export const USER_SOURCE_OPTIONS = [ WIRED_SOURCE_TRIGGER, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL ];
export const USER_SOURCE_OPTIONS_WITH_CLICKED = [ WIRED_SOURCE_TRIGGER, WIRED_SOURCE_CLICKED_AVATAR, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL ];
export const VALID_VARIABLE_TYPES = [ WIRED_VARIABLE_FURNI, WIRED_VARIABLE_GLOBAL, WIRED_VARIABLE_USER, WIRED_VARIABLE_CONTEXT ];

export const CHEST_REFERENCE_SET_VALUE = WIRED_REFERENCE_SET_VALUE;
export const CHEST_REFERENCE_FROM_VARIABLE = WIRED_REFERENCE_FROM_VARIABLE;

export const CHEST_MODE_AMOUNT = 0;
export const CHEST_MODE_ALL = 1;

export const CHEST_ELEMENT_CREDITS = 0;
export const CHEST_ELEMENT_FURNI = 1;

export const COMPARISON_GREATER_THAN = 0;
export const COMPARISON_GREATER_OR_EQUAL = 1;
export const COMPARISON_EQUAL = 2;
export const COMPARISON_LESS_OR_EQUAL = 3;
export const COMPARISON_LESS_THAN = 4;
export const COMPARISON_NOT_EQUAL = 5;

export const COMPARISON_OPTIONS: WiredOption<number>[] = [
    { value: COMPARISON_GREATER_THAN, label: '>' },
    { value: COMPARISON_GREATER_OR_EQUAL, label: '≥' },
    { value: COMPARISON_EQUAL, label: '=' },
    { value: COMPARISON_LESS_OR_EQUAL, label: '≤' },
    { value: COMPARISON_LESS_THAN, label: '<' },
    { value: COMPARISON_NOT_EQUAL, label: '≠' }
];

export interface ChestVariableData
{
    globalVariables?: string[];
    furniVariables?: string[];
    userVariables?: string[];
    contextVariables?: string[];
    subVariables?: Record<string, string[]>;
    selectedItemIds?: number[];
    secondarySelectedItemIds?: number[];
}

export const clampNumber = (value: number, min: number, max: number) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));

export const intOrDefault = (value: unknown, fallback: number) => (typeof value === 'number' && Number.isFinite(value)) ? value : fallback;

export const normalizeModeAmount = (value: number) => value === CHEST_MODE_ALL ? CHEST_MODE_ALL : CHEST_MODE_AMOUNT;

export const normalizeReferenceMode = (value: number) => value === CHEST_REFERENCE_FROM_VARIABLE ? CHEST_REFERENCE_FROM_VARIABLE : CHEST_REFERENCE_SET_VALUE;

export const normalizeVariableType = (value: number) => VALID_VARIABLE_TYPES.includes(value) ? value : WIRED_VARIABLE_GLOBAL;

export const normalizeFurniSource = (value: number) => normalizeWiredSource(value, CHEST_SOURCE_OPTIONS_WITH_SECONDARY);

export const normalizeUserSource = (value: number) => normalizeWiredSource(value, USER_SOURCE_OPTIONS);

export const isSelectedFurniSource = (source: number) => source === WIRED_SOURCE_SELECTED || source === WIRED_SOURCE_SECONDARY_SELECTED;

export const normalizeComparison = (value: number) =>
    COMPARISON_OPTIONS.some(option => option.value === value) ? value : COMPARISON_EQUAL;

export const variableSourceOptions = (variableType: number) => wiredVariableSourceOptions(variableType, true);

export const normalizeVariableSource = (variableType: number, source: number) =>
    normalizeWiredSource(source, variableSourceOptions(variableType));

export const variableSourceLabelPrefix = (variableType: number) =>
    variableType === WIRED_VARIABLE_FURNI
        ? 'wiredfurni.params.sources.furni'
        : (variableType === WIRED_VARIABLE_USER ? 'wiredfurni.params.sources.users' : 'wiredfurni.params.sources');

export const variablesFromData = (data: ChestVariableData = {}): WiredVariableLists => ({
    global: data.globalVariables ?? [],
    furni: data.furniVariables ?? [],
    user: data.userVariables ?? [],
    context: data.contextVariables ?? []
});

export const variableListForType = (variableType: number, variables: WiredVariableLists) =>
    variableType === WIRED_VARIABLE_FURNI
        ? (variables.furni ?? [])
        : (variableType === WIRED_VARIABLE_USER)
            ? (variables.user ?? [])
            : (variableType === WIRED_VARIABLE_CONTEXT)
                ? (variables.context ?? [])
                : (variables.global ?? []);

export const normalizeVariableName = (variableType: number, variableName: string, variables: WiredVariableLists, subVariables: Record<string, string[]> = {}) =>
    wiredVariableIsSelectable(variableName ?? '', variableListForType(variableType, variables), subVariables) ? variableName : '';

export const selectedSourceLabel = (selectedCount: number, selectionLimit: number) =>
    `${ LocalizeText('wiredfurni.params.sources.furni.100') } [${ selectedCount }/${ selectionLimit }]`;

export const sourceOptionLabels = (selectedCount: number, selectionLimit: number) => ({
    [WIRED_SOURCE_SELECTED]: selectedSourceLabel(selectedCount, selectionLimit),
    [WIRED_SOURCE_SECONDARY_SELECTED]: `${ LocalizeText('wiredfurni.params.sources.furni.101') } [${ selectedCount }/${ selectionLimit }]`,
    [WIRED_VARIABLE_GLOBAL]: LocalizeText('wiredfurni.params.sources.global'),
    [WIRED_VARIABLE_CONTEXT]: LocalizeText('wiredfurni.params.sources.context')
});

export const sourcePickersFor = (source: number, onSelect: (source: number) => void, activeSource = source): WiredSourcePickerConfig[] =>
{
    if(source === WIRED_SOURCE_SELECTED)
    {
        return [ {
            source: WIRED_SOURCE_SELECTED,
            icon: 'wired_furni_picks',
            color: '#7C8039',
            variant: 'selected',
            selected: activeSource === WIRED_SOURCE_SELECTED,
            onClick: () => onSelect(WIRED_SOURCE_SELECTED)
        } ];
    }

    if(source === WIRED_SOURCE_SECONDARY_SELECTED)
    {
        return [ {
            source: WIRED_SOURCE_SECONDARY_SELECTED,
            icon: 'wired_furni_picks2',
            color: '#525892',
            variant: 'secondary',
            selected: activeSource === WIRED_SOURCE_SECONDARY_SELECTED,
            onClick: () => onSelect(WIRED_SOURCE_SECONDARY_SELECTED)
        } ];
    }

    return [];
};

const uniqueFurniIds = (ids: number[]) => [ ...new Set(ids.filter(id => typeof id === 'number')) ];

export const useChestDualFurniSelection = (trigger: any, furniIds: number[] = [], setFurniIds: (ids: number[]) => void = null, data: ChestVariableData = {}) =>
{
    const initialSelectedIds = useMemo(() => uniqueFurniIds((data.selectedItemIds?.length ? data.selectedItemIds : trigger?.selectedItems) ?? []), [ trigger, data ]);
    const initialSecondaryIds = useMemo(() => uniqueFurniIds(data.secondarySelectedItemIds ?? []), [ data ]);
    const [ activePickSource, setActivePickSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ selectedItemIds, setSelectedItemIds ] = useState<number[]>([]);
    const [ secondarySelectedItemIds, setSecondarySelectedItemIds ] = useState<number[]>([]);

    const clearAndApplyFurniSelection = (nextFurniIds: number[], previousFurniIds: number[] = []) =>
    {
        WiredSelectionVisualizer.clearSelectionShaderFromFurni(uniqueFurniIds([ ...selectedItemIds, ...secondarySelectedItemIds, ...previousFurniIds, ...(Array.isArray(furniIds) ? furniIds : []) ]));

        if(nextFurniIds.length) WiredSelectionVisualizer.applySelectionShaderToFurni(nextFurniIds);
        if(setFurniIds) setFurniIds(nextFurniIds);
    };

    useEffect(() =>
    {
        setSelectedItemIds(initialSelectedIds);
        setSecondarySelectedItemIds(initialSecondaryIds);
        setActivePickSource(WIRED_SOURCE_SELECTED);

        WiredSelectionVisualizer.clearSelectionShaderFromFurni(uniqueFurniIds([ ...initialSelectedIds, ...initialSecondaryIds ]));
        if(initialSelectedIds.length) WiredSelectionVisualizer.applySelectionShaderToFurni(initialSelectedIds);
        if(setFurniIds) setFurniIds(initialSelectedIds);
    }, [ trigger, initialSelectedIds, initialSecondaryIds, setFurniIds ]);

    useEffect(() =>
    {
        if(!Array.isArray(furniIds)) return;

        if(activePickSource === WIRED_SOURCE_SECONDARY_SELECTED)
        {
            setSecondarySelectedItemIds(furniIds);
            return;
        }

        setSelectedItemIds(furniIds);
    }, [ furniIds, activePickSource ]);

    const selectPickSource = (source: number) =>
    {
        if(source !== WIRED_SOURCE_SELECTED && source !== WIRED_SOURCE_SECONDARY_SELECTED) return;
        if(activePickSource === source) return;

        let previousFurniIds: number[] = [];

        if(Array.isArray(furniIds))
        {
            previousFurniIds = furniIds;

            if(activePickSource === WIRED_SOURCE_SECONDARY_SELECTED) setSecondarySelectedItemIds(furniIds);
            else setSelectedItemIds(furniIds);
        }

        setActivePickSource(source);
        clearAndApplyFurniSelection(source === WIRED_SOURCE_SECONDARY_SELECTED ? secondarySelectedItemIds : selectedItemIds, previousFurniIds);
    };

    const getSavedSelectedIds = () => activePickSource === WIRED_SOURCE_SELECTED && Array.isArray(furniIds) ? furniIds : selectedItemIds;
    const getSavedSecondaryIds = () => activePickSource === WIRED_SOURCE_SECONDARY_SELECTED && Array.isArray(furniIds) ? furniIds : secondarySelectedItemIds;
    const getOptionLabels = (selectionLimit: number) => ({
        [WIRED_SOURCE_SELECTED]: selectedSourceLabel(getSavedSelectedIds().length, selectionLimit),
        [WIRED_SOURCE_SECONDARY_SELECTED]: `${ LocalizeText('wiredfurni.params.sources.furni.101') } [${ getSavedSecondaryIds().length }/${ selectionLimit }]`,
        [WIRED_VARIABLE_GLOBAL]: LocalizeText('wiredfurni.params.sources.global'),
        [WIRED_VARIABLE_CONTEXT]: LocalizeText('wiredfurni.params.sources.context')
    });

    return {
        activePickSource,
        selectedItemIds,
        secondarySelectedItemIds,
        selectPickSource,
        getSavedSelectedIds,
        getSavedSecondaryIds,
        getOptionLabels
    };
};
