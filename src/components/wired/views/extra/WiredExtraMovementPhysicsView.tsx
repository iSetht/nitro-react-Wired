import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType, WiredSelectionVisualizer } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredBaseView } from '../WiredBaseView';
import { parseWiredData, WiredCheckbox, WiredParam, WIRED_SOURCE_SECONDARY_SELECTED, WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL, WIRED_SOURCE_TRIGGER } from '../WiredControls';

const SOURCE_ROOM_FURNI = 900;
const SOURCE_ROOM_USERS = 900;
const PRIMARY_PICK_ICON = 'wired_furni_picks';
const SECONDARY_PICK_ICON = 'wired_furni_picks2';
const PRIMARY_PICK_COLOR = '#7C8039';
const SECONDARY_PICK_COLOR = '#525892';

const FURNI_SOURCE_OPTIONS = [ SOURCE_ROOM_FURNI, WIRED_SOURCE_TRIGGER, WIRED_SOURCE_SELECTED, WIRED_SOURCE_SECONDARY_SELECTED, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL ];
const USER_SOURCE_OPTIONS = [ SOURCE_ROOM_USERS, WIRED_SOURCE_TRIGGER, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL ];

interface MovementPhysicsData
{
    keepAltitude?: boolean;
    moveThroughFurni?: boolean;
    moveThroughUsers?: boolean;
    blockByFurni?: boolean;
    moveThroughFurniSource?: number;
    blockByFurniSource?: number;
    moveThroughUsersSource?: number;
    secondaryItemIds?: number[];
}

const normalizeFurniSource = (source: number) => FURNI_SOURCE_OPTIONS.includes(source) ? source : SOURCE_ROOM_FURNI;
const normalizeUserSource = (source: number) => USER_SOURCE_OPTIONS.includes(source) ? source : SOURCE_ROOM_USERS;
const uniqueFurniIds = (ids: number[]) => [ ...new Set(ids) ];
const getTriggerFurniIds = (triggerData: any) =>
{
    const ids = triggerData?.selectedItems ?? triggerData?.stuffIds ?? triggerData?.furniIds ?? triggerData?.items ?? [];

    if(!Array.isArray(ids)) return [];

    return ids
        .map(item => (typeof item === 'number') ? item : item?.id)
        .filter(id => typeof id === 'number');
}

