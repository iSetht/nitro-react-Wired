import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { createUserSourceSelector, useWiredEffectSource, USER_SOURCE_OPTIONS } from './WiredEffectSourceSelector';
import { WiredControlTitle, WiredParam, WiredRadio, WiredSlider, WiredTextInput, WIRED_SOURCE_TRIGGER } from '../WiredControls';

const OPERATION_ADD = 0;
const OPERATION_REMOVE = 1;

export const WiredEffectGivePointsView: FC<{}> = props =>
{
    const [ points, setPoints ] = useState(1);
    const [ operation, setOperation ] = useState(OPERATION_ADD);
    const { trigger = null, setIntParams = null } = useWired();
    const [ userSource, setUserSource, expanded, setExpanded ] = useWiredEffectSource(trigger, 2, WIRED_SOURCE_TRIGGER, USER_SOURCE_OPTIONS);

    const clampPoints = (value: number) => Math.min(1000, Math.max(1, value || 1));
    const save = () => setIntParams([ clampPoints(points), operation, userSource ]);

    useEffect(() =>
    {
        setPoints(trigger.intData.length > 0 ? clampPoints(trigger.intData[0]) : 1);
        setOperation((trigger.intData.length > 1 && trigger.intData[1] === OPERATION_REMOVE) ? OPERATION_REMOVE : OPERATION_ADD);
    }, [ trigger ]);

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ createUserSourceSelector(userSource, setUserSource) ] }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(value => !value) }>
            <WiredParam>
                <Flex className="nw-title-input-row" alignItems="center" gap={ 1 }>
                    <WiredControlTitle>{ LocalizeText('wiredfurni.params.setpoints2') }</WiredControlTitle>
                    <WiredTextInput
                        compact
                        type="number"
                        min={ 1 }
                        max={ 1000 }
                        value={ points }
                        onChange={ event => setPoints(clampPoints(parseInt(event.target.value))) } />
                </Flex>
                <WiredSlider
                    min={ 1 }
                    max={ 1000 }
                    value={ points }
                    onChange={ event => setPoints(clampPoints(event)) } />
            </WiredParam>
            <WiredParam titleKey="wiredfurni.params.points_operation" divider={ false }>
                { [ OPERATION_ADD, OPERATION_REMOVE ].map(value =>
                    <WiredRadio
                        key={ value }
                        name="pointsOperation"
                        checked={ operation === value }
                        onChange={ () => setOperation(value) }
                        label={ LocalizeText(`wiredfurni.params.points_operation.${ value }`) } />) }
            </WiredParam>
        </WiredEffectBaseView>
    );
}
