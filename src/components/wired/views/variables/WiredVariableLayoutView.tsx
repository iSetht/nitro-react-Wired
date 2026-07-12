import { WiredVariableLayout } from '../../../../api';
import { WiredVariableContextView } from './WiredVariableContextView';
import { WiredVariableEchoView } from './WiredVariableEchoView';
import { WiredVariableFurniView } from './WiredVariableFurniView';
import { WiredVariableFromAnotherRoomView } from './WiredVariableFromAnotherRoomView';
import { WiredVariableGlobalView } from './WiredVariableGlobalView';
import { WiredVariableUserView } from './WiredVariableUserView';

export const WiredVariableLayoutView = (code: number) =>
{
    switch(code)
    {
        case WiredVariableLayout.FURNI:
            return <WiredVariableFurniView />;
        case WiredVariableLayout.GLOBAL:
            return <WiredVariableGlobalView />;
        case WiredVariableLayout.USER:
            return <WiredVariableUserView />;
        case WiredVariableLayout.CONTEXT:
            return <WiredVariableContextView />;
        case WiredVariableLayout.REFERENCE:
            return <WiredVariableFromAnotherRoomView />;
        case WiredVariableLayout.ECHO:
            return <WiredVariableEchoView />;
    }

    return null;
}
