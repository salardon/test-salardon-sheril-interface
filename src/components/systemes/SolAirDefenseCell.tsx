import React from 'react';

interface Building {
  techCode: string;
  count: number;
}

interface SolAirDefenseCellProps {
  buildings: Building[];
}

const SolAirDefenseCell: React.FC<SolAirDefenseCellProps> = ({ buildings }) => {
  if (!buildings || buildings.length === 0) {
    return <td></td>;
  }

  return (
    <td>
      {buildings.map((building) => (
        <div key={building.techCode}>
          {`${building.count} ${building.techCode}`}
        </div>
      ))}
    </td>
  );
};

export default SolAirDefenseCell;
