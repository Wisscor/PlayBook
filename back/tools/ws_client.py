import asyncio
import sys

import websockets

URL = "ws://localhost:8000/ws"


async def read_from_server(ws):
    try:
        async for raw in ws:
            print("<<", raw, flush=True)
    except websockets.ConnectionClosed as exc:
        close = exc.rcvd or exc.sent
        code = close.code if close else "unknown"
        reason = close.reason if close else ""
        print(f"<< connection closed (code={code}, reason={reason!r})", flush=True)


async def read_from_keyboard(ws):
    loop = asyncio.get_running_loop()
    lines = asyncio.Queue()
    stdin_fd = sys.stdin.fileno()

    def on_stdin_ready():
        lines.put_nowait(sys.stdin.readline())

    loop.add_reader(stdin_fd, on_stdin_ready)
    try:
        while True:
            line = await lines.get()
            if not line:
                return
            line = line.strip()
            if line:
                await ws.send(line)
    finally:
        loop.remove_reader(stdin_fd)


async def keepalive(ws):
    while True:
        await asyncio.sleep(20)
        await ws.send('{"type": "ping"}')


async def main(session_id):
    async with websockets.connect(
        URL, additional_headers={"Cookie": f"session_id={session_id}"}
    ) as ws:
        print("Connected. Type a message and press Enter; Ctrl+C to quit.", flush=True)
        server_task = asyncio.create_task(read_from_server(ws))
        keyboard_task = asyncio.create_task(read_from_keyboard(ws))
        keepalive_task = asyncio.create_task(keepalive(ws))
        tasks = (server_task, keyboard_task, keepalive_task)
        try:
            done, _ = await asyncio.wait(
                tasks, return_when=asyncio.FIRST_COMPLETED
            )
            for task in done:
                task.result()
        finally:
            for task in tasks:
                if not task.done():
                    task.cancel()
            await asyncio.gather(*tasks, return_exceptions=True)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python3 tools/ws_client.py <session_id>")
    asyncio.run(main(sys.argv[1]))
