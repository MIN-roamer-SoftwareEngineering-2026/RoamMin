#!/usr/bin/env bash
set -euo pipefail
umask 077

root="$(cd -- "$(dirname -- "$0")/.." && pwd)"
jar="$root/backend/target/min-roamer-api-0.1.0-SNAPSHOT.jar"
vite="$root/frontend/node_modules/vite/bin/vite.js"
if [[ ! -f "$jar" || ! -f "$vite" ]]; then
    printf '%s\n' 'Build the backend JAR and install frontend dependencies first.' >&2
    exit 1
fi
python3 - <<'PY'
import socket
for port in (5173, 8080, 8447):
    with socket.socket() as probe:
        try:
            probe.bind(("127.0.0.1", port))
        except OSError:
            raise SystemExit(f"Local QA requires port {port} to be free.")
PY

scratch="$(mktemp -d)"
pids=()
cleanup() {
    set +u
    for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; done
    for pid in "${pids[@]}"; do wait "$pid" 2>/dev/null || true; done
    rm -rf -- "$scratch"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

cat > "$scratch/tls.cnf" <<'TLS'
[req]
distinguished_name = dn
x509_extensions = server
prompt = no
[dn]
CN = localhost
[server]
subjectAltName = DNS:localhost,IP:127.0.0.1
basicConstraints = critical,CA:TRUE
TLS
openssl req -x509 -newkey rsa:2048 -nodes -days 1 -config "$scratch/tls.cnf" \
    -keyout "$scratch/fixture.key" -out "$scratch/fixture.crt" >/dev/null 2>&1
keytool -importcert -noprompt -alias roammin-fixture -file "$scratch/fixture.crt" \
    -keystore "$scratch/trust.p12" -storetype PKCS12 -storepass changeit >/dev/null 2>&1

# Only the two test servers inherit the generated test credentials.
fixture_key="$(openssl rand -hex 24)"
DASHSCOPE_API_KEY="$fixture_key" python3 "$root/backend/src/test/fixtures/qwen_https.py" \
    "$scratch/fixture.crt" "$scratch/fixture.key" >"$scratch/fixture.log" 2>&1 &
pids+=("$!")
(
    cd "$scratch"
    export DASHSCOPE_API_KEY="$fixture_key" JWT_SECRET="$(openssl rand -base64 32)"
    export QWEN_ENDPOINT="https://127.0.0.1:8447/compatible-mode/v1/chat/completions"
    export QWEN_MODEL=fixture-model QWEN_TIMEOUT=2s
    export SERVER_ADDRESS=127.0.0.1 SERVER_PORT=8080
    export SPRING_DATASOURCE_URL="jdbc:h2:mem:aiE2e;DB_CLOSE_DELAY=-1" APP_AVATAR_DIRECTORY="$scratch/avatars"
    exec java -Djavax.net.ssl.trustStore="$scratch/trust.p12" -Djavax.net.ssl.trustStorePassword=changeit -jar "$jar"
) >"$scratch/backend.log" 2>&1 &
pids+=("$!")
(
    cd "$root/frontend"
    unset DASHSCOPE_API_KEY JWT_SECRET QWEN_ENDPOINT QWEN_MODEL QWEN_TIMEOUT
    export VITE_API_BASE_URL=/api/v1
    exec node "$vite" --host 127.0.0.1 --port 5173 --strictPort
) >"$scratch/frontend.log" 2>&1 &
pids+=("$!")

wait_http() {
    local url="$1" expected="$2" pid="$3" code
    for ((i = 0; i < 120; i++)); do
        kill -0 "$pid" 2>/dev/null || break
        code="$(curl --noproxy '*' --silent --output /dev/null --write-out '%{http_code}' --max-time 1 "$url" || true)"
        if [[ "$code" == "$expected" ]]; then return; fi
        sleep 0.25
    done
    printf 'Could not start QA service at %s\n' "$url" >&2
    exit 1
}
wait_http http://127.0.0.1:8080/api/v1/auth/me 401 "${pids[1]}"
wait_http http://127.0.0.1:5173/ 200 "${pids[2]}"
kill -0 "${pids[0]}"

cd "$root/frontend"
export AI_QA_PROVIDER=fixture QA_BASE_URL=http://127.0.0.1:5173
export NO_PROXY=localhost,127.0.0.1 no_proxy=localhost,127.0.0.1
unset DASHSCOPE_API_KEY JWT_SECRET QWEN_ENDPOINT QWEN_MODEL QWEN_TIMEOUT
output="${QA_OUTPUT:-artifacts/ai-phase2}"
QA_OUTPUT="$output/https" node --test scripts/verify-ai-https.cjs
QA_OUTPUT="$output/ai-browser" node --test scripts/verify-ai-assistant.cjs
QA_OUTPUT="$output/user-module" node scripts/verify-user-module.cjs
