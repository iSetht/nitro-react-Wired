import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import {
    CHEST_ELEMENT_CREDITS,
    CHEST_ELEMENT_FURNI,
    CHEST_REFERENCE_FROM_VARIABLE,
    CHEST_REFERENCE_SET_VALUE,
    ChestVariableData,
    CONTRACT_SOURCE_OPTIONS,
    intOrDefault,
    isSelectedFurniSource,
    normalizeFurniSource,
    normalizeReferenceMode,
    normalizeVariableName,
    normalizeVariableSource,
    normalizeVariableType,
    sourceOptionLabels,
    variablesFromData,
    variableSourceLabelPrefix,
    variableSourceOptions
} from '../chests/WiredChestCommon';
import { WiredBaseView } from '../WiredBaseView';
import { WiredSourceSelectorConfig } from '../WiredFurniSelectorView';
import {
    parseWiredData,
    WIRED_SOURCE_SELECTED,
    WiredCheckbox,
    WiredControlTitle,
    WiredDisabled,
    WiredInfoDesc,
    WiredParam,
    WiredRadioGroup,
    WiredValueOrVariable
} from '../WiredControls';

const MAX_AMOUNT = 999999999;
const FURNI_TARGET_PAYMENT = 0;
const FURNI_TARGET_REWARD = 1;

interface CustomContractData extends ChestVariableData
{
    paymentEnabled?: boolean;
    paymentElementType?: number;
    paymentReferenceMode?: number;
    paymentAmount?: number;
    paymentVariableType?: number;
    paymentVariableSource?: number;
    paymentFurniSource?: number;
    paymentVariableName?: string;
    paymentFurniItemIds?: number[];
    rewardEnabled?: boolean;
    rewardElementType?: number;
    rewardReferenceMode?: number;
    rewardAmount?: number;
    rewardVariableType?: number;
    rewardVariableSource?: number;
    rewardFurniSource?: number;
    rewardVariableName?: string;
    rewardFurniItemIds?: number[];
}

const normalizeElementType = (value: number) => value === CHEST_ELEMENT_FURNI ? CHEST_ELEMENT_FURNI : CHEST_ELEMENT_CREDITS;

