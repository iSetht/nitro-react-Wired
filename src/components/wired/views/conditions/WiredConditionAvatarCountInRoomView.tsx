import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Column } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredControlTitle, WiredDivider, WiredSlider } from '../WiredControls';
import { WiredConditionBaseView } from './WiredConditionBaseView';

const COUNT_MIN = 0;
const COUNT_MAX = 125;

const clamp = (v: number) => Math.max(COUNT_MIN, Math.min(COUNT_MAX, v));

export const WiredConditionAvatarCountInRoomView: FC<{}> = () =>
{
    const [ minCount, setMinCount ] = useState(0);
    const [ maxCount, setMaxCount ] = useState(125);

    const { trigger = null, setIntParams = null } = useWired();

    const save = () => setIntParams([ minCount, maxCount ]);

    useEffect(() =>
    {
        if (!trigger) return;

        const p = trigger.intData ?? [];
        setMinCount(clamp(p[0] ?? 0));
        setMaxCount(clamp(p[1] ?? 125));
    }, [ trigger ]);

    return (
        <WiredConditionBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }>
            <Column gap={ 1 }>
                <WiredControlTitle>{ LocalizeText('wiredfurni.params.usercountmin', [ 'value' ], [ String(minCount) ]) }</WiredControlTitle>
                <WiredSlider
                    min={ COUNT_MIN }
                    max={ COUNT_MAX }
                    step={ 1 }
                    value={ minCount }
                    onChange={ (v: number) => setMinCount(clamp(v)) } />

                <WiredDivider />

                <WiredControlTitle>{ LocalizeText('wiredfurni.params.usercountmax', [ 'value' ], [ String(maxCount) ]) }</WiredControlTitle>
                <WiredSlider
                    min={ COUNT_MIN }
                    max={ COUNT_MAX }
                    step={ 1 }
                    value={ maxCount }
                    onChange={ (v: number) => setMaxCount(clamp(v)) } />
            </Column>
        </WiredConditionBaseView>
    );
}
