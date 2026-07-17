import { FC } from 'react';
import { WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL, WIRED_SOURCE_TRIGGER } from '../WiredControls';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { useWiredEffectSource } from './WiredEffectSourceSelector';

const FURNI_SOURCES = [ WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL, WIRED_SOURCE_TRIGGER ];

export const WiredEffectRemoveTempFurniView: FC<{}> = props =>
{
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();
    const [ furniSource, setFurniSource, expanded, setExpanded ] = useWiredEffectSource(trigger, 0, WIRED_SOURCE_SELECTOR, FURNI_SOURCES);

    const save = () =>
    {
        setStringParam('');
        setIntParams([ furniSource ]);
    };

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ {
                value: furniSource,
                onChange: setFurniSource,
                options: FURNI_SOURCES,
                titleKey: 'wiredfurni.params.sources.furni.title',
                labelPrefix: 'wiredfurni.params.sources.furni'
            } ] }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(value => !value) }
            alwaysExpandedSources={ true } />
    );
}
