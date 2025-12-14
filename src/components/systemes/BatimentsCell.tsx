import React from 'react';

interface Batiment {
  techCode: string;
  count: number;
}

interface Planete {
  batiments?: Batiment[];
}

interface System {
  planetes?: Planete[];
}

interface BatimentsCellProps {
  system: System;
}

const BatimentsCell: React.FC<BatimentsCellProps> = ({ system }) => {
  const batiments = system.planetes?.flatMap(p => p.batiments || []) || [];

  if (batiments.length === 0) {
    return <td></td>;
  }

  const sortedBatiments = [...batiments].sort((a, b) => b.count - a.count);

  return (
    <td style={{ fontSize: '0.8em', color: '#666' }}>
      {sortedBatiments.map((batiment, index) => (
        <React.Fragment key={batiment.techCode}>
          {`${batiment.count} ${batiment.techCode}`}
          {index < sortedBatiments.length - 1 && <br />}
        </React.Fragment>
      ))}
    </td>
  );
};

export default BatimentsCell;
