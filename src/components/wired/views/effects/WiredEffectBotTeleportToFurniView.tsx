import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { BOT_SOURCE_OPTIONS, FURNI_TILE_SOURCE_OPTIONS_WITH_TRIGGERING, useWiredEffectSource } from './WiredEffectSourceSelector';
import { WiredParam, WiredTextInput, WIRED_SOURCE_SELECTED } from '../WiredControls';

export const WiredEffectBotTeleportToFurniView: FC<{}> = props =>
{
    const [ botName, setBotName ] = useState('');
    const { trigger = null, setStringParam = null, setIntParams = null } = useWired();
    const [ furniSource, setFurniSource, furniExpanded, setFurniExpanded ] = useWiredEffectSource(trigger, 0, WIRED_SOURCE_SELECTED, FURNI_TILE_SOURCE_OPTIONS_WITH_TRIGGERING);
    const [ botSource, setBotSource, botExpanded, setBotExpanded ] = useWiredEffectSource(trigger, 1, WIRED_SOURCE_SELECTED, BOT_SOURCE_OPTIONS);
    const expanded = furniExpanded || botExpanded;

    const save = () =>
    {
        setStringParam(botName);
        setIntParams([ furniSource, botSource ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;
        setBotName(trigger.stringData ?? '');
    }, [ trigger ]);

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [
                {
                    value: furniSource,
                    onChange: setFurniSource,
                    options: FURNI_TILE_SOURCE_OPTIONS_WITH_TRIGGERING,
                    titleKey: 'wiredfurni.params.sources.furni.title',
                    labelPrefix: 'wiredfurni.params.sources.furni'
                },
                {
                    value: botSource,
                    onChange: setBotSource,
                    options: BOT_SOURCE_OPTIONS,
                    titleKey: 'wiredfurni.params.sources.users.title.bots',
                    labelPrefix: 'wiredfurni.params.sources.users'
                }
            ] }
            expanded={ expanded }
            onToggleExpanded={ () =>
            {
                setFurniExpanded(!expanded);
                setBotExpanded(!expanded);
            } }>
            <WiredParam titleKey="wiredfurni.params.bot.name" divider={ false }>
                <WiredTextInput
                    type="text"
                    maxLength={ 32 }
                    value={ botName }
                    onChange={ event => setBotName(event.target.value) } />
            </WiredParam>
        </WiredEffectBaseView>
    );
}
