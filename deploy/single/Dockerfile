# Multi-stage Dockerfile that builds frontend (Next.js) and backend (Rust),
# then assembles a runtime image containing only the production artifacts (no source).

# Frontend builder
FROM node:20-bullseye-slim AS frontend-builder
WORKDIR /build/frontend
# copy package only first for faster install
COPY frontend/package.json ./
COPY frontend/package-lock.json ./
# copy full frontend source to run the build
COPY frontend/ ./

# install build dependencies and build
RUN apt-get update \
    && apt-get install -y python3 make g++ ca-certificates --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && npm ci \
    && npm run build \
    # prune dev deps so production node_modules is smaller
    && npm prune --production \
    && rm -rf node_modules/.cache

# Backend builder (Rust)
FROM rust:latest AS backend-builder
WORKDIR /build/backend
# copy manifest first to cache dependencies
COPY backend/Cargo.toml backend/Cargo.lock ./
# copy backend source
COPY backend/ ./

# build release binary
RUN apt-get update && apt-get install -y pkg-config libssl-dev build-essential ca-certificates --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && cargo build --release

# Runtime image
FROM node:20-bookworm-slim AS runtime
RUN apt-get update \
    && apt-get install -y nginx gettext-base ca-certificates curl libssl3 libpq5 postgresql-client --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# create directories
RUN mkdir -p /opt/frontend /var/log/nginx \
    && chown -R www-data:www-data /var/log/nginx || true

# copy frontend production artifacts only (no source)
COPY --from=frontend-builder /build/frontend/.next /opt/frontend/.next
COPY --from=frontend-builder /build/frontend/public /opt/frontend/public
COPY --from=frontend-builder /build/frontend/node_modules /opt/frontend/node_modules
COPY --from=frontend-builder /build/frontend/package.json /opt/frontend/package.json

# copy backend binary
COPY --from=backend-builder /build/backend/target/release/backend /usr/local/bin/backend
RUN chmod +x /usr/local/bin/backend

# nginx template and entrypoint
COPY deploy/single/nginx.conf.template /etc/nginx/nginx.conf.template
COPY deploy/single/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# copy optional init SQL (used when APPLY_INIT_DB=true at runtime)
COPY deploy/single/init_db.sql /opt/init_db.sql
RUN chmod 644 /opt/init_db.sql || true

WORKDIR /opt/frontend
ENV PORT=3000
EXPOSE 80 3000 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s CMD curl -fsS http://localhost/health || exit 1

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
