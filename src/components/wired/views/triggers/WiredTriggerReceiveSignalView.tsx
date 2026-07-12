import { RoomObjectCategory } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { GetRoomEngine, LocalizeText, WiredFurniType } from '../../../../api';
import { useNotification, useWired } from '../../../../hooks';
import { WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL } from '../WiredControls';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';

const SOURCES = [ WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL ];

const isAntenna = (type: string) => !!type && type.startsWith('wf_antenna');

export const WiredTriggerReceiveSignalView: FC<{}> = props =>
{
    const { trigger = null, setIntParams = null, furniIds = [] } = useWired();
    const { simpleAlert = null } = useNotification();
    const [ furniSource, setFurniSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ expanded, setExpanded ] = useState(false);

    useEffect(() =>
    {
        if(!trigger) return;

        const saved = trigger.intData?.length > 0 ? trigger.intData[0] : WIRED_SOURCE_SELECTED;
        const valid = SOURCES.includes(saved) ? saved : WIRED_SOURCE_SELECTED;

        setFurniSource(valid);
        setExpanded(valid !== WIRED_SOURCE_SELECTED);
    }, [ trigger ]);

    const validate = () =>
    {
        for(const furniId of furniIds)
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
