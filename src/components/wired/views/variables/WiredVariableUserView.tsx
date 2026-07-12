import { VariableDefinition } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { LocalizeText } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredCheckbox, WiredControlSection, WiredDivider, WiredRadio, WiredTextInput } from '../WiredControls';
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

export const WiredVariableUserView: FC<{}> = props =>
{
    const [ variableName, setVariableName ] = useState('');
    const [ availability, setAvailability ] = useState(0);
    const [ hasValue, setHasValue ] = useState(false);
    const { trigger = null, setStringParam = null, setIntParams = null } = useWired();

    const variable = trigger as VariableDefinition;

    const save = () =>
    {
        setStringParam(variableName);
        setIntParams([ availability, hasValue ? 1 : 0 ]);
    }

    useEffect(() =>
    {
        if(!variable) return;

        setVariableName(variable.variableName ?? '');
        setAvailability(variable.persistence ?? 0);
        setHasValue(variable.value === '1');
    }, [ variable ]);

    return (
        <WiredVariableBaseView save={ save }>
            <WiredControlSection title={ LocalizeText('wiredfurni.params.variables.variable_name') }>
                <WiredTextInput type="text" value={ variableName } onChange={ event => setVariableName(sanitizeVariableName(event.target.value)) } maxLength={ 40 } />
            </WiredControlSection>

            <WiredDivider />

            <WiredControlSection title={ LocalizeText('wiredfurni.params.variables.settings') }>
                <WiredCheckbox
                    checked={ hasValue }
                    onChange={ setHasValue }
                    label={ LocalizeText('wiredfurni.params.variables.settings.has_value') } />
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
