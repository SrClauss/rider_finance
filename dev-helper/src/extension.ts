import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';


export function activate(context: vscode.ExtensionContext) {
  const configPath = path.join(vscode.workspace.rootPath || '', 'dev-help-config.json');
  // mapa global dentro do activate para armazenar closeCommand por terminal
  const closeCommandMap: Record<string, string | undefined> = {};
  // mapa de terminais criados por config name
  const createdTerminalsMap: Record<string, vscode.Terminal | undefined> = {};
  // mapa de pids dos terminais criados
  const createdTerminalPids: Record<string, number | undefined> = {};
  // última configuração carregada
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
      const { name, promptName, command, cwd, closeCommand } = terminalConfig;
      if (!name || !command || !cwd) {
        vscode.window.showErrorMessage(`Configuração inválida para terminal: ${JSON.stringify(terminalConfig)}`);
        return;
      }

      const terminal = vscode.window.createTerminal({
        name: promptName || name,
        cwd: path.join(vscode.workspace.rootPath || '', cwd),
      });
      terminal.sendText(command);
      // tenta obter o pid do terminal para gravar
      terminal.processId.then(pid => {
        createdTerminalPids[name] = pid;
        // também indexa pelo label caso precise
        if (terminal.name) { createdTerminalPids[terminal.name] = pid; }
      }, () => {});
      // guarda closeCommand para uso no kill (indexado pelo config name e pelo terminal.name)
      closeCommandMap[name] = closeCommand;
      createdTerminalsMap[name] = terminal;
      // também armazena por terminal label caso precise
      closeCommandMap[terminal.name] = closeCommand;
    });
  });
    context.subscriptions.push(disposable);

  let killDisposable = vscode.commands.registerCommand('dev-helper.killAllTerminals', () => {
    if (loadedConfig && Array.isArray(loadedConfig.terminals)) {
      // cria um terminal killer para executar todos os closeCommands e deixá-lo aberto
      const killer = vscode.window.createTerminal({ name: 'dev-helper-killer', cwd: vscode.workspace.rootPath || undefined });
      loadedConfig.terminals.forEach((tc: any) => {
        const closeCmd = tc.closeCommand || closeCommandMap[tc.name];
        if (closeCmd) {
          killer.sendText(closeCmd);
        }
      });

      // envia exit e fecha (dispose) todos os terminais criados pela extensão
      loadedConfig.terminals.forEach((tc: any) => {
        const created = createdTerminalsMap[tc.name];
        if (created) {
          try { created.sendText('exit'); } catch (e) {}
          try { created.dispose(); } catch (e) {}
        }
      });

      // mostra informação com os PIDs registrados
      const pidLines = Object.keys(createdTerminalPids).map(k => `${k}: ${createdTerminalPids[k]}`);
      vscode.window.showInformationMessage('Dev Helper: comandos de encerramento enviados. Terminais criados (pids): ' + pidLines.join('; '));
    } else {
      // fallback: envia exit e fecha todos os terminais abertos
      vscode.window.terminals.forEach(terminal => {
        try { terminal.sendText('exit'); } catch (e) {}
        try { terminal.dispose(); } catch (e) {}
      });
    }

    vscode.window.showInformationMessage('Comandos para encerrar processos dos terminais enviados (closeCommand executado pelo killer)!');
  });

  context.subscriptions.push(killDisposable);
}

export function deactivate() {}
