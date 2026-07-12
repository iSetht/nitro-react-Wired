import { FC } from 'react';
import { WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { createUserSourceSelector, useWiredEffectSource, USER_SOURCE_OPTIONS } from './WiredEffectSourceSelector';
import { WIRED_SOURCE_TRIGGER } from '../WiredControls';

export const WiredEffectLeaveTeamView: FC<{}> = props =>
{
    const { trigger = null, setIntParams = null } = useWired();
    const [ userSource, setUserSource, expanded, setExpanded ] = useWiredEffectSource(trigger, 0, WIRED_SOURCE_TRIGGER, USER_SOURCE_OPTIONS);

    const save = () => setIntParams([ userSource ]);

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ createUserSourceSelector(userSource, setUserSource) ] }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(value => !value) } />
    );
}
