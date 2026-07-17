import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import {
    parseWiredData,
    WiredCheckbox,
    WiredDisabled,
    WiredParam,
    WiredVariableLists,
    WiredVariablePicker,
    wiredVariableIsSelectable,
    WIRED_VARIABLE_CONTEXT,
    WIRED_VARIABLE_FURNI,
    WIRED_VARIABLE_GLOBAL,
    WIRED_VARIABLE_USER
} from '../WiredControls';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';

const OPTION_CREATED = 1;
const OPTION_VALUE_CHANGED = 1 << 1;
const OPTION_INCREASED = 1 << 2;
const OPTION_DECREASED = 1 << 3;
const OPTION_UNCHANGED = 1 << 4;
const OPTION_DELETED = 1 << 5;
const DEFAULT_OPTIONS = OPTION_CREATED | OPTION_VALUE_CHANGED | OPTION_DELETED;
const VALID_VARIABLE_TYPES = [ WIRED_VARIABLE_FURNI, WIRED_VARIABLE_GLOBAL, WIRED_VARIABLE_USER ];

interface VariableChangedData
{
    variableName?: string;
    globalVariables?: string[];
    furniVariables?: string[];
    userVariables?: string[];
    subVariables?: Record<string, string[]>;
    variableType?: number;
    options?: number;
}

const normalizeVariableType = (value: number) => VALID_VARIABLE_TYPES.includes(value) ? value : WIRED_VARIABLE_GLOBAL;
const hasOption = (options: number, option: number) => (options & option) !== 0;

export const WiredTriggerVariableChangedView: FC<{}> = () =>
{
    const [ variableType, setVariableType ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ variableName, setVariableName ] = useState('');
    const [ options, setOptions ] = useState(DEFAULT_OPTIONS);
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired() as any;

    const data = useMemo(() => parseWiredData<VariableChangedData>(trigger?.stringData ?? ''), [ trigger ]);
    const variables = useMemo<WiredVariableLists>(() => ({
        global: data.globalVariables ?? [],
        furni: data.furniVariables ?? [],
        user: data.userVariables ?? []
    }), [ data ]);
    const subVariables = useMemo(() => data.subVariables ?? {}, [ data ]);

    const setOption = (option: number, checked: boolean) =>
    {
        setOptions(current => checked ? (current | option) : (current & ~option));
    };

    const save = () =>
    {
        setStringParam(JSON.stringify({ variableName }));
        setIntParams([ variableType, options ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];
        const savedVariableType = normalizeVariableType(intData[0] ?? data.variableType ?? WIRED_VARIABLE_GLOBAL);
        const savedVariables = savedVariableType === WIRED_VARIABLE_FURNI ? variables.furni : (savedVariableType === WIRED_VARIABLE_USER ? variables.user : variables.global);
        const savedVariableName = data.variableName ?? '';

        setVariableType(savedVariableType);
        setVariableName(wiredVariableIsSelectable(savedVariableName, savedVariables ?? [], subVariables) ? savedVariableName : '');
        setOptions(intData[1] ?? data.options ?? DEFAULT_OPTIONS);
    }, [ trigger, data, variables, subVariables ]);

    const valueChanged = hasOption(options, OPTION_VALUE_CHANGED);

    return (
        <WiredTriggerBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }>
            <WiredParam>
                <WiredVariablePicker
                    titleKey="wiredfurni.params.variables.variable_selection"
                    variableType={ variableType }
                    onVariableTypeChange={ type =>
                    {
                        setVariableType(normalizeVariableType(type));
                        setVariableName('');
                    } }
                    variableName={ variableName }
                    onVariableNameChange={ setVariableName }
                    variables={ variables }
                    subVariables={ subVariables }
                    hiddenTypes={ [ WIRED_VARIABLE_CONTEXT ] } />
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.variables.trigger_options" divider={ false }>
                <WiredCheckbox
                    checked={ hasOption(options, OPTION_CREATED) }
                    onChange={ checked => setOption(OPTION_CREATED, checked) }
                    label={ LocalizeText('wiredfurni.params.variables.trigger_options.0') } />
                <WiredCheckbox
                    checked={ valueChanged }
                    onChange={ checked => setOption(OPTION_VALUE_CHANGED, checked) }
                    label={ LocalizeText('wiredfurni.params.variables.trigger_options.1') } />
                <WiredDisabled disabled={ !valueChanged } className="nw-indent-1">
                    <WiredCheckbox
                        checked={ hasOption(options, OPTION_INCREASED) }
                        onChange={ checked => setOption(OPTION_INCREASED, checked) }
                        label={ LocalizeText('wiredfurni.params.variables.trigger_options.1.0') } />
                    <WiredCheckbox
                        checked={ hasOption(options, OPTION_DECREASED) }
                        onChange={ checked => setOption(OPTION_DECREASED, checked) }
                        label={ LocalizeText('wiredfurni.params.variables.trigger_options.1.1') } />
                    <WiredCheckbox
                        checked={ hasOption(options, OPTION_UNCHANGED) }
                        onChange={ checked => setOption(OPTION_UNCHANGED, checked) }
                        label={ LocalizeText('wiredfurni.params.variables.trigger_options.1.2') } />
                </WiredDisabled>
                <WiredCheckbox
                    checked={ hasOption(options, OPTION_DELETED) }
                    onChange={ checked => setOption(OPTION_DELETED, checked) }
                    label={ LocalizeText('wiredfurni.params.variables.trigger_options.2') } />
            </WiredParam>
        </WiredTriggerBaseView>
    );
}
