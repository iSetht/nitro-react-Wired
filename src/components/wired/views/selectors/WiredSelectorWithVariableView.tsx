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
    WiredCheckbox,
    WiredControlTitle,
    WiredDisabled,
    WiredParam,
    WiredRadioGroup,
    WiredValueOrVariable,
    WiredVariableLists,
    WiredVariableNameSelect,
    wiredVariableSourceOptions,
    WIRED_VARIABLE_CONTEXT,
    WIRED_VARIABLE_FURNI,
    WIRED_VARIABLE_GLOBAL,
    WIRED_VARIABLE_USER
} from '../WiredControls';
import { WiredSelectorBaseView } from './WiredSelectorBaseView';

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
const VALID_REFERENCE_TYPES = [ WIRED_VARIABLE_FURNI, WIRED_VARIABLE_GLOBAL, WIRED_VARIABLE_USER, WIRED_VARIABLE_CONTEXT ];

interface VariableSelectorData
{
    targetVariable?: string;
    referenceVariable?: string;
    referenceValue?: number;
    furniVariables?: string[];
    userVariables?: string[];
    globalVariables?: string[];
    contextVariables?: string[];
    selectByValue?: boolean;
    comparison?: number;
    referenceMode?: number;
    referenceVariableType?: number;
    referenceSource?: number;
}

interface WiredSelectorWithVariableViewProps
{
    variableType: number;
}

const normalizeComparison = (comparison: number) => COMPARISON_OPTIONS.some(option => option.value === comparison) ? comparison : COMPARISON_EQUAL;
const normalizeReferenceVariableType = (value: number) => VALID_REFERENCE_TYPES.includes(value) ? value : WIRED_VARIABLE_GLOBAL;
const variablesForType = (variableType: number, variables: WiredVariableLists) => variableType === WIRED_VARIABLE_FURNI
    ? (variables.furni ?? [])
    : (variableType === WIRED_VARIABLE_USER
        ? (variables.user ?? [])
        : (variableType === WIRED_VARIABLE_CONTEXT ? (variables.context ?? []) : (variables.global ?? [])));
const sourceLabelPrefix = (variableType: number) => variableType === WIRED_VARIABLE_FURNI
    ? 'wiredfurni.params.sources.furni'
    : (variableType === WIRED_VARIABLE_USER ? 'wiredfurni.params.sources.users' : 'wiredfurni.params.sources');

