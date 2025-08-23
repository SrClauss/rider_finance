# Configurações da Extensão Dev Helper

Este documento descreve como configurar e editar as configurações da extensão Dev Helper.

## Arquivo de Configuração

A extensão utiliza um arquivo chamado `dev-help-config.json` localizado no diretório raiz do workspace. Este arquivo define os terminais e comandos que a extensão gerencia.

### Estrutura do Arquivo

```json
{
  "terminals": [
    {
      "name": "Nome do Terminal",
      "promptName": "Nome exibido no prompt (opcional)",
      "command": "Comando a ser executado",
      "cwd": "Diretório de trabalho",
      "closeCommand": "Comando para encerrar o terminal (opcional)",
      "keepOpen": true
    }
  ]
}
```

### Campos
- **name**: Nome único do terminal.
- **promptName**: Nome exibido no terminal (opcional).
- **command**: Comando que será executado no terminal.
- **cwd**: Caminho do diretório de trabalho.
- **closeCommand**: Comando para encerrar o terminal (opcional).
- **keepOpen**: Define se o terminal deve permanecer aberto após o comando de encerramento (opcional, padrão: `false`).

## Editando as Configurações

1. Abra o arquivo `dev-help-config.json` no diretório raiz do seu workspace.
2. Edite ou adicione novos terminais seguindo a estrutura descrita acima.
3. Salve o arquivo.
4. Recarregue a extensão no VS Code para aplicar as alterações.

## Exemplo de Configuração

```json
{
  "terminals": [
    {
      "name": "Backend",
      "command": "npm run start",
      "cwd": "./backend",
      "closeCommand": "npm stop",
      "keepOpen": false
    },
    {
      "name": "Frontend",
      "command": "npm run dev",
      "cwd": "./frontend",
      "keepOpen": true
    }
  ]
}
```

## Observações
- Certifique-se de que o arquivo JSON esteja bem formatado.
- Utilize o campo `keepOpen` para evitar que terminais importantes sejam fechados automaticamente.
