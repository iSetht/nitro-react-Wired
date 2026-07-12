import { VariableDefinition } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { LocalizeText } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredCheckbox, WiredControlSection, WiredDivider, WiredTextInput } from '../WiredControls';
import { WiredVariableBaseView } from './WiredVariableBaseView';

/**
 * Sanitize on every keystroke: spaces become underscores, invalid chars are dropped.
 * Trailing underscores are kept so the user can type "test_var" naturally.
 * Full trim of leading/trailing underscores happens on the backend when saved.
 */
const sanitizeVariableName = (input: string): string =>
{
    let result = '';
    for (const c of input.toLowerCase()) {
        if (/[a-z0-9_]/.test(c)) result += c;
        else if (/\s/.test(c)) result += '_';
    }
    return result;
};

/**
 * Context variables live only for the duration of the wired signal execution that initialised them.
 * They have no persistence option — once the execution ends the value is gone.
 *
 * The only runtime setting is whether the variable tracks a numeric value ("has value") or is
 * purely a presence flag. Availability / persistence options are intentionally absent.
 */
export const WiredVariableContextView: FC<{}> = props =>
{
    const [ variableName, setVariableName ] = useState('');
    const [ hasValue, setHasValue ] = useState(false);
    const { trigger = null, setStringParam = null, setIntParams = null } = useWired();

    const variable = trigger as VariableDefinition;

    const save = () =>
    {
        setStringParam(variableName);
        // persistence code 0 (ignored by backend for context), hasValue as second param
        setIntParams([ 0, hasValue ? 1 : 0 ]);
    }

    useEffect(() =>
    {
        if(!variable) return;

        setVariableName(variable.variableName ?? '');
        setHasValue(variable.value === '1');
    }, [ variable ]);

    return (
        <WiredVariableBaseView save={ save }>
            <WiredControlSection title={ LocalizeText('wiredfurni.params.variables.variable_name') }>
                <WiredTextInput
                    type="text"
                    value={ variableName }
                    onChange={ event => setVariableName(sanitizeVariableName(event.target.value)) }
                    maxLength={ 40 } />
            </WiredControlSection>

            <WiredDivider />

            <WiredControlSection title={ LocalizeText('wiredfurni.params.variables.settings') }>
                <WiredCheckbox
                    checked={ hasValue }
                    onChange={ setHasValue }
                    label={ LocalizeText('wiredfurni.params.variables.settings.has_value') } />
            </WiredControlSection>
        </WiredVariableBaseView>
    );
}
