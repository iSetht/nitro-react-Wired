import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredSourceSelectorConfig } from '../WiredFurniSelectorView';
import {
    clampWiredText,
    normalizeWiredSource,
    parseWiredData,
    wiredClickedAvatarSourceAvailableForTrigger,
    WIRED_SOURCE_SELECTED,
    WiredControlText,
    WiredParam,
    WiredRadioGroup,
    WiredSelect,
    WiredTextInput,
    WiredVariableLists,
    WiredVariablePicker,
    wiredVariableSourceOptions,
    WIRED_VARIABLE_CONTEXT,
    WIRED_VARIABLE_FURNI,
    WIRED_VARIABLE_GLOBAL,
    WIRED_VARIABLE_USER
} from '../WiredControls';
import { WiredConditionBaseView } from './WiredConditionBaseView';
import { WIRED_CONDITION_QUANTIFIER_ALL as QUANTIFIER_ALL, WIRED_CONDITION_QUANTIFIER_ANY as QUANTIFIER_ANY, WiredConditionQuantifierSection } from './WiredConditionUtils';

const AGE_CREATED = 0;
const AGE_UPDATED = 1;
const COMPARISON_LOWER = 0;
const COMPARISON_HIGHER = 2;
const UNIT_SECONDS = 1;
const VALID_VARIABLE_TYPES = [ WIRED_VARIABLE_FURNI, WIRED_VARIABLE_GLOBAL, WIRED_VARIABLE_USER, WIRED_VARIABLE_CONTEXT ];
const AGE_OPTIONS = [ AGE_CREATED, AGE_UPDATED ];
const COMPARISON_OPTIONS = [ COMPARISON_LOWER, COMPARISON_HIGHER ];
const DURATION_UNITS = [ 0, 1, 2, 3, 4, 5, 6, 7 ];

interface VariableAgeData
{
    variableName?: string;
    duration?: number;
    globalVariables?: string[];
    furniVariables?: string[];
    userVariables?: string[];
    contextVariables?: string[];
    variableType?: number;
    ageType?: number;
    comparison?: number;
    durationUnit?: number;
    source?: number;
    quantifier?: number;
}

const normalizeVariableType = (value: number) => VALID_VARIABLE_TYPES.includes(value) ? value : WIRED_VARIABLE_GLOBAL;
const normalizeAgeType = (value: number) => AGE_OPTIONS.includes(value) ? value : AGE_CREATED;
const normalizeComparison = (value: number) => COMPARISON_OPTIONS.includes(value) ? value : COMPARISON_HIGHER;
const normalizeDurationUnit = (value: number) => DURATION_UNITS.includes(value) ? value : UNIT_SECONDS;
const sourceLabelPrefix = (variableType: number) => variableType === WIRED_VARIABLE_FURNI
    ? 'wiredfurni.params.sources.furni'
    : (variableType === WIRED_VARIABLE_USER ? 'wiredfurni.params.sources.users' : 'wiredfurni.params.sources');

