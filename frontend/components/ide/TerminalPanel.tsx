import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import 'xterm/css/xterm.css';

const TerminalPanel = ({ workspaceId = 'default', onClose, onMaximize, logs = [] }: { workspaceId?: string; onClose?: () => void; onMaximize?: () => void; logs?: string[] }) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);

    // Initialize Terminal
    useEffect(() => {
        if (!terminalRef.current) return;

        const term = new Terminal({
            cursorBlink: true,
            fontSize: 13,
            fontFamily: 'Consolas, monospace',
            theme: {
                background: '#1e1e1e',
                foreground: '#cccccc',
                black: '#000000',
                red: '#cd3131',
                green: '#0dbc79',
                yellow: '#e5e510',
                blue: '#2472c8',
                magenta: '#bc3fbc',
                cyan: '#11a8cd',
                white: '#e5e5e5',
            }
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // Connect to Realtime Layer (Socket.io)
        let unsubscribe: (() => void) | undefined;
        
        const initSocket = async () => {
            const { realtimeService } = await import('../../services/infra/realtime-service');
            
            realtimeService.send({ 
                type: "TERMINAL_JOIN", 
                workspaceId 
            });

            unsubscribe = realtimeService.subscribe((event) => {
                if (event.type === 'TERMINAL_OUTPUT') {
                    term.write(event.data);
                }
                if (event.type === 'CONNECTION_OPEN') {
                    term.write('\r\n\x1b[34m[Client] Realtime Layer Re-synchronized.\x1b[0m\r\n');
                }
            });

            // Terminal -> Realtime
            term.onData((data) => {
                realtimeService.send({
                    type: "TERMINAL_INPUT",
                    data
                });
            });
        };

        initSocket().catch(err => {
            term.write(`\r\n\x1b[31m[Client] Socket.io Init Failed: ${err.message}\x1b[0m\r\n`);
        });

        // Handle Resize
        const handleResize = () => fitAddon.fit();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            term.dispose();
            if (unsubscribe) unsubscribe();
        };
    }, [workspaceId]);

    // Write logs to terminal when prop changes
    useEffect(() => {
        if (!xtermRef.current || !logs.length) return;
        // Just write the latest log entry for simulation
        const lastLog = logs[logs.length - 1];
        if (lastLog) {
            xtermRef.current.write('\r\n' + lastLog.replace(/\n/g, '\r\n') + '\r\n');
        }
    }, [logs]);

    // Fit on mount/active
    useEffect(() => {
        setTimeout(() => fitAddonRef.current?.fit(), 100);
    }, []);

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e] border-t border-[#1E232E] font-mono text-sm group">
            <div className="flex items-center justify-between px-4 border-b border-[#1E232E] h-[30px] shrink-0 bg-[#1e1e1e]">
                <span className="text-[11px] font-bold text-white">TERMINAL (THE FORGE)</span>
                <div className="flex items-center gap-2">
                    <button onClick={onMaximize} className="text-[#cccccc] hover:text-white p-0.5" title="Toggle Maximize">
                        <span className="material-symbols-outlined !text-[16px]">keyboard_arrow_up</span>
                    </button>
                    <button onClick={onClose} className="text-[#cccccc] hover:text-white p-0.5" title="Close Panel">
                        <span className="material-symbols-outlined !text-[16px]">close</span>
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-hidden p-2" ref={terminalRef} />
        </div>
    );
};

export default TerminalPanel;


