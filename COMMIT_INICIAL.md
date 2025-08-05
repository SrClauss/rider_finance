# Commit Inicial - rider_finance2

Este é o passo a passo para aplicar e versionar as mudanças iniciais do projeto, considerando que o repositório remoto é:

```
https://github.com/SrClauss/rider_finance
```

## 1. Limpar staging area (caso tenha feito `git add .` antes)
```sh
git reset
```

## 2. Adicionar todos os arquivos respeitando o .gitignore
```sh
git add .
```

## 3. Fazer o commit inicial
```sh
git commit -m "commit inicial: estrutura base rider_finance2 (Rust Diesel Axum + Next.js + models migrados do rider_finance + schemas completos + nginx + .gitignore customizado para backend e frontend)"
```

## 4. Adicionar o repositório remoto (se ainda não adicionou)
```sh
git remote add origin https://github.com/SrClauss/rider_finance
```

## 5. Enviar para o GitHub
```sh
git push -u origin master
```

---

> **Dica:** Sempre confira o que será enviado com `git status` antes do commit!
