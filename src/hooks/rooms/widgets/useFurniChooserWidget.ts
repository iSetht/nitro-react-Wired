import { RoomObjectCategory, RoomObjectVariable } from '@nitrots/nitro-renderer';
import { useState } from 'react';
import { GetRoomEngine, GetRoomSession, GetSessionDataManager, LocalizeText, RoomObjectItem } from '../../../api';
import { useFurniAddedEvent, useFurniRemovedEvent } from '../engine';
import { useRoom } from '../useRoom';

const useFurniChooserWidgetState = () =>
{
    const [ items, setItems ] = useState<RoomObjectItem[]>(null);
    const { roomSession = null } = useRoom();

    const onClose = () => setItems(null);

    const selectItem = (item: RoomObjectItem) =>
        {
            if (!item) return;
        
            const roomId = GetRoomSession().roomId;
            const roomEngine = GetRoomEngine();
        
            roomEngine.selectRoomObject(roomId, item.id, item.category);
        };
                     
        const buildRoomObjectItem = (roomObject, category): RoomObjectItem =>
            {
                if (!roomObject || roomObject.id < 0) return null;
            
                const sessionDataManager = GetSessionDataManager();
                let name = roomObject.type;
            
                const typeId = roomObject.model.getValue(RoomObjectVariable.FURNITURE_TYPE_ID) as number;
                const ownerId = roomObject.model.getValue(RoomObjectVariable.FURNITURE_OWNER_ID) as number;
                const ownerName = roomObject.model.getValue(RoomObjectVariable.FURNITURE_OWNER_NAME) as string ?? '-';
            
                if (name.startsWith('poster'))
                {
                    name = LocalizeText(`poster_${ name.replace('poster', '') }_name`);
                }
                else
                {
                    const furniData = (category === RoomObjectCategory.FLOOR)
                        ? sessionDataManager.getFloorItemData(typeId)
                        : sessionDataManager.getWallItemData(typeId);
            
                    if (furniData && furniData.name.length) name = furniData.name;
                }
            
                return new RoomObjectItem(roomObject.id, category, name, ownerId, ownerName);
            };                        

    const populateChooser = () =>
    {
        const wallObjects = GetRoomEngine().getRoomObjects(roomSession.roomId, RoomObjectCategory.WALL);
        const floorObjects = GetRoomEngine().getRoomObjects(roomSession.roomId, RoomObjectCategory.FLOOR);

        const wallItems = wallObjects.map(obj => buildRoomObjectItem(obj, RoomObjectCategory.WALL)).filter(Boolean);
        const floorItems = floorObjects.map(obj => buildRoomObjectItem(obj, RoomObjectCategory.FLOOR)).filter(Boolean);

        setItems([ ...wallItems, ...floorItems ].sort((a, b) => ((a.name < b.name) ? -1 : 1)));
    }

    useFurniAddedEvent(!!items, event =>
    {
        const roomObject = GetRoomEngine().getRoomObject(GetRoomSession().roomId, event.id, event.category);
        const item = buildRoomObjectItem(roomObject, event.category);

        if(!item) return;

        setItems(prev => [ ...prev, item ].sort((a, b) => ((a.name < b.name) ? -1 : 1)));
    });

    useFurniRemovedEvent(!!items, event =>
    {
        if(event.id < 0) return;

        setItems(prev =>
        {
            const newValue = [ ...prev ];

            for(let i = 0; i < newValue.length; i++)
            {
                const existingValue = newValue[i];

                if((existingValue.id !== event.id) || (existingValue.category !== event.category)) continue;

                newValue.splice(i, 1);
                break;
            }

            return newValue;
        });
    });

    return { items, onClose, selectItem, populateChooser };
}

export const useFurniChooserWidget = useFurniChooserWidgetState;
