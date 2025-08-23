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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
function activate(context) {
    const configPath = path.join(vscode.workspace.rootPath || '', 'dev-help-config.json');
    const closeCommandMap = {};
    const createdTerminalsMap = {};
    const createdTerminalPids = {};
    let loadedConfig = null;
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
        }
        catch (error) {
            vscode.window.showErrorMessage('Erro ao ler ou parsear o arquivo dev-help-config.json!');
            return;
        }
        if (!Array.isArray(config.terminals)) {
            vscode.window.showErrorMessage('Configuração inválida: "terminals" deve ser uma lista no dev-help-config.json!');
            return;
        }
        config.terminals.forEach((terminalConfig) => {
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
                if (terminal.name) {
                    createdTerminalPids[terminal.name] = pid;
                }
            }, () => { });
            closeCommandMap[name] = closeCommand;
            createdTerminalsMap[name] = terminal;
            closeCommandMap[terminal.name] = closeCommand;
        });
    });
    let killDisposable = vscode.commands.registerCommand('dev-helper.killAllTerminals', () => {
        if (loadedConfig && Array.isArray(loadedConfig.terminals)) {
            const killer = vscode.window.createTerminal({ name: 'dev-helper-killer', cwd: vscode.workspace.rootPath || undefined });
            loadedConfig.terminals.forEach((tc) => {
                const closeCmd = tc.closeCommand || closeCommandMap[tc.name];
                if (closeCmd) {
                    killer.sendText(closeCmd);
                }
            });
            loadedConfig.terminals.forEach((tc) => {
                const created = createdTerminalsMap[tc.name];
                if (created && !tc.keepOpen) {
                    try {
                        created.sendText('exit');
                    }
                    catch (e) { }
                    try {
                        created.dispose();
                    }
                    catch (e) { }
                }
            });
            killer.sendText('exit');
            killer.dispose();
            const pidLines = Object.keys(createdTerminalPids).map(k => `${k}: ${createdTerminalPids[k]}`);
            vscode.window.showInformationMessage('Dev Helper: comandos de encerramento enviados. Terminais criados (pids): ' + pidLines.join('; '));
        }
        else {
            vscode.window.terminals.forEach(terminal => {
                try {
                    terminal.sendText('exit');
                }
                catch (e) { }
                try {
                    terminal.dispose();
                }
                catch (e) { }
            });
        }
        vscode.window.showInformationMessage('Comandos para encerrar processos dos terminais enviados (closeCommand executado pelo killer)!');
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
function deactivate() {
    // Função vazia para desativação da extensão
}
//# sourceMappingURL=extension.js.map