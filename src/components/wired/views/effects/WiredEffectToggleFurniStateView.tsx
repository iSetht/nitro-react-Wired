import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredParam, WiredRadio, WIRED_SOURCE_SELECTED } from '../WiredControls';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { createFurniSourceSelector, FURNI_SOURCE_OPTIONS, useWiredEffectSource } from './WiredEffectSourceSelector';

const TOGGLE_NEXT = 0;
const TOGGLE_PREVIOUS = 1;
const TOGGLE_TYPES = [ TOGGLE_NEXT, TOGGLE_PREVIOUS ];

export const WiredEffectToggleFurniStateView: FC<{}> = props =>
{
    const { trigger = null, setIntParams = null } = useWired();
    const [ toggleType, setToggleType ] = useState(TOGGLE_NEXT);
    const [ furniSource, setFurniSource, expanded, setExpanded ] = useWiredEffectSource(trigger, 0, WIRED_SOURCE_SELECTED, FURNI_SOURCE_OPTIONS);

    const save = () => setIntParams([ furniSource, toggleType ]);

    useEffect(() =>
    {
        if(!trigger) return;

        const savedToggleType = trigger.intData?.length > 1 ? trigger.intData[1] : TOGGLE_NEXT;

        setToggleType(TOGGLE_TYPES.includes(savedToggleType) ? savedToggleType : TOGGLE_NEXT);
    }, [ trigger ]);

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ createFurniSourceSelector(furniSource, setFurniSource) ] }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(value => !value) }>
            <WiredParam titleKey="wiredfurni.params.toggletype_selection" divider={ false }>
                { TOGGLE_TYPES.map(value =>
                    <WiredRadio
                        key={ value }
                        name="toggleType"
                        checked={ toggleType === value }
                        onChange={ () => setToggleType(value) }
                        label={ LocalizeText(`wiredfurni.params.toggletype.${ value }`) } />) }
            </WiredParam>
        </WiredEffectBaseView>
    );
}
