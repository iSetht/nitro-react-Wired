import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Column, Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredParam, WiredRadio } from '../WiredControls';
import { createUserSourceSelector, USER_SOURCE_OPTIONS, useWiredEffectSource } from '../effects/WiredEffectSourceSelector';
import { WiredConditionBaseView } from './WiredConditionBaseView';
import { WIRED_CONDITION_QUANTIFIER_ALL as QUANTIFIER_ALL, WIRED_CONDITION_QUANTIFIER_ANY as QUANTIFIER_ANY, WiredConditionQuantifierSection } from './WiredConditionUtils';

const SOURCE_TRIGGER  = 0;

const TEAM_TRIGGERER  = 0;
const TEAM_RED        = 1;
const TEAM_GREEN      = 2;
const TEAM_BLUE       = 3;
const TEAM_YELLOW     = 4;

const PLACEMENT_1ST   = 1;
const PLACEMENT_2ND   = 2;
const PLACEMENT_3RD   = 3;
const PLACEMENT_4TH   = 4;

const TEAM_OPTIONS = [
    { value: TEAM_TRIGGERER, label: 'wiredfurni.params.team.triggerer' },
    { value: TEAM_RED,       label: 'wiredfurni.params.team.1'         },
    { value: TEAM_GREEN,     label: 'wiredfurni.params.team.2'         },
    { value: TEAM_BLUE,      label: 'wiredfurni.params.team.3'         },
    { value: TEAM_YELLOW,    label: 'wiredfurni.params.team.4'         },
];

const PLACEMENT_OPTIONS = [
    { value: PLACEMENT_1ST, label: 'wiredfurni.params.placement.1' },
    { value: PLACEMENT_2ND, label: 'wiredfurni.params.placement.2' },
    { value: PLACEMENT_3RD, label: 'wiredfurni.params.placement.3' },
    { value: PLACEMENT_4TH, label: 'wiredfurni.params.placement.4' },
];

export const WiredConditionTeamIsWinningView: FC<{}> = () =>
{
    const [ team,       setTeam       ] = useState(TEAM_TRIGGERER);
    const [ placement,  setPlacement  ] = useState(PLACEMENT_1ST);
    const [ quantifier, setQuantifier ] = useState(QUANTIFIER_ALL);

    const { trigger = null, setIntParams = null } = useWired();
    const [ userSource, setUserSource, sourceExpanded, setSourceExpanded ] = useWiredEffectSource(trigger, 3, SOURCE_TRIGGER, USER_SOURCE_OPTIONS);

    const expanded = quantifier !== QUANTIFIER_ALL || sourceExpanded;

    const save = () => setIntParams([ team, placement, quantifier, userSource ]);

    useEffect(() =>
    {
        if (!trigger) return;

        const p = trigger.intData ?? [];
        const t = p[0] ?? TEAM_TRIGGERER;
        setTeam((t >= TEAM_TRIGGERER && t <= TEAM_YELLOW) ? t : TEAM_TRIGGERER);
        const pl = p[1] ?? PLACEMENT_1ST;
        setPlacement((pl >= PLACEMENT_1ST && pl <= PLACEMENT_4TH) ? pl : PLACEMENT_1ST);
        setQuantifier((p[2] ?? QUANTIFIER_ALL) === QUANTIFIER_ANY ? QUANTIFIER_ANY : QUANTIFIER_ALL);
    }, [ trigger ]);

    const quantifierSlot = (
        <WiredConditionQuantifierSection kind="users" name="rankQuantifier" value={ quantifier } onChange={ setQuantifier } />
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
            <WiredParam titleKey="wiredfurni.params.team">
                <Column gap={ 1 }>
                    <WiredRadio name="teamSelection" checked={ team === TEAM_TRIGGERER } onChange={ () => setTeam(TEAM_TRIGGERER) } label={ LocalizeText('wiredfurni.params.team.triggerer') } />
                    <Flex gap={ 3 }>
                        { TEAM_OPTIONS.slice(1, 3).map(option => (
                            <WiredRadio key={ option.value } name="teamSelection" checked={ team === option.value } onChange={ () => setTeam(option.value) } label={ LocalizeText(option.label) } />
                        )) }
                    </Flex>
                    <Flex gap={ 3 }>
                        { TEAM_OPTIONS.slice(3).map(option => (
                            <WiredRadio key={ option.value } name="teamSelection" checked={ team === option.value } onChange={ () => setTeam(option.value) } label={ LocalizeText(option.label) } />
                        )) }
                    </Flex>
                </Column>
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.placement_selection" divider={ false }>
                <Flex gap={ 3 }>
                    { PLACEMENT_OPTIONS.map(option => (
                        <WiredRadio key={ option.value } name="placementSelection" checked={ placement === option.value } onChange={ () => setPlacement(option.value) } label={ LocalizeText(option.label) } />
                    )) }
                </Flex>
            </WiredParam>
        </WiredConditionBaseView>
    );
}
