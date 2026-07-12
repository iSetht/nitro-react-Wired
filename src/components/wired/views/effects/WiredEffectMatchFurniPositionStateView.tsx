import { ApplySnapshotMessageComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { LocalizeText, SendMessageComposer, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredCheckbox, WiredParam, WIRED_SOURCE_SELECTED } from '../WiredControls';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { createFurniSourceSelector, FURNI_SOURCE_OPTIONS, useWiredEffectSource } from './WiredEffectSourceSelector';

export const WiredEffectMatchFurniPositionStateView: FC<{}> = props =>
{
    const [ stateFlag, setStateFlag ] = useState(0);
    const [ directionFlag, setDirectionFlag ] = useState(0);
    const [ positionFlag, setPositionFlag ] = useState(0);
    const [ altitudeFlag, setAltitudeFlag ] = useState(0);
    const { trigger = null, setIntParams = null } = useWired();
    const [ furniSource, setFurniSource, expanded, setExpanded ] = useWiredEffectSource(trigger, 4, WIRED_SOURCE_SELECTED, FURNI_SOURCE_OPTIONS);

    const save = () => setIntParams([ stateFlag, directionFlag, positionFlag, altitudeFlag, furniSource ]);

    useEffect(() =>
    {
        setStateFlag(trigger.getBoolean(0) ? 1 : 0);
        setDirectionFlag(trigger.getBoolean(1) ? 1 : 0);
        setPositionFlag(trigger.getBoolean(2) ? 1 : 0);
        setAltitudeFlag(trigger.getBoolean(3) ? 1 : 0);
    }, [ trigger ]);

    const applySnapshotSlot = (
        <Text
            bitmapFont="il_regular"
            className="nw-link-underline"
            onClick={ () => SendMessageComposer(new ApplySnapshotMessageComposer(trigger?.id)) }>
            { LocalizeText('wiredfurni.applysnapshot') }
        </Text>
    );

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ createFurniSourceSelector(furniSource, setFurniSource) ] }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(value => !value) }
            headerSlot={ applySnapshotSlot }>
            <WiredParam titleKey="wiredfurni.params.conditions" divider={ false }>
                <WiredCheckbox checked={ !!stateFlag } onChange={ checked => setStateFlag(checked ? 1 : 0) } label={ LocalizeText('wiredfurni.params.condition.state') } />
                <WiredCheckbox checked={ !!directionFlag } onChange={ checked => setDirectionFlag(checked ? 1 : 0) } label={ LocalizeText('wiredfurni.params.condition.direction') } />
                <WiredCheckbox checked={ !!positionFlag } onChange={ checked => setPositionFlag(checked ? 1 : 0) } label={ LocalizeText('wiredfurni.params.condition.position') } />
                <WiredCheckbox checked={ !!altitudeFlag } onChange={ checked => setAltitudeFlag(checked ? 1 : 0) } label={ LocalizeText('wiredfurni.params.condition.altitude') } />
            </WiredParam>
        </WiredEffectBaseView>
    );
}
