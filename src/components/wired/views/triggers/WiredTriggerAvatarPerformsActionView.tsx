import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredCheckbox, WiredParam, WiredSelect } from '../WiredControls';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';

const ACTIONS = [
    { label: 'widget.memenu.wave', value: 1 },
    { label: 'widget.memenu.blow', value: 2 },
    { label: 'widget.memenu.laugh', value: 3 },
    { label: 'wiredfurni.params.action.4', value: 4 },
    { label: 'widget.memenu.idle', value: 5 },
    { label: 'widget.memenu.jump', value: 6 },
    { label: 'widget.memenu.thumb', value: 7 },
    { label: 'widget.memenu.sit', value: 8 },
    { label: 'widget.memenu.stand', value: 9 },
    { label: 'wiredfurni.params.action.8', value: 10 },
    { label: 'wiredfurni.params.action.9', value: 11 },
    { label: 'widget.memenu.sign', value: 12 },
    { label: 'widget.memenu.dance1', value: 13 }
];

const SIGNS = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17 ];

const DANCES = [
    { label: 'widget.memenu.dance1', value: 1 },
    { label: 'widget.memenu.dance2', value: 2 },
    { label: 'widget.memenu.dance3', value: 3 },
    { label: 'widget.memenu.dance4', value: 4 }
];

export const WiredTriggerAvatarPerformsActionView: FC<{}> = props =>
{
    const [ action, setAction ] = useState(1);
    const [ filterEnabled, setFilterEnabled ] = useState(false);
    const [ subSelection, setSubSelection ] = useState(0);
    const { trigger = null, setIntParams = null } = useWired();

    const isSign = action === 12;
    const isDance = action === 13;

    const save = () => setIntParams([ action, filterEnabled ? 1 : 0, filterEnabled ? subSelection : 0 ]);

    useEffect(() =>
    {
        if(!trigger) return;

        setAction((trigger.intData.length > 0) ? trigger.intData[0] : 1);
        setFilterEnabled((trigger.intData.length > 1) ? trigger.intData[1] === 1 : false);
        setSubSelection((trigger.intData.length > 2) ? trigger.intData[2] : 0);
    }, [ trigger ]);

    const handleActionChange = (newAction: number) =>
    {
        setAction(newAction);
        setFilterEnabled(false);
        setSubSelection(0);
    };

    return (
        <WiredTriggerBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
            <WiredParam titleKey="wiredfurni.params.action_selection" divider={ isSign || isDance }>
                <WiredSelect
                    value={ action }
                    onChange={ event => handleActionChange(Number(event.target.value)) }
                    options={ ACTIONS.map(action => ({ value: action.value, label: LocalizeText(action.label) })) } />
            </WiredParam>

            { (isSign || isDance) &&
                <WiredParam titleKey={ isSign ? 'wiredfurni.params.sign_selection' : 'wiredfurni.params.dance_selection' } divider={ false }>
                    <WiredCheckbox
                        checked={ filterEnabled }
                        onChange={ setFilterEnabled }
                        label={ LocalizeText(isSign ? 'wiredfurni.params.sign_filter' : 'wiredfurni.params.dance_filter') } />
                    { filterEnabled &&
                        <WiredSelect
                            className="nw-indent-tab nw-w-190"
                            value={ subSelection }
                            onChange={ event => setSubSelection(Number(event.target.value)) }
                            options={ isSign
                                ? SIGNS.map(sign => ({ value: sign, label: LocalizeText(`wiredfurni.params.action.sign.${ sign }`) }))
                                : DANCES.map(dance => ({ value: dance.value, label: LocalizeText(dance.label) })) } /> }
                </WiredParam> }
        </WiredTriggerBaseView>
    );
}
