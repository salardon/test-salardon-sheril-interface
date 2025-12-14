import React from 'react';
import { Marchandise, SystemeJoueur, SystemeDetecte, MarchandiseData } from '../../types';
import './GroupedMarchandiseCell.css';
import { unicodeMap } from '../../utils/unicode';

interface GroupedMarchandiseCellProps {
  system: SystemeJoueur | SystemeDetecte;
  marchandises: Marchandise[];
}

const GroupedMarchandiseCell: React.FC<GroupedMarchandiseCellProps> = ({ system, marchandises }) => {
  return (
    <td className="grouped-marchandise-cell">
      {marchandises.map(marchandise => {
        const marchandiseData = system.marchandises?.find((mar: MarchandiseData) => mar.code === marchandise.code);
        const num = marchandiseData?.num ?? 0;
        const prod = marchandiseData?.prod ?? 0;
        const total = num + prod;

        const symbol = unicodeMap[marchandise.code] || '❓';

        if (num === 0) {
            return (
                <div key={marchandise.code} title={marchandise.nom} className="zero-value">
                    {symbol} {num} (+{prod}) [{total}]
                </div>
            );
        }

        return (
          <div key={marchandise.code} title={marchandise.nom}>
            {symbol}{' '}
            <span className={num >= 100 ? 'marchandise-num-high' : 'marchandise-num'}>{num}</span>
            <span className={prod >= 100 ? 'marchandise-prod-high' : 'marchandise-prod'}> (+{prod})</span>
            <span className={num >= 100 ? 'marchandise-total-high' : ''}> [{total}]</span>
          </div>
        );
      })}
    </td>
  );
};

export default GroupedMarchandiseCell;
