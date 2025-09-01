import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const configPath = path.join(vscode.workspace.rootPath || '', 'dev-help-config.json');
  const closeCommandMap: Record<string, string | undefined> = {};
  const createdTerminalsMap: Record<string, vscode.Terminal | undefined> = {};
  const createdTerminalPids: Record<string, number | undefined> = {};
  let loadedConfig: any = null;

  let disposable = vscode.commands.registerCommand('dev-helper.startDevServices', () => {
    if (!fs.existsSync(configPath)) {
      vscode.window.showErrorMessage('Arquivo dev-help-config.json não encontrado no diretório raiz do workspace!');
      return;
    }

    let config;
    try {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      config = JSON.parse(configContent);
      loadedConfig = config;
    } catch (error) {
      vscode.window.showErrorMessage('Erro ao ler ou parsear o arquivo dev-help-config.json!');
      return;
    }

    if (!Array.isArray(config.terminals)) {
      vscode.window.showErrorMessage('Configuração inválida: "terminals" deve ser uma lista no dev-help-config.json!');
      return;
    }

    config.terminals.forEach((terminalConfig: any) => {
      const { name, promptName, command, cwd, closeCommand, keepOpen } = terminalConfig;
      if (!name || !command || !cwd) {
        vscode.window.showErrorMessage(`Configuração inválida para terminal: ${JSON.stringify(terminalConfig)}`);
        return;
      }

      // Verifica se já existe um terminal com o mesmo promptName
      const existingTerminal = vscode.window.terminals.find(t => t.name === (promptName || name));
      if (existingTerminal) {
        vscode.window.showInformationMessage(`Terminal já aberto: ${promptName || name}`);
        return;
      }

      const terminal = vscode.window.createTerminal({
        name: promptName || name,
        cwd: path.join(vscode.workspace.rootPath || '', cwd),
      });
      terminal.sendText(command);
      terminal.processId.then(pid => {
        createdTerminalPids[name] = pid;
        if (terminal.name) { createdTerminalPids[terminal.name] = pid; }
      }, () => {});
      closeCommandMap[name] = closeCommand;
      createdTerminalsMap[name] = terminal;
      closeCommandMap[terminal.name] = closeCommand;
    });
  });

  let killDisposable = vscode.commands.registerCommand('dev-helper.killAllTerminals', () => {
    if (loadedConfig && Array.isArray(loadedConfig.terminals)) {
      // Para cada terminal com closeCommand, criar um killer com o cwd correto
      loadedConfig.terminals.forEach((tc: any) => {
        const closeCmd = tc.closeCommand || closeCommandMap[tc.name];
        if (closeCmd) {
          const killerCwd = path.join(vscode.workspace.rootPath || '', tc.cwd);
          const killer = vscode.window.createTerminal({ name: `dev-helper-killer-${tc.name}`, cwd: killerCwd });
          vscode.window.showInformationMessage(`Enviando closeCommand para ${tc.name}: ${closeCmd} em ${killerCwd}`);
          killer.sendText(closeCmd);
          // Aguardar mais tempo antes de fechar, para o comando executar
          setTimeout(() => {
            killer.sendText('exit');
            setTimeout(() => killer.dispose(), 500); // Pequeno delay adicional para exit
          }, 3000); // Aumentado para 3 segundos
        }
      });

      // Fechar os terminais criados (se não keepOpen)
      loadedConfig.terminals.forEach((tc: any) => {
        const created = createdTerminalsMap[tc.name];
        if (created && !tc.keepOpen) {
          try { created.sendText('exit'); } catch (e) {}
          try { created.dispose(); } catch (e) {}
        }
      });

      const pidLines = Object.keys(createdTerminalPids).map(k => `${k}: ${createdTerminalPids[k]}`);
      vscode.window.showInformationMessage('Dev Helper: comandos de encerramento enviados. Terminais criados (pids): ' + pidLines.join('; '));
    } else {
      vscode.window.terminals.forEach(terminal => {
        try { terminal.sendText('exit'); } catch (e) {}
        try { terminal.dispose(); } catch (e) {}
      });
    }

    vscode.window.showInformationMessage('Comandos para encerrar processos dos terminais enviados (closeCommand executado em cwd correto)!');
  });

  function openConfigFile() {
    const configPath = path.join(vscode.workspace.rootPath || '', 'dev-help-config.json');
    vscode.workspace.openTextDocument(configPath).then(doc => {
      vscode.window.showTextDocument(doc);
    }, err => {
      vscode.window.showErrorMessage('Erro ao abrir o arquivo de configuração: ' + err.message);
    });
  }

  context.subscriptions.push(disposable, killDisposable, vscode.commands.registerCommand('dev-helper.openConfig', openConfigFile));
}

export function deactivate() {
  // Função vazia para desativação da extensão
}
