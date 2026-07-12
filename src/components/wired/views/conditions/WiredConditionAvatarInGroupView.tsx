import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Column } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredParam, WiredRadio, WiredSelect } from '../WiredControls';
import { createUserSourceSelector, USER_SOURCE_OPTIONS, useWiredEffectSource } from '../effects/WiredEffectSourceSelector';
import { WiredConditionBaseView } from './WiredConditionBaseView';
import { WIRED_CONDITION_QUANTIFIER_ALL as QUANTIFIER_ALL, WIRED_CONDITION_QUANTIFIER_ANY as QUANTIFIER_ANY, WiredConditionQuantifierSection } from './WiredConditionUtils';

const SOURCE_TRIGGER        = 0;
const GROUP_TYPE_CURRENT_ROOM = 0;
const GROUP_TYPE_SELECT_LIST  = 1;

const GROUP_TYPE_OPTIONS = [
    { value: GROUP_TYPE_CURRENT_ROOM, label: 'wiredfurni.params.grouptype.0' },
    { value: GROUP_TYPE_SELECT_LIST,  label: 'wiredfurni.params.grouptype.1' },
];

interface GroupOption { id: number; name: string; }

const normalizeGroupType = (v: number) => (v === GROUP_TYPE_SELECT_LIST) ? GROUP_TYPE_SELECT_LIST : GROUP_TYPE_CURRENT_ROOM;

const parseGroups = (value: string): GroupOption[] =>
{
    if (!value) return [];
    try
    {
        const groups = JSON.parse(value);
        if (!Array.isArray(groups)) return [];
        return groups
            .map((g: any) => ({ id: Number(g.id || 0), name: String(g.name || '') }))
            .filter((g: GroupOption) => g.id > 0);
    }
    catch { return []; }
};

export const WiredConditionAvatarInGroupView: FC<{ isNegative?: boolean }> = props =>
{
    const { isNegative = false } = props;
    const [ groupType,       setGroupType       ] = useState(GROUP_TYPE_CURRENT_ROOM);
    const [ selectedGroupId, setSelectedGroupId ] = useState(0);
    const [ groups,          setGroups          ] = useState<GroupOption[]>([]);
    const [ quantifier,      setQuantifier      ] = useState(QUANTIFIER_ALL);

    const { trigger = null, setIntParams = null } = useWired();
    const [ userSource, setUserSource, sourceExpanded, setSourceExpanded ] = useWiredEffectSource(trigger, 3, SOURCE_TRIGGER, USER_SOURCE_OPTIONS);

    const expanded = quantifier !== QUANTIFIER_ALL || sourceExpanded;

    const save = () => setIntParams([ groupType, selectedGroupId, quantifier, userSource ]);

    useEffect(() =>
    {
        if (!trigger) return;

        const availableGroups = parseGroups(trigger.stringData || '');
        const savedGroupType  = normalizeGroupType(trigger.intData?.[0] ?? GROUP_TYPE_CURRENT_ROOM);
        const savedGroupId    = Math.max(0, trigger.intData?.[1] ?? 0);

        setGroups(availableGroups);
        setGroupType(savedGroupType);
        setSelectedGroupId(availableGroups.some(g => g.id === savedGroupId) ? savedGroupId : 0);
        setQuantifier(trigger.intData?.[2] ?? QUANTIFIER_ALL);
    }, [ trigger ]);

    const quantifierSlot = (
        <WiredConditionQuantifierSection kind="users" name="inGroupQuantifier" value={ quantifier } onChange={ setQuantifier } negative={ isNegative } />
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
            <WiredParam titleKey="wiredfurni.params.groupselection" divider={ false }>
                <Column gap={ 1 }>
                    { GROUP_TYPE_OPTIONS.map(option => (
                        <WiredRadio
                            key={ option.value }
                            name="inGroupType"
                            checked={ groupType === option.value }
                            onChange={ () => setGroupType(option.value) }
                            label={ LocalizeText(option.label) } />
                    )) }

                    <WiredSelect
                        disabled={ (groupType !== GROUP_TYPE_SELECT_LIST) || !groups.length }
                        value={ selectedGroupId }
                        onChange={ e => setSelectedGroupId(Math.max(0, Number(e.target.value))) }
                        options={ [
                            { value: 0, label: LocalizeText('wiredfurni.tooltip.group') },
                            ...groups.map(group => ({ value: group.id, label: group.name }))
                        ] } />
                </Column>
            </WiredParam>
        </WiredConditionBaseView>
    );
}
