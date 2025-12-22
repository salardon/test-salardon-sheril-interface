import React, {useRef} from 'react';
import {useReport} from '../context/ReportContext';
import {NavLink} from "react-router-dom";

export default function Header() {
    const {rapport, loadRapportFile, setCenter} = useReport();
    const rapportInput = useRef<HTMLInputElement>(null);

    return (<header className="app-header">
        <div>
        </div>
        <button
            className="badge"
            onClick={() => {
                if (rapport?.joueur.capitale) {
                    const [_, x, y] = rapport.joueur.capitale.split('_').map(Number);
                    setCenter({ x, y });
                }
            }}
            title="Centrer sur la capitale"
            style={{cursor: rapport?.joueur.capitale ? 'pointer' : 'not-allowed'}}
        >
            Capitale: {rapport?.joueur.capitale ? rapport.joueur.capitale.replace(/_/g, '-') : '—'}
        </button>
        <nav
            className="app-nav"
            style={{
                display: 'flex', gap: 12, padding: '8px 12px', borderBottom: '1px solid #222', flexWrap: 'wrap',
            }}
        >
            <NavLink to="/flottes" className={({isActive}) => (isActive ? 'active' : '')}>
                Flottes
            </NavLink>
        </nav>
        <div className="header-spacer"/>
        <input
            ref={rapportInput}
            type="file"
            accept=".xml"
            onChange={async (e) => {
                const f = e.currentTarget?.files?.[0];
                const inputEl = rapportInput.current;
                if (f) {
                    await loadRapportFile(f);
                }
                if (inputEl) inputEl.value = '';
            }}
            title="Charger rapport.xml"
        />
    </header>);
}
