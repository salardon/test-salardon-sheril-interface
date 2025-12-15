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

  // Cell style is now simpler, no conditional background
  const cellStyle: React.CSSProperties = {
    textAlign: 'right',
    whiteSpace: 'nowrap',
  };

  // Style for the 'nb' (stock) value
  const nbStyle: React.CSSProperties = {
    color: num >= 100 ? '#4fc3f7' : num > 0 ? '#4fc3f7' : 'inherit',
    fontWeight: num >= 100 ? 'bold' : 'normal',
  };

  // Style for the 'prod' (production) value
  const prodStyle: React.CSSProperties = {
    color: num > 0 ? (prod >= 100 ? '#81d4fa' : '#b3e5fc') : 'inherit',
  };

  // Style for the 'total' value
  const totalStyle: React.CSSProperties = {
    color: num >= 100 ? 'inherit' : 'inherit',
    fontWeight: num >= 100 ? 'bold' : 'normal',
  };

  // When num is 0, use the 'zero-value' class for default styling
  if (num === 0) {
    return (
      <td key={marchandise.code} style={cellStyle} className="zero-value">
        {num} (+{prod}) [{total}]
      </td>
    );
  }

  // Render for non-zero values
  return (
    <td key={marchandise.code} style={cellStyle}>
      <span style={nbStyle}>{num}</span>
      <span style={prodStyle}> (+{prod})</span>
      <span style={totalStyle}> [{total}]</span>
    </td>
  );
};

export default MarchandiseCell;
