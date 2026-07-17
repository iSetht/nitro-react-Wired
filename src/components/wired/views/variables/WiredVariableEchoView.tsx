import { VariableDefinition } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText } from '../../../../api';
import { useWired } from '../../../../hooks';
import {
    parseWiredData,
    wiredVariableIsSelectable,
    wiredVariablesForType,
    WIRED_VARIABLE_CONTEXT,
    WIRED_VARIABLE_FURNI,
    WIRED_VARIABLE_GLOBAL,
    WIRED_VARIABLE_USER,
    WiredControlSection,
    WiredControlTitle,
    WiredDivider,
    WiredTextInput,
    WiredVariableLists,
    WiredVariableNameSelect,
    WiredVariableTypeSelector
} from '../WiredControls';
import { WiredVariableBaseView } from './WiredVariableBaseView';

const VALID_VARIABLE_TYPES = [ WIRED_VARIABLE_FURNI, WIRED_VARIABLE_GLOBAL, WIRED_VARIABLE_USER, WIRED_VARIABLE_CONTEXT ];

interface EchoEditorData
{
    sourceVariableType?: number;
    sourceVariableName?: string;
    globalVariables?: string[];
    furniVariables?: string[];
    userVariables?: string[];
    contextVariables?: string[];
    subVariables?: Record<string, string[]>;
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

const normalizeVariableType = (value: number) => VALID_VARIABLE_TYPES.includes(value) ? value : WIRED_VARIABLE_GLOBAL;
const variableNameFromInternal = (name: string) => sanitizeVariableName(name.replace(/^@/, '').replace(/\./g, '_'));

export const WiredVariableEchoView: FC<{}> = props =>
{
    const [ variableName, setVariableName ] = useState('');
    const [ sourceVariableType, setSourceVariableType ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ sourceVariableName, setSourceVariableName ] = useState('');
    const { trigger = null, setStringParam = null, setIntParams = null } = useWired();

    const variable = trigger as VariableDefinition;
    const data = useMemo(() => parseWiredData<EchoEditorData>(variable?.value ?? ''), [ variable ]);
    const subVariables = useMemo(() => data.subVariables ?? {}, [ data ]);
    const variables = useMemo<WiredVariableLists>(() => ({
        global: data.globalVariables ?? [],
        furni: data.furniVariables ?? [],
        user: data.userVariables ?? [],
        context: data.contextVariables ?? []
    }), [ data ]);

    const save = () =>
    {
        setStringParam(JSON.stringify({
            name: variableName,
            sourceVariableType,
            sourceVariableName
        }));
        setIntParams([ 0 ]);
    }

    useEffect(() =>
    {
        if(!variable) return;

        const nextType = normalizeVariableType(data.sourceVariableType ?? WIRED_VARIABLE_GLOBAL);
        const nextName = data.sourceVariableName ?? '';
        const options = wiredVariablesForType(nextType, variables);

        setVariableName(variable.variableName ?? '');
        setSourceVariableType(nextType);
        setSourceVariableName(wiredVariableIsSelectable(nextName, options, subVariables) ? nextName : '');
    }, [ variable, data, variables, subVariables ]);

    const setNormalizedSourceType = (type: number) =>
    {
        setSourceVariableType(normalizeVariableType(type));
        setSourceVariableName('');
    };

    const setSelectedInternalVariable = (name: string) =>
    {
        setSourceVariableName(name);
        setVariableName(variableNameFromInternal(name));
    };

    return (
        <WiredVariableBaseView save={ save }>
            <WiredControlSection title={ LocalizeText('wiredfurni.params.variables.variable_name') }>
                <WiredTextInput type="text" value={ variableName } onChange={ event => setVariableName(sanitizeVariableName(event.target.value)) } maxLength={ 40 } />
            </WiredControlSection>

            <WiredDivider />

            <div className="nw-control-section">
                <div className="nw-echo-picker-title-row">
                    <WiredControlTitle>{ LocalizeText('wiredfurni.params.variables.variable_selection') }</WiredControlTitle>
                    <WiredVariableTypeSelector value={ sourceVariableType } onChange={ setNormalizedSourceType } />
                </div>
                <WiredVariableNameSelect
                    variableType={ sourceVariableType }
                    variableName={ sourceVariableName }
                    onVariableNameChange={ setSelectedInternalVariable }
                    variables={ variables }
                    subVariables={ subVariables } />
            </div>
        </WiredVariableBaseView>
    );
}
