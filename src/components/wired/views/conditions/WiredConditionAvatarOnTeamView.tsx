import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Column, Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredParam, WiredRadio } from '../WiredControls';
import { createUserSourceSelector, USER_SOURCE_OPTIONS, useWiredEffectSource } from '../effects/WiredEffectSourceSelector';
import { WiredConditionBaseView } from './WiredConditionBaseView';
import { WIRED_CONDITION_QUANTIFIER_ALL as QUANTIFIER_ALL, WIRED_CONDITION_QUANTIFIER_ANY as QUANTIFIER_ANY, WiredConditionQuantifierSection } from './WiredConditionUtils';

const SOURCE_TRIGGER = 0;

const TEAM_ANY    = 0;
const TEAM_RED    = 1;
const TEAM_GREEN  = 2;
const TEAM_BLUE   = 3;
const TEAM_YELLOW = 4;

const TEAM_OPTIONS = [
    { value: TEAM_ANY,    label: 'wiredfurni.params.team.any' },
    { value: TEAM_RED,    label: 'wiredfurni.params.team.1'   },
    { value: TEAM_GREEN,  label: 'wiredfurni.params.team.2'   },
    { value: TEAM_BLUE,   label: 'wiredfurni.params.team.3'   },
    { value: TEAM_YELLOW, label: 'wiredfurni.params.team.4'   },
];

const normalizeTeam = (value: number) => (value >= TEAM_ANY && value <= TEAM_YELLOW) ? value : TEAM_ANY;

export const WiredConditionAvatarOnTeamView: FC<{ isNegative?: boolean }> = props =>
{
    const { isNegative = false } = props;
    const [ team,       setTeam       ] = useState(TEAM_ANY);
    const [ quantifier, setQuantifier ] = useState(QUANTIFIER_ALL);

    const { trigger = null, setIntParams = null } = useWired();
    const [ userSource, setUserSource, sourceExpanded, setSourceExpanded ] = useWiredEffectSource(trigger, 2, SOURCE_TRIGGER, USER_SOURCE_OPTIONS);

    const expanded = quantifier !== QUANTIFIER_ALL || sourceExpanded;

    const save = () => setIntParams([ team, quantifier, userSource ]);

    useEffect(() =>
    {
        if (!trigger) return;

        setTeam(normalizeTeam(trigger.intData?.[0] ?? TEAM_ANY));
        setQuantifier((trigger.intData?.[1] ?? QUANTIFIER_ALL) === QUANTIFIER_ANY ? QUANTIFIER_ANY : QUANTIFIER_ALL);
    }, [ trigger ]);

    const quantifierSlot = (
        <WiredConditionQuantifierSection kind="users" name="teamQuantifier" value={ quantifier } onChange={ setQuantifier } negative={ isNegative } />
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
            <WiredParam titleKey="wiredfurni.params.team" divider={ false }>
                <Column gap={ 1 }>
                    <WiredRadio name="teamSelection" checked={ team === TEAM_ANY } onChange={ () => setTeam(TEAM_ANY) } label={ LocalizeText('wiredfurni.params.team.any') } />
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
        </WiredConditionBaseView>
    );
}
