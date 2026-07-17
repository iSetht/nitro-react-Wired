import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { createFurniSourceSelector, FURNI_SOURCE_OPTIONS, useWiredEffectSource } from './WiredEffectSourceSelector';
import { WiredCheckbox, WiredParam, WIRED_SOURCE_SELECTED } from '../WiredControls';

export const WiredEffectSetFurniStateToView: FC<{}> = props =>
{
    const [ stateFlag, setStateFlag ] = useState(0);
    const [ directionFlag, setDirectionFlag ] = useState(0);
    const [ positionFlag, setPositionFlag ] = useState(0);
    const { trigger = null, setIntParams = null } = useWired();
    const [ furniSource, setFurniSource, expanded, setExpanded ] = useWiredEffectSource(trigger, 3, WIRED_SOURCE_SELECTED, FURNI_SOURCE_OPTIONS);

    const save = () => setIntParams([ stateFlag, directionFlag, positionFlag, furniSource ]);

    useEffect(() =>
    {
        setStateFlag(trigger.getBoolean(0) ? 1 : 0);
        setDirectionFlag(trigger.getBoolean(1) ? 1 : 0);
        setPositionFlag(trigger.getBoolean(2) ? 1 : 0);
    }, [ trigger ]);

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ createFurniSourceSelector(furniSource, setFurniSource) ] }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(value => !value) }>
            <WiredParam titleKey="wiredfurni.params.conditions" divider={ false }>
                <WiredCheckbox checked={ !!stateFlag } onChange={ checked => setStateFlag(checked ? 1 : 0) } label={ LocalizeText('wiredfurni.params.condition.state') } />
                <WiredCheckbox checked={ !!directionFlag } onChange={ checked => setDirectionFlag(checked ? 1 : 0) } label={ LocalizeText('wiredfurni.params.condition.direction') } />
                <WiredCheckbox checked={ !!positionFlag } onChange={ checked => setPositionFlag(checked ? 1 : 0) } label={ LocalizeText('wiredfurni.params.condition.position') } />
            </WiredParam>
        </WiredEffectBaseView>
    );
}
