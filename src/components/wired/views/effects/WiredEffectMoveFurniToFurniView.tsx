import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType, WiredSelectionVisualizer } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { FURNI_TILE_SOURCE_OPTIONS_WITH_TRIGGERING, useWiredEffectSource } from './WiredEffectSourceSelector';
import { WIRED_SOURCE_SECONDARY_SELECTED, WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL, WIRED_SOURCE_TRIGGER } from '../WiredControls';

const MAXIMUM_FURNI_SELECTION = 5;

const FURNI_TO_FURNI_SOURCE_OPTIONS = [ WIRED_SOURCE_TRIGGER, WIRED_SOURCE_SELECTED, WIRED_SOURCE_SECONDARY_SELECTED, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL ];
const FURNI_TO_FURNI_TARGET_SOURCE_OPTIONS = [
    WIRED_SOURCE_TRIGGER,
    WIRED_SOURCE_SELECTED,
    WIRED_SOURCE_SECONDARY_SELECTED,
    ...FURNI_TILE_SOURCE_OPTIONS_WITH_TRIGGERING.filter(source => source !== WIRED_SOURCE_SELECTED && source !== WIRED_SOURCE_TRIGGER)
];
const PRIMARY_PICK_COLOR = '#7C8039';
const SECONDARY_PICK_COLOR = '#525892';
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

export const WiredEffectMoveFurniToFurniView: FC<{}> = props =>
{
    const wired = useWired() as any;
    const {
        trigger = null,
        setIntParams = null,
        setStringParam = null,
        furniIds = null,
        setFurniIds = null
    } = wired;
    const triggerData = trigger as any;
    const initialPrimaryIds = useMemo(() => getTriggerFurniIds(triggerData), [ triggerData ]);
    const initialSecondaryIds = useMemo(() => parseFurniIds(triggerData?.stringData ?? triggerData?.stringParam ?? ''), [ triggerData ]);
    const [ activePickSource, setActivePickSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ primaryFurniIds, setPrimaryFurniIds ] = useState<number[]>([]);
    const [ secondaryFurniIds, setSecondaryFurniIds ] = useState<number[]>([]);

    const [ movingFurniSource, setMovingFurniSource, movingFurniExpanded, setMovingFurniExpanded ] =
        useWiredEffectSource(trigger, 0, WIRED_SOURCE_TRIGGER, FURNI_TO_FURNI_SOURCE_OPTIONS);

    const [ targetFurniSource, setTargetFurniSource, targetFurniExpanded, setTargetFurniExpanded ] =
        useWiredEffectSource(trigger, 1, WIRED_SOURCE_SELECTED, FURNI_TO_FURNI_TARGET_SOURCE_OPTIONS);

    const expanded = movingFurniExpanded || targetFurniExpanded;
    const clearAndApplyFurniSelection = (nextFurniIds: number[], previousFurniIds: number[] = []) =>
    {
        WiredSelectionVisualizer.clearSelectionShaderFromFurni(uniqueFurniIds([ ...primaryFurniIds, ...secondaryFurniIds, ...previousFurniIds, ...(Array.isArray(furniIds) ? furniIds : []) ]));

        if(nextFurniIds.length) WiredSelectionVisualizer.applySelectionShaderToFurni(nextFurniIds);
        if(setFurniIds) setFurniIds(nextFurniIds);
    }

    useEffect(() =>
    {
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
                color: PRIMARY_PICK_COLOR,
                selected: activePickSource === WIRED_SOURCE_SELECTED,
                onClick: () => selectPickSource(WIRED_SOURCE_SELECTED),
                count: selectedCount,
                max: MAXIMUM_FURNI_SELECTION,
                variant: 'selected'
            } ];
        }

        if(source === WIRED_SOURCE_SECONDARY_SELECTED)
        {
            return [ {
                source: WIRED_SOURCE_SECONDARY_SELECTED,
                icon: SECONDARY_PICK_ICON,
                color: SECONDARY_PICK_COLOR,
                selected: activePickSource === WIRED_SOURCE_SECONDARY_SELECTED,
                onClick: () => selectPickSource(WIRED_SOURCE_SECONDARY_SELECTED),
                count: secondaryCount,
                max: MAXIMUM_FURNI_SELECTION,
                variant: 'secondary'
            } ];
        }

        return [];
    }
    const sourceSelectors = [
        {
            value: movingFurniSource,
            onChange: setMovingFurniSource,
            options: FURNI_TO_FURNI_SOURCE_OPTIONS,
            titleKey: 'wiredfurni.params.sources.furni.title.mv.0',
            labelPrefix: 'wiredfurni.params.sources.furni',
            optionLabels: sourceOptionLabels,
            pickers: getPickersForSource(movingFurniSource)
        },
        {
            value: targetFurniSource,
            onChange: setTargetFurniSource,
            options: FURNI_TO_FURNI_TARGET_SOURCE_OPTIONS,
            titleKey: 'wiredfurni.params.sources.furni.title.mv.1',
            labelPrefix: 'wiredfurni.params.sources.furni',
            optionLabels: sourceOptionLabels,
            pickers: getPickersForSource(targetFurniSource)
        }
    ] as any;

    const save = () =>
    {
        if(Array.isArray(furniIds))
        {
            if(activePickSource === WIRED_SOURCE_SECONDARY_SELECTED) setSecondaryFurniIds(furniIds);
            else setPrimaryFurniIds(furniIds);
        }

        const savedPrimaryIds = (activePickSource === WIRED_SOURCE_SELECTED && Array.isArray(furniIds)) ? furniIds : primaryFurniIds;
        const savedSecondaryIds = (activePickSource === WIRED_SOURCE_SECONDARY_SELECTED && Array.isArray(furniIds)) ? furniIds : secondaryFurniIds;

        if(setFurniIds) setFurniIds(savedPrimaryIds);
        setStringParam(savedSecondaryIds.join(','));
        setIntParams([
            movingFurniSource,
            targetFurniSource,
            savedPrimaryIds.length,
            ...savedPrimaryIds,
            savedSecondaryIds.length,
            ...savedSecondaryIds
        ]);

        WiredSelectionVisualizer.clearSelectionShaderFromFurni(uniqueFurniIds([ ...savedPrimaryIds, ...savedSecondaryIds ]));
    }

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT }
            hasSpecialInput={ true }
            save={ save }
            hideFurniSelector={ true }
            sourceSelectors={ sourceSelectors }
            alwaysExpandedSources={ true }
            expanded={ expanded }
            onToggleExpanded={ () =>
            {
                setMovingFurniExpanded(!expanded);
                setTargetFurniExpanded(!expanded);
            } } />
    );
}
