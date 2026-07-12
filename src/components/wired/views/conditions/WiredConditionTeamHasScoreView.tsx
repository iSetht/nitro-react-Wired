import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Column, Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredControlTitle, WiredParam, WiredRadio, WiredSlider, WiredTextInput } from '../WiredControls';
import { createUserSourceSelector, USER_SOURCE_OPTIONS, useWiredEffectSource } from '../effects/WiredEffectSourceSelector';
import { WiredConditionBaseView } from './WiredConditionBaseView';
import { WIRED_CONDITION_QUANTIFIER_ALL as QUANTIFIER_ALL, WIRED_CONDITION_QUANTIFIER_ANY as QUANTIFIER_ANY, WiredConditionQuantifierSection } from './WiredConditionUtils';

const SOURCE_TRIGGER    = 0;

const TEAM_TRIGGERER    = 0;
const TEAM_RED          = 1;
const TEAM_GREEN        = 2;
const TEAM_BLUE         = 3;
const TEAM_YELLOW       = 4;

const COMPARISON_LOWER  = 0;
const COMPARISON_EQUALS = 1;
const COMPARISON_HIGHER = 2;

const SCORE_MIN = 0;
const SCORE_MAX = 1000;

const TEAM_OPTIONS = [
    { value: TEAM_TRIGGERER, label: 'wiredfurni.params.team.triggerer' },
    { value: TEAM_RED,       label: 'wiredfurni.params.team.1'         },
    { value: TEAM_GREEN,     label: 'wiredfurni.params.team.2'         },
    { value: TEAM_BLUE,      label: 'wiredfurni.params.team.3'         },
    { value: TEAM_YELLOW,    label: 'wiredfurni.params.team.4'         },
];

const COMPARISON_OPTIONS = [
    { value: COMPARISON_LOWER,  label: 'wiredfurni.params.comparison.0' },
    { value: COMPARISON_EQUALS, label: 'wiredfurni.params.comparison.1' },
    { value: COMPARISON_HIGHER, label: 'wiredfurni.params.comparison.2' },
];

const clampScore = (v: number) => Math.max(SCORE_MIN, Math.min(SCORE_MAX, Math.round(v)));

export const WiredConditionTeamHasScoreView: FC<{}> = () =>
{
    const [ team,       setTeam       ] = useState(TEAM_TRIGGERER);
    const [ comparison, setComparison ] = useState(COMPARISON_EQUALS);
    const [ score,      setScore      ] = useState(0);
    const [ quantifier, setQuantifier ] = useState(QUANTIFIER_ALL);

    const { trigger = null, setIntParams = null } = useWired();
    const [ userSource, setUserSource, sourceExpanded, setSourceExpanded ] = useWiredEffectSource(trigger, 4, SOURCE_TRIGGER, USER_SOURCE_OPTIONS);

    const expanded = quantifier !== QUANTIFIER_ALL || sourceExpanded;

    const save = () => setIntParams([ team, comparison, score, quantifier, userSource ]);

    const handleScoreText = (raw: string) =>
    {
        const parsed = parseInt(raw, 10);
        if (!isNaN(parsed)) setScore(clampScore(parsed));
    };

    useEffect(() =>
    {
        if (!trigger) return;

        const p = trigger.intData ?? [];
        const t = p[0] ?? TEAM_TRIGGERER;
        setTeam((t >= TEAM_TRIGGERER && t <= TEAM_YELLOW) ? t : TEAM_TRIGGERER);
        setComparison(([COMPARISON_LOWER, COMPARISON_EQUALS, COMPARISON_HIGHER].includes(p[1])) ? p[1] : COMPARISON_EQUALS);
        setScore(clampScore(p[2] ?? 0));
        setQuantifier((p[3] ?? QUANTIFIER_ALL) === QUANTIFIER_ANY ? QUANTIFIER_ANY : QUANTIFIER_ALL);
    }, [ trigger ]);

    const quantifierSlot = (
        <WiredConditionQuantifierSection kind="users" name="scoreQuantifier" value={ quantifier } onChange={ setQuantifier } />
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

            <WiredParam titleKey="wiredfurni.params.choose_type">
                { COMPARISON_OPTIONS.map(option => (
                    <WiredRadio key={ option.value } name="comparisonSelection" checked={ comparison === option.value } onChange={ () => setComparison(option.value) } label={ LocalizeText(option.label) } />
                )) }
            </WiredParam>

            <WiredParam divider={ false }>
                <Flex className="nw-title-input-row" alignItems="center" gap={ 1 }>
                    <WiredControlTitle>{ LocalizeText('wiredfurni.params.setscore2') }</WiredControlTitle>
                    <WiredTextInput
                        compact
                        type="number"
                        min={ SCORE_MIN }
                        max={ SCORE_MAX }
                        value={ score }
                        onChange={ e => handleScoreText(e.target.value) } />
                </Flex>
                <WiredSlider
                    min={ SCORE_MIN }
                    max={ SCORE_MAX }
                    step={ 1 }
                    value={ score }
                    onChange={ (v: number) => setScore(clampScore(v)) } />
            </WiredParam>
        </WiredConditionBaseView>
    );
}
