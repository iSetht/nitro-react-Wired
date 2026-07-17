import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { createFurniSourceSelector, FURNI_SOURCE_OPTIONS, useWiredEffectSource } from './WiredEffectSourceSelector';
import { WiredDirectionIconNames, WiredParam, WiredRadioGroup, WiredSliderField, WIRED_SOURCE_SELECTED } from '../WiredControls';

const MAX_DISTANCE = 20;

const normalizeDirection = (direction: number) => direction === 1 ? 1 : 0;
const clampDistance = (distance: number) => Math.min(MAX_DISTANCE, Math.max(0, distance));

export const WiredEffectRelativeFurniMovementView: FC<{}> = props =>
{
    const [ xDirection, setXDirection ] = useState(0);
    const [ xDistance, setXDistance ] = useState(0);
    const [ yDirection, setYDirection ] = useState(0);
    const [ yDistance, setYDistance ] = useState(0);
    const { trigger = null, setIntParams = null } = useWired();
    const [ furniSource, setFurniSource, expanded, setExpanded ] = useWiredEffectSource(trigger, 4, WIRED_SOURCE_SELECTED, FURNI_SOURCE_OPTIONS);

    const save = () => setIntParams([ xDirection, xDistance, yDirection, yDistance, furniSource ]);

    useEffect(() =>
    {
        setXDirection(normalizeDirection((trigger.intData.length > 0) ? trigger.intData[0] : 0));
        setXDistance(clampDistance((trigger.intData.length > 1) ? trigger.intData[1] : 0));
        setYDirection(normalizeDirection((trigger.intData.length > 2) ? trigger.intData[2] : 0));
        setYDistance(clampDistance((trigger.intData.length > 3) ? trigger.intData[3] : 0));
    }, [ trigger ]);

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ createFurniSourceSelector(furniSource, setFurniSource) ] }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(value => !value) }>
            <WiredParam titleKey="wiredfurni.params.movement.horizontal.selection">
                <WiredRadioGroup
                    name="xDirection"
                    value={ xDirection }
                    onChange={ value => setXDirection(Number(value)) }
                    inline
                    gap={ 3 }
                    options={ [
                        { value: 0, icon: WiredDirectionIconNames.east },
                        { value: 1, icon: WiredDirectionIconNames.west }
                    ] } />
                <WiredSliderField
                    labelKey="wiredfurni.params.movement.vertical.distance"
                    labelKeys={ [ 'distance' ] }
                    labelReplacements={ [ String(xDistance) ] }
                    value={ xDistance }
                    onChange={ setXDistance }
                    min={ 0 }
                    max={ MAX_DISTANCE } />
            </WiredParam>
            <WiredParam titleKey="wiredfurni.params.movement.vertical.selection" divider={ false }>
                <WiredRadioGroup
                    name="yDirection"
                    value={ yDirection }
                    onChange={ value => setYDirection(Number(value)) }
                    inline
                    gap={ 3 }
                    options={ [
                        { value: 0, icon: WiredDirectionIconNames.south },
                        { value: 1, icon: WiredDirectionIconNames.north }
                    ] } />
                <WiredSliderField
                    labelKey="wiredfurni.params.movement.vertical.distance"
                    labelKeys={ [ 'distance' ] }
                    labelReplacements={ [ String(yDistance) ] }
                    value={ yDistance }
                    onChange={ setYDistance }
                    min={ 0 }
                    max={ MAX_DISTANCE } />
            </WiredParam>
        </WiredEffectBaseView>
    );
}
