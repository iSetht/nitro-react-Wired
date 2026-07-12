import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredSourceSelectorConfig } from '../WiredFurniSelectorView';
import {
    normalizeWiredSource,
    parseWiredData,
    wiredClickedAvatarSourceAvailableForTrigger,
    wiredVariableIsSelectable,
    WIRED_REFERENCE_FROM_VARIABLE,
    WIRED_REFERENCE_SET_VALUE,
    WIRED_SOURCE_SELECTED,
    WiredParam,
    WiredSelect,
    WiredValueOrVariable,
    WiredVariablePicker,
    WiredVariableLists,
    wiredVariableSourceOptions,
    WIRED_VARIABLE_CONTEXT,
    WIRED_VARIABLE_FURNI,
    WIRED_VARIABLE_GLOBAL,
    WIRED_VARIABLE_USER
} from '../WiredControls';
import { WiredEffectBaseView } from './WiredEffectBaseView';

const BASIC_OPERATION_OPTIONS = [ 0, 1, 2, 3, 4, 5, 6 ];
const ADVANCED_OPERATION_OPTIONS = [ 40, 41, 50, 60, 100, 101, 102, 103, 104, 105, 110, 111, 112, 113, 114, 115, 116, 117, 118 ];
const ADVANCED_OPTION = -1;
const OPERATION_OPTIONS = [ ...BASIC_OPERATION_OPTIONS, ...ADVANCED_OPERATION_OPTIONS ];
const VALID_VARIABLE_TYPES = [ WIRED_VARIABLE_FURNI, WIRED_VARIABLE_GLOBAL, WIRED_VARIABLE_USER, WIRED_VARIABLE_CONTEXT ];

interface VariableEffectData
{
    targetVariable?: string;
    referenceVariable?: string;
    referenceValue?: number;
    globalVariables?: string[];
    globalValueVariables?: string[];
    furniVariables?: string[];
    userVariables?: string[];
    furniValueVariables?: string[];
    userValueVariables?: string[];
    contextVariables?: string[];
    contextValueVariables?: string[];
    subVariables?: Record<string, string[]>;
    targetVariableType?: number;
    operation?: number;
    referenceMode?: number;
    referenceVariableType?: number;
    destinationSource?: number;
    referenceSource?: number;
}

const normalizeOperation = (operation: number) => OPERATION_OPTIONS.includes(operation) ? operation : OPERATION_OPTIONS[0];
const normalizeVariableType = (value: number) => VALID_VARIABLE_TYPES.includes(value) ? value : WIRED_VARIABLE_GLOBAL;
const sourceLabelPrefix = (variableType: number) => variableType === WIRED_VARIABLE_FURNI
    ? 'wiredfurni.params.sources.furni'
    : (variableType === WIRED_VARIABLE_USER ? 'wiredfurni.params.sources.users' : 'wiredfurni.params.sources');

