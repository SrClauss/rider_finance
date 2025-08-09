"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
function activate(context) {
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
function deactivate() { }
//# sourceMappingURL=extension.js.map