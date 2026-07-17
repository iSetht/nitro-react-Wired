import { FC, useEffect, useState } from 'react';
import { SystemChatStyleEnum } from '@nitrots/nitro-renderer';
import { LocalizeText, WiredFurniType, WIRED_STRING_DELIMETER } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { BOT_SOURCE_OPTIONS, USER_SOURCE_OPTIONS, useWiredEffectSource } from './WiredEffectSourceSelector';
import { limitWiredMessage, normalizeWiredMessageWidth, WIRED_MESSAGE_ALIGN_LEFT, WIRED_MESSAGE_WIDTH_DEFAULT } from '../message-editor/WiredMessageFormatting';
import { WiredMessageEditor } from '../message-editor/WiredMessageEditor';
import { WiredParam, WiredRadio, WiredTextInput, WIRED_SOURCE_SELECTED, WIRED_SOURCE_TRIGGER } from '../WiredControls';

export const WiredEffectBotTalkToAvatarView: FC<{}> = props =>
{
    const [ botName, setBotName ] = useState('');
    const [ message, setMessage ] = useState('');
    const [ talkMode, setTalkMode ] = useState(-1);
    const [ bubbleWidth, setBubbleWidth ] = useState(WIRED_MESSAGE_WIDTH_DEFAULT);
    const [ textAlignment, setTextAlignment ] = useState(WIRED_MESSAGE_ALIGN_LEFT);
    const { trigger = null, setStringParam = null, setIntParams = null } = useWired();
    const [ botSource, setBotSource, botExpanded, setBotExpanded ] = useWiredEffectSource(trigger, 1, WIRED_SOURCE_SELECTED, BOT_SOURCE_OPTIONS);
    const [ userSource, setUserSource, userExpanded, setUserExpanded ] = useWiredEffectSource(trigger, 2, WIRED_SOURCE_TRIGGER, USER_SOURCE_OPTIONS);
    const expanded = botExpanded || userExpanded;

    const save = () =>
    {
        setStringParam(botName + WIRED_STRING_DELIMETER + message);
        setIntParams([ talkMode, botSource, userSource, bubbleWidth, WIRED_MESSAGE_ALIGN_LEFT ]);
    };

    useEffect(() =>
    {
        const data = trigger.stringData.split(WIRED_STRING_DELIMETER);

        if(data.length > 0) setBotName(data[0]);
        if(data.length > 1) setMessage(data[1].length > 0 ? data[1] : '');

        setTalkMode((trigger.intData.length > 0) ? trigger.intData[0] : 0);
        setBubbleWidth(normalizeWiredMessageWidth((trigger.intData.length > 3) ? trigger.intData[3] : WIRED_MESSAGE_WIDTH_DEFAULT));
        setTextAlignment(WIRED_MESSAGE_ALIGN_LEFT);
    }, [ trigger ]);

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
                <WiredTextInput type="text" maxLength={ 32 } value={ botName } onChange={ event => setBotName(event.target.value) } />
            </WiredParam>
            <WiredParam titleKey="wiredfurni.params.message" divider={ false }>
                <WiredMessageEditor value={ message } onChange={ value => setMessage(limitWiredMessage(value)) } previewStyle={ SystemChatStyleEnum.BOT } bubbleWidth={ bubbleWidth } onBubbleWidthChange={ setBubbleWidth } textAlignment={ textAlignment } onTextAlignmentChange={ setTextAlignment } />
                <WiredRadio name="talkMode" checked={ talkMode === 1 } onChange={ () => setTalkMode(1) } label={ LocalizeText('wiredfurni.params.whisper') } />
                <WiredRadio name="talkMode" checked={ talkMode === 0 } onChange={ () => setTalkMode(0) } label={ LocalizeText('wiredfurni.params.talk') } />
            </WiredParam>
        </WiredEffectBaseView>
    );
}
