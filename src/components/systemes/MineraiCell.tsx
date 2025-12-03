import React from 'react';
import { SystemeJoueur } from '../../types';

interface MineraiCellProps {
  system: SystemeJoueur;
}

const MineraiCell: React.FC<MineraiCellProps> = ({ system }) => {
  const fMin = (system.stockmin ?? 0) + (system.revenumin ?? 0);

  return (
    <td style={{ textAlign: 'right' }}>
      <span style={{ color: system.stockmin > 1000 ? 'green' : system.stockmin > 0 ? 'blue' : 'inherit' }}>
        {system.stockmin ?? '—'}
      </span>
      &nbsp;(+{system.revenumin ?? '—'})
      <span style={{ color: fMin < 0 ? 'red' : 'inherit' }}>
        &nbsp;[{fMin}]
      </span>
    </td>
  );
};

export default MineraiCell;
