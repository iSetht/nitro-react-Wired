import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import {
    CHEST_MODE_ALL,
    CHEST_MODE_AMOUNT,
    CHEST_REFERENCE_FROM_VARIABLE,
    CHEST_REFERENCE_SET_VALUE,
    CHEST_SOURCE_OPTIONS_WITH_SECONDARY,
    ChestVariableData,
    intOrDefault,
    isSelectedFurniSource,
    normalizeFurniSource,
    normalizeModeAmount,
    normalizeReferenceMode,
    normalizeUserSource,
    normalizeVariableName,
    normalizeVariableSource,
    normalizeVariableType,
    sourcePickersFor,
    useChestDualFurniSelection,
    USER_SOURCE_OPTIONS,
    variablesFromData,
    variableSourceLabelPrefix,
    variableSourceOptions
} from '../chests/WiredChestCommon';
import { WiredSourceSelectorConfig } from '../WiredFurniSelectorView';
import {
    parseWiredData,
    WIRED_SOURCE_SELECTED,
    WiredCheckbox,
    WiredDisabled,
    WiredParam,
    WiredRadioGroup,
    WiredTextarea,
    WiredValueOrVariable
} from '../WiredControls';
import { WiredEffectBaseView } from './WiredEffectBaseView';

const MAX_AMOUNT = 999999999;

interface CurrencyFromChestData extends ChestVariableData
{
    rewardingMode?: number;
    amount?: number;
    amountReferenceMode?: number;
    amountVariableType?: number;
    amountVariableSource?: number;
    amountVariableName?: string;
    showRewardPopupByDefault?: boolean;
    rewardText?: string;
    chestSource?: number;
    userSource?: number;
}

