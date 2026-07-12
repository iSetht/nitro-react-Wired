import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { createFurniSourceSelector, FURNI_SOURCE_OPTIONS, useWiredEffectSource } from './WiredEffectSourceSelector';
import { WiredParam, WiredRadio, WIRED_SOURCE_SELECTED } from '../WiredControls';

const options = [ 0, 1, 2, 3, 4 ];

const normalizeOption = (option: number) => options.includes(option) ? option : 0;

export const WiredEffectControlCounterView: FC<{}> = props =>
{
    const [ option, setOption ] = useState(0);
    const { trigger = null, setIntParams = null } = useWired();
    const [ furniSource, setFurniSource, expanded, setExpanded ] = useWiredEffectSource(trigger, 1, WIRED_SOURCE_SELECTED, FURNI_SOURCE_OPTIONS);

    const save = () => setIntParams([ option, furniSource ]);

    useEffect(() =>
    {
        setOption(normalizeOption((trigger.intData.length > 0) ? trigger.intData[0] : 0));
    }, [ trigger ]);

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ createFurniSourceSelector(furniSource, setFurniSource) ] }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(value => !value) }>
            <WiredParam titleKey="wiredfurni.params.clock_control" divider={ false }>
                { options.map(value =>
                    <WiredRadio
                        key={ value }
                        name="clockControlOption"
                        checked={ option === value }
                        onChange={ () => setOption(value) }
                        label={ LocalizeText(`wiredfurni.params.clock_control.${ value }`) } />) }
            </WiredParam>
        </WiredEffectBaseView>
    );
}
