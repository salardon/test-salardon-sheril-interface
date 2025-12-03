import React from 'react';
import { SystemeJoueur } from '../../types';
import { useReport } from '../../context/ReportContext';

interface PopulationCellProps {
  system: SystemeJoueur;
}

const PopulationCell: React.FC<PopulationCellProps> = ({ system }) => {
  const { global } = useReport();
  const fPop = (system.popAct ?? 0) + (system.popAug ?? 0);

  const majorRaceId = Object.keys(system.racePop ?? {}).length > 0
    ? parseInt(Object.keys(system.racePop).reduce((a, b) => system.racePop[a as any] > system.racePop[b as any] ? a : b))
    : -1;
  const majorRaceColor = global?.races.find(r => r.id === majorRaceId)?.couleur ?? 'inherit';

  const fRacePop = { ...system.racePop };
  for (const raceId in system.racePopAug) {
    fRacePop[raceId as any] = (fRacePop[raceId as any] ?? 0) + (system.racePopAug[raceId as any] ?? 0);
  }
  const fMajorRaceId = Object.keys(fRacePop).length > 0
    ? parseInt(Object.keys(fRacePop).reduce((a, b) => fRacePop[a as any] > fRacePop[b as any] ? a : b))
    : -1;
  const fMajorRaceColor = global?.races.find(r => r.id === fMajorRaceId)?.couleur ?? 'inherit';

  return (
    <td style={{ textAlign: 'right' }}>
      <span style={{ color: majorRaceColor }}>
        {system.popAct ?? '—'}
      </span>
      /{system.popMax ?? '—'}
      <span style={{ color: fMajorRaceColor }}>
        &nbsp;[{fPop.toFixed(0)}]
      </span>
    </td>
  );
};

export default PopulationCell;
