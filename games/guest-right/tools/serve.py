#!/usr/bin/env python3
"""Development server for Guest-Right: static files from the game folder, never cached.

    python tools/serve.py [--port 5190]

Open http://localhost:5190/ (the game) or http://localhost:5190/tools/ui-dev.html and the other dev pages.
Each page load gets the latest files, so several people can edit at once.
"""
import http.server
import os
import socketserver
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(sys.argv[sys.argv.index("--port") + 1]) if "--port" in sys.argv else 5190

TYPES = {
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".woff2": "font/woff2",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".md": "text/plain; charset=utf-8",
}


class Handler(http.server.SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"      # keep connections open: a page load is a hundred small files

    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def guess_type(self, path):
        ext = os.path.splitext(path)[1].lower()
        return TYPES.get(ext) or super().guess_type(path)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        super().end_headers()

    def log_message(self, fmt, *args):
        if args and isinstance(args[1], str) and args[1].startswith("5"):
            sys.stderr.write("%s %s\n" % (self.address_string(), fmt % args))


class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True
    request_queue_size = 256      # several people load the game at once: the default backlog of 5 refuses connections


if __name__ == "__main__":
    with Server(("127.0.0.1", PORT), Handler) as httpd:
        print(f"Guest-Right dev server on http://localhost:{PORT}/  (root {ROOT})", flush=True)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
