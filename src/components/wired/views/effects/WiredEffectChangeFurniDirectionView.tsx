import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Column, Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { createFurniSourceSelector, FURNI_SOURCE_OPTIONS, useWiredEffectSource } from './WiredEffectSourceSelector';
import { WiredCheckbox, WiredDirectionIconNames, WiredParam, WiredRadio, WIRED_SOURCE_SELECTED } from '../WiredControls';

const directionRows: { value: number, icon: string }[][] = [
    [
        { value: 0, icon: WiredDirectionIconNames.north },
        { value: 1, icon: WiredDirectionIconNames.northEast },
        { value: 2, icon: WiredDirectionIconNames.east },
        { value: 3, icon: WiredDirectionIconNames.southEast }
    ],
    [
        { value: 4, icon: WiredDirectionIconNames.south },
        { value: 5, icon: WiredDirectionIconNames.southWest },
        { value: 6, icon: WiredDirectionIconNames.west },
        { value: 7, icon: WiredDirectionIconNames.northWest }
    ]
];

const turnOptions: number[] = [ 0, 1, 2, 3, 4, 5, 6 ];

export const WiredEffectChangeFurniDirectionView: FC<{}> = props =>
{
    const [ startDirection, setStartDirection ] = useState(0);
    const [ turnAction, setTurnAction ] = useState(0);
    const [ blockOnUserCollision, setBlockOnUserCollision ] = useState(true);
    const { trigger = null, setIntParams = null } = useWired();
    const [ furniSource, setFurniSource, expanded, setExpanded ] = useWiredEffectSource(trigger, 3, WIRED_SOURCE_SELECTED, FURNI_SOURCE_OPTIONS);

    const save = () => setIntParams([ startDirection, turnAction, blockOnUserCollision ? 1 : 0, furniSource ]);

    useEffect(() =>
    {
        if(trigger.intData.length >= 2)
        {
            setStartDirection(trigger.intData[0]);
            setTurnAction(trigger.intData[1]);
            setBlockOnUserCollision(trigger.intData.length >= 3 ? trigger.intData[2] === 1 : true);
        }
        else
        {
            setStartDirection(0);
            setTurnAction(0);
            setBlockOnUserCollision(true);
        }
    }, [ trigger ]);

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ createFurniSourceSelector(furniSource, setFurniSource) ] }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(value => !value) }>
            <WiredParam titleKey="wiredfurni.params.startdir">
                <Column gap={ 1 }>
                    { directionRows.map((row, index) => (
                        <Flex key={ index } gap={ 2 } alignItems="center">
                            { row.map(option =>
                                <WiredRadio
                                    key={ option.value }
                                    name="startDirection"
                                    checked={ startDirection === option.value }
                                    onChange={ () => setStartDirection(option.value) }
                                    icon={ option.icon } />) }
                        </Flex>
                    )) }
                </Column>
            </WiredParam>
            <WiredParam titleKey="wiredfurni.params.turn">
                { turnOptions.map(option =>
                    <WiredRadio
                        key={ option }
                        name="turnAction"
                        checked={ turnAction === option }
                        onChange={ () => setTurnAction(option) }
                        label={ LocalizeText(`wiredfurni.params.turn.${ option }`) } />) }
            </WiredParam>
            <WiredParam titleKey="wiredfurni.params.user_collide" divider={ false }>
                <WiredCheckbox
                    checked={ blockOnUserCollision }
                    onChange={ setBlockOnUserCollision }
                    label={ LocalizeText('wiredfurni.params.user_collide.0') } />
            </WiredParam>
        </WiredEffectBaseView>
    );
}
