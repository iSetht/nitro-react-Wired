import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import {
    CHEST_REFERENCE_FROM_VARIABLE,
    CHEST_REFERENCE_SET_VALUE,
    CHEST_SOURCE_OPTIONS_WITH_SECONDARY,
    ChestVariableData,
    CONTRACT_SOURCE_OPTIONS,
    intOrDefault,
    isSelectedFurniSource,
    normalizeFurniSource,
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
    clampWiredText,
    parseWiredData,
    WIRED_SOURCE_SELECTED,
    WiredCheckbox,
    WiredButtonInfoText,
    WiredDisabled,
    WiredParam,
    WiredRadioGroup,
    WiredTextInput,
    WiredValueOrVariable
} from '../WiredControls';
import { WiredEffectBaseView } from './WiredEffectBaseView';

const MODE_NORMAL = 0;
const MODE_MULTIPLIER = 1;
const MODE_AUTO_MULTIPLIER = 2;
const MIN_TIMEOUT_SECONDS = 10;
const MAX_TIMEOUT_SECONDS = 3600;

interface InitiateTransactionData extends ChestVariableData
{
    transactionMode?: number;
    multiplier?: number;
    multiplierReferenceMode?: number;
    multiplierVariableType?: number;
    multiplierVariableSource?: number;
    multiplierVariableName?: string;
    timeoutEnabled?: boolean;
    timeoutSeconds?: number;
    chestSource?: number;
    contractSource?: number;
    userSource?: number;
}

const normalizeTransactionMode = (value: number) =>
    value === MODE_MULTIPLIER || value === MODE_AUTO_MULTIPLIER ? value : MODE_NORMAL;

