import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';
import { clampWiredValue, WiredControlTitle, WiredParam, WiredSlider, WiredTextInput } from '../WiredControls';

export const WiredTriggerAtSetTimeView: FC<{}> = props =>
{
    const [ time, setTime ] = useState(1);
    const { trigger = null, setIntParams = null } = useWired();

    const save = () => setIntParams([ time ]);

    useEffect(() =>
    {
        setTime((trigger.intData.length > 0) ? trigger.intData[0] : 0);
    }, [ trigger ]);

    return (
        <WiredTriggerBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
            <WiredParam divider={ false }>
                <Flex className="nw-title-input-row" alignItems="center" gap={ 1 }>
                    <WiredControlTitle>{ LocalizeText('wiredfurni.params.settime2') }</WiredControlTitle>
                    <WiredTextInput
                        compact
                        type="number"
                        min={ 1 }
                        max={ 1200 }
                        value={ time }
                        onChange={ event => setTime(clampWiredValue(parseInt(event.target.value) || 1, 1, 1200)) } />
                </Flex>
                <WiredSlider
                    min={ 1 }
                    max={ 1200 }
                    value={ time }
                    onChange={ event => setTime(event) } />
            </WiredParam>
        </WiredTriggerBaseView>
    );
}
