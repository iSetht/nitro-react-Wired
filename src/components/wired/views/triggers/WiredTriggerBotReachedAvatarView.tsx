import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredParam, WiredTextInput, WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR } from '../WiredControls';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';

const SOURCES = [ WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR ];

export const WiredTriggerBotReachedAvatarView: FC<{}> = props =>
{
    const [ botName, setBotName ] = useState('');
    const [ botSource, setBotSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ expanded, setExpanded ] = useState(false);
    const { trigger = null, setStringParam = null, setIntParams = null } = useWired();

    const save = () =>
    {
        setStringParam(botName);
        setIntParams([ botSource ]);
    }

    useEffect(() =>
    {
        if(!trigger) return;

        setBotName(trigger.stringData ?? '');

        const savedBotSource = trigger.intData?.length > 0 ? trigger.intData[0] : WIRED_SOURCE_SELECTED;
        const validBotSource = SOURCES.includes(savedBotSource) ? savedBotSource : WIRED_SOURCE_SELECTED;

        setBotSource(validBotSource);
        setExpanded(validBotSource !== WIRED_SOURCE_SELECTED);
    }, [ trigger ]);

    return (
        <WiredTriggerBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            furniSource={ botSource }
            onFurniSourceChange={ setBotSource }
            sourceOptions={ SOURCES }
            sourceTitleKey="wiredfurni.params.sources.users.title.bots"
            sourceLabelPrefix="wiredfurni.params.sources.users"
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(v => !v) }
            showSourceDivider={ false }
        >
            <WiredParam titleKey="wiredfurni.params.bot.name" divider={ false }>
                <WiredTextInput
                    type="text"
                    maxLength={ 32 }
                    value={ botName }
                    onChange={ event => setBotName(event.target.value) } />
            </WiredParam>
        </WiredTriggerBaseView>
    );
}
