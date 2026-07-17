import { VariableDefinition } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { LocalizeText } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredControlSection, WiredControlText, WiredDivider, WiredRadio, WiredTextInput } from '../WiredControls';
import { WiredVariableBaseView } from './WiredVariableBaseView';

const sanitizeVariableName = (input: string): string =>
{
    let result = '';
    for (const c of input.toLowerCase()) {
        if (/[a-z0-9_]/.test(c)) result += c;
        else if (/\s/.test(c)) result += '_';
    }
    return result;
};

const AVAILABILITY_OPTIONS = [ 0, 10, 11 ];

export const WiredVariableGlobalView: FC<{}> = props =>
{
    const [ variableName, setVariableName ] = useState('');
    const [ availability, setAvailability ] = useState(0);
    const { trigger = null, setStringParam = null, setIntParams = null } = useWired();

    const variable = trigger as VariableDefinition;

    const save = () =>
    {
        setStringParam(variableName);
        setIntParams([ availability ]);
    }

    useEffect(() =>
    {
        if(!variable) return;

        setVariableName(variable.variableName ?? '');
        setAvailability(variable.persistence ?? 0);
    }, [ variable ]);

    return (
        <WiredVariableBaseView save={ save }>
            <WiredControlSection title={ LocalizeText('wiredfurni.params.variables.variable_name') }>
                <WiredTextInput type="text" value={ variableName } onChange={ event => setVariableName(sanitizeVariableName(event.target.value)) } maxLength={ 40 } />
            </WiredControlSection>

            <WiredDivider />

            <WiredControlSection title={ LocalizeText('wiredfurni.params.variables.inspection') }>
                <WiredControlText>{ LocalizeText('wiredfurni.params.variables.inspection.current_value', [ 'value' ], [ variable?.value ?? '0' ]) }</WiredControlText>
            </WiredControlSection>

            <WiredDivider />

            <WiredControlSection title={ LocalizeText('wiredfurni.params.variables.availability') }>
                { AVAILABILITY_OPTIONS.map(option =>
                    <WiredRadio
                        key={ option }
                        name="variableAvailability"
                        checked={ availability === option }
                        onChange={ () => setAvailability(option) }
                        label={ LocalizeText(`wiredfurni.params.variables.availability.${ option }`) } />) }
            </WiredControlSection>
        </WiredVariableBaseView>
    );
}
