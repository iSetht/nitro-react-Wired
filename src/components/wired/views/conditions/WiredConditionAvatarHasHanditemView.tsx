import { FC, useEffect, useState } from 'react';
import { GetRoomEngine, LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredButton, WiredParam, WiredSelect } from '../WiredControls';
import { createUserSourceSelector, USER_SOURCE_OPTIONS, useWiredEffectSource } from '../effects/WiredEffectSourceSelector';
import { WiredConditionBaseView } from './WiredConditionBaseView';
import { WIRED_CONDITION_QUANTIFIER_ALL as QUANTIFIER_ALL, WIRED_CONDITION_QUANTIFIER_ANY as QUANTIFIER_ANY, WiredConditionQuantifierSection } from './WiredConditionUtils';

const SOURCE_TRIGGER        = 0;
const DEFAULT_HAND_ITEMS    = [ 0, 2, 5, 7, 8, 9, 10, 27 ];
const ROOM_OBJECT_CATEGORY_UNIT = 100;
const FIGURE_CARRY_OBJECT   = 'figure_carry_object';

const normalizeHandItem = (value: number) => isNaN(value) ? 0 : Math.max(0, Math.floor(value));

export const WiredConditionAvatarHasHanditemView: FC<{ isNegative?: boolean }> = props =>
{
    const { isNegative = false } = props;
    const [ handItem,  setHandItem  ] = useState(0);
    const [ handItems, setHandItems ] = useState(DEFAULT_HAND_ITEMS);
    const [ quantifier, setQuantifier ] = useState(QUANTIFIER_ALL);

    const { trigger = null, setIntParams = null } = useWired();
    const [ userSource, setUserSource, sourceExpanded, setSourceExpanded ] = useWiredEffectSource(trigger, 2, SOURCE_TRIGGER, USER_SOURCE_OPTIONS);

    const expanded = quantifier !== QUANTIFIER_ALL || sourceExpanded;

    const save = () => setIntParams([ handItem, quantifier, userSource ]);

    useEffect(() =>
    {
        if (!trigger) return;

        const savedHandItem = normalizeHandItem(trigger.intData?.[0] ?? 0);
        setHandItem(savedHandItem);
        setHandItems(values => values.includes(savedHandItem) ? values : [ ...values, savedHandItem ]);
        setQuantifier(trigger.intData?.[1] ?? QUANTIFIER_ALL);
    }, [ trigger ]);

    const captureHandItem = () =>
    {
        const roomEngine = GetRoomEngine();
        const roomId = roomEngine?.activeRoomId ?? -1;
        const roomSession = (roomEngine as any)?._roomSessionManager?.getSession?.(roomId);
        const ownRoomIndex = roomSession?.ownRoomIndex ?? -1;
        const roomObject = roomEngine?.getRoomObject(roomId, ownRoomIndex, ROOM_OBJECT_CATEGORY_UNIT);
        const captured = normalizeHandItem(Number(roomObject?.model?.getValue?.(FIGURE_CARRY_OBJECT) || 0));

        setHandItem(captured);
        setHandItems(values => values.includes(captured) ? values : [ ...values, captured ]);
    };

    const quantifierSlot = (
        <WiredConditionQuantifierSection kind="users" name="handitemQuantifier" value={ quantifier } onChange={ setQuantifier } negative={ isNegative } />
    );

    return (
        <WiredConditionBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ createUserSourceSelector(userSource, setUserSource) ] }
            advancedSlot={ quantifierSlot }
            expanded={ expanded }
            onToggleExpanded={ () =>
            {
                const next = !expanded;
                setSourceExpanded(next);
            } }>
            <WiredParam titleKey="wiredfurni.params.handitem" divider={ false }>
                <WiredSelect
                    value={ handItem }
                    onChange={ e => setHandItem(normalizeHandItem(Number(e.target.value))) }
                    options={ handItems.map(value => ({ value, label: LocalizeText(`handitem${ value }`) })) } />
                <WiredButton onClick={ captureHandItem }>{ LocalizeText('wiredfurni.params.capture.handitem') }</WiredButton>
            </WiredParam>
        </WiredConditionBaseView>
    );
}