export const WiredEffectChangeVariableValueView: FC<{}> = props =>
{
    const [ targetVariableType, setTargetVariableType ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ targetVariable, setTargetVariable ] = useState('');
    const [ operation, setOperation ] = useState(BASIC_OPERATION_OPTIONS[0]);
    const [ showAdvancedOperations, setShowAdvancedOperations ] = useState(false);
    const [ referenceMode, setReferenceMode ] = useState(WIRED_REFERENCE_SET_VALUE);
    const [ referenceValue, setReferenceValue ] = useState('0');
    const [ referenceVariableType, setReferenceVariableType ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ referenceVariable, setReferenceVariable ] = useState('');
    const [ destinationSource, setDestinationSource ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ referenceSource, setReferenceSource ] = useState(WIRED_VARIABLE_GLOBAL);
    const { trigger = null, setIntParams = null, setStringParam = null, furniIds = [] } = useWired() as any;

    const data = useMemo(() => parseWiredData<VariableEffectData>(trigger?.stringData ?? ''), [ trigger ]);
    const globalVariables = useMemo(() => data.globalVariables ?? [], [ data ]);
    const globalValueVariables = useMemo(() => data.globalValueVariables ?? [], [ data ]);
    const furniVariables = useMemo(() => data.furniVariables ?? [], [ data ]);
    const userVariables = useMemo(() => data.userVariables ?? [], [ data ]);
    const contextVariables = useMemo(() => data.contextVariables ?? [], [ data ]);
    const furniValueVariables = useMemo(() => data.furniValueVariables ?? [], [ data ]);
    const userValueVariables = useMemo(() => data.userValueVariables ?? [], [ data ]);
    const contextValueVariables = useMemo(() => data.contextValueVariables ?? [], [ data ]);
    const subVariables = useMemo(() => data.subVariables ?? {}, [ data ]);
    const includeClickedAvatarSource = wiredClickedAvatarSourceAvailableForTrigger(trigger);
    const getSourceOptions = (type: number) => wiredVariableSourceOptions(type, includeClickedAvatarSource);

    const targetVariables = useMemo<WiredVariableLists>(() => ({
        global: globalVariables,
        furni: furniVariables,
        user: userVariables,
        context: contextVariables
    }), [ globalVariables, furniVariables, userVariables, contextVariables ]);
    const referenceVariables = useMemo<WiredVariableLists>(() => ({
        global: globalValueVariables.length ? globalValueVariables : globalVariables,
        furni: furniValueVariables.length ? furniValueVariables : furniVariables,
        user: userValueVariables.length ? userValueVariables : userVariables,
        context: contextValueVariables.length ? contextValueVariables : contextVariables
    }), [ globalVariables, globalValueVariables, furniVariables, userVariables, contextVariables, furniValueVariables, userValueVariables, contextValueVariables ]);

    const selectedCount = Array.isArray(furniIds) ? furniIds.length : 0;
    const selectionLimit = trigger?.maximumItemSelectionCount ?? 20;
    const selectedSourceLabel = `${ LocalizeText('wiredfurni.params.sources.furni.100') } [${ selectedCount }/${ selectionLimit }]`;
    const needsFurniSelection = targetVariableType === WIRED_VARIABLE_FURNI || (referenceMode === WIRED_REFERENCE_FROM_VARIABLE && referenceVariableType === WIRED_VARIABLE_FURNI);
    const commonOptionLabels = {
        [WIRED_SOURCE_SELECTED]: selectedSourceLabel,
        [WIRED_VARIABLE_GLOBAL]: LocalizeText('wiredfurni.params.sources.global'),
        [WIRED_VARIABLE_CONTEXT]: LocalizeText('wiredfurni.params.sources.context')
    };
    const sourceSelectors: WiredSourceSelectorConfig[] = [
        {
            value: destinationSource,
            onChange: setDestinationSource,
            options: getSourceOptions(targetVariableType),
            titleKey: 'wiredfurni.params.sources.merged.title.variables_destination',
            labelPrefix: sourceLabelPrefix(targetVariableType),
            optionLabels: commonOptionLabels
        },
        {
            value: referenceSource,
            onChange: setReferenceSource,
            options: getSourceOptions(referenceVariableType),
            titleKey: 'wiredfurni.params.sources.merged.title.variables_reference',
            labelPrefix: sourceLabelPrefix(referenceVariableType),
            optionLabels: commonOptionLabels,
            disabled: referenceMode !== WIRED_REFERENCE_FROM_VARIABLE
        }
    ];

    const setNormalizedTargetType = (type: number) =>
    {
        const nextType = normalizeVariableType(type);

        setTargetVariableType(nextType);
        setDestinationSource(current => normalizeWiredSource(current, getSourceOptions(nextType)));
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
            operation,
            referenceMode,
            referenceVariableType,
            destinationSource,
            referenceSource
        ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];
        const savedTargetVariableType = normalizeVariableType(intData[0] ?? data.targetVariableType ?? WIRED_VARIABLE_GLOBAL);
        const savedReferenceVariableType = normalizeVariableType(intData[3] ?? data.referenceVariableType ?? WIRED_VARIABLE_GLOBAL);
        const savedTargetVariables = savedTargetVariableType === WIRED_VARIABLE_FURNI ? targetVariables.furni : (savedTargetVariableType === WIRED_VARIABLE_USER ? targetVariables.user : (savedTargetVariableType === WIRED_VARIABLE_CONTEXT ? targetVariables.context : targetVariables.global));
        const savedReferenceVariables = savedReferenceVariableType === WIRED_VARIABLE_FURNI ? referenceVariables.furni : (savedReferenceVariableType === WIRED_VARIABLE_USER ? referenceVariables.user : (savedReferenceVariableType === WIRED_VARIABLE_CONTEXT ? referenceVariables.context : referenceVariables.global));
        const savedTargetVariable = data.targetVariable ?? '';
        const savedReferenceVariable = data.referenceVariable ?? '';

        setTargetVariableType(savedTargetVariableType);
        setTargetVariable(wiredVariableIsSelectable(savedTargetVariable, savedTargetVariables ?? [], subVariables) ? savedTargetVariable : '');
        setOperation(normalizeOperation(intData[1] ?? data.operation ?? OPERATION_OPTIONS[0]));
        setShowAdvancedOperations(ADVANCED_OPERATION_OPTIONS.includes(normalizeOperation(intData[1] ?? data.operation ?? OPERATION_OPTIONS[0])));
        setReferenceMode(intData[2] ?? data.referenceMode ?? WIRED_REFERENCE_SET_VALUE);
        setReferenceVariableType(savedReferenceVariableType);
        setReferenceVariable(wiredVariableIsSelectable(savedReferenceVariable, savedReferenceVariables ?? [], subVariables) ? savedReferenceVariable : '');
        setReferenceValue(String(data.referenceValue ?? 0));
        setDestinationSource(normalizeWiredSource(intData[4] ?? data.destinationSource ?? WIRED_VARIABLE_GLOBAL, getSourceOptions(savedTargetVariableType)));
        setReferenceSource(normalizeWiredSource(intData[5] ?? data.referenceSource ?? WIRED_VARIABLE_GLOBAL, getSourceOptions(savedReferenceVariableType)));
    }, [ trigger, data, targetVariables, referenceVariables, subVariables ]);

    const operationSelectOptions = showAdvancedOperations
        ? OPERATION_OPTIONS
        : [ ...BASIC_OPERATION_OPTIONS, ADVANCED_OPTION ];

    const onOperationChange = (value: number) =>
    {
        if(value === ADVANCED_OPTION)
        {
            setShowAdvancedOperations(true);
            return;
        }

        setOperation(normalizeOperation(value));
    };

    return (
        <WiredEffectBaseView
            requiresFurni={ needsFurniSelection ? WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT : WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            hideFurniSelector={ needsFurniSelection }
            sourceSelectors={ sourceSelectors }
            alwaysExpandedSources={ true }>
            <WiredParam>
                <WiredVariablePicker
                    titleKey="wiredfurni.params.variables.variable_selection"
                    variableType={ targetVariableType }
                    onVariableTypeChange={ setNormalizedTargetType }
                    variableName={ targetVariable }
                    onVariableNameChange={ setTargetVariable }
                    variables={ targetVariables }
                    subVariables={ subVariables } />
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.variables.operation">
                <WiredSelect
                    value={ operation }
                    onChange={ event => onOperationChange(Number(event.target.value)) }
                    options={ operationSelectOptions.map(value => ({
                        value,
                        label: LocalizeText(value === ADVANCED_OPTION ? 'wiredfurni.params.variables.operation.advanced' : `wiredfurni.params.variables.operation.${ value }`)
                    })) } />
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.variables.reference_value" divider={ false }>
                <WiredValueOrVariable
                    radioName="variableReferenceValue"
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
                    variables={ referenceVariables }
                    variableSource={ referenceSource }
                    onVariableSourceChange={ setReferenceSource }
                    subVariables={ subVariables } />
            </WiredParam>
        </WiredEffectBaseView>
    );
}
