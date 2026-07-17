import { HighScoreDataType, ObjectDataFactory, RoomEngineTriggerWidgetEvent, RoomObjectVariable } from '@nitrots/nitro-renderer';
import { useEffect, useState } from 'react';
import { GetRoomEngine } from '../../../../api';
import { useRoomEngineEvent } from '../../../events';
import { useRoom } from '../../useRoom';

const SCORE_TYPES = [ 'perteam', 'mostwins', 'classic' ];
const CLEAR_TYPES = [ 'alltime', 'daily', 'weekly', 'monthly' ];

const useFurnitureHighScoreWidgetState = () =>
{
    const [ stuffDatas, setStuffDatas ] = useState<Map<number, HighScoreDataType>>(new Map());
    const { roomSession = null } = useRoom();

    const getScoreType = (type: number) => SCORE_TYPES[type];
    const getClearType = (type: number) => CLEAR_TYPES[type];

    useEffect(() =>
    {
        setStuffDatas(new Map());
    }, [ roomSession?.roomId ]);

    const refreshStuffData = (roomId: number, objectId: number, category: number) =>
    {
        const roomObject = GetRoomEngine().getRoomObject(roomId, objectId, category);
    
        if(!roomObject) return;

        const formatKey = roomObject.model.getValue<number>(RoomObjectVariable.FURNITURE_DATA_FORMAT);
        const stuffData = (ObjectDataFactory.getData(formatKey) as HighScoreDataType);

        stuffData.initializeFromRoomObjectModel(roomObject.model);
        stuffData.setLegacyString(roomObject.getState(0).toString());

        setStuffDatas(prevValue =>
        {
            const newValue = new Map(prevValue);

            newValue.set(roomObject.id, stuffData);

            return newValue;
        });
    }

    useRoomEngineEvent<RoomEngineTriggerWidgetEvent>(RoomEngineTriggerWidgetEvent.REQUEST_HIGH_SCORE_DISPLAY, event =>
    {
        if(!roomSession || (event.roomId !== roomSession.roomId)) return;

        refreshStuffData(event.roomId, event.objectId, event.category);
    });

    useRoomEngineEvent<RoomEngineTriggerWidgetEvent>(RoomEngineTriggerWidgetEvent.REQUEST_HIDE_HIGH_SCORE_DISPLAY, event =>
    {
        if(roomSession && (event.roomId !== roomSession.roomId)) return;

        setStuffDatas(prevValue =>
        {
            const newValue = new Map(prevValue);

            newValue.delete(event.objectId);

            return newValue;
        });
    });

    return { stuffDatas, getScoreType, getClearType };
}

export const useFurnitureHighScoreWidget = useFurnitureHighScoreWidgetState;
