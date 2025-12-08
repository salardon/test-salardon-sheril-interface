import React from 'react';
import { SystemeJoueur } from '../../types';

interface MineraiCellProps {
  system: SystemeJoueur;
}

const MineraiCell: React.FC<MineraiCellProps> = ({ system }) => {
  const stock = system.stockmin ?? 0;
  const minprod = system.revenumin ?? 0;
  const fprod = stock + minprod;

  const stockStyle: React.CSSProperties = {
    color: stock > 0 && stock < 100 ? '#4fc3f7' : 'inherit',
  };

  const minprodStyle: React.CSSProperties = {
    color: stock > 0 && stock < 100 ? (minprod >= 100 ? '#81d4fa' : '#b3e5fc') : 'inherit',
  };

  const fprodStyle: React.CSSProperties = {
    color: stock > 0 && stock < 100 ? '#4fc3f7' : 'inherit',
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
