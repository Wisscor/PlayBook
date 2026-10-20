from collections import deque


class SlidingWindow:
    def __init__(self, span: float) -> None:
        self.span = span
        self._hits: deque[float] = deque()

    def hit(self, now: float) -> int:
        self._hits.append(now)
        while self._hits and self._hits[0] < now - self.span:
            self._hits.popleft()
        return len(self._hits)
