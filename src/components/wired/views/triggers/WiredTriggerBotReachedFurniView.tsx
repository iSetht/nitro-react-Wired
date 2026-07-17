import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredParam, WiredTextInput, WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR } from '../WiredControls';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';

const SOURCES = [ WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR ];

export const WiredTriggerBotReachedFurniView: FC<{}> = props =>
{
    const [ botName, setBotName ] = useState('');
    const [ furniSource, setFurniSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ botSource, setBotSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ expanded, setExpanded ] = useState(false);
    const { trigger = null, setStringParam = null, setIntParams = null } = useWired();

    const save = () =>
    {
        setStringParam(botName);
        setIntParams([ furniSource, botSource ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        setBotName(trigger.stringData ?? '');

        const savedFurniSource = trigger.intData?.length > 0 ? trigger.intData[0] : WIRED_SOURCE_SELECTED;
        const savedBotSource = trigger.intData?.length > 1 ? trigger.intData[1] : WIRED_SOURCE_SELECTED;

        const validFurniSource = SOURCES.includes(savedFurniSource) ? savedFurniSource : WIRED_SOURCE_SELECTED;
        const validBotSource = SOURCES.includes(savedBotSource) ? savedBotSource : WIRED_SOURCE_SELECTED;

        setFurniSource(validFurniSource);
        setBotSource(validBotSource);
        setExpanded((validFurniSource !== WIRED_SOURCE_SELECTED) || (validBotSource !== WIRED_SOURCE_SELECTED));
    }, [ trigger ]);

    return (
        <WiredTriggerBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_OR_BY_TYPE }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [
                {
                    value: furniSource,
                    onChange: setFurniSource,
                    options: SOURCES,
                    titleKey: 'wiredfurni.params.sources.furni.title',
                    labelPrefix: 'wiredfurni.params.sources.furni'
                },
                {
                    value: botSource,
                    onChange: setBotSource,
                    options: SOURCES,
                    titleKey: 'wiredfurni.params.sources.users.title.bots',
                    labelPrefix: 'wiredfurni.params.sources.users'
                }
            ] }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(v => !v) }
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
