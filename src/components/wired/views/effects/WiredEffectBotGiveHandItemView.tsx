import { FC, useEffect, useState } from 'react';
import { GetRoomEngine, LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { BOT_SOURCE_OPTIONS, USER_SOURCE_OPTIONS, useWiredEffectSource } from './WiredEffectSourceSelector';
import { WiredButton, WiredCheckbox, WiredParam, WiredSelect, WiredTextInput, WIRED_SOURCE_SELECTED, WIRED_SOURCE_TRIGGER } from '../WiredControls';

const DEFAULT_HAND_ITEMS = [ 0, 2, 5, 7, 8, 9, 10, 27 ];
const ROOM_OBJECT_CATEGORY_UNIT = 100;
const FIGURE_CARRY_OBJECT = 'figure_carry_object';

const normalizeHandItem = (value: number) => isNaN(value) ? 0 : Math.max(0, Math.floor(value));

export const WiredEffectBotGiveHandItemView: FC<{}> = props =>
{
    const [ botName, setBotName ] = useState('');
    const [ useBot, setUseBot ] = useState(false);
    const [ handItemId, setHandItemId ] = useState(0);
    const [ handItems, setHandItems ] = useState(DEFAULT_HAND_ITEMS);
    const { trigger = null, setStringParam = null, setIntParams = null } = useWired();
    const [ botSource, setBotSource, botExpanded, setBotExpanded ] = useWiredEffectSource(trigger, 2, WIRED_SOURCE_SELECTED, BOT_SOURCE_OPTIONS);
    const [ userSource, setUserSource, userExpanded, setUserExpanded ] = useWiredEffectSource(trigger, 3, WIRED_SOURCE_TRIGGER, USER_SOURCE_OPTIONS);
    const expanded = botExpanded || userExpanded;

    const save = () =>
    {
        setStringParam(useBot ? botName : '');
        setIntParams([ handItemId, useBot ? 1 : 0, botSource, userSource ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        const savedBotName = trigger.stringData || '';
        const savedHandItem = normalizeHandItem((trigger.intData.length > 0) ? trigger.intData[0] : 0);

        setBotName(savedBotName);
        setUseBot((trigger.intData.length > 1) ? (trigger.intData[1] === 1) : (savedBotName.length > 0));
        setHandItemId(savedHandItem);
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

        setHandItemId(capturedHandItem);
        setHandItems(values => values.includes(capturedHandItem) ? values : [ ...values, capturedHandItem ]);
    };

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [
                {
                    value: botSource,
                    onChange: setBotSource,
                    options: BOT_SOURCE_OPTIONS,
                    titleKey: 'wiredfurni.params.sources.users.title.bots',
                    labelPrefix: 'wiredfurni.params.sources.users'
                },
                {
                    value: userSource,
                    onChange: setUserSource,
                    options: USER_SOURCE_OPTIONS,
                    titleKey: 'wiredfurni.params.sources.users.title',
                    labelPrefix: 'wiredfurni.params.sources.users'
                }
            ] }
            expanded={ expanded }
            onToggleExpanded={ () =>
            {
                setBotExpanded(!expanded);
                setUserExpanded(!expanded);
            } }>
            <WiredParam titleKey="wiredfurni.params.bot.name">
                <WiredCheckbox checked={ useBot } onChange={ setUseBot } label={ LocalizeText('wiredfurni.params.bot.usage') } />
                { useBot &&
                    <WiredTextInput type="text" maxLength={ 32 } value={ botName } onChange={ event => setBotName(event.target.value) } /> }
            </WiredParam>
            <WiredParam titleKey="wiredfurni.params.handitem" divider={ false }>
                <WiredSelect
                    value={ handItemId }
                    onChange={ event => setHandItemId(normalizeHandItem(Number(event.target.value))) }
                    options={ handItems.map(value => ({ value, label: LocalizeText(`handitem${ value }`) })) } />
                <WiredButton onClick={ captureHandItem }>{ LocalizeText('wiredfurni.params.capture.handitem') }</WiredButton>
            </WiredParam>
        </WiredEffectBaseView>
    );
}