export const WiredConditionVariableAgeView: FC<{}> = () =>
{
    const [ variableType, setVariableType ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ variableName, setVariableName ] = useState('');
    const [ ageType, setAgeType ] = useState(AGE_CREATED);
    const [ comparison, setComparison ] = useState(COMPARISON_HIGHER);
    const [ duration, setDuration ] = useState('0');
    const [ durationUnit, setDurationUnit ] = useState(UNIT_SECONDS);
    const [ source, setSource ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ quantifier, setQuantifier ] = useState(QUANTIFIER_ALL);
    const { trigger = null, setIntParams = null, setStringParam = null, furniIds = [] } = useWired() as any;

    const data = useMemo(() => parseWiredData<VariableAgeData>(trigger?.stringData ?? ''), [ trigger ]);
    const includeClickedAvatarSource = wiredClickedAvatarSourceAvailableForTrigger(trigger);
    const getSourceOptions = (type: number) => wiredVariableSourceOptions(type, includeClickedAvatarSource);
    const variables = useMemo<WiredVariableLists>(() => ({
        global: data.globalVariables ?? [],
        furni: data.furniVariables ?? [],
        user: data.userVariables ?? [],
        context: data.contextVariables ?? []
    }), [ data ]);

    const selectedCount = Array.isArray(furniIds) ? furniIds.length : 0;
    const selectionLimit = trigger?.maximumItemSelectionCount ?? 20;
    const sourceSelector: WiredSourceSelectorConfig = {
        value: source,
        onChange: setSource,
        options: getSourceOptions(variableType),
        titleKey: 'wiredfurni.params.sources.merged.title.variables',
        labelPrefix: sourceLabelPrefix(variableType),
        optionLabels: {
            [WIRED_SOURCE_SELECTED]: `${ LocalizeText('wiredfurni.params.sources.furni.100') } [${ selectedCount }/${ selectionLimit }]`,
            [WIRED_VARIABLE_GLOBAL]: LocalizeText('wiredfurni.params.sources.global'),
            [WIRED_VARIABLE_CONTEXT]: LocalizeText('wiredfurni.params.sources.context')
        }
    };

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
            duration: Number(duration || 0)
        }));
        setIntParams([
            variableType,
            ageType,
            comparison,
            durationUnit,
            source,
            quantifier
        ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];
        const savedVariableType = normalizeVariableType(intData[0] ?? data.variableType ?? WIRED_VARIABLE_GLOBAL);
        const savedVariables = savedVariableType === WIRED_VARIABLE_FURNI ? variables.furni : (savedVariableType === WIRED_VARIABLE_USER ? variables.user : (savedVariableType === WIRED_VARIABLE_CONTEXT ? variables.context : variables.global));
        const savedVariableName = data.variableName ?? '';

        setVariableType(savedVariableType);
        setVariableName((savedVariables ?? []).includes(savedVariableName) ? savedVariableName : '');
        setAgeType(normalizeAgeType(intData[1] ?? data.ageType ?? AGE_CREATED));
        setComparison(normalizeComparison(intData[2] ?? data.comparison ?? COMPARISON_HIGHER));
        setDurationUnit(normalizeDurationUnit(intData[3] ?? data.durationUnit ?? UNIT_SECONDS));
        setSource(normalizeWiredSource(intData[4] ?? data.source ?? WIRED_VARIABLE_GLOBAL, getSourceOptions(savedVariableType)));
        setQuantifier((intData[5] ?? data.quantifier ?? QUANTIFIER_ALL) === QUANTIFIER_ANY ? QUANTIFIER_ANY : QUANTIFIER_ALL);
        setDuration(String(data.duration ?? 0));
    }, [ trigger, data, variables ]);

    return (
        <WiredConditionBaseView
            requiresFurni={ variableType === WIRED_VARIABLE_FURNI ? WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT : WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            hideFurniSelector={ variableType === WIRED_VARIABLE_FURNI }
            sourceSelectors={ [ sourceSelector ] }
            advancedSlot={ <WiredConditionQuantifierSection kind="variables" name="variableAgeQuantifier" value={ quantifier } onChange={ setQuantifier } /> }
            alwaysExpandedSources={ true }
            expanded={ true }>
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
                    includeClickedAvatarSource={ includeClickedAvatarSource } />
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.variables.compare_value">
                <WiredRadioGroup
                    name="variableAgeType"
                    value={ ageType }
                    onChange={ value => setAgeType(Number(value)) }
                    options={ AGE_OPTIONS.map(value => ({ value, labelKey: `wiredfurni.params.variables.compare_value.${ value }` })) } />
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.choose_type">
                <WiredRadioGroup
                    name="variableAgeComparison"
                    value={ comparison }
                    onChange={ value => setComparison(Number(value)) }
                    options={ COMPARISON_OPTIONS.map(value => ({ value, labelKey: `wiredfurni.params.comparison.${ value }` })) } />
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.variables.time_selection" divider={ false }>
                <Flex className="nw-inline-input-row" alignItems="center" gap={ 1 }>
                    <WiredControlText>{ LocalizeText('wiredfurni.params.variables.duration') }</WiredControlText>
                    <WiredTextInput
                        compact
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={ duration }
                        onChange={ event => setDuration(clampWiredText(event.target.value.replace(/[^0-9]/g, ''), 0, 999999999)) } />
                    <WiredSelect
                        style={ { width: 90 } }
                        value={ durationUnit }
                        onChange={ event => setDurationUnit(normalizeDurationUnit(Number(event.target.value))) }
                        options={ DURATION_UNITS.map(value => ({
                            value,
                            label: LocalizeText(`wiredfurni.params.variables.duration.${ value }`)
                        })) } />
                </Flex>
            </WiredParam>
        </WiredConditionBaseView>
    );
}
