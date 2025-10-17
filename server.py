#!/usr/bin/env python3
"""
Simple HTTP server with proper MIME types for ES6 modules
"""
import http.server
import socketserver

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add proper MIME type for JavaScript modules
        self.send_my_headers()
        http.server.SimpleHTTPRequestHandler.end_headers(self)
    
    def send_my_headers(self):
        # Ensure .js files are served with correct MIME type
        if self.path.endswith('.js'):
            self.send_header('Content-Type', 'application/javascript')

Handler = MyHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    print("Press Ctrl+C to stop")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped")

