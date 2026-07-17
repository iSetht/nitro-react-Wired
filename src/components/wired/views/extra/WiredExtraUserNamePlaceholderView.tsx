import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Column, Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredBaseView } from '../WiredBaseView';
import { parseWiredData, WiredButtonInfoText, WiredDisabled, WiredParam, WiredPlaceholderPreview, WiredRadio, WiredTextInput, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL, WIRED_SOURCE_TRIGGER } from '../WiredControls';

const TYPE_SINGLE_USER = 1;
const TYPE_MULTIPLE_USERS = 2;
const SOURCE_OPTIONS = [ WIRED_SOURCE_TRIGGER, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL ];

interface UserNamePlaceholderData
{
    placeholderName?: string;
    delimiter?: string;
    placeholderType?: number;
    userSource?: number;
}

const normalizePlaceholderName = (value: string) =>
{
    let normalized = value.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    normalized = normalized.replace(/^_+|_+$/g, '');

    return normalized.substring(0, 40);
}

const normalizePlaceholderType = (value: number) => value === TYPE_MULTIPLE_USERS ? TYPE_MULTIPLE_USERS : TYPE_SINGLE_USER;
const normalizeSource = (source: number) => SOURCE_OPTIONS.includes(source) ? source : WIRED_SOURCE_TRIGGER;
const sanitizeDelimiter = (value: string) => value.replace(/[^\x21-\x7E]/g, '').substring(0, 4);

export const WiredExtraUserNamePlaceholderView: FC<{}> = props =>
{
    const [ placeholderName, setPlaceholderName ] = useState('');
    const [ placeholderType, setPlaceholderType ] = useState(TYPE_SINGLE_USER);
    const [ delimiter, setDelimiter ] = useState(',');
    const [ userSource, setUserSource ] = useState(WIRED_SOURCE_TRIGGER);
    const [ sourceExpanded, setSourceExpanded ] = useState(false);
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired() as any;

    const data = useMemo(() => parseWiredData<UserNamePlaceholderData>(trigger?.stringData ?? ''), [ trigger ]);
    const isMultiple = placeholderType === TYPE_MULTIPLE_USERS;
    const previewToken = placeholderName ? `$(${ placeholderName })` : '$()';

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];
        const savedName = normalizePlaceholderName(data.placeholderName ?? '');
        const savedDelimiter = sanitizeDelimiter(data.delimiter ?? ',') || ',';

        setPlaceholderName(savedName);
        setPlaceholderType(normalizePlaceholderType(intData[0] ?? data.placeholderType ?? TYPE_SINGLE_USER));
        const savedSource = normalizeSource(intData[1] ?? data.userSource ?? WIRED_SOURCE_TRIGGER);

        setUserSource(savedSource);
        setSourceExpanded(savedSource !== WIRED_SOURCE_TRIGGER);
        setDelimiter(savedDelimiter);
    }, [ trigger, data ]);

    const save = () =>
    {
        const normalizedName = normalizePlaceholderName(placeholderName);
        const normalizedDelimiter = sanitizeDelimiter(delimiter) || ',';

        setStringParam(JSON.stringify({
            placeholderName: normalizedName,
            delimiter: normalizedDelimiter
        }));
        setIntParams([
            normalizePlaceholderType(placeholderType),
            normalizeSource(userSource)
        ]);
    };

    return (
        <WiredBaseView
            wiredType="extra"
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ {
                value: userSource,
                onChange: setUserSource,
                options: SOURCE_OPTIONS,
                titleKey: 'wiredfurni.params.sources.users.title',
                labelPrefix: 'wiredfurni.params.sources.users'
            } as any ] }
            expanded={ sourceExpanded }
            onToggleExpanded={ () => setSourceExpanded(value => !value) }>
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

            <WiredParam titleKey="wiredfurni.params.texts.placeholder_type" divider={ false }>
                <Column gap={ 1 }>
                    <WiredRadio
                        name="wiredUserNamePlaceholderType"
                        checked={ placeholderType === TYPE_SINGLE_USER }
                        onChange={ () => setPlaceholderType(TYPE_SINGLE_USER) }
                        label={ LocalizeText('wiredfurni.params.texts.placeholder_type.user.1') } />
                    <WiredRadio
                        name="wiredUserNamePlaceholderType"
                        checked={ placeholderType === TYPE_MULTIPLE_USERS }
                        onChange={ () => setPlaceholderType(TYPE_MULTIPLE_USERS) }
                        label={ LocalizeText('wiredfurni.params.texts.placeholder_type.user.2') } />
                    <WiredDisabled disabled={ !isMultiple } className="nw-indent-1">
                        <Flex alignItems="center" gap={ 1 }>
                            <WiredButtonInfoText>{ LocalizeText('wiredfurni.params.texts.select_delimiter') }</WiredButtonInfoText>
                            <WiredTextInput
                                type="text"
                                compact
                                maxLength={ 4 }
                                value={ delimiter }
                                onChange={ event => setDelimiter(sanitizeDelimiter(event.target.value)) } />
                        </Flex>
                    </WiredDisabled>
                </Column>
            </WiredParam>
        </WiredBaseView>
    );
}
