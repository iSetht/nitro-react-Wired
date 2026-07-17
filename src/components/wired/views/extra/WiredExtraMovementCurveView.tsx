import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Flex, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredSourceSelectorConfig } from '../WiredFurniSelectorView';
import {
    clampWiredValue,
    normalizeWiredSource,
    parseWiredData,
    WIRED_REFERENCE_FROM_VARIABLE,
    WIRED_REFERENCE_SET_VALUE,
    WIRED_SOURCE_SELECTED,
    WIRED_VARIABLE_CONTEXT,
    WIRED_VARIABLE_FURNI,
    WIRED_VARIABLE_GLOBAL,
    WIRED_VARIABLE_USER,
    WiredParam,
    WiredSelect,
    WiredTextInput,
    WiredValueOrVariable,
    WiredVariableLists,
    wiredVariableSourceOptions
} from '../WiredControls';
import { WiredBaseView } from '../WiredBaseView';

const MIN_CURVE_STRENGTH = -1000;
const MAX_CURVE_STRENGTH = 1000;
const MIN_BOUNCE_COUNT = 1;
const MAX_BOUNCE_COUNT = 20;
const DEFAULT_BOUNCE_COUNT = 4;
const EASING_NONE = 0;
const EASING_EASE_OUT_BOUNCE = 9;
const EASING_EASE_IN_BOUNCE = 11;

const EASING_OPTIONS = [
    { value: EASING_NONE, label: 'Default quadratic' },
    { value: 3, label: 'easeInCubic' },
    { value: 12, label: 'easeOutCubic' },
    { value: 13, label: 'easeInExponential' },
    { value: 4, label: 'easeOutExponential' },
    { value: 14, label: 'easeInBack' },
    { value: 6, label: 'easeOutBack' },
    { value: EASING_EASE_IN_BOUNCE, label: 'easeInBounce' },
    { value: EASING_EASE_OUT_BOUNCE, label: 'easeOutBounce' }
];

const VALID_VARIABLE_TYPES = [ WIRED_VARIABLE_FURNI, WIRED_VARIABLE_GLOBAL, WIRED_VARIABLE_USER, WIRED_VARIABLE_CONTEXT ];

interface MovementCurveData
{
    jumpStrength?: number;
    lateralStrength?: number;
    verticalReferenceVariable?: string;
    lateralReferenceVariable?: string;
    referenceVariable?: string;
    globalVariables?: string[];
    furniVariables?: string[];
    userVariables?: string[];
    contextVariables?: string[];
    verticalReferenceMode?: number;
    lateralReferenceMode?: number;
    referenceMode?: number;
    verticalReferenceVariableType?: number;
    lateralReferenceVariableType?: number;
    referenceVariableType?: number;
    verticalReferenceSource?: number;
    lateralReferenceSource?: number;
    referenceSource?: number;
    easing?: number;
    bounceCount?: number;
}

const normalizeCurveStrength = (value: number) => clampWiredValue(Number.isFinite(value) ? value : 0, MIN_CURVE_STRENGTH, MAX_CURVE_STRENGTH);
const normalizeBounceCount = (value: number) => clampWiredValue(Number.isFinite(value) && value > 0 ? value : DEFAULT_BOUNCE_COUNT, MIN_BOUNCE_COUNT, MAX_BOUNCE_COUNT);
const normalizeReferenceMode = (value: number) => value === WIRED_REFERENCE_FROM_VARIABLE ? WIRED_REFERENCE_FROM_VARIABLE : WIRED_REFERENCE_SET_VALUE;
const normalizeVariableType = (value: number) => VALID_VARIABLE_TYPES.includes(value) ? value : WIRED_VARIABLE_GLOBAL;
const normalizeEasing = (value: number) => EASING_OPTIONS.some(option => option.value === value) ? value : EASING_NONE;
const isBounceEasing = (value: number) => value === EASING_EASE_IN_BOUNCE || value === EASING_EASE_OUT_BOUNCE;
const sourceLabelPrefix = (variableType: number) => variableType === WIRED_VARIABLE_FURNI
    ? 'wiredfurni.params.sources.furni'
    : (variableType === WIRED_VARIABLE_USER ? 'wiredfurni.params.sources.users' : 'wiredfurni.params.sources');

