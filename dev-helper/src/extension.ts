// ...existing code...
import * as vscode from 'vscode';


export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('dev-helper.startDevServices', () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage('Nenhuma pasta aberta no workspace!');
      return;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;

    // Se não houver terminais abertos, abre a aba de terminal
    if (vscode.window.terminals.length === 0) {
      vscode.commands.executeCommand('workbench.action.terminal.toggleTerminal');
    }

    // Backend
    const backendPath = `${rootPath}/backend`;
    const backendTerminal = vscode.window.createTerminal({
      name: '🐍 Backend (Rust FastAPI)',
      cwd: backendPath
    });
    backendTerminal.sendText('cargo run -vv');

    // Frontend
    const frontendPath = `${rootPath}/frontend`;
    const frontendTerminal = vscode.window.createTerminal({
      name: '⚛️ Frontend (Next.js)',
      cwd: frontendPath
    });
    frontendTerminal.sendText('npm run dev -- --verbose');

    // Nginx
    const nginxPath = `${rootPath}/nginx`;
    const nginxTerminal = vscode.window.createTerminal({
      name: '🌐 Nginx (Proxy)',
      cwd: nginxPath
    });
    nginxTerminal.sendText('.\\nginx.exe -g "error_log logs/error.log debug;"');
  });

  context.subscriptions.push(disposable);

  let killDisposable = vscode.commands.registerCommand('dev-helper.killAllTerminals', () => {
    // Identificadores dos terminais criados pela extensão
    const terminalNames = [
      '🐍 Backend (Rust FastAPI)',
      '⚛️ Frontend (Next.js)',
      '🌐 Nginx (Proxy)'
    ];
    vscode.window.terminals.forEach(terminal => {
      if (terminalNames.includes(terminal.name)) {
        // Envia comando de kill para o terminal específico
        terminal.sendText('exit'); // Tenta encerrar o processo gentilmente
        // Para nginx, força kill
        if (terminal.name === '🌐 Nginx (Proxy)') {
          terminal.sendText('taskkill /IM nginx.exe /F');
        }
      }
    });
    vscode.window.showInformationMessage('Comandos para encerrar processos dos terminais da extensão enviados!');
  });
  context.subscriptions.push(killDisposable);
}

export function deactivate() {}
