#!/bin/bash

# Iniciar PostgreSQL
su - postgres -c "/usr/lib/postgresql/15/bin/pg_ctl -D /var/lib/postgresql/data -l /var/lib/postgresql/logfile start"

# Aguardar PostgreSQL iniciar
sleep 5

# Iniciar o backend Rust
/usr/local/bin/backend &
wait
