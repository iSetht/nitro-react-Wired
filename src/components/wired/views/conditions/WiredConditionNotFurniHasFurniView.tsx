import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Column, Flex, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { createFurniSourceSelector, FURNI_SOURCE_OPTIONS, useWiredEffectSource } from '../effects/WiredEffectSourceSelector';
import { WiredRadioInput } from '../WiredControls';
import { WiredConditionBaseView } from './WiredConditionBaseView';

const SOURCE_SELECTED = 100;

export const WiredConditionNotFurniHasFurniView: FC<{}> = props =>
{
    const [ requireAll, setRequireAll ] = useState(0);
    const { trigger = null, setIntParams = null } = useWired();
    const [ furniSource, setFurniSource, expanded, setExpanded ] = useWiredEffectSource(trigger, 1, SOURCE_SELECTED, FURNI_SOURCE_OPTIONS);

    const save = () => setIntParams([ requireAll, furniSource ]);

    useEffect(() =>
    {
        if(!trigger) return;
        setRequireAll((trigger.intData.length > 0) ? trigger.intData[0] : 0);
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
                <Text bold>{ LocalizeText('wiredfurni.params.not_requireall') }</Text>
                { [ 0, 1 ].map(value =>
                {
                    return (
                        <Flex alignItems="center" gap={ 1 } key={ value }>
                            <WiredRadioInput type="radio" name="requireAll" id={ `requireAll${ value }` } checked={ (requireAll === value) } onChange={ () => setRequireAll(value) } />
                            <Text>{ LocalizeText(`wiredfurni.params.not_requireall.${ value }`) }</Text>
                        </Flex>
                    )
                }) }
            </Column>
        </WiredConditionBaseView>
    );
}