export const WiredExtraMovementCurveView: FC<{}> = props =>
{
    const [ verticalMode, setVerticalMode ] = useState(WIRED_REFERENCE_SET_VALUE);
    const [ verticalValue, setVerticalValue ] = useState('0');
    const [ verticalVariableType, setVerticalVariableType ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ verticalVariable, setVerticalVariable ] = useState('');
    const [ verticalSource, setVerticalSource ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ lateralMode, setLateralMode ] = useState(WIRED_REFERENCE_SET_VALUE);
    const [ lateralValue, setLateralValue ] = useState('0');
    const [ lateralVariableType, setLateralVariableType ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ lateralVariable, setLateralVariable ] = useState('');
    const [ lateralSource, setLateralSource ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ easing, setEasing ] = useState(EASING_NONE);
    const [ bounceCount, setBounceCount ] = useState(String(DEFAULT_BOUNCE_COUNT));
    const { trigger = null, setIntParams = null, setStringParam = null, furniIds = [] } = useWired() as any;

    const data = useMemo(() => parseWiredData<MovementCurveData>(trigger?.stringData ?? ''), [ trigger ]);
    const variables = useMemo<WiredVariableLists>(() => ({
        global: data.globalVariables ?? [],
        furni: data.furniVariables ?? [],
        user: data.userVariables ?? [],
        context: data.contextVariables ?? []
    }), [ data ]);
    const selectedCount = Array.isArray(furniIds) ? furniIds.length : 0;
    const selectionLimit = trigger?.maximumItemSelectionCount ?? 20;
    const selectedSourceLabel = `${ LocalizeText('wiredfurni.params.sources.furni.100') } [${ selectedCount }/${ selectionLimit }]`;
    const commonOptionLabels = {
        [WIRED_SOURCE_SELECTED]: selectedSourceLabel,
        [WIRED_VARIABLE_GLOBAL]: LocalizeText('wiredfurni.params.sources.global'),
        [WIRED_VARIABLE_CONTEXT]: LocalizeText('wiredfurni.params.sources.context')
    };
    const needsFurniSelection = (verticalMode === WIRED_REFERENCE_FROM_VARIABLE && verticalVariableType === WIRED_VARIABLE_FURNI)
        || (lateralMode === WIRED_REFERENCE_FROM_VARIABLE && lateralVariableType === WIRED_VARIABLE_FURNI);
    const sourceSelectors: WiredSourceSelectorConfig[] = [
        {
            value: verticalSource,
            onChange: setVerticalSource,
            options: wiredVariableSourceOptions(verticalVariableType),
            titleKey: 'wiredfurni.params.sources.merged.title.variables_reference',
            labelPrefix: sourceLabelPrefix(verticalVariableType),
            optionLabels: commonOptionLabels,
            disabled: verticalMode !== WIRED_REFERENCE_FROM_VARIABLE
        },
        {
            value: lateralSource,
            onChange: setLateralSource,
            options: wiredVariableSourceOptions(lateralVariableType),
            titleKey: 'wiredfurni.params.sources.merged.title.variables_reference',
            labelPrefix: sourceLabelPrefix(lateralVariableType),
            optionLabels: commonOptionLabels,
            disabled: lateralMode !== WIRED_REFERENCE_FROM_VARIABLE
        }
    ];

    const setNormalizedVerticalType = (type: number) =>
    {
        const nextType = normalizeVariableType(type);

        setVerticalVariableType(nextType);
        setVerticalSource(current => normalizeWiredSource(current, wiredVariableSourceOptions(nextType)));
    };

    const setNormalizedLateralType = (type: number) =>
    {
        const nextType = normalizeVariableType(type);

        setLateralVariableType(nextType);
        setLateralSource(current => normalizeWiredSource(current, wiredVariableSourceOptions(nextType)));
    };

    const save = () =>
    {
        setStringParam(JSON.stringify({
            jumpStrength: normalizeCurveStrength(Number(verticalValue || 0)),
            lateralStrength: normalizeCurveStrength(Number(lateralValue || 0)),
            verticalReferenceVariable: verticalVariable,
            lateralReferenceVariable: lateralVariable,
            easing,
            bounceCount: normalizeBounceCount(Number(bounceCount || 0))
        }));
        setIntParams([
            normalizeReferenceMode(verticalMode),
            normalizeVariableType(verticalVariableType),
            normalizeWiredSource(verticalSource, wiredVariableSourceOptions(verticalVariableType)),
            normalizeReferenceMode(lateralMode),
            normalizeVariableType(lateralVariableType),
            normalizeWiredSource(lateralSource, wiredVariableSourceOptions(lateralVariableType))
        ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];
        const savedVerticalMode = normalizeReferenceMode(intData[0] ?? data.verticalReferenceMode ?? data.referenceMode ?? WIRED_REFERENCE_SET_VALUE);
        const savedVerticalType = normalizeVariableType(intData[1] ?? data.verticalReferenceVariableType ?? data.referenceVariableType ?? WIRED_VARIABLE_GLOBAL);
        const savedLateralMode = normalizeReferenceMode(intData[3] ?? data.lateralReferenceMode ?? WIRED_REFERENCE_SET_VALUE);
        const savedLateralType = normalizeVariableType(intData[4] ?? data.lateralReferenceVariableType ?? WIRED_VARIABLE_GLOBAL);
        const savedVerticalVariables = savedVerticalType === WIRED_VARIABLE_FURNI ? variables.furni : (savedVerticalType === WIRED_VARIABLE_USER ? variables.user : (savedVerticalType === WIRED_VARIABLE_CONTEXT ? variables.context : variables.global));
        const savedLateralVariables = savedLateralType === WIRED_VARIABLE_FURNI ? variables.furni : (savedLateralType === WIRED_VARIABLE_USER ? variables.user : (savedLateralType === WIRED_VARIABLE_CONTEXT ? variables.context : variables.global));
        const savedVerticalVariable = data.verticalReferenceVariable ?? data.referenceVariable ?? '';
        const savedLateralVariable = data.lateralReferenceVariable ?? '';

        setVerticalMode(savedVerticalMode);
        setVerticalVariableType(savedVerticalType);
        setVerticalSource(normalizeWiredSource(intData[2] ?? data.verticalReferenceSource ?? data.referenceSource ?? WIRED_VARIABLE_GLOBAL, wiredVariableSourceOptions(savedVerticalType)));
        setVerticalVariable((savedVerticalVariables ?? []).includes(savedVerticalVariable) ? savedVerticalVariable : '');
        setVerticalValue(String(normalizeCurveStrength(data.jumpStrength ?? 0)));
        setLateralMode(savedLateralMode);
        setLateralVariableType(savedLateralType);
        setLateralSource(normalizeWiredSource(intData[5] ?? data.lateralReferenceSource ?? WIRED_VARIABLE_GLOBAL, wiredVariableSourceOptions(savedLateralType)));
        setLateralVariable((savedLateralVariables ?? []).includes(savedLateralVariable) ? savedLateralVariable : '');
        setLateralValue(String(normalizeCurveStrength(data.lateralStrength ?? 0)));
        setEasing(normalizeEasing(data.easing ?? EASING_NONE));
        setBounceCount(String(normalizeBounceCount(data.bounceCount ?? DEFAULT_BOUNCE_COUNT)));
    }, [ trigger, data, variables ]);

    return (
        <WiredBaseView
            wiredType="extra"
            requiresFurni={ needsFurniSelection ? WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT : WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            hideFurniSelector={ needsFurniSelection }
            sourceSelectors={ sourceSelectors }
            alwaysExpandedSources={ true }>
            <WiredParam titleKey="wiredfurni.params.vertical_curve">
                <WiredValueOrVariable
                    radioName="movementCurveVerticalReference"
                    mode={ verticalMode }
                    onModeChange={ setVerticalMode }
                    value={ verticalValue }
                    onValueChange={ setVerticalValue }
                    min={ MIN_CURVE_STRENGTH }
                    max={ MAX_CURVE_STRENGTH }
                    variableType={ verticalVariableType }
                    onVariableTypeChange={ setNormalizedVerticalType }
                    variableName={ verticalVariable }
                    onVariableNameChange={ setVerticalVariable }
                    variables={ variables }
                    variableSource={ verticalSource }
                    onVariableSourceChange={ setVerticalSource } />
            </WiredParam>
            <WiredParam titleKey="wiredfurni.params.lateral_curve">
                <WiredValueOrVariable
                    radioName="movementCurveLateralReference"
                    mode={ lateralMode }
                    onModeChange={ setLateralMode }
                    value={ lateralValue }
                    onValueChange={ setLateralValue }
                    min={ MIN_CURVE_STRENGTH }
                    max={ MAX_CURVE_STRENGTH }
                    variableType={ lateralVariableType }
                    onVariableTypeChange={ setNormalizedLateralType }
                    variableName={ lateralVariable }
                    onVariableNameChange={ setLateralVariable }
                    variables={ variables }
                    variableSource={ lateralSource }
                    onVariableSourceChange={ setLateralSource } />
            </WiredParam>
            <WiredParam titleKey="wiredfurni.params.easing_function" divider={ false }>
                <WiredSelect
                    value={ easing }
                    onChange={ event => setEasing(normalizeEasing(Number(event.target.value))) }
                    options={ EASING_OPTIONS.map(option => ({ value: option.value, label: option.label })) } />
                { isBounceEasing(easing) &&
                    <div className="nw-indent-1 mt-1">
                        <Flex alignItems="center" gap={ 1 }>
                            <Text bitmapFont="il_regular">{ LocalizeText('wiredfurni.params.bounce_count') }</Text>
                            <WiredTextInput
                                compact
                                type="number"
                                min={ MIN_BOUNCE_COUNT }
                                max={ MAX_BOUNCE_COUNT }
                                value={ bounceCount }
                                onChange={ event => setBounceCount(String(normalizeBounceCount(Number(event.target.value || 0)))) } />
                        </Flex>
                    </div> }
            </WiredParam>
        </WiredBaseView>
    );
}
