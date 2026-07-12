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
    WiredControlTitle,
    WiredParam,
    WiredSelect,
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

const DEFAULT_FILTER_AMOUNT = 10;
const MIN_FILTER_AMOUNT = 1;
const MAX_FILTER_AMOUNT = 1000;
const SORT_OPTIONS = [ 0, 1, 2, 3, 4, 5 ];
const VALID_REFERENCE_TYPES = [ WIRED_VARIABLE_FURNI, WIRED_VARIABLE_GLOBAL, WIRED_VARIABLE_USER, WIRED_VARIABLE_CONTEXT ];

interface VariableHighLowFilterData
{
    targetVariable?: string;
    referenceVariable?: string;
    referenceValue?: number;
    furniVariables?: string[];
    userVariables?: string[];
    globalVariables?: string[];
    contextVariables?: string[];
    sortBy?: number;
    referenceMode?: number;
    referenceVariableType?: number;
    referenceSource?: number;
}

interface WiredSelectorVariableHighLowFilterViewProps
{
    variableType: number;
}

const normalizeSortBy = (sortBy: number) => SORT_OPTIONS.includes(sortBy) ? sortBy : SORT_OPTIONS[0];
const normalizeFilterAmount = (value: number) => Math.max(MIN_FILTER_AMOUNT, Math.min(MAX_FILTER_AMOUNT, Math.floor(value || DEFAULT_FILTER_AMOUNT)));
const normalizeReferenceVariableType = (value: number) => VALID_REFERENCE_TYPES.includes(value) ? value : WIRED_VARIABLE_GLOBAL;
const variablesForType = (variableType: number, variables: WiredVariableLists) => variableType === WIRED_VARIABLE_FURNI
    ? (variables.furni ?? [])
    : (variableType === WIRED_VARIABLE_USER
        ? (variables.user ?? [])
        : (variableType === WIRED_VARIABLE_CONTEXT ? (variables.context ?? []) : (variables.global ?? [])));
const sourceLabelPrefix = (variableType: number) => variableType === WIRED_VARIABLE_FURNI
    ? 'wiredfurni.params.sources.furni'
    : (variableType === WIRED_VARIABLE_USER ? 'wiredfurni.params.sources.users' : 'wiredfurni.params.sources');

export const WiredSelectorVariableHighLowFilterView: FC<WiredSelectorVariableHighLowFilterViewProps> = props =>
{
    const { variableType } = props;
    const [ targetVariable, setTargetVariable ] = useState('');
    const [ sortBy, setSortBy ] = useState(SORT_OPTIONS[0]);
    const [ referenceMode, setReferenceMode ] = useState(WIRED_REFERENCE_SET_VALUE);
    const [ referenceValue, setReferenceValue ] = useState(String(DEFAULT_FILTER_AMOUNT));
    const [ referenceVariableType, setReferenceVariableType ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ referenceVariable, setReferenceVariable ] = useState('');
    const [ referenceSource, setReferenceSource ] = useState(WIRED_VARIABLE_GLOBAL);
    const { trigger = null, setIntParams = null, setStringParam = null, furniIds = [] } = useWired() as any;

    const data = useMemo(() => parseWiredData<VariableHighLowFilterData>(trigger?.stringData ?? ''), [ trigger ]);
    const includeClickedAvatarSource = wiredClickedAvatarSourceAvailableForTrigger(trigger);
    const getSourceOptions = (type: number) => wiredVariableSourceOptions(type, includeClickedAvatarSource);
    const variables = useMemo<WiredVariableLists>(() => ({
        global: data.globalVariables ?? [],
        furni: data.furniVariables ?? [],
        user: data.userVariables ?? [],
        context: data.contextVariables ?? []
    }), [ data ]);

    const targetVariables = variablesForType(variableType, variables);
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
        disabled: referenceMode !== WIRED_REFERENCE_FROM_VARIABLE
    } ];

    const setNormalizedReferenceType = (type: number) =>
    {
        const nextType = normalizeReferenceVariableType(type);

        setReferenceVariableType(nextType);
        setReferenceSource(current => normalizeWiredSource(current, getSourceOptions(nextType)));
    };

    const save = () =>
    {
        setStringParam(JSON.stringify({
            targetVariable,
            referenceVariable,
            referenceValue: normalizeFilterAmount(Number(referenceValue || DEFAULT_FILTER_AMOUNT))
        }));
        setIntParams([
            variableType,
            sortBy,
            referenceMode,
            referenceVariableType,
            referenceSource
        ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];
        const savedReferenceType = normalizeReferenceVariableType(intData[3] ?? data.referenceVariableType ?? WIRED_VARIABLE_GLOBAL);
        const savedTargetVariable = data.targetVariable ?? '';
        const savedReferenceVariable = data.referenceVariable ?? '';

        setTargetVariable(targetVariables.includes(savedTargetVariable) ? savedTargetVariable : '');
        setSortBy(normalizeSortBy(intData[1] ?? data.sortBy ?? SORT_OPTIONS[0]));
        setReferenceMode((intData[2] ?? data.referenceMode ?? WIRED_REFERENCE_SET_VALUE) === WIRED_REFERENCE_FROM_VARIABLE ? WIRED_REFERENCE_FROM_VARIABLE : WIRED_REFERENCE_SET_VALUE);
        setReferenceVariableType(savedReferenceType);
        setReferenceVariable(variablesForType(savedReferenceType, variables).includes(savedReferenceVariable) ? savedReferenceVariable : '');
        setReferenceValue(String(data.referenceValue ?? DEFAULT_FILTER_AMOUNT));
        setReferenceSource(normalizeWiredSource(intData[4] ?? data.referenceSource ?? WIRED_VARIABLE_GLOBAL, getSourceOptions(savedReferenceType)));
    }, [ trigger, data, variables, targetVariables ]);

    return (
        <WiredSelectorBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
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

            <WiredParam titleKey="wiredfurni.params.variables.sort_by">
                <WiredSelect
                    value={ sortBy }
                    onChange={ event => setSortBy(normalizeSortBy(Number(event.target.value))) }
                    options={ SORT_OPTIONS.map(value => ({
                        value,
                        label: LocalizeText(`wiredfurni.params.variables.sort_by.${ value }`)
                    })) } />
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.setfilter" divider={ false }>
                <WiredValueOrVariable
                    radioName="variableHighLowFilterAmount"
                    mode={ referenceMode }
                    onModeChange={ setReferenceMode }
                    value={ referenceValue }
                    onValueChange={ setReferenceValue }
                    min={ MIN_FILTER_AMOUNT }
                    max={ MAX_FILTER_AMOUNT }
                    variableType={ referenceVariableType }
                    onVariableTypeChange={ setNormalizedReferenceType }
                    variableName={ referenceVariable }
                    onVariableNameChange={ setReferenceVariable }
                    variables={ variables }
                    variableSource={ referenceSource }
                    onVariableSourceChange={ setReferenceSource }
                    includeClickedAvatarSource={ includeClickedAvatarSource } />
            </WiredParam>
        </WiredSelectorBaseView>
    );
}
