import { FC, useEffect, useMemo, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import {
    CONTRACT_SELECTED_SOURCE_OPTIONS,
    normalizeFurniSource,
    sourceOptionLabels
} from '../chests/WiredChestCommon';
import { WiredSourceSelectorConfig } from '../WiredFurniSelectorView';
import { parseWiredData, WIRED_SOURCE_SELECTED, WiredInfoDesc, WiredParam } from '../WiredControls';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';

interface TransactionTriggerData
{
    contractSource?: number;
}

export const WiredTriggerTransactionView: FC<{}> = () =>
{
    const [ contractSource, setContractSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ expanded, setExpanded ] = useState(false);
    const { trigger = null, setIntParams = null, furniIds = [] } = useWired() as any;

    const data = useMemo(() => parseWiredData<TransactionTriggerData>(trigger?.stringData ?? ''), [ trigger ]);
    const selectedCount = Array.isArray(furniIds) ? furniIds.length : 0;
    const selectionLimit = trigger?.maximumItemSelectionCount ?? 20;
    const optionLabels = sourceOptionLabels(selectedCount, selectionLimit);

    const sourceSelectors: WiredSourceSelectorConfig[] = [
        {
            value: contractSource,
            onChange: source => setContractSource(normalizeFurniSource(source)),
            options: CONTRACT_SELECTED_SOURCE_OPTIONS,
            titleKey: 'wiredfurni.params.sources.furni.title',
            labelPrefix: 'wiredfurni.params.sources.furni',
            optionLabels
        }
    ];

    const save = () => setIntParams([ contractSource ]);

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];
        const savedSource = intData[0] ?? data.contractSource ?? WIRED_SOURCE_SELECTED;

        setContractSource(normalizeFurniSource(savedSource));
        setExpanded(savedSource !== WIRED_SOURCE_SELECTED);
    }, [ trigger, data ]);

    const infoKey = trigger?.code === 26
        ? 'wiredfurni.params.transaction_failed.usage_info'
        : 'wiredfurni.params.transaction_complete.usage_info';

    return (
        <WiredTriggerBaseView
            requiresFurni={ contractSource === WIRED_SOURCE_SELECTED ? WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT : WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ sourceSelectors }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(value => !value) }>
            <WiredParam titleKey="wiredfurni.params.general_box_info" chevron divider={ false }>
                <WiredInfoDesc textKey={ infoKey } />
            </WiredParam>
        </WiredTriggerBaseView>
    );
}
