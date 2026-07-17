import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import {
    CONTRACT_SELECTED_SOURCE_OPTIONS,
    isSelectedFurniSource,
    normalizeFurniSource,
    normalizeUserSource,
    sourceOptionLabels,
    USER_SOURCE_OPTIONS
} from '../chests/WiredChestCommon';
import { WiredSourceSelectorConfig } from '../WiredFurniSelectorView';
import {
    parseWiredData,
    WIRED_SOURCE_SELECTED,
    WiredInfoDesc,
    WiredParam,
    WiredRadioGroup
} from '../WiredControls';
import { WiredEffectBaseView } from './WiredEffectBaseView';

const MATCH_CONTRACTS = 0;
const MATCH_ANY = 1;

interface CancelTransactionData
{
    matchCriteria?: number;
    contractSource?: number;
    userSource?: number;
}

export const WiredEffectCancelTransactionView: FC<{}> = () =>
{
    const [ matchCriteria, setMatchCriteria ] = useState(MATCH_ANY);
    const [ contractSource, setContractSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ userSource, setUserSource ] = useState(0);
    const [ expanded, setExpanded ] = useState(false);
    const { trigger = null, setIntParams = null, setStringParam = null, furniIds = [] } = useWired() as any;

    const data = useMemo(() => parseWiredData<CancelTransactionData>(trigger?.stringData ?? ''), [ trigger ]);
    const selectedCount = Array.isArray(furniIds) ? furniIds.length : 0;
    const selectionLimit = trigger?.maximumItemSelectionCount ?? 20;
    const optionLabels = sourceOptionLabels(selectedCount, selectionLimit);
    const matchContracts = matchCriteria === MATCH_CONTRACTS;

    const sourceSelectors: WiredSourceSelectorConfig[] = [
        {
            value: contractSource,
            onChange: source => setContractSource(normalizeFurniSource(source)),
            options: CONTRACT_SELECTED_SOURCE_OPTIONS,
            titleKey: 'wiredfurni.params.sources.furni.title',
            labelPrefix: 'wiredfurni.params.sources.furni',
            optionLabels,
            disabled: !matchContracts
        },
        {
            value: userSource,
            onChange: source => setUserSource(normalizeUserSource(source)),
            options: USER_SOURCE_OPTIONS,
            titleKey: 'wiredfurni.params.sources.users.title',
            labelPrefix: 'wiredfurni.params.sources.users'
        }
    ];

    const save = () =>
    {
        setStringParam(JSON.stringify({
            matchCriteria,
            contractSource
        }));
        setIntParams([
            matchCriteria,
            contractSource,
            userSource
        ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];

        setMatchCriteria((intData[0] ?? data.matchCriteria ?? MATCH_ANY) === MATCH_CONTRACTS ? MATCH_CONTRACTS : MATCH_ANY);
        setContractSource(normalizeFurniSource(intData[1] ?? data.contractSource ?? WIRED_SOURCE_SELECTED));
        setUserSource(normalizeUserSource(intData[2] ?? data.userSource ?? 0));
        setExpanded((intData[1] ?? data.contractSource ?? WIRED_SOURCE_SELECTED) !== WIRED_SOURCE_SELECTED || (intData[2] ?? data.userSource ?? 0) !== 0);
    }, [ trigger, data ]);

    return (
        <WiredEffectBaseView
            requiresFurni={ matchContracts && isSelectedFurniSource(contractSource) ? WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT : WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ sourceSelectors }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(value => !value) }>
            <WiredParam titleKey="wiredfurni.params.general_box_info" chevron>
                <WiredInfoDesc textKey="wiredfurni.params.cancel_transaction.usage_info" />
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.cancel_transaction.match_criteria" divider={ false }>
                <WiredRadioGroup
                    name="cancelTransactionMatch"
                    value={ matchCriteria }
                    onChange={ value => setMatchCriteria(Number(value) === MATCH_ANY ? MATCH_ANY : MATCH_CONTRACTS) }
                    options={ [
                        { value: MATCH_CONTRACTS, labelKey: 'wiredfurni.params.cancel_transaction.match_criteria.0' },
                        { value: MATCH_ANY, labelKey: 'wiredfurni.params.cancel_transaction.match_criteria.1' }
                    ] } />
            </WiredParam>
        </WiredEffectBaseView>
    );
}
