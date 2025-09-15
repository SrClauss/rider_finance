# Usar Ubuntu 24.04 com Rust para garantir compatibilidade GLIBC
FROM ubuntu:24.04 AS builder

# Instalar Rust e dependências de build
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    libpq-dev \
    pkg-config \
    libssl-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Instalar Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

WORKDIR /app
COPY Cargo.toml ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
COPY src ./src
RUN cargo build --release
# instalar diesel_cli no estágio builder para copiar o binário para a imagem final
RUN cargo install diesel_cli --no-default-features --features postgres --locked || true

FROM ubuntu:24.04

# Instalar apenas bibliotecas necessárias para runtime
RUN apt-get update && apt-get install -y \
    libssl3 \
    libpq5 \
    postgresql-client \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*
# copiar binário diesel (instalado no builder) e ajustar PATH
COPY --from=builder /root/.cargo/bin/diesel /usr/local/bin/diesel
ENV PATH="/usr/local/bin:${PATH}"

COPY --from=builder /app/target/release/backend /usr/local/bin/backend

# Definir working dir e copiar migrations para que diesel encontre-as em runtime
WORKDIR /app
COPY ./migrations /app/migrations

# copiar entrypoint script (adicionado via build context)
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