export const WiredExtraCustomContractView: FC<{}> = () =>
{
    const [ paymentEnabled, setPaymentEnabled ] = useState(false);
    const [ paymentElementType, setPaymentElementType ] = useState(CHEST_ELEMENT_CREDITS);
    const [ paymentReferenceMode, setPaymentReferenceMode ] = useState(CHEST_REFERENCE_SET_VALUE);
    const [ paymentAmount, setPaymentAmount ] = useState('1');
    const [ paymentVariableType, setPaymentVariableType ] = useState(1);
    const [ paymentVariableSource, setPaymentVariableSource ] = useState(1);
    const [ paymentVariableName, setPaymentVariableName ] = useState('');
    const [ paymentFurniSource, setPaymentFurniSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ rewardEnabled, setRewardEnabled ] = useState(false);
    const [ rewardElementType, setRewardElementType ] = useState(CHEST_ELEMENT_CREDITS);
    const [ rewardReferenceMode, setRewardReferenceMode ] = useState(CHEST_REFERENCE_SET_VALUE);
    const [ rewardAmount, setRewardAmount ] = useState('1');
    const [ rewardVariableType, setRewardVariableType ] = useState(1);
    const [ rewardVariableSource, setRewardVariableSource ] = useState(1);
    const [ rewardVariableName, setRewardVariableName ] = useState('');
    const [ rewardFurniSource, setRewardFurniSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ furniSelectionTarget, setFurniSelectionTarget ] = useState(FURNI_TARGET_PAYMENT);
    const [ expanded, setExpanded ] = useState(false);
    const { trigger = null, setIntParams = null, setStringParam = null, furniIds = [] } = useWired() as any;

    const data = useMemo(() => parseWiredData<CustomContractData>(trigger?.stringData ?? ''), [ trigger ]);
    const variables = useMemo(() => variablesFromData(data), [ data ]);
    const subVariables = useMemo(() => data.subVariables ?? {}, [ data ]);
    const selectedIds = useMemo(() => Array.isArray(furniIds) ? furniIds : [], [ furniIds ]);
    const selectionLimit = trigger?.maximumItemSelectionCount ?? 20;
    const optionLabels = sourceOptionLabels(selectedIds.length, selectionLimit);
    const paymentFurniActive = paymentEnabled && paymentElementType === CHEST_ELEMENT_FURNI;
    const rewardFurniActive = rewardEnabled && rewardElementType === CHEST_ELEMENT_FURNI;

    const setNormalizedPaymentVariableType = (value: number) =>
    {
        const nextType = normalizeVariableType(value);

        setPaymentVariableType(nextType);
        setPaymentVariableSource(current => normalizeVariableSource(nextType, current));
    };

    const setNormalizedRewardVariableType = (value: number) =>
    {
        const nextType = normalizeVariableType(value);

        setRewardVariableType(nextType);
        setRewardVariableSource(current => normalizeVariableSource(nextType, current));
    };

    const sourceSelectors: WiredSourceSelectorConfig[] = [
        {
            value: paymentFurniSource,
            onChange: source => setPaymentFurniSource(normalizeFurniSource(source)),
            options: CONTRACT_SOURCE_OPTIONS,
            titleKey: 'wiredfurni.params.sources.furni.title.payment',
            labelPrefix: 'wiredfurni.params.sources.furni',
            optionLabels,
            disabled: !paymentFurniActive
        },
        {
            value: rewardFurniSource,
            onChange: source => setRewardFurniSource(normalizeFurniSource(source)),
            options: CONTRACT_SOURCE_OPTIONS,
            titleKey: 'wiredfurni.params.sources.furni.title.reward',
            labelPrefix: 'wiredfurni.params.sources.furni',
            optionLabels,
            disabled: !rewardFurniActive
        },
        {
            value: paymentVariableSource,
            onChange: source => setPaymentVariableSource(normalizeVariableSource(paymentVariableType, source)),
            options: variableSourceOptions(paymentVariableType),
            titleKey: 'wiredfurni.params.sources.merged.title.variables_reference_payment',
            labelPrefix: variableSourceLabelPrefix(paymentVariableType),
            optionLabels,
            disabled: !paymentEnabled || paymentReferenceMode !== CHEST_REFERENCE_FROM_VARIABLE
        },
        {
            value: rewardVariableSource,
            onChange: source => setRewardVariableSource(normalizeVariableSource(rewardVariableType, source)),
            options: variableSourceOptions(rewardVariableType),
            titleKey: 'wiredfurni.params.sources.merged.title.variables_reference_reward',
            labelPrefix: variableSourceLabelPrefix(rewardVariableType),
            optionLabels,
            disabled: !rewardEnabled || rewardReferenceMode !== CHEST_REFERENCE_FROM_VARIABLE
        }
    ];

    const needsFurniSelection =
        (paymentFurniActive && isSelectedFurniSource(paymentFurniSource)) ||
        (rewardFurniActive && isSelectedFurniSource(rewardFurniSource)) ||
        (paymentReferenceMode === CHEST_REFERENCE_FROM_VARIABLE && isSelectedFurniSource(paymentVariableSource)) ||
        (rewardReferenceMode === CHEST_REFERENCE_FROM_VARIABLE && isSelectedFurniSource(rewardVariableSource));

    const save = () =>
    {
        const target = paymentFurniActive && !rewardFurniActive
            ? FURNI_TARGET_PAYMENT
            : (rewardFurniActive && !paymentFurniActive ? FURNI_TARGET_REWARD : furniSelectionTarget);

        setStringParam(JSON.stringify({
            paymentVariableName,
            paymentFurniItemIds: paymentFurniActive ? (target === FURNI_TARGET_PAYMENT ? selectedIds : (data.paymentFurniItemIds ?? [])) : [],
            rewardVariableName,
            rewardFurniItemIds: rewardFurniActive ? (target === FURNI_TARGET_REWARD ? selectedIds : (data.rewardFurniItemIds ?? [])) : []
        }));
        setIntParams([
            paymentEnabled ? 1 : 0,
            paymentElementType,
            paymentReferenceMode,
            Number(paymentAmount || 1),
            paymentVariableType,
            paymentVariableSource,
            paymentFurniSource,
            rewardEnabled ? 1 : 0,
            rewardElementType,
            rewardReferenceMode,
            Number(rewardAmount || 1),
            rewardVariableType,
            rewardVariableSource,
            rewardFurniSource
        ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];
        const savedPaymentVariableType = normalizeVariableType(intData[4] ?? data.paymentVariableType ?? 1);
        const savedRewardVariableType = normalizeVariableType(intData[11] ?? data.rewardVariableType ?? 1);
        const hasPaymentItems = (data.paymentFurniItemIds ?? []).length > 0;
        const hasRewardItems = (data.rewardFurniItemIds ?? []).length > 0;

        setPaymentEnabled((intData[0] ?? (data.paymentEnabled ? 1 : 0)) === 1);
        setPaymentElementType(normalizeElementType(intData[1] ?? data.paymentElementType ?? CHEST_ELEMENT_CREDITS));
        setPaymentReferenceMode(normalizeReferenceMode(intData[2] ?? data.paymentReferenceMode ?? CHEST_REFERENCE_SET_VALUE));
        setPaymentAmount(String(intOrDefault(intData[3] ?? data.paymentAmount, 1)));
        setPaymentVariableType(savedPaymentVariableType);
        setPaymentVariableSource(normalizeVariableSource(savedPaymentVariableType, intData[5] ?? data.paymentVariableSource ?? savedPaymentVariableType));
        setPaymentFurniSource(normalizeFurniSource(intData[6] ?? data.paymentFurniSource ?? WIRED_SOURCE_SELECTED));
        setPaymentVariableName(normalizeVariableName(savedPaymentVariableType, data.paymentVariableName ?? '', variables, subVariables));

        setRewardEnabled((intData[7] ?? (data.rewardEnabled ? 1 : 0)) === 1);
        setRewardElementType(normalizeElementType(intData[8] ?? data.rewardElementType ?? CHEST_ELEMENT_CREDITS));
        setRewardReferenceMode(normalizeReferenceMode(intData[9] ?? data.rewardReferenceMode ?? CHEST_REFERENCE_SET_VALUE));
        setRewardAmount(String(intOrDefault(intData[10] ?? data.rewardAmount, 1)));
        setRewardVariableType(savedRewardVariableType);
        setRewardVariableSource(normalizeVariableSource(savedRewardVariableType, intData[12] ?? data.rewardVariableSource ?? savedRewardVariableType));
        setRewardFurniSource(normalizeFurniSource(intData[13] ?? data.rewardFurniSource ?? WIRED_SOURCE_SELECTED));
        setRewardVariableName(normalizeVariableName(savedRewardVariableType, data.rewardVariableName ?? '', variables, subVariables));
        setFurniSelectionTarget(hasRewardItems && !hasPaymentItems ? FURNI_TARGET_REWARD : FURNI_TARGET_PAYMENT);
        setExpanded(
            (intData[6] ?? data.paymentFurniSource ?? WIRED_SOURCE_SELECTED) !== WIRED_SOURCE_SELECTED ||
            (intData[13] ?? data.rewardFurniSource ?? WIRED_SOURCE_SELECTED) !== WIRED_SOURCE_SELECTED ||
            (intData[5] ?? data.paymentVariableSource ?? savedPaymentVariableType) !== savedPaymentVariableType ||
            (intData[12] ?? data.rewardVariableSource ?? savedRewardVariableType) !== savedRewardVariableType
        );
    }, [ trigger, data, variables, subVariables ]);

    return (
        <WiredBaseView
            wiredType="extra"
            requiresFurni={ needsFurniSelection ? WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT : WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ sourceSelectors }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(value => !value) }
            hideFurniSelectionCaption={ true }>
            <WiredParam titleKey="wiredfurni.params.general_box_warning" chevron>
                <WiredInfoDesc textKey="wiredfurni.params.custom_contract.usage_warning" />
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.custom_contract.payment">
                <WiredCheckbox checked={ paymentEnabled } onChange={ setPaymentEnabled } label={ LocalizeText('wiredfurni.params.custom_contract.enable_payment') } />
                <WiredDisabled disabled={ !paymentEnabled }>
                    <WiredControlTitle>{ LocalizeText('wiredcontracts.element.type') }</WiredControlTitle>
                    <WiredRadioGroup
                        inline
                        name="customContractPaymentType"
                        value={ paymentElementType }
                        onChange={ value => setPaymentElementType(normalizeElementType(Number(value))) }
                        options={ [
                            { value: CHEST_ELEMENT_CREDITS, labelKey: 'wiredcontracts.element.type.0' },
                            { value: CHEST_ELEMENT_FURNI, labelKey: 'wiredcontracts.element.type.1' }
                        ] } />
                    <WiredControlTitle>{ LocalizeText('wiredfurni.params.custom_contract.amount_selection') }</WiredControlTitle>
                    <WiredValueOrVariable
                        radioName="customContractPaymentAmount"
                        mode={ paymentReferenceMode }
                        onModeChange={ value => setPaymentReferenceMode(Number(value)) }
                        value={ paymentAmount }
                        onValueChange={ setPaymentAmount }
                        min={ 1 }
                        max={ MAX_AMOUNT }
                        variableType={ paymentVariableType }
                        onVariableTypeChange={ setNormalizedPaymentVariableType }
                        variableName={ paymentVariableName }
                        onVariableNameChange={ setPaymentVariableName }
                        variables={ variables }
                        variableSource={ paymentVariableSource }
                        onVariableSourceChange={ setPaymentVariableSource }
                        subVariables={ subVariables } />
                </WiredDisabled>
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.custom_contract.reward" divider={ false }>
                <WiredCheckbox checked={ rewardEnabled } onChange={ setRewardEnabled } label={ LocalizeText('wiredfurni.params.custom_contract.enable_reward') } />
                <WiredDisabled disabled={ !rewardEnabled }>
                    <WiredControlTitle>{ LocalizeText('wiredcontracts.element.type') }</WiredControlTitle>
                    <WiredRadioGroup
                        inline
                        name="customContractRewardType"
                        value={ rewardElementType }
                        onChange={ value => setRewardElementType(normalizeElementType(Number(value))) }
                        options={ [
                            { value: CHEST_ELEMENT_CREDITS, labelKey: 'wiredcontracts.element.type.0' },
                            { value: CHEST_ELEMENT_FURNI, labelKey: 'wiredcontracts.element.type.1' }
                        ] } />
                    <WiredControlTitle>{ LocalizeText('wiredfurni.params.custom_contract.amount_selection') }</WiredControlTitle>
                    <WiredValueOrVariable
                        radioName="customContractRewardAmount"
                        mode={ rewardReferenceMode }
                        onModeChange={ value => setRewardReferenceMode(Number(value)) }
                        value={ rewardAmount }
                        onValueChange={ setRewardAmount }
                        min={ 1 }
                        max={ MAX_AMOUNT }
                        variableType={ rewardVariableType }
                        onVariableTypeChange={ setNormalizedRewardVariableType }
                        variableName={ rewardVariableName }
                        onVariableNameChange={ setRewardVariableName }
                        variables={ variables }
                        variableSource={ rewardVariableSource }
                        onVariableSourceChange={ setRewardVariableSource }
                        subVariables={ subVariables } />
                </WiredDisabled>
            </WiredParam>
        </WiredBaseView>
    );
}
