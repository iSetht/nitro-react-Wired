import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR } from '../WiredControls';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';

const SOURCES = [ WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR ];

export const WiredTriggerAvatarClicksFurniView: FC<{}> = props =>
{
    const { trigger = null, setIntParams = null } = useWired();
    const [ furniSource, setFurniSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ expanded, setExpanded ] = useState(false);

    useEffect(() =>
    {
        if(!trigger) return;

        const saved = trigger.intData?.length > 0 ? trigger.intData[0] : WIRED_SOURCE_SELECTED;
        const valid = SOURCES.includes(saved) ? saved : WIRED_SOURCE_SELECTED;

        setFurniSource(valid);
        setExpanded(valid !== WIRED_SOURCE_SELECTED);
    }, [ trigger ]);

    const save = () => setIntParams([ furniSource ]);

    return (
        <WiredTriggerBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_OR_BY_TYPE }
            hasSpecialInput={ true }
            save={ save }
            furniSource={ furniSource }
            onFurniSourceChange={ setFurniSource }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(v => !v) }
        />
    );
}
