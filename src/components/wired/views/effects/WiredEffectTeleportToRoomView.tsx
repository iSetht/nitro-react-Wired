import { RoomObjectCategory } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { GetRoomEngine, LocalizeText, WiredFurniType } from '../../../../api';
import { useNotification, useWired } from '../../../../hooks';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { createUserSourceSelector, useWiredEffectSource, USER_SOURCE_OPTIONS } from './WiredEffectSourceSelector';
import { WIRED_SOURCE_TRIGGER } from '../WiredControls';

const ROOM_LINKER = 'wf_room_linker';

export const WiredEffectTeleportToRoomView: FC<{}> = props =>
{
    const { trigger = null, setIntParams = null, furniIds = [] } = useWired();
    const { simpleAlert = null } = useNotification();
    const [ userSource, setUserSource, expanded, setExpanded ] = useWiredEffectSource(trigger, 0, WIRED_SOURCE_TRIGGER, USER_SOURCE_OPTIONS);

    const validate = () =>
    {
        for (const furniId of furniIds)
        {
            const roomObject = GetRoomEngine().getRoomObject(
                GetRoomEngine().activeRoomId,
                furniId,
                RoomObjectCategory.FLOOR
            );

            if (!roomObject || roomObject.type !== ROOM_LINKER)
            {
                simpleAlert(LocalizeText('wiredfurni.error.require_room_linker'));
                return false;
            }
        }

        return true;
    }

    const save = () => setIntParams([ userSource ]);

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT }
            hasSpecialInput={ true }
            save={ save }
            validate={ validate }
            sourceSelectors={ [ createUserSourceSelector(userSource, setUserSource) ] }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(value => !value) } />
    );
}
