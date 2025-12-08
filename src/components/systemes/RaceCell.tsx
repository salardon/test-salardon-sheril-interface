import React from 'react';
import { SystemeJoueur } from '../../types';

interface RaceCellProps {
  system: SystemeJoueur;
}

const raceColorMap: { [key: string]: string } = {
  "Fremens": "#CC00FF",
  "Atalantes": "#0066CC",
  "Zwaias": "#FFCC00",
  "Yoksors": "#CC0033",
  "Fergoks": "#009933",
  "Cyborgs": "#777777",
};

const RaceCell: React.FC<RaceCellProps> = ({ system }) => {
  const race = system.race ?? '—';
  const color = raceColorMap[race] || 'inherit';

  return (
    <td style={{ color }}>
      {race}
    </td>
  );
};

export default RaceCell;
