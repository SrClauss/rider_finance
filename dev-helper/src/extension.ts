import * as vscode from 'vscode';

declare function setTimeout(handler: (...args: any[]) => void, timeout: number): number;

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('dev-helper.startDevServices', () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage('Nenhuma pasta aberta no workspace!');
      return;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;

    // Se não houver terminais abertos ou visíveis, abre a aba de terminal
    vscode.commands.executeCommand('workbench.action.terminal.focus');

    // Backend
    const backendPath = `${rootPath}/backend`;
    const backendTerminal = vscode.window.createTerminal({
      name: '🐍 Backend (Rust FastAPI)',
      cwd: backendPath
    });
    backendTerminal.show();
    backendTerminal.sendText('cargo run -vv');

    // Frontend
    const frontendPath = `${rootPath}/frontend`;
    const frontendTerminal = vscode.window.createTerminal({
      name: '⚛️ Frontend (Next.js)',
      cwd: frontendPath
    });
    frontendTerminal.show();
    frontendTerminal.sendText('npm run dev');

    // Nginx
    const nginxPath = `${rootPath}/nginx`;
    const nginxTerminal = vscode.window.createTerminal({
      name: '🌐 Nginx (Proxy)',
      cwd: nginxPath
    });
    nginxTerminal.show();
    nginxTerminal.sendText('echo $SHELL');
    nginxTerminal.sendText('pwd');
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
    // Matar processos relevantes em terminais ocultos
    const killCommands = [
      'taskkill /IM nginx.exe /F',
      'taskkill /IM cargo.exe /F',
      'taskkill /IM node.exe /F',
      'taskkill /IM npm.exe /F'
    ];
    killCommands.forEach(cmd => {
      const killTerminal = vscode.window.createTerminal({ name: `💀 Kill: ${cmd}`, hideFromUser: true });
      killTerminal.sendText(cmd);
      killTerminal.sendText('exit');
      setTimeout(() => killTerminal.dispose(), 1000);
    });
    // Aguarda um pouco para garantir que os processos sejam mortos antes de fechar os terminais da extensão
    setTimeout(() => {
      vscode.window.terminals.forEach(terminal => {
        if (terminalNames.includes(terminal.name)) {
          terminal.sendText('exit');
          terminal.dispose();
        }
      });
      vscode.window.showInformationMessage('Processos e terminais da extensão foram encerrados!');
    }, 1500);
  });
  context.subscriptions.push(killDisposable);
}

export function deactivate() {}
