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
    nginxTerminal.sendText('nginx.exe -g "error_log logs/error.log debug;"');
  });

  context.subscriptions.push(disposable);

  let killDisposable = vscode.commands.registerCommand('dev-helper.killAllTerminals', () => {
    vscode.window.terminals.forEach(terminal => terminal.dispose());
    vscode.window.showInformationMessage('Todos os terminais foram fechados!');
  });
  context.subscriptions.push(killDisposable);
}

export function deactivate() {}
