import { RoomObjectCategory } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { GetRoomEngine, LocalizeText, WiredFurniType, WiredSelectionVisualizer } from '../../../../api';
import { useNotification, useWired } from '../../../../hooks';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { useWiredEffectSource } from './WiredEffectSourceSelector';
import {
    WiredCheckbox,
    WiredParam,
    WIRED_SOURCE_SELECTED,
    WIRED_SOURCE_SECONDARY_SELECTED,
    WIRED_SOURCE_SELECTOR,
    WIRED_SOURCE_SIGNAL,
    WIRED_SOURCE_TRIGGER
} from '../WiredControls';

const MAXIMUM_FURNI_SELECTION = 5;

const ANTENNA_SOURCE_OPTIONS = [ WIRED_SOURCE_SELECTED, WIRED_SOURCE_SECONDARY_SELECTED, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL, WIRED_SOURCE_TRIGGER ];
const FURNI_FORWARD_SOURCE_OPTIONS = [ WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL, WIRED_SOURCE_TRIGGER, WIRED_SOURCE_SELECTED, WIRED_SOURCE_SECONDARY_SELECTED ];
const USER_FORWARD_SOURCE_OPTIONS = [ WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL, WIRED_SOURCE_TRIGGER ];
const PRIMARY_PICK_ICON = 'wired_furni_picks';
const SECONDARY_PICK_ICON = 'wired_furni_picks2';

const isAntenna = (type: string) => !!type && type.startsWith('wf_antenna');

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

