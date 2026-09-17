from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

#notes bellow is for me to not forget 
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # accept() completes the handshake. Until you call it, the
    # connection is not open and you cannot send anything.
    await websocket.accept()
    try:
        while True:
            # receive_text() waits here until the client sends something.
            text = await websocket.receive_text()
            await websocket.send_text(f"echo: {text}")
    except WebSocketDisconnect:
        # The client closed the tab, lost network, or the browser
        # crashed. This is normal, not an error. If you do not catch
        # it, your logs fill with tracebacks for ordinary behaviour.
        pass
