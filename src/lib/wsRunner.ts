import { getWsUrl } from './api';

export interface InteractiveSessionCallbacks {
  onConnecting?: () => void;
  onCompiling?: () => void;
  onRunning?: () => void;
  onStdout?: (text: string) => void;
  onStderr?: (text: string) => void;
  onExit?: (code: number, timeMs: number) => void;
  onError?: (err: string) => void;
}

export interface InteractiveSession {
  sendStdin: (input: string) => void;
  kill: () => void;
}

export function startInteractiveSession(
  code: string,
  standard: string = 'C++23',
  callbacks: InteractiveSessionCallbacks
): InteractiveSession {
  const wsUrl = getWsUrl();
  let ws: WebSocket | null = null;
  let isClosed = false;

  try {
    callbacks.onConnecting?.();
    ws = new WebSocket(wsUrl);
  } catch (err: any) {
    callbacks.onError?.(`Failed to open WebSocket connection: ${err.message || String(err)}`);
    return {
      sendStdin: () => {},
      kill: () => {}
    };
  }

  ws.onopen = () => {
    callbacks.onCompiling?.();
    try {
      ws?.send(JSON.stringify({
        type: 'start',
        code,
        standard
      }));
    } catch (e: any) {
      callbacks.onError?.(`Failed to send start command: ${e.message || String(e)}`);
    }
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'compiling') {
        callbacks.onCompiling?.();
      } else if (msg.type === 'running') {
        callbacks.onRunning?.();
      } else if (msg.type === 'stdout') {
        callbacks.onStdout?.(msg.data);
      } else if (msg.type === 'stderr') {
        callbacks.onStderr?.(msg.data);
      } else if (msg.type === 'exit') {
        isClosed = true;
        callbacks.onExit?.(msg.exitCode ?? 0, msg.timeMs ?? 0);
      } else if (msg.type === 'error') {
        isClosed = true;
        callbacks.onError?.(msg.compileOutput || msg.runOutput || 'Execution error');
      }
    } catch (e) {
      console.error('WS parse error:', e);
    }
  };

  ws.onerror = () => {
    if (!isClosed) {
      callbacks.onError?.('Interactive WebSocket connection failed.');
    }
  };

  ws.onclose = () => {
    isClosed = true;
  };

  return {
    sendStdin: (input: string) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({
            type: 'stdin',
            data: input
          }));
        } catch (e) {
          console.error('Error sending stdin:', e);
        }
      }
    },
    kill: () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: 'kill' }));
          ws.close();
        } catch (_) {}
      }
      isClosed = true;
    }
  };
}
