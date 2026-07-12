import { FC, useEffect, useState } from 'react';
import { GetWiredTimeLocale, LocalizeText, WiredFurniType } from '../../../../api';
import { Column, Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';
import { WiredControlTitle, WiredSlider, WiredTextInput, clampWiredValue } from '../WiredControls';

export const WiredConditionTimeElapsedMoreView: FC<{}> = props =>
{
    const [ time, setTime ] = useState(-1);
    const { trigger = null, setIntParams = null } = useWired();

    const save = () => setIntParams([ time ]);

    useEffect(() =>
    {
        setTime((trigger.intData.length > 0) ? trigger.intData[0] : 0);
    }, [ trigger ]);
    
    return (
        <WiredConditionBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
            <Column gap={ 1 }>
                <Flex className="nw-title-input-row" alignItems="center" gap={ 1 }>
                    <WiredControlTitle>{ LocalizeText('wiredfurni.params.allowafter2', [ 'seconds' ], [ GetWiredTimeLocale(time) ]) }</WiredControlTitle>
                    <WiredTextInput compact type="number" min={ 1 } max={ 1200 } value={ time } onChange={ event => setTime(clampWiredValue(parseInt(event.target.value || '0'), 1, 1200)) } />
                </Flex>
                <WiredSlider
                    min={ 1 }
                    max={ 1200 }
                    value={ time }
                    onChange={ event => setTime(event) } />
            </Column>
        </WiredConditionBaseView>
    );
}