export const WiredEffectInitiateTransactionView: FC<{}> = () =>
{
    const [ transactionMode, setTransactionMode ] = useState(MODE_NORMAL);
    const [ multiplier, setMultiplier ] = useState('1');
    const [ multiplierReferenceMode, setMultiplierReferenceMode ] = useState(CHEST_REFERENCE_SET_VALUE);
    const [ multiplierVariableType, setMultiplierVariableType ] = useState(1);
    const [ multiplierVariableSource, setMultiplierVariableSource ] = useState(1);
    const [ multiplierVariableName, setMultiplierVariableName ] = useState('');
    const [ timeoutEnabled, setTimeoutEnabled ] = useState(false);
    const [ timeoutSeconds, setTimeoutSeconds ] = useState('300');
    const [ chestSource, setChestSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ contractSource, setContractSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ userSource, setUserSource ] = useState(0);
    const { trigger = null, setIntParams = null, setStringParam = null, furniIds = [], setFurniIds = null } = useWired() as any;

    const data = useMemo(() => parseWiredData<InitiateTransactionData>(trigger?.stringData ?? ''), [ trigger ]);
    const variables = useMemo(() => variablesFromData(data), [ data ]);
    const subVariables = useMemo(() => data.subVariables ?? {}, [ data ]);
    const selectionLimit = trigger?.maximumItemSelectionCount ?? 20;
    const dualSelection = useChestDualFurniSelection(trigger, furniIds, setFurniIds, data);
    const optionLabels = dualSelection.getOptionLabels(selectionLimit);

    const setNormalizedMultiplierVariableType = (value: number) =>
    {
        const nextType = normalizeVariableType(value);

        setMultiplierVariableType(nextType);
        setMultiplierVariableSource(current => normalizeVariableSource(nextType, current));
    };

    const selectChestSource = (source: number) =>
    {
        const normalized = normalizeFurniSource(source);

        setChestSource(normalized);
        if(isSelectedFurniSource(normalized)) dualSelection.selectPickSource(normalized);
    };

    const selectContractSource = (source: number) =>
    {
        const normalized = normalizeFurniSource(source);

        setContractSource(normalized);
        if(isSelectedFurniSource(normalized)) dualSelection.selectPickSource(normalized);
    };

    const sourceSelectors: WiredSourceSelectorConfig[] = [
        {
            value: chestSource,
            onChange: selectChestSource,
            options: CHEST_SOURCE_OPTIONS_WITH_SECONDARY,
            titleKey: 'wiredfurni.params.sources.furni.title.chests',
            labelPrefix: 'wiredfurni.params.sources.furni',
            optionLabels,
            pickers: sourcePickersFor(chestSource, selectChestSource, dualSelection.activePickSource)
        },
        {
            value: contractSource,
            onChange: selectContractSource,
            options: CONTRACT_SOURCE_OPTIONS,
            titleKey: 'wiredfurni.params.sources.furni.title.contracts',
            labelPrefix: 'wiredfurni.params.sources.furni',
            optionLabels,
            pickers: sourcePickersFor(contractSource, selectContractSource, dualSelection.activePickSource)
        },
        {
            value: userSource,
            onChange: source => setUserSource(normalizeUserSource(source)),
            options: USER_SOURCE_OPTIONS,
            titleKey: 'wiredfurni.params.sources.users.title',
            labelPrefix: 'wiredfurni.params.sources.users'
        },
        {
            value: multiplierVariableSource,
            onChange: source => setMultiplierVariableSource(normalizeVariableSource(multiplierVariableType, source)),
            options: variableSourceOptions(multiplierVariableType),
            titleKey: 'wiredfurni.params.sources.merged.title.variables_reference',
            labelPrefix: variableSourceLabelPrefix(multiplierVariableType),
            optionLabels,
            disabled: multiplierReferenceMode !== CHEST_REFERENCE_FROM_VARIABLE
        }
    ];

    const needsFurniSelection = isSelectedFurniSource(chestSource) ||
        isSelectedFurniSource(contractSource) ||
        (multiplierReferenceMode === CHEST_REFERENCE_FROM_VARIABLE && isSelectedFurniSource(multiplierVariableSource));

    const save = () =>
    {
        setStringParam(JSON.stringify({
            multiplierVariableName,
            selectedItemIds: dualSelection.getSavedSelectedIds(),
            secondarySelectedItemIds: dualSelection.getSavedSecondaryIds()
        }));
        if(setFurniIds) setFurniIds(dualSelection.getSavedSelectedIds());
        setIntParams([
            transactionMode,
            Number(multiplier || 1),
            multiplierReferenceMode,
            multiplierVariableType,
            multiplierVariableSource,
            timeoutEnabled ? 1 : 0,
            Number(timeoutSeconds || 300),
            chestSource,
            contractSource,
            userSource
        ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];
        const savedVariableType = normalizeVariableType(intData[3] ?? data.multiplierVariableType ?? 1);

        setTransactionMode(normalizeTransactionMode(intData[0] ?? data.transactionMode ?? MODE_NORMAL));
        setMultiplier(String(intOrDefault(intData[1] ?? data.multiplier, 1)));
        setMultiplierReferenceMode(normalizeReferenceMode(intData[2] ?? data.multiplierReferenceMode ?? CHEST_REFERENCE_SET_VALUE));
        setMultiplierVariableType(savedVariableType);
        setMultiplierVariableSource(normalizeVariableSource(savedVariableType, intData[4] ?? data.multiplierVariableSource ?? savedVariableType));
        setTimeoutEnabled((intData[5] ?? (data.timeoutEnabled ? 1 : 0)) === 1);
        setTimeoutSeconds(String(intOrDefault(intData[6] ?? data.timeoutSeconds, 300)));
        setChestSource(normalizeFurniSource(intData[7] ?? data.chestSource ?? WIRED_SOURCE_SELECTED));
        setContractSource(normalizeFurniSource(intData[8] ?? data.contractSource ?? WIRED_SOURCE_SELECTED));
        setUserSource(normalizeUserSource(intData[9] ?? data.userSource ?? 0));
        setMultiplierVariableName(normalizeVariableName(savedVariableType, data.multiplierVariableName ?? '', variables, subVariables));
    }, [ trigger, data, variables, subVariables ]);

    return (
        <WiredEffectBaseView
            requiresFurni={ needsFurniSelection ? WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT : WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ sourceSelectors }
            alwaysExpandedSources={ true }
            hideFurniSelectionCaption={ true }>
            <WiredParam titleKey="wiredfurni.params.contract.mode">
                <WiredRadioGroup
                    name="transactionMode"
                    value={ transactionMode }
                    onChange={ value => setTransactionMode(normalizeTransactionMode(Number(value))) }
                    options={ [
                        { value: MODE_NORMAL, labelKey: 'wiredfurni.params.contract.mode.0' },
                        { value: MODE_MULTIPLIER, labelKey: 'wiredfurni.params.contract.mode.1' },
                        { value: MODE_AUTO_MULTIPLIER, labelKey: 'wiredfurni.params.contract.mode.2' }
                    ] } />
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.contract.multiplier_selection">
                <WiredDisabled disabled={ transactionMode === MODE_NORMAL }>
                    <WiredValueOrVariable
                        radioName="transactionMultiplier"
                        mode={ multiplierReferenceMode }
                        onModeChange={ value => setMultiplierReferenceMode(Number(value)) }
                        value={ multiplier }
                        onValueChange={ setMultiplier }
                        min={ 1 }
                        max={ 500 }
                        variableType={ multiplierVariableType }
                        onVariableTypeChange={ setNormalizedMultiplierVariableType }
                        variableName={ multiplierVariableName }
                        onVariableNameChange={ setMultiplierVariableName }
                        variables={ variables }
                        variableSource={ multiplierVariableSource }
                        onVariableSourceChange={ setMultiplierVariableSource }
                        subVariables={ subVariables } />
                </WiredDisabled>
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.contract.timeout" divider={ false }>
                <WiredCheckbox checked={ timeoutEnabled } onChange={ setTimeoutEnabled } label={ LocalizeText('wiredfurni.params.contract.timeout.desc') } />
                <WiredDisabled disabled={ !timeoutEnabled }>
                    <Flex className="nw-indent-1" alignItems="center" gap={ 1 }>
                        <WiredButtonInfoText>{ LocalizeText('wiredfurni.params.contract.timeout.selection') }</WiredButtonInfoText>
                        <WiredTextInput
                            compact
                            type="number"
                            min={ MIN_TIMEOUT_SECONDS }
                            max={ MAX_TIMEOUT_SECONDS }
                            value={ timeoutSeconds }
                            onChange={ event => setTimeoutSeconds(clampWiredText(event.target.value, MIN_TIMEOUT_SECONDS, MAX_TIMEOUT_SECONDS)) } />
                    </Flex>
                </WiredDisabled>
            </WiredParam>
        </WiredEffectBaseView>
    );
}
