import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';
import { WiredControlTitle, WiredParam, WiredSlider, WiredTextInput } from '../WiredControls';

export const WiredTriggerRepeaterView: FC<{}> = props =>
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
                <div className="nw-title-input-row">
                    <WiredControlTitle>{ LocalizeText('wiredfurni.params.settime3') }</WiredControlTitle>
                    <WiredTextInput
                        compact
                        type="number"
                        min={ 0.5 }
                        max={ 60 }
                        step={ 0.5 }
                        value={ time / 2 }
                        onChange={ event =>
                        {
                            let seconds = parseFloat(event.target.value);

                            if(isNaN(seconds)) seconds = 0.5;
                            if(seconds < 0.5) seconds = 0.5;
                            if(seconds > 60) seconds = 60;

                            seconds = Math.round(seconds * 2) / 2;

                            setTime(seconds * 2);
                        } } />
                </div>
                <WiredSlider
                    min={ 1 }
                    max={ 120 }
                    value={ time }
                    onChange={ event => setTime(event) } />
            </WiredParam>
        </WiredTriggerBaseView>
    );
}
