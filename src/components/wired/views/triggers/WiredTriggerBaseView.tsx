import { FC, PropsWithChildren, ReactNode } from 'react';
import { WiredFurniType } from '../../../../api';
import { WiredBaseView } from '../WiredBaseView';
import { WiredSourceSelectorConfig } from '../WiredFurniSelectorView';

export interface WiredTriggerBaseViewProps
{
    hasSpecialInput: boolean;
    requiresFurni: number;
    save: () => void;
    validate?: () => boolean;
    furniSource?: number;
    onFurniSourceChange?: (source: number) => void;
    sourceOptions?: number[];
    sourceTitleKey?: string;
    sourceLabelPrefix?: string;
    sourceSelectors?: WiredSourceSelectorConfig[];
    expanded?: boolean;
    onToggleExpanded?: () => void;
    headerSlot?: ReactNode;
    showSourceDivider?: boolean;
}

export const WiredTriggerBaseView: FC<PropsWithChildren<WiredTriggerBaseViewProps>> = props =>
{
    const {
        requiresFurni = WiredFurniType.STUFF_SELECTION_OPTION_NONE,
        save = null,
        validate = null,
        hasSpecialInput = false,
        children = null,
        furniSource,
        onFurniSourceChange,
        sourceOptions,
        sourceTitleKey,
        sourceLabelPrefix,
        sourceSelectors,
        expanded,
        onToggleExpanded,
        headerSlot,
        showSourceDivider
    } = props;

    const onSave = () => (save && save());

    return (
        <WiredBaseView
            wiredType="trigger"
            requiresFurni={ requiresFurni }
            hasSpecialInput={ hasSpecialInput }
            save={ onSave }
            validate={ validate }
            furniSource={ furniSource }
            onFurniSourceChange={ onFurniSourceChange }
            sourceOptions={ sourceOptions }
            sourceTitleKey={ sourceTitleKey }
            sourceLabelPrefix={ sourceLabelPrefix }
            sourceSelectors={ sourceSelectors }
            expanded={ expanded }
            onToggleExpanded={ onToggleExpanded }
            headerSlot={ headerSlot }
            showSourceDivider={ showSourceDivider }
        >
            { children }
        </WiredBaseView>
    );
}
