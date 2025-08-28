#!/bin/sh
set -e

# render nginx config from template using envsubst
: ${DOMAIN:=localhost}
: ${API_PREFIX:=/api}
: ${FRONTEND_PREFIX:=/}

export DOMAIN API_PREFIX FRONTEND_PREFIX
envsubst '\$DOMAIN \$API_PREFIX \$FRONTEND_PREFIX' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Optional: apply init SQL into the database if requested at runtime.
# Use: set APPLY_INIT_DB=true and provide DATABASE_URL (psql connection string)
if [ "${APPLY_INIT_DB:-}" = "true" ] && [ -f /opt/init_db.sql ] && [ -n "${DATABASE_URL:-}" ]; then
  echo "Applying init_db.sql to ${DATABASE_URL} ..."
  # psql expects separate params; DATABASE_URL may be in the form postgres://user:pass@host:port/db
  # Use psql with connection string
  psql "$DATABASE_URL" -f /opt/init_db.sql || echo "Warning: init_db.sql returned non-zero exit code"
fi

PIDS=""

shutdown() {
  echo "Shutting down..."
  [ -n "$PIDS" ] && kill $PIDS || true
  exit 0
}

trap 'shutdown' TERM INT

# Start backend if present
if [ -x /usr/local/bin/backend ]; then
  /usr/local/bin/backend &
  PIDS="$PIDS $!"
  echo "Started backend (pid $!)"
fi

# Start Next.js if present (server mode)
if [ -d /opt/frontend/.next ] && [ -d /opt/frontend/node_modules ]; then
  # run next start in background
  (cd /opt/frontend && NODE_ENV=production npm run start) &
  PIDS="$PIDS $!"
  echo "Started frontend (next start) (pid $!)"
fi

# Finally start nginx in foreground
nginx -g 'daemon off;' &
PIDS="$PIDS $!"

wait $PIDS
