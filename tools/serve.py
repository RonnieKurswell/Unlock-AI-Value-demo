"""Dev server for the kiosk build.

Same as `python3 -m http.server`, with one difference that matters: it tells the
browser never to cache. Plain http.server sends only Last-Modified, which lets a
browser reuse stale JS and CSS without revalidating — during this build that made
fixed code look broken more than once, including input handling that appeared
dead because the old stylesheet was still in play.

Port comes from the PORT environment variable when set, so the harness can assign
one, otherwise argv[1], otherwise 4321. Serves ./build by default.

    python3 tools/serve.py            # build/ on 4321
    python3 tools/serve.py 8080 build # explicit
"""
import functools
import http.server
import os
import socketserver
import sys


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, fmt, *args):
        # Quieter: one line per request is noise when driving the kiosk.
        if '404' in (fmt % args):
            super().log_message(fmt, *args)


def main():
    port = int(os.environ.get('PORT') or (sys.argv[1] if len(sys.argv) > 1 else 4321))
    root = sys.argv[2] if len(sys.argv) > 2 else 'build'
    if not os.path.isdir(root):
        raise SystemExit(f'no such directory: {root}')
    handler = functools.partial(NoCache, directory=root)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('127.0.0.1', port), handler) as httpd:
        print(f'serving {root}/ on http://localhost:{port} (no-store)', flush=True)
        httpd.serve_forever()


if __name__ == '__main__':
    main()
