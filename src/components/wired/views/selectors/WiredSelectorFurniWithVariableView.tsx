import { FC } from 'react';
import { WIRED_VARIABLE_FURNI } from '../WiredControls';
import { WiredSelectorWithVariableView } from './WiredSelectorWithVariableView';

export const WiredSelectorFurniWithVariableView: FC<{}> = () => <WiredSelectorWithVariableView variableType={ WIRED_VARIABLE_FURNI } />;
