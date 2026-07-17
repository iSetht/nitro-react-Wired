import { FC, useEffect, useState } from 'react';
import { GetRoomEngine, LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredButton, WiredParam, WiredSelect } from '../WiredControls';
import { WiredSelectorBaseView } from './WiredSelectorBaseView';

const DEFAULT_HAND_ITEMS = [ 0, 2, 5, 7, 8, 9, 10, 27 ];
const ROOM_OBJECT_CATEGORY_UNIT = 100;
const FIGURE_CARRY_OBJECT = 'figure_carry_object';

const normalizeHandItem = (value: number) => isNaN(value) ? 0 : Math.max(0, Math.floor(value));

export const WiredSelectorUserWithHanditemView: FC<{}> = props =>
{
    const [ handItem, setHandItem ] = useState(0);
    const [ handItems, setHandItems ] = useState(DEFAULT_HAND_ITEMS);
    const { trigger = null, setIntParams = null } = useWired();

    const save = (filterExistingSelection = false, invert = false) =>
    {
        setIntParams([
            handItem,
            filterExistingSelection ? 1 : 0,
            invert ? 1 : 0
        ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        const savedHandItem = normalizeHandItem((trigger.intData.length > 0) ? trigger.intData[0] : 0);

        setHandItem(savedHandItem);
        setHandItems(values => values.includes(savedHandItem) ? values : [ ...values, savedHandItem ]);
    }, [ trigger ]);

    const captureHandItem = () =>
    {
        const roomEngine = GetRoomEngine();
        const roomId = roomEngine?.activeRoomId ?? -1;
        const roomSession = (roomEngine as any)?._roomSessionManager?.getSession?.(roomId);
        const ownRoomIndex = roomSession?.ownRoomIndex ?? -1;
        const roomObject = roomEngine?.getRoomObject(roomId, ownRoomIndex, ROOM_OBJECT_CATEGORY_UNIT);
        const capturedHandItem = normalizeHandItem(Number(roomObject?.model?.getValue?.(FIGURE_CARRY_OBJECT) || 0));

        setHandItem(capturedHandItem);
        setHandItems(values => values.includes(capturedHandItem) ? values : [ ...values, capturedHandItem ]);
    };

    return (
        <WiredSelectorBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            showSelectorOptions={ true }
            selectorOptionOffset={ 1 }
        >
            <WiredParam titleKey="wiredfurni.params.handitem">
                <WiredSelect
                    value={ handItem }
                    onChange={ event => setHandItem(normalizeHandItem(Number(event.target.value))) }
                    options={ handItems.map(value => ({ value, label: LocalizeText(`handitem${ value }`) })) } />

                <WiredButton className="nw-inline-btn" onClick={ captureHandItem }>
                    { LocalizeText('wiredfurni.params.capture.handitem') }
                </WiredButton>
            </WiredParam>
        </WiredSelectorBaseView>
    );
}