export const WiredSelectorWithVariableView: FC<WiredSelectorWithVariableViewProps> = props =>
{
    const { variableType } = props;
    const [ targetVariable, setTargetVariable ] = useState('');
    const [ selectByValue, setSelectByValue ] = useState(false);
    const [ comparison, setComparison ] = useState(COMPARISON_EQUAL);
    const [ referenceMode, setReferenceMode ] = useState(WIRED_REFERENCE_SET_VALUE);
    const [ referenceValue, setReferenceValue ] = useState('0');
    const [ referenceVariableType, setReferenceVariableType ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ referenceVariable, setReferenceVariable ] = useState('');
    const [ referenceSource, setReferenceSource ] = useState(WIRED_VARIABLE_GLOBAL);
    const { trigger = null, setIntParams = null, setStringParam = null, furniIds = [] } = useWired() as any;

    const data = useMemo(() => parseWiredData<VariableSelectorData>(trigger?.stringData ?? ''), [ trigger ]);
    const includeClickedAvatarSource = wiredClickedAvatarSourceAvailableForTrigger(trigger);
    const getSourceOptions = (type: number) => wiredVariableSourceOptions(type, includeClickedAvatarSource);
    const variables = useMemo<WiredVariableLists>(() => ({
        global: data.globalVariables ?? [],
        furni: data.furniVariables ?? [],
        user: data.userVariables ?? [],
        context: data.contextVariables ?? []
    }), [ data ]);

    const targetVariables = variableType === WIRED_VARIABLE_FURNI ? (variables.furni ?? []) : (variables.user ?? []);
    const selectedCount = Array.isArray(furniIds) ? furniIds.length : 0;
    const selectionLimit = trigger?.maximumItemSelectionCount ?? 20;
    const sourceSelectors: WiredSourceSelectorConfig[] = [ {
        value: referenceSource,
        onChange: setReferenceSource,
        options: getSourceOptions(referenceVariableType),
        titleKey: 'wiredfurni.params.sources.merged.title.variables_reference',
        labelPrefix: sourceLabelPrefix(referenceVariableType),
        optionLabels: {
            [WIRED_SOURCE_SELECTED]: `${ LocalizeText('wiredfurni.params.sources.furni.100') } [${ selectedCount }/${ selectionLimit }]`,
            [WIRED_VARIABLE_GLOBAL]: LocalizeText('wiredfurni.params.sources.global'),
            [WIRED_VARIABLE_CONTEXT]: LocalizeText('wiredfurni.params.sources.context')
        },
        disabled: !selectByValue || referenceMode !== WIRED_REFERENCE_FROM_VARIABLE
    } ];

    const setNormalizedReferenceType = (type: number) =>
    {
        const nextType = normalizeReferenceVariableType(type);

        setReferenceVariableType(nextType);
        setReferenceSource(current => normalizeWiredSource(current, getSourceOptions(nextType)));
    };

    const save = (filterExistingSelection = false, invert = false) =>
    {
        setStringParam(JSON.stringify({
            targetVariable,
            referenceVariable,
            referenceValue: Number(referenceValue || 0)
        }));
        setIntParams([
            variableType,
            selectByValue ? 1 : 0,
            comparison,
            referenceMode,
            referenceVariableType,
            referenceSource,
            filterExistingSelection ? 1 : 0,
            invert ? 1 : 0
        ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];
        const savedReferenceType = normalizeReferenceVariableType(intData[4] ?? data.referenceVariableType ?? WIRED_VARIABLE_GLOBAL);
        const savedTargetVariable = data.targetVariable ?? '';
        const savedReferenceVariable = data.referenceVariable ?? '';

        setTargetVariable(targetVariables.includes(savedTargetVariable) ? savedTargetVariable : '');
        setSelectByValue((intData[1] ?? (data.selectByValue ? 1 : 0)) === 1);
        setComparison(normalizeComparison(intData[2] ?? data.comparison ?? COMPARISON_EQUAL));
        setReferenceMode((intData[3] ?? data.referenceMode ?? WIRED_REFERENCE_SET_VALUE) === WIRED_REFERENCE_FROM_VARIABLE ? WIRED_REFERENCE_FROM_VARIABLE : WIRED_REFERENCE_SET_VALUE);
        setReferenceVariableType(savedReferenceType);
        setReferenceVariable(variablesForType(savedReferenceType, variables).includes(savedReferenceVariable) ? savedReferenceVariable : '');
        setReferenceValue(String(data.referenceValue ?? 0));
        setReferenceSource(normalizeWiredSource(intData[5] ?? data.referenceSource ?? WIRED_VARIABLE_GLOBAL, getSourceOptions(savedReferenceType)));
    }, [ trigger, data, variables, targetVariables ]);

    return (
        <WiredSelectorBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            showSelectorOptions={ true }
            selectorOptionOffset={ 6 }
            sourceSelectors={ sourceSelectors }
            alwaysExpandedSources={ true }>
            <WiredParam>
                <WiredControlTitle>{ LocalizeText('wiredfurni.params.variables.variable_selection') }</WiredControlTitle>
                <WiredVariableNameSelect
                    variableType={ variableType }
                    variableName={ targetVariable }
                    onVariableNameChange={ setTargetVariable }
                    variables={ variables } />
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.choose_type">
                <WiredCheckbox
                    checked={ selectByValue }
                    onChange={ setSelectByValue }
                    label={ LocalizeText('wiredfurni.params.variables.value_settings.select_by_value') } />
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.choose_type">
                <WiredDisabled disabled={ !selectByValue }>
                    <WiredRadioGroup
                        inline
                        gap={ 2 }
                        name="selectorVariableComparison"
                        value={ comparison }
                        onChange={ value => setComparison(Number(value)) }
                        options={ COMPARISON_OPTIONS } />
                </WiredDisabled>
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.variables.reference_value">
                <WiredDisabled disabled={ !selectByValue }>
                    <WiredValueOrVariable
                        radioName="selectorVariableReference"
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
                        variableSource={ referenceSource }
                        onVariableSourceChange={ setReferenceSource }
                        includeClickedAvatarSource={ includeClickedAvatarSource } />
                </WiredDisabled>
            </WiredParam>
        </WiredSelectorBaseView>
    );
}
