#!/bin/bash

# Construir a imagem
docker build -t rider-backend-rust .

# Executar o contêiner
docker run -p 3000:3000 rider-backend-rust
