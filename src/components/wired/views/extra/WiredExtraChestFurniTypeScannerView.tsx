import { FC, useEffect, useMemo, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import {
    CHEST_SOURCE_OPTIONS_WITH_SECONDARY,
    ITEM_TYPE_SOURCE_OPTIONS,
    isSelectedFurniSource,
    normalizeFurniSource,
    sourcePickersFor,
    useChestDualFurniSelection
} from '../chests/WiredChestCommon';
import { WiredBaseView } from '../WiredBaseView';
import { WiredSourceSelectorConfig } from '../WiredFurniSelectorView';
import {
    parseWiredData,
    WIRED_SOURCE_SELECTED,
    WIRED_VARIABLE_CONTEXT,
    WiredInfoDesc,
    WiredParam,
    WiredRadioGroup,
    WiredVariableNameSelect,
    WiredVariableLists
} from '../WiredControls';

const SCAN_ALL = 0;
const SCAN_PREVIEWED = 1;

interface ChestFurniTypeScannerData
{
    scanMode?: number;
    itemTypeSource?: number;
    chestSource?: number;
    variableName?: string;
    contextVariables?: string[];
}

export const WiredExtraChestFurniTypeScannerView: FC<{}> = () =>
{
    const [ scanMode, setScanMode ] = useState(SCAN_ALL);
    const [ itemTypeSource, setItemTypeSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ chestSource, setChestSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ variableName, setVariableName ] = useState('');
    const { trigger = null, setIntParams = null, setStringParam = null, furniIds = [], setFurniIds = null } = useWired() as any;

    const data = useMemo(() => parseWiredData<ChestFurniTypeScannerData>(trigger?.stringData ?? ''), [ trigger ]);
    const variables = useMemo<WiredVariableLists>(() => ({ context: (data.contextVariables ?? []).filter(name => !!name && !name.startsWith('@')) }), [ data ]);
    const selectionLimit = trigger?.maximumItemSelectionCount ?? 20;
    const dualSelection = useChestDualFurniSelection(trigger, furniIds, setFurniIds, data);
    const optionLabels = dualSelection.getOptionLabels(selectionLimit);

    const sourceSelectors: WiredSourceSelectorConfig[] = [
        {
            value: itemTypeSource,
            onChange: source => setItemTypeSource(normalizeFurniSource(source)),
            options: ITEM_TYPE_SOURCE_OPTIONS,
            titleKey: 'wiredfurni.params.sources.furni.title.item_types',
            labelPrefix: 'wiredfurni.params.sources.furni',
            optionLabels,
            pickers: sourcePickersFor(itemTypeSource, dualSelection.selectPickSource, dualSelection.activePickSource)
        },
        {
            value: chestSource,
            onChange: source => setChestSource(normalizeFurniSource(source)),
            options: CHEST_SOURCE_OPTIONS_WITH_SECONDARY,
            titleKey: 'wiredfurni.params.sources.furni.title.chests',
            labelPrefix: 'wiredfurni.params.sources.furni',
            optionLabels,
            pickers: sourcePickersFor(chestSource, dualSelection.selectPickSource, dualSelection.activePickSource)
        }
    ];

    const needsFurniSelection = isSelectedFurniSource(itemTypeSource) || isSelectedFurniSource(chestSource);

    const save = () =>
    {
        setStringParam(JSON.stringify({
            variableName,
            selectedItemIds: dualSelection.getSavedSelectedIds(),
            secondarySelectedItemIds: dualSelection.getSavedSecondaryIds()
        }));
        if(setFurniIds) setFurniIds(dualSelection.getSavedSelectedIds());
        setIntParams([
            scanMode,
            itemTypeSource,
            chestSource
        ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];

        setScanMode((intData[0] ?? data.scanMode ?? SCAN_ALL) === SCAN_PREVIEWED ? SCAN_PREVIEWED : SCAN_ALL);
        setItemTypeSource(normalizeFurniSource(intData[1] ?? data.itemTypeSource ?? WIRED_SOURCE_SELECTED));
        setChestSource(normalizeFurniSource(intData[2] ?? data.chestSource ?? WIRED_SOURCE_SELECTED));
        setVariableName(data.variableName ?? '');
    }, [ trigger, data ]);

    return (
        <WiredBaseView
            wiredType="extra"
            requiresFurni={ needsFurniSelection ? WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT : WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ sourceSelectors }
            alwaysExpandedSources={ true }>
            <WiredParam titleKey="wiredfurni.params.general_box_info" chevron>
                <WiredInfoDesc textKey="wiredfurni.params.chest_item_type_scanner.info" />
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.variables.variable_selection">
                <WiredVariableNameSelect
                    variableType={ WIRED_VARIABLE_CONTEXT }
                    variableName={ variableName }
                    onVariableNameChange={ setVariableName }
                    variables={ variables } />
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.chest_item_type_scanner" divider={ false }>
                <WiredRadioGroup
                    name="chestFurniTypeScannerMode"
                    value={ scanMode }
                    onChange={ value => setScanMode(Number(value) === SCAN_PREVIEWED ? SCAN_PREVIEWED : SCAN_ALL) }
                    options={ [
                        { value: SCAN_ALL, labelKey: 'wiredfurni.params.chest_item_type_scanner.0' },
                        { value: SCAN_PREVIEWED, labelKey: 'wiredfurni.params.chest_item_type_scanner.1' }
                    ] } />
            </WiredParam>
        </WiredBaseView>
    );
}
