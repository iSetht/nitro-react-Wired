import { FC } from 'react';
import { WIRED_VARIABLE_USER } from '../WiredControls';
import { WiredSelectorWithVariableView } from './WiredSelectorWithVariableView';

export const WiredSelectorUserWithVariableView: FC<{}> = () => <WiredSelectorWithVariableView variableType={ WIRED_VARIABLE_USER } />;