export const WiredEffectSendSignalView: FC<{}> = props =>
{
    const wired = useWired() as any;
    const {
        trigger = null,
        setIntParams = null,
        setStringParam = null,
        furniIds = null,
        setFurniIds = null
    } = wired;
    const { simpleAlert = null } = useNotification();
    const triggerData = trigger as any;
    const initialPrimaryIds = useMemo(() => getTriggerFurniIds(triggerData), [ triggerData ]);
    const initialSecondaryIds = useMemo(() => parseFurniIds(triggerData?.stringData ?? triggerData?.stringParam ?? ''), [ triggerData ]);
    const [ splitFurni, setSplitFurni ] = useState(false);
    const [ splitUsers, setSplitUsers ] = useState(false);
    const [ activePickSource, setActivePickSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ primaryFurniIds, setPrimaryFurniIds ] = useState<number[]>([]);
    const [ secondaryFurniIds, setSecondaryFurniIds ] = useState<number[]>([]);

    const [ antennaSource, setAntennaSource, antennaExpanded, setAntennaExpanded ] =
        useWiredEffectSource(trigger, 2, WIRED_SOURCE_SELECTED, ANTENNA_SOURCE_OPTIONS);

    const [ furniForwardSource, setFurniForwardSource, furniExpanded, setFurniExpanded ] =
        useWiredEffectSource(trigger, 3, WIRED_SOURCE_SELECTOR, FURNI_FORWARD_SOURCE_OPTIONS);

    const [ userForwardSource, setUserForwardSource, userExpanded, setUserExpanded ] =
        useWiredEffectSource(trigger, 4, WIRED_SOURCE_SELECTOR, USER_FORWARD_SOURCE_OPTIONS);

    const expanded = antennaExpanded || furniExpanded || userExpanded;

    useEffect(() =>
    {
        setSplitFurni((trigger?.intData?.length > 0) ? trigger.intData[0] === 1 : false);
        setSplitUsers((trigger?.intData?.length > 1) ? trigger.intData[1] === 1 : false);
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
                variant: 'selected',
                selected: activePickSource === WIRED_SOURCE_SELECTED,
                onClick: () => selectPickSource(WIRED_SOURCE_SELECTED),
                count: selectedCount,
                max: MAXIMUM_FURNI_SELECTION
            } ];
        }

        if(source === WIRED_SOURCE_SECONDARY_SELECTED)
        {
            return [ {
                source: WIRED_SOURCE_SECONDARY_SELECTED,
                icon: SECONDARY_PICK_ICON,
                color: '#525892',
                variant: 'secondary',
                selected: activePickSource === WIRED_SOURCE_SECONDARY_SELECTED,
                onClick: () => selectPickSource(WIRED_SOURCE_SECONDARY_SELECTED),
                count: secondaryCount,
                max: MAXIMUM_FURNI_SELECTION
            } ];
        }

        return [];
    }

    const sourceSelectors = [
        {
            value: antennaSource,
            onChange: setAntennaSource,
            options: ANTENNA_SOURCE_OPTIONS,
            titleKey: 'wiredfurni.params.sources.furni.title.signal_antenna',
            labelPrefix: 'wiredfurni.params.sources.furni',
            optionLabels: sourceOptionLabels,
            pickers: getPickersForSource(antennaSource)
        },
        {
            value: furniForwardSource,
            onChange: setFurniForwardSource,
            options: FURNI_FORWARD_SOURCE_OPTIONS,
            titleKey: 'wiredfurni.params.sources.furni.title.signal_forward',
            labelPrefix: 'wiredfurni.params.sources.furni',
            optionLabels: sourceOptionLabels,
            pickers: getPickersForSource(furniForwardSource)
        },
        {
            value: userForwardSource,
            onChange: setUserForwardSource,
            options: USER_FORWARD_SOURCE_OPTIONS,
            titleKey: 'wiredfurni.params.sources.users.title.signal_forward',
            labelPrefix: 'wiredfurni.params.sources.users'
        }
    ] as any;

    const getSavedAntennaIds = () =>
    {
        const savedPrimaryIds = (activePickSource === WIRED_SOURCE_SELECTED && Array.isArray(furniIds)) ? furniIds : primaryFurniIds;
        const savedSecondaryIds = (activePickSource === WIRED_SOURCE_SECONDARY_SELECTED && Array.isArray(furniIds)) ? furniIds : secondaryFurniIds;

        return { savedPrimaryIds, savedSecondaryIds };
    }

    const validate = () =>
    {
        const { savedPrimaryIds, savedSecondaryIds } = getSavedAntennaIds();

        for(const furniId of uniqueFurniIds([ ...savedPrimaryIds, ...savedSecondaryIds ]))
        {
            const roomObject = GetRoomEngine().getRoomObject(
                GetRoomEngine().activeRoomId,
                furniId,
                RoomObjectCategory.FLOOR
            );

            if(!roomObject || !isAntenna(roomObject.type))
            {
                simpleAlert(LocalizeText('wiredfurni.error.require_signal_antennas'));
                return false;
            }
        }

        return true;
    }

    const save = () =>
    {
        if(Array.isArray(furniIds))
        {
            if(activePickSource === WIRED_SOURCE_SECONDARY_SELECTED) setSecondaryFurniIds(furniIds);
            else setPrimaryFurniIds(furniIds);
        }

        const { savedPrimaryIds, savedSecondaryIds } = getSavedAntennaIds();

        if(setFurniIds) setFurniIds(savedPrimaryIds);
        setStringParam(savedSecondaryIds.join(','));
        setIntParams([
            splitFurni ? 1 : 0,
            splitUsers ? 1 : 0,
            antennaSource,
            furniForwardSource,
            userForwardSource,
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
            validate={ validate }
            sourceSelectors={ sourceSelectors }
            expanded={ expanded }
            onToggleExpanded={ () =>
            {
                setAntennaExpanded(!expanded);
                setFurniExpanded(!expanded);
                setUserExpanded(!expanded);
            } }>
            <WiredParam titleKey="wiredfurni.params.signal.send_options" divider={ false }>
                <WiredCheckbox checked={ splitFurni } onChange={ setSplitFurni } label={ LocalizeText('wiredfurni.params.signal.split_furni') } />
                <WiredCheckbox checked={ splitUsers } onChange={ setSplitUsers } label={ LocalizeText('wiredfurni.params.signal.split_users') } />
            </WiredParam>
        </WiredEffectBaseView>
    );
}
