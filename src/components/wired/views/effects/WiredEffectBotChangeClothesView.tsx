import { FC, useEffect, useState } from 'react';
import { GetSessionDataManager, LocalizeText, WiredFurniType, WIRED_STRING_DELIMETER } from '../../../../api';
import { Column, LayoutAvatarImageView } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { BOT_SOURCE_OPTIONS, useWiredEffectSource } from './WiredEffectSourceSelector';
import { WiredButton, WiredParam, WiredTextInput, WIRED_SOURCE_SELECTED } from '../WiredControls';

const DEFAULT_FIGURE: string = 'hd-180-1.ch-210-66.lg-270-82.sh-290-81';

export const WiredEffectBotChangeClothesView: FC<{}> = props =>
{
    const [ botName, setBotName ] = useState('');
    const [ figure, setFigure ] = useState('');
    const { trigger = null, setStringParam = null, setIntParams = null } = useWired();
    const [ botSource, setBotSource, botExpanded, setBotExpanded ] = useWiredEffectSource(trigger, 0, WIRED_SOURCE_SELECTED, BOT_SOURCE_OPTIONS);

    const save = () =>
    {
        setStringParam(botName + WIRED_STRING_DELIMETER + figure);
        setIntParams([ botSource ]);
    };

    useEffect(() =>
    {
        const data = trigger.stringData.split(WIRED_STRING_DELIMETER);

        if(data.length > 0) setBotName(data[0]);
        if(data.length > 1) setFigure(data[1].length > 0 ? data[1] : DEFAULT_FIGURE);
    }, [ trigger ]);

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            furniSource={ botSource }
            onFurniSourceChange={ setBotSource }
            sourceOptions={ BOT_SOURCE_OPTIONS }
            sourceTitleKey="wiredfurni.params.sources.users.title.bots"
            sourceLabelPrefix="wiredfurni.params.sources.users"
            expanded={ botExpanded }
            onToggleExpanded={ () => setBotExpanded(!botExpanded) }>
            <WiredParam titleKey="wiredfurni.params.bot.name">
                <WiredTextInput type="text" maxLength={ 32 } value={ botName } onChange={ event => setBotName(event.target.value) } />
            </WiredParam>
            <WiredParam titleKey="avatar.widget.dress_up" divider={ false }>
                <Column center gap={ 1 }>
                    <LayoutAvatarImageView figure={ figure } direction={ 4 } />
                    <WiredButton onClick={ () => setFigure(GetSessionDataManager().figure) }>{ LocalizeText('avatar.widget.dress_up') }</WiredButton>
                </Column>
            </WiredParam>
        </WiredEffectBaseView>
    );
}
