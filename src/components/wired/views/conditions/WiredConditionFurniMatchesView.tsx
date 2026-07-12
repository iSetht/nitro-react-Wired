import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType, WiredSelectionVisualizer } from '../../../../api';
import { useWired } from '../../../../hooks';
import {
    WIRED_SOURCE_SECONDARY_SELECTED,
    WIRED_SOURCE_SELECTED,
    WIRED_SOURCE_SELECTOR,
    WIRED_SOURCE_SIGNAL,
    WIRED_SOURCE_TRIGGER,
    WiredInfoDesc,
    WiredParam
} from '../WiredControls';
import { WiredSourceSelectorConfig } from '../WiredFurniSelectorView';
import { useWiredEffectSource } from '../effects/WiredEffectSourceSelector';
import { WiredConditionBaseView } from './WiredConditionBaseView';
import { WIRED_CONDITION_QUANTIFIER_ALL as QUANTIFIER_ALL, WIRED_CONDITION_QUANTIFIER_ANY as QUANTIFIER_ANY, WiredConditionQuantifierSection } from './WiredConditionUtils';

const MAXIMUM_FURNI_SELECTION = 5;
const FURNI_MATCH_SOURCE_OPTIONS = [ WIRED_SOURCE_TRIGGER, WIRED_SOURCE_SELECTED, WIRED_SOURCE_SECONDARY_SELECTED, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL ];
const PRIMARY_PICK_ICON = 'wired_furni_picks';
const SECONDARY_PICK_ICON = 'wired_furni_picks2';

const parseFurniIds = (value: string) =>
{
    if(!value) return [];

    return value.split(/[,;\r\n\t]+/)
        .map(part => parseInt(part, 10))
        .filter(id => !isNaN(id));
}

const getTriggerFurniIds = (triggerData: any) =>
{
    const ids = triggerData?.selectedItems ?? triggerData?.stuffIds ?? triggerData?.furniIds ?? triggerData?.items ?? [];

    if(!Array.isArray(ids)) return [];

    return ids
        .map(item => (typeof item === 'number') ? item : item?.id)
        .filter(id => typeof id === 'number');
}

const uniqueFurniIds = (ids: number[]) => [ ...new Set(ids) ];

