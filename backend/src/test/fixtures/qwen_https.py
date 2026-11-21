"""Local HTTPS fixture for scripts/verify-ai-https.sh."""

import json
import os
import ssl
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            if self.path != "/compatible-mode/v1/chat/completions":
                self.send_error(404)
                return
            if self.headers.get("Authorization") != "Bearer " + os.environ["DASHSCOPE_API_KEY"]:
                self.send_error(401)
                return
            request = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
            if request["model"] != "fixture-model" or request["stream"] or request["enable_thinking"]:
                raise ValueError("Unexpected request options")

            messages = request["messages"]
            if messages[0]["role"] != "system" or messages[-1]["role"] != "user":
                raise ValueError("Unexpected message order")
            prompt = messages[-1]["content"]
            if "response_format" in request:
                if request["response_format"] != {"type": "json_object"} or "JSON" not in messages[0]["content"]:
                    raise ValueError("Expected JSON Object mode")
                data = json.loads(prompt)
                if (data["destination"], data["days"], data["budget"]) != ("Fuzhou", 3, 1500):
                    raise ValueError("Unexpected trip input")
                days = [
                    {
                        "day": day, "title": title,
                        "activities": [{"name": place, "description": "Check access before visiting.",
                                        "estimatedCost": cost}],
                    }
                    for day, title, place, cost in (
                        (1, "Old quarter", "Sanfang Qixiang", 0),
                        (2, "Lakeside", "West Lake Park", None),
                        (3, "Riverside", "Min River promenade", None),
                    )
                ]
                self.reply(200, self.completion(json.dumps({
                    "dailyItinerary": days, "suggestions": ["Confirm opening hours before departure."],
                })))
            elif prompt == "Fixture quota":
                self.reply(429, {"error": "PRIVATE_FIXTURE_PAYLOAD"})
            elif prompt == "Fixture upstream failure":
                self.reply(500, {"error": "PRIVATE_FIXTURE_PAYLOAD"})
            elif prompt == "Fixture oversized body":
                body = json.dumps(self.completion("Should never reach the browser.")).encode()
                self.respond_with_body(b" " * (300 * 1024) + body)
            elif prompt == "Fixture slow body":
                self.respond_with_body(json.dumps(self.completion("Too late.")).encode(), delay=4)
            elif len(messages) == 2 and "Fuzhou Railway Station" in prompt:
                self.reply(200, self.completion("Start at Fuzhou Railway Station and check local transit."))
            elif (
                [message["role"] for message in messages] == ["system", "user", "assistant", "user"]
                and "Fuzhou Railway Station" in messages[1]["content"]
                and "Fuzhou Railway Station" in messages[2]["content"]
                and "which station" in prompt.lower()
            ):
                self.reply(200, self.completion("Your starting point was Fuzhou Railway Station."))
            else:
                raise ValueError("Unexpected conversation")
        except (KeyError, ValueError):
            self.reply(400, {"error": "Unexpected local fixture request"})
        except (BrokenPipeError, ConnectionResetError, ssl.SSLEOFError):
            pass

    def log_message(self, *_):
        pass

    @staticmethod
    def completion(content):
        return {"choices": [{"finish_reason": "stop", "message": {"role": "assistant", "content": content}}]}

    def respond_with_body(self, data, delay=0):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        # Connection-close framing exercises the byte cap even without Content-Length.
        self.end_headers()
        self.wfile.write(data[:1])
        if delay:
            time.sleep(delay)
        self.wfile.write(data[1:])

    def reply(self, status, payload):
        data = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


if __name__ == "__main__":
    cert, key = sys.argv[1:]
    with ThreadingHTTPServer(("127.0.0.1", 8447), Handler) as server:
        tls = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        tls.load_cert_chain(cert, key)
        server.socket = tls.wrap_socket(server.socket, server_side=True)
        server.serve_forever()
