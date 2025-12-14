import React from 'react';
import { Marchandise, MarchandiseData } from '../../types';

interface AggregatedMarchandiseCellProps {
  marchandises: {
    marchandise?: Marchandise;
    marchandiseData?: MarchandiseData;
  }[];
}

const symbolMap: { [key: string]: string } = {
  "unité énergétique": "⚡",
  "composants électroniques": "💡",
  "systèmes de guidage": "🛰️",
  "armement et explosifs": "💥",
  "logiciels": "💻",
  "robots": "🤖",
  "pièces industrielles": "⚙️",
  "produits alimentaires": "🍔",
  "médicaments": "💊",
  "articles de luxe": "💎",
  "métaux précieux": "💰",
  "holofilms et hololivres": "🎬",
  "oxole": "🧪",
  "tixium": "🔮",
  "lixiam": "✨",
};

const AggregatedMarchandiseCell: React.FC<AggregatedMarchandiseCellProps> = ({ marchandises }) => {
  const cellStyle: React.CSSProperties = {
    textAlign: 'left',
    whiteSpace: 'nowrap',
  };

  return (
    <td style={cellStyle}>
      {marchandises.map(({ marchandise, marchandiseData }, index) => {
        if (!marchandise) {
          return null;
        }

        const num = marchandiseData?.num ?? 0;
        const prod = marchandiseData?.prod ?? 0;
        const total = num + prod;

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

        const symbol = symbolMap[marchandise.nom] || '📦';

        return (
          <div key={marchandise.code || index}>
            {symbol}{' '}
            {num === 0 && prod === 0 ? (
              <span className="zero-value">
                {num} (+{prod}) [{total}]
              </span>
            ) : (
              <>
                <span style={nbStyle}>{num}</span>
                <span style={prodStyle}> (+{prod})</span>
                <span style={totalStyle}> [{total}]</span>
              </>
            )}
          </div>
        );
      })}
    </td>
  );
};

export default AggregatedMarchandiseCell;
