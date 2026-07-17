import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';
import { WiredParam, WiredSelect } from '../WiredControls';

const ALLOWED_HAND_ITEM_IDS: number[] = [ 2, 5, 7, 8, 9, 10, 27 ];

export const WiredConditionActorHasHandItemView: FC<{}> = props =>
{
    const [ handItemId, setHandItemId ] = useState(-1);
    const { trigger = null, setIntParams = null } = useWired();

    const save = () => setIntParams([ handItemId ]);

    useEffect(() =>
    {
        setHandItemId((trigger.intData.length > 0) ? trigger.intData[0] : 0);
    }, [ trigger ]);

    return (
        <WiredConditionBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
            <WiredParam titleKey="wiredfurni.params.handitem" divider={ false }>
                <WiredSelect
                    value={ handItemId }
                    onChange={ event => setHandItemId(parseInt(event.target.value)) }
                    options={ ALLOWED_HAND_ITEM_IDS.map(value => ({ value, label: LocalizeText(`handitem${ value }`) })) } />
            </WiredParam>
        </WiredConditionBaseView>
    );
}
