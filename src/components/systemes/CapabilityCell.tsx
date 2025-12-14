import React from 'react';

interface Capability {
    techCode: string;
    count: number;
}

interface CapabilityCellProps {
    value: number | string;
    contributingBuildings: Capability[];
}

const CapabilityCell: React.FC<CapabilityCellProps> = ({ value, contributingBuildings }) => {
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

    return (
        <td className={value === 0 ? 'zero-value' : ''}>
            {value}
            {renderContributingBuildings()}
        </td>
    );
};

export default CapabilityCell;
