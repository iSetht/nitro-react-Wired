import { GetRoomSession, GoToDesktop } from '.';

export const VisitDesktop = () =>
{
    if(!GetRoomSession()) return;

    // The server response ends the room session after its leave lifecycle is complete.
    GoToDesktop();
}
