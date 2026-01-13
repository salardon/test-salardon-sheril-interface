import React from 'react';
import { useParams } from 'react-router-dom';
import { useReport } from '../context/ReportContext';
import CombatHeatmap from './CombatHeatmap';

export default function CombatHeatmapScreen() {
    const { id } = useParams<{ id: string }>();
    const { combatLogs } = useReport();
    const log = combatLogs.find(l => l.id === id);

    if (!log) {
        return <div>Combat log not found</div>;
    }

    return <CombatHeatmap log={log} />;
}
