import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredParam, WiredRadio } from '../WiredControls';
import { WiredSelectorBaseView } from './WiredSelectorBaseView';

const USER_TYPE_HABBO = 1;
const USER_TYPE_PET = 2;
const USER_TYPE_BOT = 4;

const USER_TYPES = [
    { label: 'wiredfurni.params.usertype.1', value: USER_TYPE_HABBO },
    { label: 'wiredfurni.params.usertype.2', value: USER_TYPE_PET  },
    { label: 'wiredfurni.params.usertype.4', value: USER_TYPE_BOT  }
];

const normalizeUserType = (value: number) => USER_TYPES.some(type => type.value === value) ? value : USER_TYPE_HABBO;

export const WiredSelectorUserByTypeView: FC<{}> = props =>
{
    const [ userType, setUserType ] = useState(USER_TYPE_HABBO);
    const { trigger = null, setIntParams = null } = useWired();

    const save = (filterExistingSelection = false, invert = false) =>
    {
        setIntParams([
            userType,
            filterExistingSelection ? 1 : 0,
            invert ? 1 : 0
        ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        setUserType(normalizeUserType((trigger.intData.length > 0) ? trigger.intData[0] : USER_TYPE_HABBO));
    }, [ trigger ]);

    return (
        <WiredSelectorBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            showSelectorOptions={ true }
            selectorOptionOffset={ 1 }
        >
            <WiredParam titleKey="wiredfurni.params.usertype">
                { USER_TYPES.map(type => (
                    <WiredRadio
                        key={ type.value }
                        name="userType"
                        checked={ userType === type.value }
                        onChange={ () => setUserType(type.value) }
                        label={ LocalizeText(type.label) } />
                )) }
            </WiredParam>
        </WiredSelectorBaseView>
    );
}
