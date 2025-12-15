import React from 'react';
import { SystemeJoueur } from '../../types';

interface MineraiCellProps {
  system: SystemeJoueur;
}

const MineraiCell: React.FC<MineraiCellProps> = ({ system }) => {
  const stock = system.stockmin ?? 0;
  const minprod = system.revenumin ?? 0;
  const fprod = stock + minprod;

  const cellStyle: React.CSSProperties = {
  textAlign: 'right',
  whiteSpace: 'nowrap',
};
  
// Stock styling (same logic as nbStyle)
  const stockStyle: React.CSSProperties = {
    color: stock >= 100 ? '#4fc3f7' : stock > 0 ? '#4fc3f7' : 'inherit',
    fontWeight: stock >= 100 ? 'bold' : 'normal',
  };

  // Production styling (same logic as prodStyle)
  const minprodStyle: React.CSSProperties = {
    color: stock > 0 ? (minprod >= 100 ? '#81d4fa' : '#b3e5fc') : 'inherit',
  };

  // Total styling (same logic as totalStyle)
  const fprodStyle: React.CSSProperties = {
    color: stock >= 100 ? 'inherit' : 'inherit',
    fontWeight: stock >= 100 ? 'bold' : 'normal',
  };


  if (stock === 0) {
    return (
      <td style={{ textAlign: 'right' }} className="zero-value">
        {stock} (+{minprod}) [{fprod}]
      </td>
    );
  }

  return (
    <td style={{ textAlign: 'right' }}>
      <span style={stockStyle}>{stock}</span>
      <span style={minprodStyle}> (+{minprod})</span>
      <span style={fprodStyle}> [{fprod}]</span>
    </td>
  );
};

export default MineraiCell;
