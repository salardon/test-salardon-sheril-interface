import React from 'react';
import { Marchandise, SystemeJoueur } from '../../types';

interface GroupedMarchandiseCellProps {
  system: SystemeJoueur;
  marchandiseNames: string[];
  marchandiseDefs: Marchandise[];
}

const iconMap: { [key: string]: string } = {
  "unité énergétique": '⚡',
  "composants électroniques": '🔌',
  "systèmes de guidage": '🎯',
  "armement et explosifs": '💣',
  "logiciels": '💻',
  "robots": '🤖',
  "pièces industrielles": '⚙️',
  "produits alimentaires": '🍎',
  "médicaments": '💊',
  "articles de luxe": '💎',
  "métaux précieux": '🪙',
  "holofilms et hololivres": '🎥',
  "oxole": '🧪',
  "tixium": '🧪',
  "lixiam": '🧪',
};

const GroupedMarchandiseCell: React.FC<GroupedMarchandiseCellProps> = ({ system, marchandiseNames, marchandiseDefs }) => {
  const cellStyle: React.CSSProperties = {
    textAlign: 'left',
    whiteSpace: 'nowrap',
  };

  return (
    <td style={cellStyle}>
      {marchandiseNames.map(name => {
        const marchandise = marchandiseDefs.find(m => m.nom === name);
        if (!marchandise) {
          return <div key={name}><em>{name} not found</em></div>;
        }

        const marchandiseData = system.marchandises?.find(m => m.code === marchandise.code);
        const num = marchandiseData?.num ?? 0;
        const prod = marchandiseData?.prod ?? 0;
        const total = num + prod;
        const icon = iconMap[name] || '📦';

        // Styles from MarchandiseCell
        const nbStyle: React.CSSProperties = {
            color: num >= 100 ? '#1a1a1a' : num > 0 ? '#4fc3f7' : 'inherit',
            textDecoration: num >= 100 ? 'underline' : 'none',
        };
        const prodStyle: React.CSSProperties = {
            color: num > 0 ? (prod >= 100 ? '#81d4fa' : '#b3e5fc') : 'inherit',
        };
        const totalStyle: React.CSSProperties = {
            color: num >= 100 ? '#1a1a1a' : 'inherit',
        };

        const line = (
            <>
                <span style={nbStyle}>{num}</span>
                <span style={prodStyle}> (+{prod})</span>
                <span style={totalStyle}> [{total}]</span>
            </>
        );

        return (
          <div key={name} className={num === 0 ? 'zero-value' : ''}>
            {icon} {name}: {line}
          </div>
        );
      })}
    </td>
  );
};

export default GroupedMarchandiseCell;
