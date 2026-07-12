import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Column } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredParam, WiredRadio } from '../WiredControls';
import { createFurniSourceSelector, FURNI_SOURCE_OPTIONS, useWiredEffectSource } from '../effects/WiredEffectSourceSelector';
import { WiredConditionBaseView } from './WiredConditionBaseView';

const SOURCE_SELECTED = 100;

export const WiredConditionFurniHasAvatarView: FC<{ isNegative?: boolean }> = props =>
{
    const { isNegative = false } = props;
    const [ requireAll, setRequireAll ] = useState(3);
    const { trigger = null, setIntParams = null } = useWired();
    const [ furniSource, setFurniSource, expanded, setExpanded ] = useWiredEffectSource(trigger, 1, SOURCE_SELECTED, FURNI_SOURCE_OPTIONS);

    const save = () => setIntParams([ requireAll, furniSource ]);

    useEffect(() =>
    {
        if(!trigger) return;
        setRequireAll((trigger.intData.length > 0) ? trigger.intData[0] : 3);
    }, [ trigger ]);

    return (
        <WiredConditionBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ createFurniSourceSelector(furniSource, setFurniSource) ] }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(value => !value) }>
            <Column gap={ 1 }>
                <WiredParam titleKey="wiredfurni.params.requireall" divider={ false }>
                { [ 2, 3 ].map(value =>
                {
                    return (
                        <WiredRadio key={ value } name="requireAll" checked={ (requireAll === value) } onChange={ () => setRequireAll(value) } label={ LocalizeText(`wiredfurni.params.${ isNegative ? 'not_requireall' : 'requireall' }.${ value }`) } />
                    )
                }) }
                </WiredParam>
            </Column>
        </WiredConditionBaseView>
    );
}
