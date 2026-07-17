import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { BOT_SOURCE_OPTIONS, USER_SOURCE_OPTIONS, useWiredEffectSource } from './WiredEffectSourceSelector';
import { WiredParam, WiredRadio, WiredTextInput, WIRED_SOURCE_SELECTED, WIRED_SOURCE_TRIGGER } from '../WiredControls';

export const WiredEffectBotFollowAvatarView: FC<{}> = props =>
{
    const [ botName, setBotName ] = useState('');
    const [ followMode, setFollowMode ] = useState(-1);
    const { trigger = null, setStringParam = null, setIntParams = null } = useWired();
    const [ botSource, setBotSource, botExpanded, setBotExpanded ] = useWiredEffectSource(trigger, 1, WIRED_SOURCE_SELECTED, BOT_SOURCE_OPTIONS);
    const [ userSource, setUserSource, userExpanded, setUserExpanded ] = useWiredEffectSource(trigger, 2, WIRED_SOURCE_TRIGGER, USER_SOURCE_OPTIONS);
    const expanded = botExpanded || userExpanded;

    const save = () =>
    {
        setStringParam(botName);
        setIntParams([ followMode, botSource, userSource ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        setBotName(trigger.stringData ?? '');
        setFollowMode((trigger.intData.length > 0) ? trigger.intData[0] : 0);
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
            <WiredParam titleKey="wiredfurni.params.bot.name" divider={ false }>
                <WiredTextInput type="text" maxLength={ 32 } value={ botName } onChange={ event => setBotName(event.target.value) } />
                <WiredRadio name="followMode" checked={ followMode === 1 } onChange={ () => setFollowMode(1) } label={ LocalizeText('wiredfurni.params.start.following') } />
                <WiredRadio name="followMode" checked={ followMode === 0 } onChange={ () => setFollowMode(0) } label={ LocalizeText('wiredfurni.params.stop.following') } />
            </WiredParam>
        </WiredEffectBaseView>
    );
}