export const WiredExtraMovementPhysicsView: FC<{}> = props =>
{
    const [ keepAltitude, setKeepAltitude ] = useState(false);
    const [ moveThroughFurni, setMoveThroughFurni ] = useState(false);
    const [ moveThroughUsers, setMoveThroughUsers ] = useState(false);
    const [ blockByFurni, setBlockByFurni ] = useState(false);
    const [ moveThroughFurniSource, setMoveThroughFurniSource ] = useState(SOURCE_ROOM_FURNI);
    const [ blockByFurniSource, setBlockByFurniSource ] = useState(SOURCE_ROOM_FURNI);
    const [ moveThroughUsersSource, setMoveThroughUsersSource ] = useState(SOURCE_ROOM_USERS);
    const [ activePickSource, setActivePickSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ primaryFurniIds, setPrimaryFurniIds ] = useState<number[]>([]);
    const [ secondaryItemIds, setSecondaryItemIds ] = useState<number[]>([]);
    const [ sourceExpanded, setSourceExpanded ] = useState(true);
    const { trigger = null, setIntParams = null, furniIds = [], setFurniIds = null } = useWired() as any;

    const data = useMemo(() => parseWiredData<MovementPhysicsData>(trigger?.stringData ?? ''), [ trigger ]);
    const initialPrimaryIds = useMemo(() => getTriggerFurniIds(trigger), [ trigger ]);
    const selectedCount = primaryFurniIds.length;
    const secondaryCount = secondaryItemIds.length;
    const selectionLimit = trigger?.maximumItemSelectionCount ?? 20;
    const sourceOptionLabels = {
        [WIRED_SOURCE_SELECTED]: `${ LocalizeText('wiredfurni.params.sources.furni.100') } [${ selectedCount }/${ selectionLimit }]`,
        [WIRED_SOURCE_SECONDARY_SELECTED]: `${ LocalizeText('wiredfurni.params.sources.furni.101') } [${ secondaryCount }/${ selectionLimit }]`
    };

    const save = () => setIntParams([
        keepAltitude ? 1 : 0,
        moveThroughFurni ? 1 : 0,
        moveThroughUsers ? 1 : 0,
        blockByFurni ? 1 : 0,
        normalizeFurniSource(moveThroughFurniSource),
        normalizeFurniSource(blockByFurniSource),
        normalizeUserSource(moveThroughUsersSource),
        secondaryItemIds.length,
        ...secondaryItemIds
    ]);

    const clearAndApplyFurniSelection = (nextFurniIds: number[], previousFurniIds: number[] = []) =>
    {
        WiredSelectionVisualizer.clearSelectionShaderFromFurni(uniqueFurniIds([ ...primaryFurniIds, ...secondaryItemIds, ...previousFurniIds, ...(Array.isArray(furniIds) ? furniIds : []) ]));

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

            if(activePickSource === WIRED_SOURCE_SECONDARY_SELECTED) setSecondaryItemIds(furniIds);
            else setPrimaryFurniIds(furniIds);
        }

        setActivePickSource(source);
        clearAndApplyFurniSelection(source === WIRED_SOURCE_SECONDARY_SELECTED ? secondaryItemIds : primaryFurniIds, previousFurniIds);
    }

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
                variant: 'secondary'
            } ];
        }

        return [];
    }

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];
        const secondaryCount = Math.max(0, intData[7] ?? data.secondaryItemIds?.length ?? 0);
        const savedSecondaryIds = secondaryCount > 0 ? intData.slice(8, 8 + secondaryCount) : (data.secondaryItemIds ?? []);

        setKeepAltitude((intData[0] ?? (data.keepAltitude ? 1 : 0)) === 1);
        setMoveThroughFurni((intData[1] ?? (data.moveThroughFurni ? 1 : 0)) === 1);
        setMoveThroughUsers((intData[2] ?? (data.moveThroughUsers ? 1 : 0)) === 1);
        setBlockByFurni((intData[3] ?? (data.blockByFurni ? 1 : 0)) === 1);
        setMoveThroughFurniSource(normalizeFurniSource(intData[4] ?? data.moveThroughFurniSource ?? SOURCE_ROOM_FURNI));
        setBlockByFurniSource(normalizeFurniSource(intData[5] ?? data.blockByFurniSource ?? SOURCE_ROOM_FURNI));
        setMoveThroughUsersSource(normalizeUserSource(intData[6] ?? data.moveThroughUsersSource ?? SOURCE_ROOM_USERS));
        setPrimaryFurniIds(initialPrimaryIds);
        setSecondaryItemIds(savedSecondaryIds);
        setActivePickSource(WIRED_SOURCE_SELECTED);

        WiredSelectionVisualizer.clearSelectionShaderFromFurni(uniqueFurniIds([ ...initialPrimaryIds, ...savedSecondaryIds ]));
        if(initialPrimaryIds.length) WiredSelectionVisualizer.applySelectionShaderToFurni(initialPrimaryIds);
        if(setFurniIds) setFurniIds(initialPrimaryIds);
    }, [ trigger, data, initialPrimaryIds, setFurniIds ]);

    useEffect(() =>
    {
        if(!Array.isArray(furniIds)) return;

        if(activePickSource === WIRED_SOURCE_SECONDARY_SELECTED)
        {
            setSecondaryItemIds(furniIds);
            return;
        }

        setPrimaryFurniIds(furniIds);
    }, [ furniIds, activePickSource ]);

    return (
        <WiredBaseView
            wiredType="extra"
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [
                {
                    value: moveThroughFurniSource,
                    onChange: setMoveThroughFurniSource,
                    options: FURNI_SOURCE_OPTIONS,
                    titleKey: 'wiredfurni.params.sources.furni.title.physics.0',
                    labelPrefix: 'wiredfurni.params.sources.furni',
                    optionLabels: sourceOptionLabels,
                    pickers: getPickersForSource(moveThroughFurniSource)
                } as any,
                {
                    value: blockByFurniSource,
                    onChange: setBlockByFurniSource,
                    options: FURNI_SOURCE_OPTIONS,
                    titleKey: 'wiredfurni.params.sources.furni.title.physics.1',
                    labelPrefix: 'wiredfurni.params.sources.furni',
                    optionLabels: sourceOptionLabels,
                    pickers: getPickersForSource(blockByFurniSource)
                } as any,
                {
                    value: moveThroughUsersSource,
                    onChange: setMoveThroughUsersSource,
                    options: USER_SOURCE_OPTIONS,
                    titleKey: 'wiredfurni.params.sources.users.title.physics.0',
                    labelPrefix: 'wiredfurni.params.sources.users'
                } as any
            ] }
            expanded={ sourceExpanded }
            onToggleExpanded={ () => setSourceExpanded(value => !value) }>
            <WiredParam titleKey="wiredfurni.params.select_options" divider={ false }>
                <WiredCheckbox checked={ keepAltitude } onChange={ setKeepAltitude } label={ LocalizeText('wiredfurni.params.movephysics.keep_altitude') } />
                <WiredCheckbox checked={ moveThroughFurni } onChange={ setMoveThroughFurni } label={ LocalizeText('wiredfurni.params.movephysics.move_through_furni') } />
                <WiredCheckbox checked={ moveThroughUsers } onChange={ setMoveThroughUsers } label={ LocalizeText('wiredfurni.params.movephysics.move_through_users') } />
                <WiredCheckbox checked={ blockByFurni } onChange={ setBlockByFurni } label={ LocalizeText('wiredfurni.params.movephysics.block_by_furni') } />
            </WiredParam>
        </WiredBaseView>
    );
}
