import { FC, useEffect, useState } from 'react';
import { GetConfiguration, LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { createUserSourceSelector, useWiredEffectSource, USER_SOURCE_OPTIONS } from './WiredEffectSourceSelector';
import { WiredParam, WiredTextInput, WIRED_SOURCE_TRIGGER } from '../WiredControls';

export const WiredEffectKickAvatarView: FC<{}> = props =>
{
    const [ message, setMessage ] = useState('');
    const { trigger = null, setStringParam = null, setIntParams = null } = useWired();
    const [ userSource, setUserSource, expanded, setExpanded ] = useWiredEffectSource(trigger, 0, WIRED_SOURCE_TRIGGER, USER_SOURCE_OPTIONS);

    const save = () =>
    {
        setStringParam(message);
        setIntParams([ userSource ]);
    }

    useEffect(() =>
    {
        setMessage(trigger.stringData);
    }, [ trigger ]);

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ createUserSourceSelector(userSource, setUserSource) ] }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(value => !value) }>
            <WiredParam titleKey="wiredfurni.params.message" divider={ false }>
                <WiredTextInput type="text" value={ message } onChange={ event => setMessage(event.target.value) } maxLength={ GetConfiguration<number>('wired.action.kick.from.room.max.length', 100) } />
            </WiredParam>
        </WiredEffectBaseView>
    );
}
