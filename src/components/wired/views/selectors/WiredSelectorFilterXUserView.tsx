import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredSourceSelectorConfig } from '../WiredFurniSelectorView';
import {
    normalizeWiredSource,
    parseWiredData,
    wiredClickedAvatarSourceAvailableForTrigger,
    wiredVariableSourceOptions,
    WIRED_REFERENCE_FROM_VARIABLE,
    WIRED_REFERENCE_SET_VALUE,
    WIRED_SOURCE_SELECTED,
    WIRED_VARIABLE_CONTEXT,
    WIRED_VARIABLE_FURNI,
    WIRED_VARIABLE_GLOBAL,
    WIRED_VARIABLE_USER,
    WiredParam,
    WiredValueOrVariable,
    WiredVariableLists
} from '../WiredControls';
import { WiredSelectorBaseView } from './WiredSelectorBaseView';

const DEFAULT_FILTER_AMOUNT = 10;
const MIN_FILTER_AMOUNT = 1;
const MAX_FILTER_AMOUNT = 1000;
const VALID_VARIABLE_TYPES = [ WIRED_VARIABLE_FURNI, WIRED_VARIABLE_GLOBAL, WIRED_VARIABLE_USER, WIRED_VARIABLE_CONTEXT ];

const normalizeFilterAmount = (value: number) => Math.max(MIN_FILTER_AMOUNT, Math.min(MAX_FILTER_AMOUNT, Math.floor(value || DEFAULT_FILTER_AMOUNT)));
const normalizeVariableType = (value: number) => VALID_VARIABLE_TYPES.includes(value) ? value : WIRED_VARIABLE_GLOBAL;
const sourceLabelPrefix = (variableType: number) => variableType === WIRED_VARIABLE_FURNI
    ? 'wiredfurni.params.sources.furni'
    : (variableType === WIRED_VARIABLE_USER ? 'wiredfurni.params.sources.users' : 'wiredfurni.params.sources');

interface FilterReferenceData
{
    referenceVariable?: string;
    referenceValue?: number;
    globalVariables?: string[];
    furniVariables?: string[];
    userVariables?: string[];
    contextVariables?: string[];
    furniValueVariables?: string[];
    userValueVariables?: string[];
    contextValueVariables?: string[];
    referenceMode?: number;
    referenceVariableType?: number;
    referenceSource?: number;
}

export const WiredSelectorFilterXUserView: FC<{}> = props =>
{
    const [ referenceMode, setReferenceMode ] = useState(WIRED_REFERENCE_SET_VALUE);
    const [ referenceValue, setReferenceValue ] = useState(String(DEFAULT_FILTER_AMOUNT));
    const [ referenceVariableType, setReferenceVariableType ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ referenceVariable, setReferenceVariable ] = useState('');
    const [ referenceSource, setReferenceSource ] = useState(WIRED_VARIABLE_GLOBAL);
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();
    const data = useMemo(() => parseWiredData<FilterReferenceData>(trigger?.stringData ?? ''), [ trigger ]);
    const includeClickedAvatarSource = wiredClickedAvatarSourceAvailableForTrigger(trigger);
    const getSourceOptions = (type: number) => wiredVariableSourceOptions(type, includeClickedAvatarSource);
    const variables = useMemo<WiredVariableLists>(() => ({
        global: data.globalVariables ?? [],
        furni: data.furniValueVariables?.length ? data.furniValueVariables : (data.furniVariables ?? []),
        user: data.userValueVariables?.length ? data.userValueVariables : (data.userVariables ?? []),
        context: data.contextValueVariables?.length ? data.contextValueVariables : (data.contextVariables ?? [])
    }), [ data ]);

    const sourceSelector: WiredSourceSelectorConfig = {
        value: referenceSource,
        onChange: setReferenceSource,
        options: getSourceOptions(referenceVariableType),
        titleKey: 'wiredfurni.params.sources.merged.title.variables_reference',
        labelPrefix: sourceLabelPrefix(referenceVariableType),
        optionLabels: {
            [WIRED_SOURCE_SELECTED]: LocalizeText('wiredfurni.params.sources.furni.100'),
            [WIRED_VARIABLE_GLOBAL]: LocalizeText('wiredfurni.params.sources.global'),
            [WIRED_VARIABLE_CONTEXT]: LocalizeText('wiredfurni.params.sources.context')
        },
        disabled: referenceMode !== WIRED_REFERENCE_FROM_VARIABLE
    };

    const setNormalizedReferenceType = (type: number) =>
    {
        const nextType = normalizeVariableType(type);

        setReferenceVariableType(nextType);
        setReferenceSource(current => normalizeWiredSource(current, getSourceOptions(nextType)));
    };

    const save = () =>
    {
        const normalizedValue = normalizeFilterAmount(Number(referenceValue || DEFAULT_FILTER_AMOUNT));

        setStringParam(JSON.stringify({
            referenceVariable,
            referenceValue: normalizedValue
        }));
        setIntParams([
            normalizedValue,
            referenceMode,
            referenceVariableType,
            referenceSource
        ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];
        const savedReferenceType = normalizeVariableType(intData[2] ?? data.referenceVariableType ?? WIRED_VARIABLE_GLOBAL);
        const savedReferenceVariable = data.referenceVariable ?? '';
        const savedReferenceVariables = savedReferenceType === WIRED_VARIABLE_FURNI
            ? variables.furni
            : (savedReferenceType === WIRED_VARIABLE_USER ? variables.user : (savedReferenceType === WIRED_VARIABLE_CONTEXT ? variables.context : variables.global));

        setReferenceValue(String(data.referenceValue ?? normalizeFilterAmount(intData[0] ?? DEFAULT_FILTER_AMOUNT)));
        setReferenceMode(intData[1] ?? data.referenceMode ?? WIRED_REFERENCE_SET_VALUE);
        setReferenceVariableType(savedReferenceType);
        setReferenceVariable((savedReferenceVariables ?? []).includes(savedReferenceVariable) ? savedReferenceVariable : '');
        setReferenceSource(normalizeWiredSource(intData[3] ?? data.referenceSource ?? WIRED_VARIABLE_GLOBAL, getSourceOptions(savedReferenceType)));
    }, [ trigger, data, variables ]);

    return (
        <WiredSelectorBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ sourceSelector ] }
            alwaysExpandedSources={ true }
            expanded={ true }
        >
            <WiredParam titleKey="wiredfurni.params.setfilter" divider={ false }>
                <WiredValueOrVariable
                    radioName="filterReferenceValue"
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
