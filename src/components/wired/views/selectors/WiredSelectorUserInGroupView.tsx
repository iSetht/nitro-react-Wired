import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredParam, WiredRadio, WiredSelect } from '../WiredControls';
import { WiredSelectorBaseView } from './WiredSelectorBaseView';

const GROUP_TYPE_CURRENT_ROOM = 0;
const GROUP_TYPE_SELECT_LIST = 1;

const GROUP_TYPE_OPTIONS = [
    { value: GROUP_TYPE_CURRENT_ROOM, label: 'wiredfurni.params.grouptype.0' },
    { value: GROUP_TYPE_SELECT_LIST,  label: 'wiredfurni.params.grouptype.1' },
];

interface GroupOption
{
    id: number;
    name: string;
}

const normalizeGroupType = (value: number) => (value === GROUP_TYPE_SELECT_LIST) ? GROUP_TYPE_SELECT_LIST : GROUP_TYPE_CURRENT_ROOM;

const parseGroups = (value: string) =>
{
    if(!value) return [];

    try
    {
        const groups = JSON.parse(value);

        if(!Array.isArray(groups)) return [];

        return groups
            .map(group => ({
                id: Number(group.id || 0),
                name: String(group.name || '')
            }))
            .filter(group => group.id > 0);
    }
    catch
    {
        return [];
    }
};

export const WiredSelectorUserInGroupView: FC<{}> = props =>
{
    const [ groupType, setGroupType ] = useState(GROUP_TYPE_CURRENT_ROOM);
    const [ selectedGroupId, setSelectedGroupId ] = useState(0);
    const [ groups, setGroups ] = useState<GroupOption[]>([]);
    const { trigger = null, setIntParams = null } = useWired();

    const save = (filterExistingSelection = false, invert = false) =>
    {
        setIntParams([
            groupType,
            selectedGroupId,
            filterExistingSelection ? 1 : 0,
            invert ? 1 : 0
        ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        const availableGroups = parseGroups(trigger.stringData || '');
        const savedGroupType = normalizeGroupType((trigger.intData.length > 0) ? trigger.intData[0] : GROUP_TYPE_CURRENT_ROOM);
        const savedGroupId = (trigger.intData.length > 1) ? Math.max(0, trigger.intData[1]) : 0;

        setGroups(availableGroups);
        setGroupType(savedGroupType);
        setSelectedGroupId(availableGroups.some(group => group.id === savedGroupId) ? savedGroupId : 0);
    }, [ trigger ]);

    return (
        <WiredSelectorBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            showSelectorOptions={ true }
            selectorOptionOffset={ 2 }
        >
            <WiredParam titleKey="wiredfurni.params.groupselection">
                { GROUP_TYPE_OPTIONS.map(option => (
                    <WiredRadio
                        key={ option.value }
                        name="groupType"
                        checked={ groupType === option.value }
                        onChange={ () => setGroupType(option.value) }
                        label={ LocalizeText(option.label) } />
                )) }

                <WiredSelect
                    disabled={ (groupType !== GROUP_TYPE_SELECT_LIST) || !groups.length }
                    value={ selectedGroupId }
                    onChange={ event => setSelectedGroupId(Math.max(0, Number(event.target.value))) }
                    options={ [
                        { value: 0, label: LocalizeText('wiredfurni.tooltip.group') },
                        ...groups.map(group => ({ value: group.id, label: group.name }))
                    ] } />
            </WiredParam>
        </WiredSelectorBaseView>
    );
}