export const WiredConditionFurniMatchesView: FC<{ isNegative?: boolean }> = props =>
{
    const { isNegative = false } = props;
    const [ quantifier, setQuantifier ] = useState(QUANTIFIER_ALL);
    const wired = useWired() as any;
    const { trigger = null, setIntParams = null, setStringParam = null, furniIds = null, setFurniIds = null } = wired;
    const initialPrimaryIds = useMemo(() => getTriggerFurniIds(trigger), [ trigger ]);
    const initialSecondaryIds = useMemo(() => parseFurniIds(trigger?.stringData ?? trigger?.stringParam ?? ''), [ trigger ]);
    const [ activePickSource, setActivePickSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ primaryFurniIds, setPrimaryFurniIds ] = useState<number[]>([]);
    const [ secondaryFurniIds, setSecondaryFurniIds ] = useState<number[]>([]);
    const [ matchSource, setMatchSource, matchExpanded, setMatchExpanded ] = useWiredEffectSource(trigger, 1, WIRED_SOURCE_SELECTED, FURNI_MATCH_SOURCE_OPTIONS);
    const [ compareSource, setCompareSource, compareExpanded, setCompareExpanded ] = useWiredEffectSource(trigger, 2, WIRED_SOURCE_SECONDARY_SELECTED, FURNI_MATCH_SOURCE_OPTIONS);
    const expanded = quantifier !== QUANTIFIER_ALL || matchExpanded || compareExpanded;

    const clearAndApplyFurniSelection = (nextFurniIds: number[], previousFurniIds: number[] = []) =>
    {
        WiredSelectionVisualizer.clearSelectionShaderFromFurni(uniqueFurniIds([ ...primaryFurniIds, ...secondaryFurniIds, ...previousFurniIds, ...(Array.isArray(furniIds) ? furniIds : []) ]));

        if(nextFurniIds.length) WiredSelectionVisualizer.applySelectionShaderToFurni(nextFurniIds);
        if(setFurniIds) setFurniIds(nextFurniIds);
    }

    const selectPickSource = (source: number) =>
    {
        if(activePickSource === source) return;

        let previousFurniIds: number[] = [];

        if(Array.isArray(furniIds))
        {
            previousFurniIds = furniIds;

            if(activePickSource === WIRED_SOURCE_SECONDARY_SELECTED) setSecondaryFurniIds(furniIds);
            else setPrimaryFurniIds(furniIds);
        }

        setActivePickSource(source);
        clearAndApplyFurniSelection(source === WIRED_SOURCE_SECONDARY_SELECTED ? secondaryFurniIds : primaryFurniIds, previousFurniIds);
    }

    const selectedCount = primaryFurniIds.length;
    const secondaryCount = secondaryFurniIds.length;
    const sourceOptionLabels = {
        [WIRED_SOURCE_SELECTED]: `${ LocalizeText('wiredfurni.params.sources.furni.100') } [${ selectedCount }/${ MAXIMUM_FURNI_SELECTION }]`,
        [WIRED_SOURCE_SECONDARY_SELECTED]: `${ LocalizeText('wiredfurni.params.sources.furni.101') } [${ secondaryCount }/${ MAXIMUM_FURNI_SELECTION }]`
    };
    const getPickersForSource = (source: number) =>
    {
        if(source === WIRED_SOURCE_SELECTED)
        {
            return [ {
                source: WIRED_SOURCE_SELECTED,
                icon: PRIMARY_PICK_ICON,
                color: '#7C8039',
                selected: activePickSource === WIRED_SOURCE_SELECTED,
                onClick: () => selectPickSource(WIRED_SOURCE_SELECTED),
                variant: 'selected' as const
            } ];
        }

        if(source === WIRED_SOURCE_SECONDARY_SELECTED)
        {
            return [ {
                source: WIRED_SOURCE_SECONDARY_SELECTED,
                icon: SECONDARY_PICK_ICON,
                color: '#525892',
                selected: activePickSource === WIRED_SOURCE_SECONDARY_SELECTED,
                onClick: () => selectPickSource(WIRED_SOURCE_SECONDARY_SELECTED),
                variant: 'secondary' as const
            } ];
        }

        return [];
    }

    const save = () =>
    {
        let savedPrimaryIds = primaryFurniIds;
        let savedSecondaryIds = secondaryFurniIds;

        if(Array.isArray(furniIds))
        {
            if(activePickSource === WIRED_SOURCE_SECONDARY_SELECTED) savedSecondaryIds = furniIds;
            else savedPrimaryIds = furniIds;
        }

        if(setFurniIds) setFurniIds(savedPrimaryIds);
        if(setStringParam) setStringParam(savedSecondaryIds.join(','));
        setIntParams([ quantifier, matchSource, compareSource ]);
        WiredSelectionVisualizer.clearSelectionShaderFromFurni(uniqueFurniIds([ ...savedPrimaryIds, ...savedSecondaryIds ]));
    };

    useEffect(() =>
    {
        if(!trigger) return;

        setQuantifier((trigger.intData?.[0] ?? QUANTIFIER_ALL) === QUANTIFIER_ANY ? QUANTIFIER_ANY : QUANTIFIER_ALL);
        setPrimaryFurniIds(initialPrimaryIds);
        setSecondaryFurniIds(initialSecondaryIds);
        setActivePickSource(WIRED_SOURCE_SELECTED);
        WiredSelectionVisualizer.clearSelectionShaderFromFurni(uniqueFurniIds([ ...initialPrimaryIds, ...initialSecondaryIds ]));
        if(initialPrimaryIds.length) WiredSelectionVisualizer.applySelectionShaderToFurni(initialPrimaryIds);
        if(setFurniIds) setFurniIds(initialPrimaryIds);
    }, [ trigger, initialPrimaryIds, initialSecondaryIds, setFurniIds ]);

    useEffect(() =>
    {
        if(!Array.isArray(furniIds)) return;

        if(activePickSource === WIRED_SOURCE_SECONDARY_SELECTED)
        {
            setSecondaryFurniIds(furniIds);
            return;
        }

        setPrimaryFurniIds(furniIds);
    }, [ furniIds, activePickSource ]);

    const quantifierSlot = (
        <WiredConditionQuantifierSection kind="furni" name="furniMatchQuantifier" value={ quantifier } onChange={ setQuantifier } negative={ isNegative } />
    );

    const matchSourceSelector: WiredSourceSelectorConfig = {
        value: matchSource,
        onChange: setMatchSource,
        options: FURNI_MATCH_SOURCE_OPTIONS,
        titleKey: 'wiredfurni.params.sources.furni.title.match.0',
        labelPrefix: 'wiredfurni.params.sources.furni',
        optionLabels: sourceOptionLabels,
        pickers: getPickersForSource(matchSource)
    };

    const compareSourceSelector: WiredSourceSelectorConfig = {
        value: compareSource,
        onChange: setCompareSource,
        options: FURNI_MATCH_SOURCE_OPTIONS,
        titleKey: 'wiredfurni.params.sources.furni.title.match.1',
        labelPrefix: 'wiredfurni.params.sources.furni',
        optionLabels: sourceOptionLabels,
        pickers: getPickersForSource(compareSource)
    };

    return (
        <WiredConditionBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT }
            hasSpecialInput={ true }
            save={ save }
            hideFurniSelector={ true }
            sourceSelectors={ [ matchSourceSelector, compareSourceSelector ] }
            advancedSlot={ quantifierSlot }
            alwaysExpandedSources={ true }
            expanded={ expanded }
            onToggleExpanded={ () =>
            {
                const next = !expanded;
                setMatchExpanded(next);
                setCompareExpanded(next);
            } }>
            <WiredParam title={ LocalizeText('wiredfurni.pickfurnis.caption', [ 'count', 'limit' ], [ selectedCount.toString(), MAXIMUM_FURNI_SELECTION.toString() ]) } divider={ false }>
                <WiredInfoDesc textKey="wiredfurni.pickfurnis.desc" />
            </WiredParam>
        </WiredConditionBaseView>
    );
}
