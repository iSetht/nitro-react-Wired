import { FC, useEffect, useMemo, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import {
    CHEST_REFERENCE_FROM_VARIABLE,
    CHEST_REFERENCE_SET_VALUE,
    CHEST_SOURCE_OPTIONS,
    ChestVariableData,
    COMPARISON_EQUAL,
    COMPARISON_OPTIONS,
    intOrDefault,
    isSelectedFurniSource,
    normalizeComparison,
    normalizeFurniSource,
    normalizeReferenceMode,
    normalizeVariableName,
    normalizeVariableSource,
    normalizeVariableType,
    sourcePickersFor,
    useChestDualFurniSelection,
    variablesFromData,
    variableSourceLabelPrefix,
    variableSourceOptions
} from '../chests/WiredChestCommon';
import { WiredSourceSelectorConfig } from '../WiredFurniSelectorView';
import {
    parseWiredData,
    WIRED_SOURCE_SELECTED,
    WiredParam,
    WiredRadioGroup,
    WiredValueOrVariable
} from '../WiredControls';
import { WiredConditionBaseView } from './WiredConditionBaseView';
import { WIRED_CONDITION_QUANTIFIER_ALL, WIRED_CONDITION_QUANTIFIER_ANY, WiredConditionQuantifierSection } from './WiredConditionUtils';

const MAX_AMOUNT = 999999999;

interface ChestHasItemsData extends ChestVariableData
{
    amount?: number;
    amountReferenceMode?: number;
    amountVariableType?: number;
    amountVariableSource?: number;
    amountVariableName?: string;
    comparison?: number;
    quantifier?: number;
    chestSource?: number;
}

export const WiredConditionChestHasItemsView: FC<{}> = () =>
{
    const [ amount, setAmount ] = useState('0');
    const [ amountReferenceMode, setAmountReferenceMode ] = useState(CHEST_REFERENCE_SET_VALUE);
    const [ amountVariableType, setAmountVariableType ] = useState(1);
    const [ amountVariableSource, setAmountVariableSource ] = useState(1);
    const [ amountVariableName, setAmountVariableName ] = useState('');
    const [ comparison, setComparison ] = useState(COMPARISON_EQUAL);
    const [ quantifier, setQuantifier ] = useState(WIRED_CONDITION_QUANTIFIER_ALL);
    const [ chestSource, setChestSource ] = useState(WIRED_SOURCE_SELECTED);
    const { trigger = null, setIntParams = null, setStringParam = null, furniIds = [], setFurniIds = null } = useWired() as any;

    const data = useMemo(() => parseWiredData<ChestHasItemsData>(trigger?.stringData ?? ''), [ trigger ]);
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
            options: CHEST_SOURCE_OPTIONS,
            titleKey: 'wiredfurni.params.sources.furni.title.chests',
            labelPrefix: 'wiredfurni.params.sources.furni',
            optionLabels,
            pickers: sourcePickersFor(chestSource, dualSelection.selectPickSource, dualSelection.activePickSource)
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
            selectedItemIds: dualSelection.getSavedSelectedIds(),
            secondarySelectedItemIds: dualSelection.getSavedSecondaryIds()
        }));
        if(setFurniIds) setFurniIds(dualSelection.getSavedSelectedIds());
        setIntParams([
            Number(amount || 0),
            amountReferenceMode,
            amountVariableType,
            comparison,
            quantifier,
            chestSource,
            amountVariableSource
        ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];
        const savedVariableType = normalizeVariableType(intData[2] ?? data.amountVariableType ?? 1);

        setAmount(String(intOrDefault(intData[0] ?? data.amount, 0)));
        setAmountReferenceMode(normalizeReferenceMode(intData[1] ?? data.amountReferenceMode ?? CHEST_REFERENCE_SET_VALUE));
        setAmountVariableType(savedVariableType);
        setComparison(normalizeComparison(intData[3] ?? data.comparison ?? COMPARISON_EQUAL));
        setQuantifier((intData[4] ?? data.quantifier ?? WIRED_CONDITION_QUANTIFIER_ALL) === WIRED_CONDITION_QUANTIFIER_ANY ? WIRED_CONDITION_QUANTIFIER_ANY : WIRED_CONDITION_QUANTIFIER_ALL);
        setChestSource(normalizeFurniSource(intData[5] ?? data.chestSource ?? WIRED_SOURCE_SELECTED));
        setAmountVariableSource(normalizeVariableSource(savedVariableType, intData[6] ?? data.amountVariableSource ?? savedVariableType));
        setAmountVariableName(normalizeVariableName(savedVariableType, data.amountVariableName ?? '', variables, subVariables));
    }, [ trigger, data, variables, subVariables ]);

    return (
        <WiredConditionBaseView
            requiresFurni={ needsFurniSelection ? WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT : WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ sourceSelectors }
            advancedSlot={ <WiredConditionQuantifierSection kind="furni" name="chestHasItemsQuantifier" value={ quantifier } onChange={ setQuantifier } /> }
            alwaysExpandedSources={ true }
            expanded={ true }>
            <WiredParam titleKey="wiredfurni.params.choose_type">
                <WiredRadioGroup
                    inline
                    gap={ 2 }
                    name="chestHasItemsComparison"
                    value={ comparison }
                    onChange={ value => setComparison(normalizeComparison(Number(value))) }
                    options={ COMPARISON_OPTIONS } />
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.variables.compare_value" divider={ false }>
                <WiredValueOrVariable
                    radioName="chestHasItemsAmount"
                    mode={ amountReferenceMode }
                    onModeChange={ value => setAmountReferenceMode(Number(value)) }
                    value={ amount }
                    onValueChange={ setAmount }
                    min={ 0 }
                    max={ MAX_AMOUNT }
                    variableType={ amountVariableType }
                    onVariableTypeChange={ setNormalizedAmountVariableType }
                    variableName={ amountVariableName }
                    onVariableNameChange={ setAmountVariableName }
                    variables={ variables }
                    variableSource={ amountVariableSource }
                    onVariableSourceChange={ setAmountVariableSource }
                    subVariables={ subVariables } />
            </WiredParam>
        </WiredConditionBaseView>
    );
}
