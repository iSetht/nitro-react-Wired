import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredAssetIcon, WiredCheckboxInput, WiredDirectionIconNames, WiredParam } from '../WiredControls';
import { createUserSourceSelector, USER_SOURCE_OPTIONS, useWiredEffectSource } from '../effects/WiredEffectSourceSelector';
import { WiredConditionBaseView } from './WiredConditionBaseView';
import { WIRED_CONDITION_QUANTIFIER_ALL as QUANTIFIER_ALL, WIRED_CONDITION_QUANTIFIER_ANY as QUANTIFIER_ANY, WiredConditionQuantifierSection } from './WiredConditionUtils';

const SOURCE_TRIGGER = 0;

const directionRows: { value: number; icon: string }[][] = [
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

export const WiredConditionAvatarDirectionView: FC<{}> = () =>
{
    const [ dirMask, setDirMask ] = useState(0);
    const [ quantifier, setQuantifier ] = useState(QUANTIFIER_ALL);
    const { trigger = null, setIntParams = null } = useWired();
    const [ userSource, setUserSource, sourceExpanded, setSourceExpanded ] = useWiredEffectSource(trigger, 2, SOURCE_TRIGGER, USER_SOURCE_OPTIONS);

    const expanded = quantifier !== QUANTIFIER_ALL || sourceExpanded;

    const save = () => setIntParams([ dirMask, quantifier, userSource ]);

    useEffect(() =>
    {
        if (!trigger) return;
        setDirMask(trigger.intData?.[0] ?? 0);
        setQuantifier(trigger.intData?.[1] ?? QUANTIFIER_ALL);
    }, [ trigger ]);

    const toggleDir = (bit: number) => setDirMask(prev => prev ^ (1 << bit));

    const quantifierSlot = (
        <WiredConditionQuantifierSection kind="users" name="avatarDirQuantifier" value={ quantifier } onChange={ setQuantifier } />
    );

    return (
        <WiredConditionBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ createUserSourceSelector(userSource, setUserSource) ] }
            advancedSlot={ quantifierSlot }
            expanded={ expanded }
            onToggleExpanded={ () =>
            {
                const next = !expanded;
                setSourceExpanded(next);
            } }>
            <WiredParam titleKey="wiredfurni.params.direction_selection" divider={ false }>
                { directionRows.map((row, rowIdx) => (
                    <Flex key={ rowIdx } gap={ 2 }>
                        { row.map(dir => (
                            <Flex key={ dir.value } alignItems="center" gap={ 1 }>
                                <WiredCheckboxInput
                                    checked={ !!(dirMask & (1 << dir.value)) }
                                    onChange={ () => toggleDir(dir.value) } />
                                <WiredAssetIcon name={ dir.icon } />
                            </Flex>
                        )) }
                    </Flex>
                )) }
            </WiredParam>
        </WiredConditionBaseView>
    );
}
