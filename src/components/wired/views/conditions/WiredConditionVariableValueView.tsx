import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredSourceSelectorConfig } from '../WiredFurniSelectorView';
import {
    normalizeWiredSource,
    parseWiredData,
    wiredClickedAvatarSourceAvailableForTrigger,
    WIRED_REFERENCE_FROM_VARIABLE,
    WIRED_REFERENCE_SET_VALUE,
    WIRED_SOURCE_SELECTED,
    WiredParam,
    WiredRadioGroup,
    WiredValueOrVariable,
    WiredVariableLists,
    WiredVariablePicker,
    wiredVariableExists,
    wiredVariableSourceOptions,
    WIRED_VARIABLE_CONTEXT,
    WIRED_VARIABLE_FURNI,
    WIRED_VARIABLE_GLOBAL,
    WIRED_VARIABLE_USER
} from '../WiredControls';
import { WiredConditionBaseView } from './WiredConditionBaseView';
import { WIRED_CONDITION_QUANTIFIER_ALL as QUANTIFIER_ALL, WIRED_CONDITION_QUANTIFIER_ANY as QUANTIFIER_ANY, WiredConditionQuantifierSection } from './WiredConditionUtils';

const COMPARISON_GREATER_THAN = 0;
const COMPARISON_GREATER_OR_EQUAL = 1;
const COMPARISON_EQUAL = 2;
const COMPARISON_LESS_OR_EQUAL = 3;
const COMPARISON_LESS_THAN = 4;
const COMPARISON_NOT_EQUAL = 5;
const COMPARISON_OPTIONS = [
    { value: COMPARISON_GREATER_THAN, label: '>' },
    { value: COMPARISON_GREATER_OR_EQUAL, label: '≥' },
    { value: COMPARISON_EQUAL, label: '=' },
    { value: COMPARISON_LESS_OR_EQUAL, label: '≤' },
    { value: COMPARISON_LESS_THAN, label: '<' },
    { value: COMPARISON_NOT_EQUAL, label: '≠' }
];
const VALID_VARIABLE_TYPES = [ WIRED_VARIABLE_FURNI, WIRED_VARIABLE_GLOBAL, WIRED_VARIABLE_USER, WIRED_VARIABLE_CONTEXT ];

interface VariableConditionData
{
    targetVariable?: string;
    referenceVariable?: string;
    referenceValue?: number;
    globalVariables?: string[];
    furniVariables?: string[];
    userVariables?: string[];
    contextVariables?: string[];
    furniValueVariables?: string[];
    userValueVariables?: string[];
    contextValueVariables?: string[];
    subVariables?: Record<string, string[]>;
    targetVariableType?: number;
    comparison?: number;
    referenceMode?: number;
    referenceVariableType?: number;
    targetSource?: number;
    referenceSource?: number;
    quantifier?: number;
}

const normalizeComparison = (comparison: number) => COMPARISON_OPTIONS.some(option => option.value === comparison) ? comparison : COMPARISON_EQUAL;
const normalizeVariableType = (value: number) => VALID_VARIABLE_TYPES.includes(value) ? value : WIRED_VARIABLE_GLOBAL;
const sourceLabelPrefix = (variableType: number) => variableType === WIRED_VARIABLE_FURNI
    ? 'wiredfurni.params.sources.furni'
    : (variableType === WIRED_VARIABLE_USER ? 'wiredfurni.params.sources.users' : 'wiredfurni.params.sources');

