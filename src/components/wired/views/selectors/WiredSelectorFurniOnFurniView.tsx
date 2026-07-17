import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredSelectorBaseView } from './WiredSelectorBaseView';
import { WiredParam, WiredRadio } from '../WiredControls';

const SOURCE_TRIGGER = 0;
const SOURCE_SELECTED = 100;
const SOURCE_SIGNAL = 201;
const SOURCES = [ SOURCE_SELECTED, SOURCE_SIGNAL, SOURCE_TRIGGER ];
const SELECTION_TYPES = [ 0, 1, 2, 3 ];

export const WiredSelectorFurniOnFurniView: FC<{}> = props =>
{
    const [ furniSource, setFurniSource ] = useState(SOURCE_SELECTED);
    const [ selectionType, setSelectionType ] = useState(0);
    const [ expanded, setExpanded ] = useState(false);
    const { trigger = null, setIntParams = null } = useWired();

    const save = (filterExistingSelection = false, invert = false) =>
    {
        setIntParams([
            furniSource,
            selectionType,
            filterExistingSelection ? 1 : 0,
            invert ? 1 : 0
        ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        const savedSource = trigger.intData.length > 0 ? trigger.intData[0] : SOURCE_SELECTED;
        const savedSelectionType = (trigger.intData.length > 1) ? trigger.intData[1] : 0;

        setFurniSource(SOURCES.includes(savedSource) ? savedSource : SOURCE_SELECTED);
        setSelectionType(SELECTION_TYPES.includes(savedSelectionType) ? savedSelectionType : 0);
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
            <WiredParam titleKey="wiredfurni.params.selection_type">
                { SELECTION_TYPES.map(type =>
                    <WiredRadio
                        key={ type }
                        name="wired-selector-furni-on-furni"
                        checked={ selectionType === type }
                        onChange={ () => setSelectionType(type) }
                        label={ LocalizeText(`wiredfurni.params.onfurni.${ type }`) } />) }
            </WiredParam>
        </WiredSelectorBaseView>
    );
}
