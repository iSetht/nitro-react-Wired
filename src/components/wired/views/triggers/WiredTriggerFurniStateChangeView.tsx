import { FC, useEffect, useState } from 'react';
import { useWired } from '../../../../hooks';
import { Text } from '../../../../common';
import { LocalizeText, WiredFurniType, SendMessageComposer } from '../../../../api';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';
import { ApplySnapshotMessageComposer } from '@nitrots/nitro-renderer';
import { WiredParam, WiredRadio, WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR } from '../WiredControls';


const SOURCES = [ WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR ];

export const WiredTriggerFurniStateChangeView: FC<{}> = props =>
{
    const { trigger = null, setIntParams = null } = useWired();
    const [ furniSource, setFurniSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ expanded, setExpanded ] = useState(false);
    const [ mode, setMode ] = useState(0);

    useEffect(() =>
    {
        if(!trigger) return;

        const saved = trigger.intData?.length > 0 ? trigger.intData[0] : WIRED_SOURCE_SELECTED;
        const valid = SOURCES.includes(saved) ? saved : WIRED_SOURCE_SELECTED;

        setFurniSource(valid);
        setExpanded(valid !== WIRED_SOURCE_SELECTED);
        setMode((trigger.intData.length > 1) ? trigger.intData[1] : 0);
    }, [ trigger ]);

    const save = () => setIntParams([ furniSource, mode ]);

    const applySnapshotSlot = (
        <Text
            bitmapFont="il_regular"
            className="nw-link-underline"
            onClick={ () => SendMessageComposer(new ApplySnapshotMessageComposer(trigger?.id)) }>
            { LocalizeText('wiredfurni.applysnapshot') }
        </Text>
    );

    return (
        <WiredTriggerBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_OR_BY_TYPE }
            hasSpecialInput={ true }
            save={ save }
            furniSource={ furniSource }
            onFurniSourceChange={ setFurniSource }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(v => !v) }
            headerSlot={ applySnapshotSlot }
        >
            <WiredParam titleKey="wiredfurni.params.select_options" divider={ false }>
                <WiredRadio name="triggererAvatar" checked={ mode === 1 } onChange={ () => setMode(1) } label={ LocalizeText('wiredfurni.params.state_trigger.1') } />
                <WiredRadio name="triggererAvatar" checked={ mode === 0 } onChange={ () => setMode(0) } label={ LocalizeText('wiredfurni.params.state_trigger.0') } />
            </WiredParam>
        </WiredTriggerBaseView>
    );
}
