import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredSelectorBaseView } from './WiredSelectorBaseView';
import { WiredCheckbox, WiredParam } from '../WiredControls';

const SOURCE_TRIGGER = 0;
const SOURCE_SELECTED = 100;
const SOURCE_SIGNAL = 201;
const SOURCES = [ SOURCE_SELECTED, SOURCE_SIGNAL, SOURCE_TRIGGER ];

export const WiredSelectorFurniByTypeView: FC<{}> = props =>
{
    const [ furniSource, setFurniSource ] = useState(SOURCE_SELECTED);
    const [ matchState, setMatchState ] = useState(false);
    const [ expanded, setExpanded ] = useState(false);
    const { trigger = null, setIntParams = null } = useWired();

    const save = (filterExistingSelection = false, invert = false) =>
    {
        setIntParams([
            furniSource,
            matchState ? 1 : 0,
            filterExistingSelection ? 1 : 0,
            invert ? 1 : 0
        ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        const savedSource = trigger.intData.length > 0 ? trigger.intData[0] : SOURCE_SELECTED;

        setFurniSource(SOURCES.includes(savedSource) ? savedSource : SOURCE_SELECTED);
        setMatchState(trigger.intData.length > 1 ? (trigger.intData[1] === 1) : false);
        setExpanded(savedSource !== SOURCE_SELECTED);
    }, [ trigger ]);

    return (
        <WiredSelectorBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_OR_BY_TYPE }
            hasSpecialInput={ true }
            save={ save }
            showSelectorOptions={ true }
            selectorOptionOffset={ 2 }
            furniSource={ furniSource }
            onFurniSourceChange={ setFurniSource }
            sourceOptions={ SOURCES }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(value => !value) }
        >
            <WiredParam titleKey="wiredfurni.params.select_options">
                <WiredCheckbox
                    checked={ matchState }
                    onChange={ setMatchState }
                    label={ LocalizeText('wiredfurni.params.state_match') } />
            </WiredParam>
        </WiredSelectorBaseView>
    );
}
