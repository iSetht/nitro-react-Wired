import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredParam, WiredTextarea } from '../WiredControls';
import { WiredSelectorBaseView } from './WiredSelectorBaseView';

const MAX_NAMES = 20;
const MAX_CHARACTERS = 1000;

const sanitizeUsernames = (value: string) =>
{
    const normalized = (value || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').slice(0, MAX_CHARACTERS);
    const lines = normalized.split('\n');

    if(lines.length <= MAX_NAMES) return normalized;

    return lines.slice(0, MAX_NAMES).join('\n');
}

export const WiredSelectorUserByNameView: FC<{}> = props =>
{
    const [ usernames, setUsernames ] = useState('');
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();

    const save = (filterExistingSelection = false, invert = false) =>
    {
        const sanitizedUsernames = sanitizeUsernames(usernames);

        setIntParams([
            filterExistingSelection ? 1 : 0,
            invert ? 1 : 0
        ]);

        setStringParam(sanitizedUsernames);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        setUsernames(sanitizeUsernames(trigger.stringData || ''));
    }, [ trigger ]);

    const onUsernamesChange = (value: string) =>
    {
        setUsernames(sanitizeUsernames(value));
    };

    return (
        <WiredSelectorBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            showSelectorOptions={ true }
            selectorOptionOffset={ 0 }
        >
            <WiredParam titleKey="wiredfurni.params.enter_names">
                <WiredTextarea
                    className="nw-selector-names-input"
                    maxLength={ MAX_CHARACTERS }
                    value={ usernames }
                    onChange={ event => onUsernamesChange(event.target.value) } />
            </WiredParam>
        </WiredSelectorBaseView>
    );
}
