import React, { useMemo, useState, useRef } from 'react';
import { Sentence, StoryBranch } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { MapNode } from './MapNode';
import { PlusIcon } from './icons/PlusIcon';
import { MinusIcon } from './icons/MinusIcon';


export interface TreeNode {
    sentence: Sentence;
    children: TreeNode[];
}

interface PositionedNode {
    x: number;
    y: number;
    node: TreeNode;
}

interface Connector {
    id: string;
    d: string;
    isActive: boolean;
}

interface UniverseMapProps {
    sentences: Sentence[];
    branches: StoryBranch[];
    activeBranchId: string;
    onNavigateToBranch: (branchId: string) => void;
    onClose: () => void;
}

const NODE_WIDTH = 220;
const NODE_HEIGHT = 70;
const X_SPACING = 300;
const Y_SPACING = 120;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2;

export const UniverseMap: React.FC<UniverseMapProps> = ({ sentences, branches, activeBranchId, onNavigateToBranch, onClose }) => {
    const [transform, setTransform] = useState({ x: 50, y: 200, k: 0.8 });
    const [isDragging, setIsDragging] = useState(false);
    const lastMousePosition = useRef({ x: 0, y: 0 });
    const svgRef = useRef<SVGSVGElement>(null);

    const storyTree = useMemo(() => {
        const sentenceMap = new Map<string, Sentence>(sentences.map(s => [s.cumle_id, s]));
        const childrenMap = new Map<string | null, Sentence[]>();

        for (const sentence of sentences) {
            const parentId = sentence.ebeveyn_cumle_id;
            if (!childrenMap.has(parentId)) {
                childrenMap.set(parentId, []);
            }
            childrenMap.get(parentId)!.push(sentence);
        }
        
        const buildTree = (sentence: Sentence): TreeNode => ({
            sentence,
            children: (childrenMap.get(sentence.cumle_id) || []).map(buildTree),
        });
        
        const rootSentences = childrenMap.get(null) || [];
        return rootSentences.map(buildTree);
    }, [sentences]);

    const activePathSet = useMemo(() => {
        const path = new Set<string>();
        const activeBranch = branches.find(b => b.dal_id === activeBranchId);
        if (!activeBranch) return path;

        let currentSentence = sentences.find(s => s.cumle_id === activeBranch.kaynak_cumle_id);
        while (currentSentence) {
            path.add(currentSentence.cumle_id);
            currentSentence = sentences.find(s => s.cumle_id === currentSentence!.ebeveyn_cumle_id);
        }
        return path;
    }, [activeBranchId, branches, sentences]);
    
    const { positionedNodes, connectors, mapDimensions } = useMemo(() => {
        const layout = new Map<string, { x: number; y: number; node: TreeNode }>();
        let yOffset = 0;

        function assignPositions(node: TreeNode, depth = 0): number {
            const x = depth * X_SPACING;

            if (!node.children || node.children.length === 0) {
                const y = yOffset;
                layout.set(node.sentence.cumle_id, { x, y, node });
                yOffset += Y_SPACING;
                return y;
            }

            const childrenMidpoints = node.children.map(child => assignPositions(child, depth + 1));
            const firstChildY = childrenMidpoints[0];
            const lastChildY = childrenMidpoints[childrenMidpoints.length - 1];
            const y = firstChildY + (lastChildY - firstChildY) / 2;

            layout.set(node.sentence.cumle_id, { x, y, node });
            return y;
        }

        storyTree.forEach(root => {
            assignPositions(root)
            yOffset += Y_SPACING * 2; // Add spacing between multiple root trees if any
        });
        
        const nodes = Array.from(layout.values());
        const conns: Connector[] = [];
        let maxX = 0;
        let maxY = 0;

        nodes.forEach(({ node, x, y }) => {
            maxX = Math.max(maxX, x + NODE_WIDTH);
            maxY = Math.max(maxY, y + NODE_HEIGHT);
            if (node.children) {
                node.children.forEach(child => {
                    const childPos = layout.get(child.sentence.cumle_id);
                    if (childPos) {
                        const pathD = `M ${x + NODE_WIDTH} ${y + NODE_HEIGHT / 2} C ${x + NODE_WIDTH + X_SPACING / 2} ${y + NODE_HEIGHT / 2}, ${childPos.x - X_SPACING / 2} ${childPos.y + NODE_HEIGHT / 2}, ${childPos.x} ${childPos.y + NODE_HEIGHT / 2}`;
                        conns.push({
                            id: `${node.sentence.cumle_id}-${child.sentence.cumle_id}`,
                            d: pathD,
                            isActive: activePathSet.has(node.sentence.cumle_id) && activePathSet.has(child.sentence.cumle_id)
                        });
                    }
                });
            }
        });

        return { positionedNodes: nodes, connectors: conns, mapDimensions: { width: maxX, height: maxY } };
    }, [storyTree, activePathSet]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        lastMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - lastMousePosition.current.x;
        const dy = e.clientY - lastMousePosition.current.y;
        lastMousePosition.current = { x: e.clientX, y: e.clientY };
        setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        const newScale = e.deltaY > 0 ? transform.k / zoomFactor : transform.k * zoomFactor;
        
        if (newScale < MIN_ZOOM || newScale > MAX_ZOOM) return;

        const svgBounds = svgRef.current?.getBoundingClientRect();
        if(!svgBounds) return;

        const mouseX = e.clientX - svgBounds.left;
        const mouseY = e.clientY - svgBounds.top;

        const newX = mouseX - (mouseX - transform.x) * (newScale / transform.k);
        const newY = mouseY - (mouseY - transform.y) * (newScale / transform.k);

        setTransform({ x: newX, y: newY, k: newScale });
    };

    const handleZoom = (direction: 'in' | 'out') => {
        const zoomFactor = 1.5;
        const newScale = direction === 'in' ? transform.k * zoomFactor : transform.k / zoomFactor;
        if (newScale < MIN_ZOOM || newScale > MAX_ZOOM) return;

        const svgBounds = svgRef.current?.getBoundingClientRect();
        if(!svgBounds) return;

        const centerX = svgBounds.width / 2;
        const centerY = svgBounds.height / 2;
        
        const newX = centerX - (centerX - transform.x) * (newScale / transform.k);
        const newY = centerY - (centerY - transform.y) * (newScale / transform.k);

        setTransform({ x: newX, y: newY, k: newScale });
    };


    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="w-full h-full max-w-6xl bg-gray-900 border border-indigo-500/30 rounded-lg shadow-2xl shadow-indigo-900/50 flex flex-col relative"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0 z-10">
                    <h2 className="text-xl font-bold text-indigo-300">Evren Haritası</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </header>
                <div className="w-full h-full overflow-hidden cursor-grab" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                    <svg ref={svgRef} className="w-full h-full" onMouseDown={handleMouseDown} onWheel={handleWheel}>
                        <defs>
                            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
                            {connectors.map(conn => (
                                <path 
                                    key={conn.id}
                                    d={conn.d}
                                    stroke={conn.isActive ? '#818cf8' : '#4b5563'}
                                    strokeWidth={conn.isActive ? 3 : 2}
                                    fill="none"
                                    style={{ transition: 'stroke 0.3s' }}
                                />
                            ))}
                            {positionedNodes.map(({ x, y, node }) => (
                                <MapNode 
                                    key={node.sentence.cumle_id}
                                    node={node}
                                    x={x}
                                    y={y}
                                    width={NODE_WIDTH}
                                    height={NODE_HEIGHT}
                                    branches={branches}
                                    activePath={activePathSet}
                                    onNavigate={onNavigateToBranch}
                                />
                            ))}
                        </g>
                    </svg>
                </div>
                 <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
                    <button onClick={() => handleZoom('in')} className="p-2 bg-gray-700/80 rounded-md text-gray-200 hover:bg-gray-600/80 transition disabled:opacity-50" disabled={transform.k >= MAX_ZOOM}>
                        <PlusIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleZoom('out')} className="p-2 bg-gray-700/80 rounded-md text-gray-200 hover:bg-gray-600/80 transition disabled:opacity-50" disabled={transform.k <= MIN_ZOOM}>
                        <MinusIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
