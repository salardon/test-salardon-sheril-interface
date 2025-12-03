import React from 'react';
import { Marchandise, MarchandiseData } from '../../types';

interface MarchandiseCellProps {
  marchandise: Marchandise;
  marchandiseData?: MarchandiseData;
}

const MarchandiseCell: React.FC<MarchandiseCellProps> = ({ marchandise, marchandiseData }) => {
  const num = marchandiseData?.num ?? 0;
  const prod = marchandiseData?.prod ?? 0;
  const fstock = num + prod;

  return (
    <td key={marchandise.code} style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
      <span style={{ color: num >= 100 ? 'green' : num > 0 ? 'blue' : 'inherit' }}>
        {num}
      </span>
      <span style={{ color: prod > 0 ? 'green' : 'inherit' }}>
        &nbsp;(+{prod})
      </span>
      <span style={{ color: fstock < 0 ? 'red' : 'inherit' }}>
        &nbsp;= [{fstock}]
      </span>
    </td>
  );
};

export default MarchandiseCell;
