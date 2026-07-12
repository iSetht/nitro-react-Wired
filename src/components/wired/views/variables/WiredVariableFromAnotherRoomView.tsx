import { VariableDefinition } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredCheckbox, WiredControlSection, WiredDivider, WiredSelect, WiredTextInput } from '../WiredControls';
import { WiredVariableBaseView } from './WiredVariableBaseView';

const WIRED_VARIABLE_GLOBAL = 1;

interface SharedVariable
{
    type: number;
    name: string;
}

interface SharedRoom
{
    id: number;
    name: string;
    variables: SharedVariable[];
}

interface ReferenceEditorData
{
    sourceRoomId?: number;
    sourceVariableType?: number;
    sourceVariableName?: string;
    rooms?: SharedRoom[];
}

const sanitizeVariableName = (input: string): string =>
{
    let result = '';
    for (const c of input.toLowerCase()) {
        if (/[a-z0-9_]/.test(c)) result += c;
        else if (/\s/.test(c)) result += '_';
    }
    return result;
};

const parseReferenceData = (value: string): ReferenceEditorData =>
{
    if(!value || !value.startsWith('{')) return {};

    try
    {
        return JSON.parse(value);
    }
    catch
    {
        return {};
    }
}

const variableKey = (variable: SharedVariable) => `${ variable.type }:${ variable.name }`;
const parseVariableKey = (key: string): SharedVariable | null =>
{
    const separator = key.indexOf(':');

    if(separator <= 0) return null;

    const type = Number(key.slice(0, separator));
    const name = key.slice(separator + 1);

    if(!Number.isFinite(type) || !name) return null;

    return { type, name };
};

const ROOM_PLACEHOLDER = 0;
const VARIABLE_PLACEHOLDER = '';

export const WiredVariableFromAnotherRoomView: FC<{}> = props =>
{
    const [ variableName, setVariableName ] = useState('');
    const [ sourceRoomId, setSourceRoomId ] = useState(0);
    const [ sourceVariableKey, setSourceVariableKey ] = useState('');
    const [ readOnly, setReadOnly ] = useState(true);
    const { trigger = null, setStringParam = null, setIntParams = null } = useWired();

    const variable = trigger as VariableDefinition;

    const rawValue = variable?.value ?? '';
    const data = useMemo(() => parseReferenceData(rawValue), [ rawValue ]);

    const rooms = data.rooms ?? [];
    const selectedRoom = rooms.find(room => room.id === sourceRoomId);

    const savedVariableKey = data.sourceVariableName
        ? `${ data.sourceVariableType ?? WIRED_VARIABLE_GLOBAL }:${ data.sourceVariableName }`
        : '';

    const selectedVariable = selectedRoom?.variables.find(next => variableKey(next) === sourceVariableKey)
        ?? parseVariableKey(sourceVariableKey);

    const variableOptions = useMemo(() =>
    {
        const options = [ ...(selectedRoom?.variables ?? []) ];


        if(savedVariableKey && sourceRoomId === data.sourceRoomId && !options.some(next => variableKey(next) === savedVariableKey))
        {
            const parsed = parseVariableKey(savedVariableKey);
            if(parsed) options.push(parsed);
        }

        return options;
    }, [ selectedRoom, savedVariableKey, sourceRoomId, data.sourceRoomId ]);

    const save = () =>
    {
        setStringParam(JSON.stringify({
            name: variableName,
            sourceRoomId,
            sourceVariableType: selectedVariable?.type ?? WIRED_VARIABLE_GLOBAL,
            sourceVariableName: selectedVariable?.name ?? ''
        }));
        setIntParams([ readOnly ? 1 : 0 ]);
    }

    useEffect(() =>
    {
        if(!variable) return;

        const nextRoomId = data.sourceRoomId ?? ROOM_PLACEHOLDER;
        const nextVariableType = data.sourceVariableType ?? WIRED_VARIABLE_GLOBAL;
        const nextVariableName = data.sourceVariableName ?? VARIABLE_PLACEHOLDER;

        setVariableName(variable.variableName ?? '');
        setReadOnly(variable.persistence === 1);
        setSourceRoomId(nextRoomId);
        setSourceVariableKey(nextVariableName ? `${ nextVariableType }:${ nextVariableName }` : '');
    }, [ variable ]);

    useEffect(() =>
    {
        if(variableName || !selectedVariable?.name) return;

        setVariableName(sanitizeVariableName(selectedVariable.name));
    }, [ selectedVariable, variableName ]);

    return (
        <WiredVariableBaseView save={ save }>
            <WiredControlSection title={ LocalizeText('wiredfurni.params.variables.variable_name') }>
                <WiredTextInput type="text" value={ variableName } onChange={ event => setVariableName(sanitizeVariableName(event.target.value)) } maxLength={ 40 } />
            </WiredControlSection>

            <WiredDivider />

            <WiredControlSection title={ LocalizeText('wiredfurni.params.room_selection') }>
                <WiredSelect
                    value={ sourceRoomId }
                    onChange={ event =>
                    {
                        setSourceRoomId(Number(event.target.value));
                        setSourceVariableKey('');
                    } }
                    options={ [
                        { value: ROOM_PLACEHOLDER, label: LocalizeText('wiredfurni.params.room_selection'), disabled: true },
                        ...rooms.map(room => ({ value: room.id, label: room.name || String(room.id) }))
                    ] } />
            </WiredControlSection>

            <WiredDivider />

            <WiredControlSection title={ LocalizeText('wiredfurni.params.variables.variable_ref_selection') }>
                <WiredSelect
                    value={ sourceVariableKey }
                    onChange={ event => setSourceVariableKey(event.target.value) }
                    disabled={ !selectedRoom?.variables?.length }
                    options={ [
                        { value: VARIABLE_PLACEHOLDER, label: LocalizeText('wiredfurni.params.variables.variable_ref_selection'), disabled: true },
                        ...variableOptions.map(next => ({ value: variableKey(next), label: next.name }))
                    ] } />
            </WiredControlSection>

            <WiredDivider />

            <WiredControlSection title={ LocalizeText('wiredfurni.params.variables.settings') }>
                <WiredCheckbox
                    checked={ readOnly }
                    onChange={ setReadOnly }
                    label={ LocalizeText('wiredfurni.params.variables.settings.read_only') } />
            </WiredControlSection>
        </WiredVariableBaseView>
    );
}