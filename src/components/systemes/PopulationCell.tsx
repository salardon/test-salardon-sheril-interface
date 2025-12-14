import React from 'react';
import { SystemeJoueur } from '../../types';
import { useReport } from '../../context/ReportContext';

interface PopulationCellProps {
  system: SystemeJoueur;
}

const PopulationCell: React.FC<PopulationCellProps> = ({ system }) => {
  const { global } = useReport();
  const calculatedFPop = (system.popAct ?? 0) * (1 + 0.01 * (system.popAug ?? 0));
  const fPop = system.popMax ? Math.min(calculatedFPop, system.popMax) : calculatedFPop;

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

  const foodStock = system.marchandises?.find(m => m.code === 0)?.num ?? 0;
  const medsStock = system.marchandises?.find(m => m.code === 5)?.num ?? 0;

  let icons = '';
  if (foodStock >= 100) {
    icons += '🍎';
  }
  if (medsStock >= 100) {
    icons += '💊';
  }

  return (
    <td style={{ textAlign: 'right' }}>
      {icons ? `${icons} ` : ''}
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
