import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredDisabled, WiredParam, WiredRadio, WiredTextInput } from '../WiredControls';
import { createFurniSourceSelector, useWiredEffectSource } from '../effects/WiredEffectSourceSelector';
import { WiredSelectorBaseView } from './WiredSelectorBaseView';

const TYPE_UNION        = 0;
const TYPE_INTERSECTION = 1;
const FILTER_ALL        = 0;
const FILTER_RANDOM     = 1;
const SOURCE_SELECTED   = 100;
const SOURCE_SIGNAL     = 201;
const SOURCE_TRIGGER    = 0;
const SOURCE_OPTIONS    = [ SOURCE_SELECTED, SOURCE_SIGNAL, SOURCE_TRIGGER ];

const DEFAULT_FILTER_AMOUNT = 1;
const MIN_FILTER_AMOUNT     = 1;
const MAX_FILTER_AMOUNT     = 999;

const normalizeFilterAmount = (value: number) =>
    Math.max(MIN_FILTER_AMOUNT, Math.min(MAX_FILTER_AMOUNT, Math.floor(value || DEFAULT_FILTER_AMOUNT)));

const parseFilterAmount = (value: string) =>
    normalizeFilterAmount(Number(value.replace(/\D/g, '')));

export const WiredSelectorRemoteSelectionView: FC<{}> = () =>
{
    const [ selectionType, setSelectionType ] = useState(TYPE_UNION);
    const [ filterMode,    setFilterMode    ] = useState(FILTER_ALL);
    const [ filterAmount,  setFilterAmount  ] = useState(DEFAULT_FILTER_AMOUNT);

    const { trigger = null, setIntParams = null } = useWired();
    const [ furniSource, setFurniSource, sourceExpanded, setSourceExpanded ] =
        useWiredEffectSource(trigger, 5, SOURCE_SELECTED, SOURCE_OPTIONS);

    const save = (filterExistingSelection = false, invert = false) =>
    {
        setIntParams([
            selectionType,
            filterMode,
            normalizeFilterAmount(filterAmount),
            filterExistingSelection ? 1 : 0,
            invert ? 1 : 0,
            furniSource
        ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        const d = trigger.intData || [];

        setSelectionType(d[0] === TYPE_INTERSECTION ? TYPE_INTERSECTION : TYPE_UNION);
        setFilterMode(d[1] === FILTER_RANDOM ? FILTER_RANDOM : FILTER_ALL);
        setFilterAmount(normalizeFilterAmount(d[2] ?? DEFAULT_FILTER_AMOUNT));
    }, [ trigger ]);

    return (
        <WiredSelectorBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_OR_BY_TYPE }
            hasSpecialInput={ true }
            save={ save }
            showSelectorOptions={ true }
            selectorOptionOffset={ 3 }
            sourceSelectors={ [ createFurniSourceSelector(furniSource, setFurniSource, SOURCE_OPTIONS) ] }
            expanded={ sourceExpanded }
            onToggleExpanded={ () => setSourceExpanded(v => !v) }>
            <WiredParam titleKey="wiredfurni.params.remote_selection.type">
                <WiredRadio
                    name="remoteSelectionType"
                    checked={ selectionType === TYPE_UNION }
                    onChange={ () => setSelectionType(TYPE_UNION) }
                    label={ LocalizeText('wiredfurni.params.remote_selection.type.0') } />
                <WiredRadio
                    name="remoteSelectionType"
                    checked={ selectionType === TYPE_INTERSECTION }
                    onChange={ () => setSelectionType(TYPE_INTERSECTION) }
                    label={ LocalizeText('wiredfurni.params.remote_selection.type.1') } />
            </WiredParam>

            <WiredParam titleKey="wiredfurni.params.remote_selection.filter">
                <WiredRadio
                    name="remoteFilterMode"
                    checked={ filterMode === FILTER_ALL }
                    onChange={ () => setFilterMode(FILTER_ALL) }
                    label={ LocalizeText('wiredfurni.params.remote_selection.filter.0') } />

                <Flex alignItems="center" gap={ 1 }>
                    <WiredRadio
                        name="remoteFilterMode"
                        checked={ filterMode === FILTER_RANDOM }
                        onChange={ () => setFilterMode(FILTER_RANDOM) }
                        label={ LocalizeText('wiredfurni.params.remote_selection.filter.1') } />
                    <WiredDisabled disabled={ filterMode !== FILTER_RANDOM }>
                        <WiredTextInput
                            compact
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={ filterAmount }
                            onChange={ e =>
                            {
                                setFilterMode(FILTER_RANDOM);
                                setFilterAmount(parseFilterAmount(e.target.value));
                            } }
                            onBlur={ () => setFilterAmount(normalizeFilterAmount(filterAmount)) } />
                    </WiredDisabled>
                </Flex>
            </WiredParam>
        </WiredSelectorBaseView>
    );
}
