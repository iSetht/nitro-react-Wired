import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';
import { WiredDisabled, WiredParam, WiredRadio, WiredTextInput } from '../WiredControls';
import { useWiredEffectSource } from '../effects/WiredEffectSourceSelector';
import { WiredSourceSelectorConfig } from '../WiredFurniSelectorView';
import { WIRED_CONDITION_QUANTIFIER_ALL as QUANTIFIER_ALL, WIRED_CONDITION_QUANTIFIER_ANY as QUANTIFIER_ANY, WiredConditionQuantifierSection } from './WiredConditionUtils';

const SOURCE_TRIGGER            = 0;
const SOURCE_SECONDARY_SELECTED = 101;
const SOURCE_SELECTOR           = 200;
const SOURCE_SIGNAL             = 201;

const MATCH_SOURCE_OPTIONS   = [ SOURCE_TRIGGER, SOURCE_SELECTOR, SOURCE_SIGNAL ];
const COMPARE_SOURCE_OPTIONS = [ SOURCE_SECONDARY_SELECTED, SOURCE_SELECTOR, SOURCE_SIGNAL, SOURCE_TRIGGER ];

const USER_TYPE_HABBO = 1;
const USER_TYPE_PET   = 2;
const USER_TYPE_BOT   = 4;

export const WiredConditionAvatarMatchesView: FC<{ isNegative?: boolean }> = props =>
{
    const { isNegative = false } = props;
    const [ userType,   setUserType   ] = useState(USER_TYPE_HABBO);
    const [ anyAvatar,  setAnyAvatar  ] = useState(1);
    const [ targetName, setTargetName ] = useState('');
    const [ quantifier, setQuantifier ] = useState(QUANTIFIER_ALL);

    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();

    const [ matchSource,   setMatchSource,   matchExpanded,   setMatchExpanded   ] = useWiredEffectSource(trigger, 3, SOURCE_TRIGGER,            MATCH_SOURCE_OPTIONS);
    const [ compareSource, setCompareSource, compareExpanded, setCompareExpanded ] = useWiredEffectSource(trigger, 4, SOURCE_SECONDARY_SELECTED, COMPARE_SOURCE_OPTIONS);

    const expanded = quantifier !== QUANTIFIER_ALL || matchExpanded || compareExpanded;

    const save = () =>
    {
        setIntParams([ userType, anyAvatar, quantifier, matchSource, compareSource ]);
        setStringParam(targetName);
    };

    useEffect(() =>
    {
        if (!trigger) return;
        setUserType(trigger.intData?.[0] ?? USER_TYPE_HABBO);
        setAnyAvatar(trigger.intData?.[1] ?? 1);
        setQuantifier(trigger.intData?.[2] ?? QUANTIFIER_ALL);
        setTargetName(trigger.stringData ?? '');
    }, [ trigger ]);

    const matchSourceSelector: WiredSourceSelectorConfig = {
        value:       matchSource,
        onChange:    setMatchSource,
        options:     MATCH_SOURCE_OPTIONS,
        titleKey:    'wiredfurni.params.sources.users.title.match.0',
        labelPrefix: 'wiredfurni.params.sources.users'
    };

    const compareSourceSelector: WiredSourceSelectorConfig = {
        value:       compareSource,
        onChange:    setCompareSource,
        options:     COMPARE_SOURCE_OPTIONS,
        titleKey:    'wiredfurni.params.sources.users.title.match.1',
        labelPrefix: 'wiredfurni.params.sources.users'
    };

    const quantifierSlot = (
        <WiredConditionQuantifierSection kind="users" name="avatarMatchesQuantifier" value={ quantifier } onChange={ setQuantifier } negative={ isNegative } />
    );

    return (
        <WiredConditionBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ matchSourceSelector, compareSourceSelector ] }
            advancedSlot={ quantifierSlot }
            expanded={ expanded }
            onToggleExpanded={ () =>
            {
                const next = !expanded;
                setMatchExpanded(next);
                setCompareExpanded(next);
            } }>
            <WiredParam titleKey="wiredfurni.params.usertype">
                { [ USER_TYPE_HABBO, USER_TYPE_PET, USER_TYPE_BOT ].map(value => (
                    <WiredRadio
                        key={ value }
                        name="avatarMatchesUserType"
                        checked={ userType === value }
                        onChange={ () => setUserType(value) }
                        label={ LocalizeText('wiredfurni.params.usertype.' + value) } />
                )) }
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.picktriggerer" divider={ false }>
                <WiredRadio
                    name="avatarMatchesAny"
                    checked={ anyAvatar === 1 }
                    onChange={ () => setAnyAvatar(1) }
                    label={ LocalizeText('wiredfurni.params.anyavatar') } />
                <WiredRadio
                    name="avatarMatchesAny"
                    checked={ anyAvatar === 0 }
                    onChange={ () => setAnyAvatar(0) }
                    label={ LocalizeText('wiredfurni.params.certainavatar') } />
                <WiredDisabled disabled={ anyAvatar !== 0 } className="nw-indent-tab">
                    <WiredTextInput
                        className="nw-w-190"
                        type="text"
                        value={ targetName }
                        onChange={ e => setTargetName(e.target.value) }
                        placeholder={ LocalizeText('wiredfurni.params.certainavatar') } />
                </WiredDisabled>
            </WiredParam>
        </WiredConditionBaseView>
    );
}
