import { FC } from 'react';
import { WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { FURNI_SOURCE_OPTIONS, USER_SOURCE_OPTIONS, useWiredEffectSource } from './WiredEffectSourceSelector';
import { WIRED_SOURCE_SELECTED, WIRED_SOURCE_TRIGGER } from '../WiredControls';

export const WiredEffectMoveFurniToAvatarView: FC<{}> = props =>
{
    const { trigger = null, setIntParams = null } = useWired();
    const [ furniSource, setFurniSource, expanded, setExpanded ] = useWiredEffectSource(trigger, 0, WIRED_SOURCE_SELECTED, FURNI_SOURCE_OPTIONS);
    const [ userSource, setUserSource, userExpanded, setUserExpanded ] = useWiredEffectSource(trigger, 1, WIRED_SOURCE_TRIGGER, USER_SOURCE_OPTIONS);
    const isExpanded = expanded || userExpanded;

    const save = () => setIntParams([ furniSource, userSource ]);

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [
                {
                    value: furniSource,
                    onChange: setFurniSource,
                    options: FURNI_SOURCE_OPTIONS,
                    titleKey: 'wiredfurni.params.sources.furni.title.mv.0',
                    labelPrefix: 'wiredfurni.params.sources.furni'
                },
                {
                    value: userSource,
                    onChange: setUserSource,
                    options: USER_SOURCE_OPTIONS,
                    titleKey: 'wiredfurni.params.sources.furni.title.mv_user',
                    labelPrefix: 'wiredfurni.params.sources.users'
                }
            ] }
            alwaysExpandedSources={ true }
            expanded={ isExpanded }
            onToggleExpanded={ () =>
            {
                setExpanded(!isExpanded);
                setUserExpanded(!isExpanded);
            } } />
    );
}
