import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Column } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredBaseView } from '../WiredBaseView';
import {
    parseWiredData,
    WiredButtonInfoText,
    WiredDisabled,
    WiredParam,
    WiredPlaceholderPreview,
    WiredRadio,
    WiredTextInput,
    WiredVariableLists,
    WiredVariableNameSelect,
    WIRED_VARIABLE_CONTEXT
} from '../WiredControls';

const DISPLAY_NUMERIC = 1;
const DISPLAY_TEXTUAL = 2;

interface VariableCapturerData
{
    placeholderName?: string;
    variableName?: string;
    displayType?: number;
    contextVariables?: string[];
    textConnectorAvailable?: boolean;
    contextTextConnectorVariables?: string[];
}

const normalizePlaceholderName = (value: string) =>
{
    let normalized = value.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    normalized = normalized.replace(/^_+|_+$/g, '');

    return normalized.substring(0, 40);
}
const normalizeDisplayType = (value: number) => value === DISPLAY_TEXTUAL ? DISPLAY_TEXTUAL : DISPLAY_NUMERIC;

export const WiredExtraVariableCapturerView: FC<{}> = props =>
{
    const [ placeholderName, setPlaceholderName ] = useState('');
    const [ variableName, setVariableName ] = useState('');
    const [ displayType, setDisplayType ] = useState(DISPLAY_NUMERIC);
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired() as any;

    const data = useMemo(() => parseWiredData<VariableCapturerData>(trigger?.stringData ?? ''), [ trigger ]);
    const variables = useMemo<WiredVariableLists>(() => ({
        context: data.contextVariables ?? []
    }), [ data ]);
    const previewToken = placeholderName ? `#(${ placeholderName })` : '#()';
    const textualDisplayEnabled = !!variableName && (data.contextTextConnectorVariables ?? []).includes(variableName);

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];
        const savedVariable = data.variableName ?? '';

        setPlaceholderName(normalizePlaceholderName(data.placeholderName ?? ''));
        setVariableName((variables.context ?? []).includes(savedVariable) ? savedVariable : '');
        setDisplayType(normalizeDisplayType(intData[0] ?? data.displayType ?? DISPLAY_NUMERIC));
    }, [ trigger, data, variables ]);

    useEffect(() =>
    {
        if(!textualDisplayEnabled && displayType === DISPLAY_TEXTUAL) setDisplayType(DISPLAY_NUMERIC);
    }, [ textualDisplayEnabled, displayType ]);

    const save = () =>
    {
        const normalizedName = normalizePlaceholderName(placeholderName);
        const normalizedDisplayType = textualDisplayEnabled ? normalizeDisplayType(displayType) : DISPLAY_NUMERIC;

        setStringParam(JSON.stringify({
            placeholderName: normalizedName,
            variableName,
            displayType: normalizedDisplayType
        }));
        setIntParams([
            normalizedDisplayType
        ]);
    };

    return (
        <WiredBaseView
            wiredType="extra"
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }>
            <WiredParam titleKey="wiredfurni.params.texts.placeholder_name">
                <Column gap={ 1 }>
                    <WiredTextInput
                        type="text"
                        maxLength={ 40 }
                        value={ placeholderName }
                        onChange={ event => setPlaceholderName(normalizePlaceholderName(event.target.value)) } />
                    <WiredPlaceholderPreview placeholder={ previewToken } />
                </Column>
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.variables.variable_selection">
                <WiredVariableNameSelect
                    variableType={ WIRED_VARIABLE_CONTEXT }
                    variableName={ variableName }
                    onVariableNameChange={ setVariableName }
                    variables={ variables } />
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.texts.variable_display_type" divider={ false }>
                <Column gap={ 1 }>
                    <WiredRadio name="variableCapturerDisplayType" checked={ displayType === DISPLAY_NUMERIC } onChange={ () => setDisplayType(DISPLAY_NUMERIC) } label={ LocalizeText('wiredfurni.params.texts.variable_display_type.1') } />
                    <WiredDisabled disabled={ !textualDisplayEnabled }>
                        <WiredRadio name="variableCapturerDisplayType" checked={ displayType === DISPLAY_TEXTUAL } onChange={ () => setDisplayType(DISPLAY_TEXTUAL) } label={ LocalizeText('wiredfurni.params.texts.variable_display_type.2') } />
                        <div className="nw-indent-1">
                            <WiredButtonInfoText>{ LocalizeText('wiredfurni.params.texts.variable_display_type.2.info') }</WiredButtonInfoText>
                        </div>
                    </WiredDisabled>
                </Column>
            </WiredParam>
        </WiredBaseView>
    );
}
