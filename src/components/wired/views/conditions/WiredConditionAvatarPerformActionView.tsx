import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredCheckbox, WiredParam, WiredSelect } from '../WiredControls';
import { createUserSourceSelector, USER_SOURCE_OPTIONS, useWiredEffectSource } from '../effects/WiredEffectSourceSelector';
import { WiredConditionBaseView } from './WiredConditionBaseView';
import { WIRED_CONDITION_QUANTIFIER_ALL as QUANTIFIER_ALL, WIRED_CONDITION_QUANTIFIER_ANY as QUANTIFIER_ANY, WiredConditionQuantifierSection } from './WiredConditionUtils';

const SOURCE_TRIGGER = 0;

const ACTIONS = [
    { label: 'widget.memenu.wave',         value: 1  },
    { label: 'widget.memenu.blow',         value: 2  },
    { label: 'widget.memenu.laugh',        value: 3  },
    { label: 'wiredfurni.params.action.4', value: 4  },
    { label: 'widget.memenu.idle',         value: 5  },
    { label: 'widget.memenu.jump',         value: 6  },
    { label: 'widget.memenu.thumb',        value: 7  },
    { label: 'widget.memenu.sit',          value: 8  },
    { label: 'widget.memenu.stand',        value: 9  },
    { label: 'wiredfurni.params.action.8', value: 10 },
    { label: 'wiredfurni.params.action.9', value: 11 },
    { label: 'widget.memenu.sign',         value: 12 },
    { label: 'widget.memenu.dance1',       value: 13 },
];

const SIGNS  = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17];
const DANCES = [
    { label: 'widget.memenu.dance1', value: 1 },
    { label: 'widget.memenu.dance2', value: 2 },
    { label: 'widget.memenu.dance3', value: 3 },
    { label: 'widget.memenu.dance4', value: 4 },
];

export const WiredConditionAvatarPerformActionView: FC<{ isNegative?: boolean }> = props =>
{
    const { isNegative = false } = props;
    const [ action,        setAction        ] = useState(1);
    const [ filterEnabled, setFilterEnabled ] = useState(false);
    const [ subSelection,  setSubSelection  ] = useState(0);
    const [ quantifier,    setQuantifier    ] = useState(QUANTIFIER_ALL);

    const { trigger = null, setIntParams = null } = useWired();
    const [ userSource, setUserSource, sourceExpanded, setSourceExpanded ] = useWiredEffectSource(trigger, 4, SOURCE_TRIGGER, USER_SOURCE_OPTIONS);

    const isSign  = action === 12;
    const isDance = action === 13;
    const expanded = quantifier !== QUANTIFIER_ALL || sourceExpanded;

    const save = () => setIntParams([ action, filterEnabled ? 1 : 0, filterEnabled ? subSelection : 0, quantifier, userSource ]);

    useEffect(() =>
    {
        if (!trigger) return;
        setAction(         trigger.intData?.[0] ?? 1);
        setFilterEnabled(  trigger.intData?.[1] === 1);
        setSubSelection(   trigger.intData?.[2] ?? 0);
        setQuantifier(     trigger.intData?.[3] ?? QUANTIFIER_ALL);
    }, [ trigger ]);

    const handleActionChange = (newAction: number) =>
    {
        setAction(newAction);
        setFilterEnabled(false);
        setSubSelection(0);
    };

    const quantifierSlot = (
        <WiredConditionQuantifierSection kind="users" name="performActionQuantifier" value={ quantifier } onChange={ setQuantifier } negative={ isNegative } />
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
            <WiredParam titleKey="wiredfurni.params.action_selection" divider={ isSign || isDance }>
                <WiredSelect value={ action } onChange={ e => handleActionChange(Number(e.target.value)) } options={ ACTIONS.map(a => ({ value: a.value, label: LocalizeText(a.label) })) } />
            </WiredParam>

            { (isSign || isDance) &&
                <WiredParam titleKey={ isSign ? 'wiredfurni.params.sign_selection' : 'wiredfurni.params.dance_selection' } divider={ false }>
                    <WiredCheckbox
                        checked={ filterEnabled }
                        onChange={ setFilterEnabled }
                        label={ LocalizeText(isSign ? 'wiredfurni.params.sign_filter' : 'wiredfurni.params.dance_filter') } />
                    { filterEnabled &&
                        <WiredSelect
                            className="nw-indent-tab nw-w-190"
                            value={ subSelection }
                            onChange={ e => setSubSelection(Number(e.target.value)) }
                            options={ isSign
                                ? SIGNS.map(sign => ({ value: sign, label: LocalizeText(`wiredfurni.params.action.sign.${ sign }`) }))
                                : DANCES.map(dance => ({ value: dance.value, label: LocalizeText(dance.label) })) } /> }
                </WiredParam> }
        </WiredConditionBaseView>
    );
}
