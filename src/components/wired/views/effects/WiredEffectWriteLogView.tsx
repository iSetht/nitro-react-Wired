import { FC, useEffect, useState } from 'react';
import { CreateLinkEvent, LocalizeText, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredParam, WiredSelect, WiredTextarea } from '../WiredControls';
import { WiredEffectBaseView } from './WiredEffectBaseView';

const MAX_LOG_MESSAGE_LINES = 8;
const MAX_LOG_MESSAGE_CHARACTERS = 400;

const LOG_LEVELS = [
    { value: 0, key: 'wiredfurni.params.log_info', fallback: 'INFO' },
    { value: 1, key: 'wiredfurni.params.log_warn', fallback: 'WARN' },
    { value: 2, key: 'wiredfurni.params.log_error', fallback: 'ERROR' },
    { value: 3, key: 'wiredfurni.params.log_debug', fallback: 'DEBUG' }
];

const normalizeLogLevel = (value: number) => LOG_LEVELS.some(level => level.value === value) ? value : 0;
const sanitizeLogMessage = (value: string) =>
{
    const normalized = (value || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').slice(0, MAX_LOG_MESSAGE_CHARACTERS);
    const lines = normalized.split('\n');

    if(lines.length <= MAX_LOG_MESSAGE_LINES) return normalized;

    return lines.slice(0, MAX_LOG_MESSAGE_LINES).join('\n');
}

const localizeLogLevel = (key: string, fallback: string) =>
{
    const text = LocalizeText(key);
    const normalized = (text || '').trim().toUpperCase();

    if([ 'INFO', 'WARN', 'ERROR', 'DEBUG' ].includes(normalized) && normalized !== fallback) return fallback;

    return text && text !== key ? text : fallback;
};

export const WiredEffectWriteLogView: FC<{}> = props =>
{
    const [ logLevel, setLogLevel ] = useState(0);
    const [ logMessage, setLogMessage ] = useState('');
    const { trigger = null, setStringParam = null, setIntParams = null } = useWired();

    const save = () =>
    {
        setStringParam(sanitizeLogMessage(logMessage));
        setIntParams([ logLevel ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        setLogMessage(sanitizeLogMessage(trigger.stringData ?? ''));
        setLogLevel(normalizeLogLevel((trigger.intData.length > 0) ? trigger.intData[0] : 0));
    }, [ trigger ]);

    const viewLogsSlot = (
        <Text
            bitmapFont="il_regular"
            className="nw-link-underline"
            onClick={ () => CreateLinkEvent('wired-tools/logs') }>
            { LocalizeText('wiredchests.view_logs') }
        </Text>
    );

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            headerSlot={ viewLogsSlot }>
            <WiredParam titleKey="wiredfurni.params.write_to_logs.log_level">
                <WiredSelect
                    value={ logLevel }
                    onChange={ event => setLogLevel(normalizeLogLevel(Number(event.target.value))) }
                    options={ LOG_LEVELS.map(level => ({
                        value: level.value,
                        label: localizeLogLevel(level.key, level.fallback)
                    })) } />
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.write_to_logs.log_message" divider={ false }>
                <WiredTextarea className="nw-selector-names-input" value={ logMessage } onChange={ event => setLogMessage(sanitizeLogMessage(event.target.value)) } maxLength={ MAX_LOG_MESSAGE_CHARACTERS } />
            </WiredParam>
        </WiredEffectBaseView>
    );
};
