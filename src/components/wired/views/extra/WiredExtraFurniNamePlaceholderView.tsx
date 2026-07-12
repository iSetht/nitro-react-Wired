import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Column, Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredBaseView } from '../WiredBaseView';
import { parseWiredData, WiredButtonInfoText, WiredDisabled, WiredParam, WiredPlaceholderPreview, WiredRadio, WiredTextInput, WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL, WIRED_SOURCE_TRIGGER } from '../WiredControls';

const TYPE_SINGLE_FURNI = 1;
const TYPE_MULTIPLE_FURNIS = 2;
const SOURCE_OPTIONS = [ WIRED_SOURCE_TRIGGER, WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL ];

interface FurniNamePlaceholderData
{
    placeholderName?: string;
    delimiter?: string;
    placeholderType?: number;
    furniSource?: number;
}

const normalizePlaceholderName = (value: string) =>
{
    let normalized = value.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    normalized = normalized.replace(/^_+|_+$/g, '');

    return normalized.substring(0, 40);
}

const normalizePlaceholderType = (value: number) => value === TYPE_MULTIPLE_FURNIS ? TYPE_MULTIPLE_FURNIS : TYPE_SINGLE_FURNI;
const normalizeSource = (source: number) => SOURCE_OPTIONS.includes(source) ? source : WIRED_SOURCE_SELECTED;
const sanitizeDelimiter = (value: string) => value.replace(/[^\x21-\x7E]/g, '').substring(0, 4);

export const WiredExtraFurniNamePlaceholderView: FC<{}> = props =>
{
    const [ placeholderName, setPlaceholderName ] = useState('');
    const [ placeholderType, setPlaceholderType ] = useState(TYPE_SINGLE_FURNI);
    const [ delimiter, setDelimiter ] = useState(',');
    const [ furniSource, setFurniSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ sourceExpanded, setSourceExpanded ] = useState(false);
    const { trigger = null, setIntParams = null, setStringParam = null, furniIds = [] } = useWired() as any;

    const data = useMemo(() => parseWiredData<FurniNamePlaceholderData>(trigger?.stringData ?? ''), [ trigger ]);
    const isMultiple = placeholderType === TYPE_MULTIPLE_FURNIS;
    const previewToken = placeholderName ? `$(${ placeholderName })` : '$()';
    const selectedCount = Array.isArray(furniIds) ? furniIds.length : 0;
    const selectionLimit = trigger?.maximumItemSelectionCount ?? 20;

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];
        const savedName = normalizePlaceholderName(data.placeholderName ?? '');
        const savedDelimiter = sanitizeDelimiter(data.delimiter ?? ',') || ',';

        setPlaceholderName(savedName);
        setPlaceholderType(normalizePlaceholderType(intData[0] ?? data.placeholderType ?? TYPE_SINGLE_FURNI));
        const savedSource = normalizeSource(intData[1] ?? data.furniSource ?? WIRED_SOURCE_SELECTED);

        setFurniSource(savedSource);
        setSourceExpanded(savedSource !== WIRED_SOURCE_SELECTED);
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
            normalizeSource(furniSource)
        ]);
    };

    return (
        <WiredBaseView
            wiredType="extra"
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_OR_BY_TYPE }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ {
                value: furniSource,
                onChange: setFurniSource,
                options: SOURCE_OPTIONS,
                titleKey: 'wiredfurni.params.sources.furni.title',
                labelPrefix: 'wiredfurni.params.sources.furni',
                optionLabels: {
                    [WIRED_SOURCE_SELECTED]: `${ LocalizeText('wiredfurni.params.sources.furni.100') } [${ selectedCount }/${ selectionLimit }]`
                }
            } as any ] }
            expanded={ sourceExpanded }
            onToggleExpanded={ () => setSourceExpanded(value => !value) }
            hideFurniSelector={ true }>
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
                        name="wiredFurniNamePlaceholderType"
                        checked={ placeholderType === TYPE_SINGLE_FURNI }
                        onChange={ () => setPlaceholderType(TYPE_SINGLE_FURNI) }
                        label={ LocalizeText('wiredfurni.params.texts.placeholder_type.furni.1') } />
                    <WiredRadio
                        name="wiredFurniNamePlaceholderType"
                        checked={ placeholderType === TYPE_MULTIPLE_FURNIS }
                        onChange={ () => setPlaceholderType(TYPE_MULTIPLE_FURNIS) }
                        label={ LocalizeText('wiredfurni.params.texts.placeholder_type.furni.2') } />
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
