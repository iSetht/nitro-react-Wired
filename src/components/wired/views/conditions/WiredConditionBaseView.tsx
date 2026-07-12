import { FC, PropsWithChildren, ReactNode } from 'react';
import { WiredFurniType } from '../../../../api';
import { WiredBaseView } from '../WiredBaseView';
import { WiredSourceSelectorConfig } from '../WiredFurniSelectorView';

export interface WiredConditionBaseViewProps
{
    hasSpecialInput: boolean;
    requiresFurni: number;
    save: () => void;
    sourceSelectors?: WiredSourceSelectorConfig[];
    hideFurniSelector?: boolean;
    expanded?: boolean;
    alwaysExpandedSources?: boolean;
    advancedSlot?: ReactNode;
    onToggleExpanded?: () => void;
    headerSlot?: ReactNode;
}

export const WiredConditionBaseView: FC<PropsWithChildren<WiredConditionBaseViewProps>> = props =>
{
    const { requiresFurni = WiredFurniType.STUFF_SELECTION_OPTION_NONE, save = null, hasSpecialInput = false, children = null, sourceSelectors = undefined, hideFurniSelector = false, expanded = false, alwaysExpandedSources = false, advancedSlot = null, onToggleExpanded = undefined, headerSlot = null } = props;
    
    const onSave = () => (save && save());

    return (
        <WiredBaseView wiredType="condition" requiresFurni={ requiresFurni } hasSpecialInput={ hasSpecialInput } save={ onSave } sourceSelectors={ sourceSelectors } hideFurniSelector={ hideFurniSelector } expanded={ expanded } alwaysExpandedSources={ alwaysExpandedSources } advancedSlot={ advancedSlot } onToggleExpanded={ onToggleExpanded } headerSlot={ headerSlot }>
            { children }
        </WiredBaseView>
    );
}
