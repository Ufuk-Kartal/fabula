import React from 'react';
import { SentenceStatus, StoryBranch } from '../types';
import { TreeNode } from './UniverseMap';

interface MapNodeProps {
    node: TreeNode;
    x: number;
    y: number;
    width: number;
    height: number;
    branches: StoryBranch[];
    activePath: Set<string>;
    onNavigate: (branchId: string) => void;
}

export const MapNode: React.FC<MapNodeProps> = ({ node, x, y, width, height, branches, activePath, onNavigate }) => {
    const { sentence } = node;
    const isApproved = sentence.durum === SentenceStatus.APPROVED;
    const onActivePath = activePath.has(sentence.cumle_id);
    const isGenesis = !sentence.ebeveyn_cumle_id;

    const associatedBranch = branches.find(b => b.kaynak_cumle_id === sentence.cumle_id);

    const handleNodeClick = () => {
        if (associatedBranch) {
            onNavigate(associatedBranch.dal_id);
        }
    };
    
    let strokeColor = '#4b5563'; // gray-600
    let textColor = 'text-gray-400';
    let filter = '';
    
    if (onActivePath) {
        strokeColor = '#818cf8'; // indigo-400
        textColor = 'text-white';
        filter = 'url(#glow)';
    } else if (isApproved) {
        strokeColor = '#16a34a'; // green-600
        textColor = 'text-green-300';
    }
    
    if (isGenesis) {
         strokeColor = '#a855f7'; // purple-500
    }

    const canNavigate = !!associatedBranch;

    return (
        <g 
            transform={`translate(${x}, ${y})`} 
            onClick={handleNodeClick} 
            className={`${canNavigate ? 'cursor-pointer' : 'cursor-default'} transition-transform duration-200 hover:scale-105`}
            style={{ filter }}
        >
            <rect 
                width={width}
                height={height}
                rx="8"
                ry="8"
                fill="#1f2937" 
                stroke={strokeColor}
                strokeWidth="2"
            />
            <foreignObject x="5" y="5" width={width - 10} height={height - 10}>
                 {/* FIX: Removed the 'xmlns' attribute which was causing a TypeScript error. React automatically handles namespacing for children of <foreignObject>. */}
                 <div 
                    className={`w-full h-full p-2 text-xs flex items-center justify-center text-center leading-tight ${textColor}`}
                    style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                    <p>{sentence.metin}</p>
                 </div>
            </foreignObject>
        </g>
    );
};
