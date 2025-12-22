import React, {createContext, useContext, useEffect, useMemo, useState, useCallback} from 'react';
import {GlobalData, Rapport} from '../types';
import {parseRapportXml} from '../parsers/parseRapport';
import {parseDataXml} from '../parsers/parseData';
import { XY } from '../types';

type ReportContextType = {
    rapport?: Rapport;
    global?: GlobalData;
    loadRapportFile: (file: File) => Promise<void>;
    ready: boolean;
    center: XY | undefined;
    setCenter: (xy: XY) => void;
};

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export function ReportProvider({children}: { children: React.ReactNode }) {
    const [rapport, setRapport] = useState<Rapport | undefined>(undefined);
    const [global, setGlobal] = useState<GlobalData | undefined>(undefined);
    const [center, setCenter] = useState<XY | undefined>(undefined);

    const parseAndSetRapport = useCallback((xmlText: string, globalData: GlobalData) => {
        const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
        const r = parseRapportXml(doc, globalData);
        setRapport(r);
        if (!center && r.joueur.capitale) {
            const [_, x, y] = r.joueur.capitale.split('_').map(Number);
            setCenter({ x, y });
        }
    }, [center]);

    const loadRapportFile = useCallback(async (file: File) => {
        if (!global) return;
        const text = await file.text();
        parseAndSetRapport(text, global);
        try {
            localStorage.setItem('rapportXml', text);
        } catch {}
    }, [global, parseAndSetRapport]);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const txt = await fetch('/examples/data.xml').then(r => r.text());
                if (!alive) return;
                const data = parseDataXml(txt);
                setGlobal(data);

                const style = document.createElement("style");
                style.innerHTML = data.races
                    .map(r => `.race${r.id} { color: ${r.couleur}; }`)
                    .join("\n");
                document.head.appendChild(style);

            } catch(e) {
                console.error("Failed to load or parse data.xml", e);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    useEffect(() => {
        if (global) {
            try {
                const stored = localStorage.getItem('rapportXml');
                if (stored) {
                    parseAndSetRapport(stored, global);
                }
            } catch {}
        }
    }, [global, parseAndSetRapport]);

    const value = useMemo<ReportContextType>(() => ({
        rapport,
        global,
        loadRapportFile,
        ready: Boolean(rapport && global),
        center,
        setCenter,
    }), [rapport, global, loadRapportFile, center]);

    return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>;
}

export function useReport() {
    const ctx = useContext(ReportContext);
    if (!ctx) throw new Error('useReport must be used within ReportProvider');
    return ctx;
}
