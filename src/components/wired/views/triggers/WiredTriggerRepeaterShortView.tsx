import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';
import { WiredParam, WiredSlider } from '../WiredControls';

export const WiredTriggerRepeaterShortView: FC<{}> = props =>
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
            <WiredParam title={ LocalizeText('wiredfurni.params.setshorttime', [ 'ms' ], [ String(time * 50) ]) } divider={ false }>
                <WiredSlider
                    min={ 1 }
                    max={ 10 }
                    value={ time }
                    onChange={ event => setTime(event) } />
            </WiredParam>
        </WiredTriggerBaseView>
    );
}
