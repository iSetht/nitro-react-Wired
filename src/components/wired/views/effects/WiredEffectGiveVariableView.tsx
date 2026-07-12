import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import {
    normalizeWiredSource,
    parseWiredData,
    WiredCheckbox,
    wiredClickedAvatarSourceAvailableForTrigger,
    WiredControlText,
    WiredDisabled,
    WiredParam,
    WiredTextInput,
    WiredVariableLists,
    WiredVariablePicker,
    wiredVariableSourceOptions,
    WIRED_SOURCE_SELECTED,
    WIRED_SOURCE_TRIGGER,
    WIRED_VARIABLE_CONTEXT,
    WIRED_VARIABLE_FURNI,
    WIRED_VARIABLE_GLOBAL,
    WIRED_VARIABLE_USER
} from '../WiredControls';
import { WiredSourceSelectorConfig } from '../WiredFurniSelectorView';
import { WiredEffectBaseView } from './WiredEffectBaseView';

interface VariableData
{
    variableName?: string;
    initialValue?: number;
    variableType?: number;
    source?: number;
    overrideExisting?: boolean;
    furniVariables?: string[];
    userVariables?: string[];
    contextVariables?: string[];
}

const VALID_VARIABLE_TYPES = [ WIRED_VARIABLE_FURNI, WIRED_VARIABLE_USER, WIRED_VARIABLE_CONTEXT ];

const normalizeVariableType = (value: number) => VALID_VARIABLE_TYPES.includes(value) ? value : WIRED_VARIABLE_USER;

export const WiredEffectGiveVariableView: FC<{}> = props =>
{
    const [ variableType, setVariableType ] = useState(WIRED_VARIABLE_USER);
    const [ variableName, setVariableName ] = useState('');
    const [ source, setSource ] = useState(WIRED_SOURCE_TRIGGER);
    const [ overrideExisting, setOverrideExisting ] = useState(false);
    const [ initialValue, setInitialValue ] = useState('0');
    const { trigger = null, setIntParams = null, setStringParam = null, furniIds = [] } = useWired() as any;

    const data = useMemo(() => parseWiredData<VariableData>(trigger?.stringData ?? ''), [ trigger ]);
    const variables = useMemo<WiredVariableLists>(() => ({
        furni: data.furniVariables ?? [],
        user: data.userVariables ?? [],
        context: data.contextVariables ?? []
    }), [ data ]);

    const selectedCount = Array.isArray(furniIds) ? furniIds.length : 0;
    const selectionLimit = trigger?.maximumItemSelectionCount ?? 20;
    const includeClickedAvatarSource = wiredClickedAvatarSourceAvailableForTrigger(trigger);
    const getSourceOptions = (type: number) => wiredVariableSourceOptions(type, includeClickedAvatarSource);
    const sourceOptions = getSourceOptions(variableType);
    const sourceLabelPrefix = variableType === WIRED_VARIABLE_FURNI
        ? 'wiredfurni.params.sources.furni'
        : (variableType === WIRED_VARIABLE_USER ? 'wiredfurni.params.sources.users' : 'wiredfurni.params.sources');
    const sourceSelectors: WiredSourceSelectorConfig[] = [ {
        value: source,
        onChange: setSource,
        options: sourceOptions,
        titleKey: 'wiredfurni.params.sources.merged.title.variables_destination',
        labelPrefix: sourceLabelPrefix,
        optionLabels: {
            [WIRED_SOURCE_SELECTED]: `${ LocalizeText('wiredfurni.params.sources.furni.100') } [${ selectedCount }/${ selectionLimit }]`,
            [WIRED_VARIABLE_CONTEXT]: LocalizeText('wiredfurni.params.sources.context')
        }
    } ];

    const setNormalizedVariableType = (type: number) =>
    {
        const nextType = normalizeVariableType(type);

        setVariableType(nextType);
        setSource(current => normalizeWiredSource(current, getSourceOptions(nextType)));
    };

    const save = () =>
    {
        setStringParam(JSON.stringify({
            variableName,
            initialValue: Number(initialValue || 0)
        }));
        setIntParams([
            variableType,
            source,
            overrideExisting ? 1 : 0
        ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];
        const savedType = normalizeVariableType(intData[0] ?? data.variableType ?? WIRED_VARIABLE_USER);
        const savedSource = normalizeWiredSource(intData[1] ?? data.source ?? savedType, getSourceOptions(savedType));
        const savedName = data.variableName ?? '';
        const savedVariables = savedType === WIRED_VARIABLE_FURNI
            ? (variables.furni ?? [])
            : (savedType === WIRED_VARIABLE_CONTEXT ? (variables.context ?? []) : (variables.user ?? []));

        setVariableType(savedType);
        setSource(savedSource);
        setOverrideExisting((intData[2] ?? (data.overrideExisting ? 1 : 0)) === 1);
        setVariableName(savedVariables.includes(savedName) ? savedName : '');
        setInitialValue(String(data.initialValue ?? 0));
    }, [ trigger, data, variables ]);

    return (
        <WiredEffectBaseView
            requiresFurni={ variableType === WIRED_VARIABLE_FURNI ? WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT : WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            hideFurniSelector={ variableType === WIRED_VARIABLE_FURNI }
            sourceSelectors={ sourceSelectors }
            alwaysExpandedSources={ true }>
            <WiredParam>
                <WiredVariablePicker
                    titleKey="wiredfurni.params.variables.variable_selection"
                    variableType={ variableType }
                    onVariableTypeChange={ setNormalizedVariableType }
                    variableName={ variableName }
                    onVariableNameChange={ setVariableName }
                    variables={ variables }
                    variableSource={ source }
                    onVariableSourceChange={ setSource }
                    includeClickedAvatarSource={ includeClickedAvatarSource }
                    hiddenTypes={ [ WIRED_VARIABLE_GLOBAL ] } />
                <WiredCheckbox
                    checked={ overrideExisting }
                    onChange={ setOverrideExisting }
                    label={ LocalizeText('wiredfurni.params.variables.value_settings.override_existing') } />
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.variables.value_settings" divider={ false }>
                <WiredDisabled disabled={ !overrideExisting }>
                    <Flex className="nw-inline-input-row" alignItems="center" gap={ 1 }>
                        <WiredControlText>{ LocalizeText('wiredfurni.params.variables.value_settings.initial_value') }</WiredControlText>
                        <WiredTextInput
                            compact
                            type="text"
                            inputMode="numeric"
                            pattern="-?[0-9]*"
                            value={ initialValue }
                            onChange={ event => setInitialValue(event.target.value.replace(/[^0-9-]/g, '')) } />
                    </Flex>
                </WiredDisabled>
            </WiredParam>
        </WiredEffectBaseView>
    );
}