export const WiredEffectGiveCurrencyFromChestView: FC<{}> = () =>
{
    const [ rewardingMode, setRewardingMode ] = useState(CHEST_MODE_AMOUNT);
    const [ amount, setAmount ] = useState('1');
    const [ amountReferenceMode, setAmountReferenceMode ] = useState(CHEST_REFERENCE_SET_VALUE);
    const [ amountVariableType, setAmountVariableType ] = useState(1);
    const [ amountVariableSource, setAmountVariableSource ] = useState(1);
    const [ amountVariableName, setAmountVariableName ] = useState('');
    const [ showRewardPopup, setShowRewardPopup ] = useState(true);
    const [ rewardText, setRewardText ] = useState('');
    const [ chestSource, setChestSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ userSource, setUserSource ] = useState(0);
    const { trigger = null, setIntParams = null, setStringParam = null, furniIds = [], setFurniIds = null } = useWired() as any;

    const data = useMemo(() => parseWiredData<CurrencyFromChestData>(trigger?.stringData ?? ''), [ trigger ]);
    const variables = useMemo(() => variablesFromData(data), [ data ]);
    const subVariables = useMemo(() => data.subVariables ?? {}, [ data ]);
    const selectionLimit = trigger?.maximumItemSelectionCount ?? 20;
    const dualSelection = useChestDualFurniSelection(trigger, furniIds, setFurniIds, data);
    const optionLabels = dualSelection.getOptionLabels(selectionLimit);

    const setNormalizedAmountVariableType = (value: number) =>
    {
        const nextType = normalizeVariableType(value);

        setAmountVariableType(nextType);
        setAmountVariableSource(current => normalizeVariableSource(nextType, current));
    };

    const sourceSelectors: WiredSourceSelectorConfig[] = [
        {
            value: chestSource,
            onChange: source => setChestSource(normalizeFurniSource(source)),
            options: CHEST_SOURCE_OPTIONS_WITH_SECONDARY,
            titleKey: 'wiredfurni.params.sources.furni.title.chests',
            labelPrefix: 'wiredfurni.params.sources.furni',
            optionLabels,
            pickers: sourcePickersFor(chestSource, dualSelection.selectPickSource, dualSelection.activePickSource)
        },
        {
            value: userSource,
            onChange: source => setUserSource(normalizeUserSource(source)),
            options: USER_SOURCE_OPTIONS,
            titleKey: 'wiredfurni.params.sources.users.title.reward_user',
            labelPrefix: 'wiredfurni.params.sources.users'
        },
        {
            value: amountVariableSource,
            onChange: source => setAmountVariableSource(normalizeVariableSource(amountVariableType, source)),
            options: variableSourceOptions(amountVariableType),
            titleKey: 'wiredfurni.params.sources.merged.title.variables_reference',
            labelPrefix: variableSourceLabelPrefix(amountVariableType),
            optionLabels,
            disabled: amountReferenceMode !== CHEST_REFERENCE_FROM_VARIABLE
        }
    ];

    const needsFurniSelection = isSelectedFurniSource(chestSource) ||
        (amountReferenceMode === CHEST_REFERENCE_FROM_VARIABLE && isSelectedFurniSource(amountVariableSource));

    const save = () =>
    {
        setStringParam(JSON.stringify({
            amountVariableName,
            rewardText,
            selectedItemIds: dualSelection.getSavedSelectedIds(),
            secondarySelectedItemIds: dualSelection.getSavedSecondaryIds()
        }));
        if(setFurniIds) setFurniIds(dualSelection.getSavedSelectedIds());
        setIntParams([
            rewardingMode,
            Number(amount || 1),
            amountReferenceMode,
            amountVariableType,
            amountVariableSource,
            showRewardPopup ? 1 : 0,
            chestSource,
            userSource
        ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];
        const savedVariableType = normalizeVariableType(intData[3] ?? data.amountVariableType ?? 1);

        setRewardingMode(normalizeModeAmount(intData[0] ?? data.rewardingMode ?? CHEST_MODE_AMOUNT));
        setAmount(String(intOrDefault(intData[1] ?? data.amount, 1)));
        setAmountReferenceMode(normalizeReferenceMode(intData[2] ?? data.amountReferenceMode ?? CHEST_REFERENCE_SET_VALUE));
        setAmountVariableType(savedVariableType);
        setAmountVariableSource(normalizeVariableSource(savedVariableType, intData[4] ?? data.amountVariableSource ?? savedVariableType));
        setShowRewardPopup((intData[5] ?? (data.showRewardPopupByDefault === false ? 0 : 1)) === 1);
        setChestSource(normalizeFurniSource(intData[6] ?? data.chestSource ?? WIRED_SOURCE_SELECTED));
        setUserSource(normalizeUserSource(intData[7] ?? data.userSource ?? 0));
        setAmountVariableName(normalizeVariableName(savedVariableType, data.amountVariableName ?? '', variables, subVariables));
        setRewardText(data.rewardText ?? '');
    }, [ trigger, data, variables, subVariables ]);

    return (
        <WiredEffectBaseView
            requiresFurni={ needsFurniSelection ? WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT : WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ sourceSelectors }
            alwaysExpandedSources={ true }>
            <WiredParam titleKey="wiredfurni.params.rewarding_mode">
                <WiredRadioGroup
                    name="currencyChestRewardMode"
                    value={ rewardingMode }
                    onChange={ value => setRewardingMode(Number(value)) }
                    options={ [
                        { value: CHEST_MODE_AMOUNT, labelKey: 'wiredfurni.params.rewarding_mode.0' },
                        { value: CHEST_MODE_ALL, labelKey: 'wiredfurni.params.rewarding_mode.1' }
                    ] } />
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.amount_to_give">
                <WiredDisabled disabled={ rewardingMode === CHEST_MODE_ALL }>
                    <WiredValueOrVariable
                        radioName="currencyChestAmount"
                        mode={ amountReferenceMode }
                        onModeChange={ value => setAmountReferenceMode(Number(value)) }
                        value={ amount }
                        onValueChange={ setAmount }
                        min={ 1 }
                        max={ MAX_AMOUNT }
                        variableType={ amountVariableType }
                        onVariableTypeChange={ setNormalizedAmountVariableType }
                        variableName={ amountVariableName }
                        onVariableNameChange={ setAmountVariableName }
                        variables={ variables }
                        variableSource={ amountVariableSource }
                        onVariableSourceChange={ setAmountVariableSource }
                        subVariables={ subVariables } />
                </WiredDisabled>
            </WiredParam>

            <WiredParam titleKey="wiredcontracts.reward_contract.reward_popup" divider={ false }>
                <WiredTextarea
                    maxLength={ 200 }
                    value={ rewardText }
                    onChange={ event => setRewardText(event.target.value) }
                    placeholder={ LocalizeText('wiredcontracts.reward_contract.reward_popup.text.tooltip') } />
                <WiredCheckbox checked={ showRewardPopup } onChange={ setShowRewardPopup } label={ LocalizeText('wiredcontracts.reward_contract.reward_popup.show_by_default') } />
            </WiredParam>
        </WiredEffectBaseView>
    );
}
