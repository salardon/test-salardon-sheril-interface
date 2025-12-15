import React from 'react';
import { Marchandise, MarchandiseData } from '../../types';

interface MarchandiseCellProps {
  marchandise: Marchandise;
  marchandiseData?: MarchandiseData;
  contributingBuildings?: { techCode: string; count: number }[];
}

const MarchandiseCell: React.FC<MarchandiseCellProps> = ({ marchandise, marchandiseData, contributingBuildings }) => {
  const num = marchandiseData?.num ?? 0;
  const prod = marchandiseData?.prod ?? 0;
  const total = num + prod;

  const renderContributingBuildings = () => {
    if (!contributingBuildings || contributingBuildings.length === 0) {
      return null;
    }

    const buildingsHtml = contributingBuildings
      .map(b => `${b.count} ${b.techCode}`)
      .join('<br/>');

    return (
      <div
        className="contributing-buildings"
        dangerouslySetInnerHTML={{ __html: buildingsHtml }}
      />
    );
  };

  // Cell style is now simpler, no conditional background
  const cellStyle: React.CSSProperties = {
    textAlign: 'right',
    whiteSpace: 'nowrap',
  };

  // Style for the 'nb' (stock) value
  const nbStyle: React.CSSProperties = {
    color: num >= 100 ? '#1a1a1a' : num > 0 ? '#4fc3f7' : 'inherit',
    textDecoration: num >= 100 ? 'underline' : 'none',
  };

  // Style for the 'prod' (production) value
  const prodStyle: React.CSSProperties = {
    color: num > 0 ? (prod >= 100 ? '#81d4fa' : '#b3e5fc') : 'inherit',
  };

  // Style for the 'total' value
  const totalStyle: React.CSSProperties = {
    color: num >= 100 ? '#1a1a1a' : 'inherit',
  };

  // When num is 0, use the 'zero-value' class for default styling
  if (num === 0 && prod === 0) {
    return (
      <td key={marchandise.code} style={cellStyle} className="zero-value">
        {num} (+{prod}) [{total}]
        {renderContributingBuildings()}
      </td>
    );
  }

  // Render for non-zero values
  return (
    <td key={marchandise.code} style={cellStyle}>
      <div>
        <span style={nbStyle}>{num}</span>
        <span style={prodStyle}> (+{prod})</span>
        <span style={totalStyle}> [{total}]</span>
      </div>
      {renderContributingBuildings()}
    </td>
  );
};

export default MarchandiseCell;
