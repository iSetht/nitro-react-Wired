import { RoomObjectCategory } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { GetRoomEngine, LocalizeText, WiredFurniType } from '../../../../api';
import { useNotification, useWired } from '../../../../hooks';
import { WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR } from '../WiredControls';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';

const SOURCE_TILE_SELECTOR = 202;
const BASE_SOURCES = [ WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR ];

const INVISIBLE_CLICK_TILES = new Set([
    'room_invisible_click_tile'
]);

export const WiredTriggerAvatarClicksTileView: FC<{}> = props =>
{
    const { trigger = null, setIntParams = null, furniIds = [] } = useWired();
    const { simpleAlert = null } = useNotification();
    const [ furniSource, setFurniSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ expanded, setExpanded ] = useState(false);

    // intData[1] is the hasTilePicks flag sent from the server
    const hasTilePicks = trigger?.intData?.length > 1 && trigger.intData[1] === 1;
    const SOURCES = hasTilePicks ? [ ...BASE_SOURCES, SOURCE_TILE_SELECTOR ] : BASE_SOURCES;

    useEffect(() =>
    {
        if(!trigger) return;

        const saved = trigger.intData?.length > 0 ? trigger.intData[0] : WIRED_SOURCE_SELECTED;
        // Rebuild sources inline to capture the hasTilePicks at effect time
        const hasTilePicksNow = trigger.intData?.length > 1 && trigger.intData[1] === 1;
        const availableSources = hasTilePicksNow ? [ ...BASE_SOURCES, SOURCE_TILE_SELECTOR ] : BASE_SOURCES;
        const valid = availableSources.includes(saved) ? saved : WIRED_SOURCE_SELECTED;

        setFurniSource(valid);
        setExpanded(valid !== WIRED_SOURCE_SELECTED);
    }, [ trigger ]);

    const validate = () =>
    {
        // No furni validation needed when using a tile selector — tiles have no item requirement
        if(furniSource === SOURCE_TILE_SELECTOR) return true;

        for (const furniId of furniIds)
        {
            const roomObject = GetRoomEngine().getRoomObject(
                GetRoomEngine().activeRoomId,
                furniId,
                RoomObjectCategory.FLOOR
            );

            if (!roomObject || !INVISIBLE_CLICK_TILES.has(roomObject.type))
            {
                simpleAlert(LocalizeText('wiredfurni.error.require_click_tiles'));
                return false;
            }
        }

        return true;
    }

    const save = () => setIntParams([ furniSource ]);

    return (
        <WiredTriggerBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_OR_BY_TYPE }
            hasSpecialInput={ true }
            save={ save }
            validate={ validate }
            furniSource={ furniSource }
            onFurniSourceChange={ setFurniSource }
            sourceOptions={ SOURCES }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(v => !v) }
        />
    );
}
