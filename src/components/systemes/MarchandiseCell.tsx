import React from 'react';
import { Marchandise, MarchandiseData } from '../../types';

interface MarchandiseCellProps {
  marchandise: Marchandise;
  marchandiseData?: MarchandiseData;
}

const MarchandiseCell: React.FC<MarchandiseCellProps> = ({ marchandise, marchandiseData }) => {
  const num = marchandiseData?.num ?? 0;
  const prod = marchandiseData?.prod ?? 0;
  const total = num + prod;

  const cellStyle: React.CSSProperties = {
    textAlign: 'right',
    whiteSpace: 'nowrap',
    backgroundColor: num >= 100 ? '#dcffdb' : 'transparent',
  };

  const nbStyle: React.CSSProperties = {
    color: num >= 100 ? '#1a1a1a' : num > 0 ? '#4fc3f7' : 'inherit',
  };

  const prodStyle: React.CSSProperties = {
    color: num >= 100 ? (prod >= 100 ? '#2d5016' : '#333333') : num > 0 ? (prod >= 100 ? '#81d4fa' : '#b3e5fc') : 'inherit',
  };

  const totalStyle: React.CSSProperties = {
    color: num >= 100 ? '#1a1a1a' : 'inherit',
  };

  if (num === 0) {
    return (
      <td key={marchandise.code} style={cellStyle} className="zero-value">
        {num} (+{prod}) [{total}]
      </td>
    );
  }

  return (
    <td key={marchandise.code} style={cellStyle}>
      <span style={nbStyle}>{num}</span>
      <span style={prodStyle}> (+{prod})</span>
      <span style={totalStyle}> [{total}]</span>
    </td>
  );
};

export default MarchandiseCell;
