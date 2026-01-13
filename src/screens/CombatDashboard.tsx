import React from 'react';
import { useParams } from 'react-router-dom';
import { useReport } from '../context/ReportContext';
import CombatHeatmap from '../components/CombatHeatmap';

export default function CombatDashboard() {
    // 1. Get the log ID from the URL (/combat/:logId)
    const { logId } = useParams<{ logId: string }>();
    const { combatLogs } = useReport();

    // 2. Find the specific battle data
    const currentLog = combatLogs.find(l => l.id === logId);

    // 3. Handle the case where the log hasn't been uploaded yet
    if (!currentLog) {
        return (
            <div style={{ padding: '40px', color: '#ff8b8b', textAlign: 'center' }}>
                <h2>Log Not Found</h2>
                <p>Please upload the .log file using the "⚔️ Log" button in the header.</p>
            </div>
        );
    }

    return (
        <div className="combat-dashboard-screen" style={{ flex: 1, overflowY: 'auto', background: '#121212' }}>
            <div style={{ padding: '10px 20px', borderBottom: '1px solid #333' }}>
                <h1 style={{ color: 'white', margin: 0 }}>{currentLog.battleName}</h1>
                <small style={{ color: '#888' }}>File: {currentLog.id}</small>
            </div>
            
            {/* 4. Render the Heatmap component inside the dashboard */}
            <CombatHeatmap log={currentLog} />
        </div>
    );
}
