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

  const aggregated = buildings.reduce((acc, building) => {
    acc[building.techCode] = (acc[building.techCode] || 0) + building.count;
    return acc;
  }, {} as Record<string, number>);

  const groupedBuildings = Object.entries(aggregated)
    .map(([techCode, count]) => ({ techCode, count }))
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.techCode.localeCompare(b.techCode);
    });

  return (
    <td>
      {groupedBuildings.map((building, index) => (
        <React.Fragment key={building.techCode}>
          {`${building.count} ${building.techCode}`}
          {index < groupedBuildings.length - 1 && <br />}
        </React.Fragment>
      ))}
    </td>
  );
};

export default SolAirDefenseCell;
