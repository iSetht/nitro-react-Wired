import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';
import { WiredControlTitle, WiredParam, WiredSlider, WiredTextInput } from '../WiredControls';

export const WiredTriggerRepeaterLongView: FC<{}> = props =>
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
                    <WiredControlTitle>{ LocalizeText('wiredfurni.params.settime3') }</WiredControlTitle>
                    <WiredTextInput
                        compact
                        type="number"
                        min={ 5 }
                        max={ 600 }
                        step={ 5 }
                        value={ time * 5 }
                        onChange={ event =>
                        {
                            let seconds = parseInt(event.target.value);

                            if(isNaN(seconds)) seconds = 5;
                            if(seconds < 5) seconds = 5;
                            if(seconds > 600) seconds = 600;

                            seconds = Math.round(seconds / 5) * 5;

                            setTime(seconds / 5);
                        } } />
                </Flex>
                <WiredSlider
                    min={ 1 }
                    max={ 120 }
                    value={ time }
                    onChange={ event => setTime(event) } />
            </WiredParam>
        </WiredTriggerBaseView>
    );
}
