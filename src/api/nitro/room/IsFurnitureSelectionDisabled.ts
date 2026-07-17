import { RoomEngineObjectEvent, RoomObjectCategory, RoomObjectVariable } from '@nitrots/nitro-renderer';
import { GetSessionDataManager } from '../..';
import { GetRoomEngine } from './GetRoomEngine';
import { GetWiredClickSettings } from './WiredClickSettings';

export function IsFurnitureSelectionDisabled(event: RoomEngineObjectEvent): boolean
{
    let result = false;
    const clickSettings = GetWiredClickSettings();

    if(clickSettings.active && ((event.category === RoomObjectCategory.FLOOR) || (event.category === RoomObjectCategory.WALL)) && (clickSettings.furniMode === 1)) return true;

    const roomObject = GetRoomEngine().getRoomObject(event.roomId, event.objectId, event.category);

    if(roomObject)
    {
        const selectionDisabled = (roomObject.model.getValue<number>(RoomObjectVariable.FURNITURE_SELECTION_DISABLED) === 1);

        if(selectionDisabled)
        {
            result = true;

            if(GetSessionDataManager().isModerator) result = false;
        }
    }

    return result;
}