export const WiredConditionVariableValueView: FC<{}> = () =>
{
    const [ targetVariableType, setTargetVariableType ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ targetVariable, setTargetVariable ] = useState('');
    const [ comparison, setComparison ] = useState(COMPARISON_EQUAL);
    const [ referenceMode, setReferenceMode ] = useState(WIRED_REFERENCE_SET_VALUE);
    const [ referenceValue, setReferenceValue ] = useState('0');
    const [ referenceVariableType, setReferenceVariableType ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ referenceVariable, setReferenceVariable ] = useState('');
    const [ targetSource, setTargetSource ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ referenceSource, setReferenceSource ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ quantifier, setQuantifier ] = useState(QUANTIFIER_ALL);
    const { trigger = null, setIntParams = null, setStringParam = null, furniIds = [] } = useWired() as any;

    const data = useMemo(() => parseWiredData<VariableConditionData>(trigger?.stringData ?? ''), [ trigger ]);
    const includeClickedAvatarSource = wiredClickedAvatarSourceAvailableForTrigger(trigger);
    const subVariables = useMemo(() => data.subVariables ?? {}, [ data ]);
    const getSourceOptions = (type: number) => wiredVariableSourceOptions(type, includeClickedAvatarSource);
    const variables = useMemo<WiredVariableLists>(() => ({
        global: data.globalVariables ?? [],
        furni: (data.furniValueVariables ?? []).length ? data.furniValueVariables : (data.furniVariables ?? []),
        user: (data.userValueVariables ?? []).length ? data.userValueVariables : (data.userVariables ?? []),
        context: (data.contextValueVariables ?? []).length ? data.contextValueVariables : (data.contextVariables ?? [])
    }), [ data ]);

    const selectedCount = Array.isArray(furniIds) ? furniIds.length : 0;
    const selectionLimit = trigger?.maximumItemSelectionCount ?? 20;
    const selectedSourceLabel = `${ LocalizeText('wiredfurni.params.sources.furni.100') } [${ selectedCount }/${ selectionLimit }]`;
    const needsFurniSelection = targetVariableType === WIRED_VARIABLE_FURNI || (referenceMode === WIRED_REFERENCE_FROM_VARIABLE && referenceVariableType === WIRED_VARIABLE_FURNI);
    const sourceOptionLabels = {
        [WIRED_SOURCE_SELECTED]: selectedSourceLabel,
        [WIRED_VARIABLE_GLOBAL]: LocalizeText('wiredfurni.params.sources.global'),
        [WIRED_VARIABLE_CONTEXT]: LocalizeText('wiredfurni.params.sources.context')
    };
    const sourceSelectors: WiredSourceSelectorConfig[] = [
        {
            value: targetSource,
            onChange: setTargetSource,
            options: getSourceOptions(targetVariableType),
            titleKey: 'wiredfurni.params.sources.merged.title.variables',
            labelPrefix: sourceLabelPrefix(targetVariableType),
            optionLabels: sourceOptionLabels
        },
        {
            value: referenceSource,
            onChange: setReferenceSource,
            options: getSourceOptions(referenceVariableType),
            titleKey: 'wiredfurni.params.sources.merged.title.variables_reference',
            labelPrefix: sourceLabelPrefix(referenceVariableType),
            optionLabels: sourceOptionLabels,
            disabled: referenceMode !== WIRED_REFERENCE_FROM_VARIABLE
        }
    ];

    const setNormalizedTargetType = (type: number) =>
    {
        const nextType = normalizeVariableType(type);

        setTargetVariableType(nextType);
        setTargetSource(current => normalizeWiredSource(current, getSourceOptions(nextType)));
    };

    const setNormalizedReferenceType = (type: number) =>
    {
        const nextType = normalizeVariableType(type);

        setReferenceVariableType(nextType);
        setReferenceSource(current => normalizeWiredSource(current, getSourceOptions(nextType)));
    };

    const save = () =>
    {
        setStringParam(JSON.stringify({
            targetVariable,
            referenceVariable,
            referenceValue: Number(referenceValue || 0)
        }));
        setIntParams([
            targetVariableType,
            comparison,
            referenceMode,
            referenceVariableType,
            targetSource,
            referenceSource,
            quantifier
        ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];
        const savedTargetVariableType = normalizeVariableType(intData[0] ?? data.targetVariableType ?? WIRED_VARIABLE_GLOBAL);
        const savedReferenceVariableType = normalizeVariableType(intData[3] ?? data.referenceVariableType ?? WIRED_VARIABLE_GLOBAL);
        const savedTargetVariables = savedTargetVariableType === WIRED_VARIABLE_FURNI ? variables.furni : (savedTargetVariableType === WIRED_VARIABLE_USER ? variables.user : (savedTargetVariableType === WIRED_VARIABLE_CONTEXT ? variables.context : variables.global));
        const savedReferenceVariables = savedReferenceVariableType === WIRED_VARIABLE_FURNI ? variables.furni : (savedReferenceVariableType === WIRED_VARIABLE_USER ? variables.user : (savedReferenceVariableType === WIRED_VARIABLE_CONTEXT ? variables.context : variables.global));
        const savedTargetVariable = data.targetVariable ?? '';
        const savedReferenceVariable = data.referenceVariable ?? '';

        setTargetVariableType(savedTargetVariableType);
        setTargetVariable(wiredVariableExists(savedTargetVariable, savedTargetVariables ?? [], subVariables) ? savedTargetVariable : '');
        setComparison(normalizeComparison(intData[1] ?? data.comparison ?? COMPARISON_EQUAL));
        setReferenceMode((intData[2] ?? data.referenceMode ?? WIRED_REFERENCE_SET_VALUE) === WIRED_REFERENCE_FROM_VARIABLE ? WIRED_REFERENCE_FROM_VARIABLE : WIRED_REFERENCE_SET_VALUE);
        setReferenceVariableType(savedReferenceVariableType);
        setReferenceVariable(wiredVariableExists(savedReferenceVariable, savedReferenceVariables ?? [], subVariables) ? savedReferenceVariable : '');
        setReferenceValue(String(data.referenceValue ?? 0));
        setTargetSource(normalizeWiredSource(intData[4] ?? data.targetSource ?? WIRED_VARIABLE_GLOBAL, getSourceOptions(savedTargetVariableType)));
        setReferenceSource(normalizeWiredSource(intData[5] ?? data.referenceSource ?? WIRED_VARIABLE_GLOBAL, getSourceOptions(savedReferenceVariableType)));
        setQuantifier((intData[6] ?? data.quantifier ?? QUANTIFIER_ALL) === QUANTIFIER_ANY ? QUANTIFIER_ANY : QUANTIFIER_ALL);
    }, [ trigger, data, variables, subVariables ]);

    return (
        <WiredConditionBaseView
            requiresFurni={ needsFurniSelection ? WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT : WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            hideFurniSelector={ needsFurniSelection }
            sourceSelectors={ sourceSelectors }
            advancedSlot={ <WiredConditionQuantifierSection kind="variables" name="variableValueQuantifier" value={ quantifier } onChange={ setQuantifier } /> }
            alwaysExpandedSources={ true }
            expanded={ true }>
            <WiredParam>
                <WiredVariablePicker
                    titleKey="wiredfurni.params.variables.variable_selection"
                    variableType={ targetVariableType }
                    onVariableTypeChange={ setNormalizedTargetType }
                    variableName={ targetVariable }
                    onVariableNameChange={ setTargetVariable }
                    variables={ variables }
                    subVariables={ subVariables }
                    variableSource={ targetSource }
                    onVariableSourceChange={ setTargetSource }
                    includeClickedAvatarSource={ includeClickedAvatarSource } />
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.choose_type">
                <WiredRadioGroup
                    inline
                    gap={ 2 }
                    name="variableValueComparison"
                    value={ comparison }
                    onChange={ value => setComparison(Number(value)) }
                    options={ COMPARISON_OPTIONS } />
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.variables.reference_value" divider={ false }>
                <WiredValueOrVariable
                    radioName="variableValueReference"
                    mode={ referenceMode }
                    onModeChange={ setReferenceMode }
                    value={ referenceValue }
                    onValueChange={ setReferenceValue }
                    min={ -999999999 }
                    max={ 999999999 }
                    variableType={ referenceVariableType }
                    onVariableTypeChange={ setNormalizedReferenceType }
                    variableName={ referenceVariable }
                    onVariableNameChange={ setReferenceVariable }
                    variables={ variables }
                    subVariables={ subVariables }
                    variableSource={ referenceSource }
                    onVariableSourceChange={ setReferenceSource }
                    includeClickedAvatarSource={ includeClickedAvatarSource } />
            </WiredParam>
        </WiredConditionBaseView>
    );
}
