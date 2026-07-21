'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, type SimulationNodeDatum } from 'd3-force';
import { RELATION_LABELS, RELATION_TYPES, type RelationType } from '@/lib/enums';

interface GraphNode {
  id: string;
  title: string;
  sourceType: string;
  type: string;
  createdAt: string;
}

interface GraphEdge {
  id: string;
  fromEntryId: string;
  toEntryId: string;
  relationType: string;
}

const RELATION_COLOR: Record<RelationType, string> = {
  reminds_me_of: '#8a5a44',
  supports: '#5c6f57',
  contradicts: '#b3453f',
  exemplifies: '#5b7a9d',
};

const WIDTH = 900;
const HEIGHT = 560;

type SimNode = SimulationNodeDatum & GraphNode;

export default function GraphView({ nodes, edges, focusId }: { nodes: GraphNode[]; edges: GraphEdge[]; focusId?: string }) {
  const sourceTypes = useMemo(() => Array.from(new Set(nodes.map((n) => n.sourceType))), [nodes]);
  const [relationFilter, setRelationFilter] = useState<Set<RelationType>>(new Set(RELATION_TYPES));
  const [sourceFilter, setSourceFilter] = useState<Set<string>>(new Set(sourceTypes));
  const [selected, setSelected] = useState<string | null>(focusId || null);

  const visibleNodeIds = useMemo(
    () => new Set(nodes.filter((n) => n.type === 'principle' || sourceFilter.has(n.sourceType)).map((n) => n.id)),
    [nodes, sourceFilter]
  );

  const visibleEdges = useMemo(
    () =>
      edges.filter(
        (e) =>
          relationFilter.has(e.relationType as RelationType) &&
          visibleNodeIds.has(e.fromEntryId) &&
          visibleNodeIds.has(e.toEntryId)
      ),
    [edges, relationFilter, visibleNodeIds]
  );

  const layout = useMemo(() => {
    const simNodes: SimNode[] = nodes.map((n) => ({ ...n }));
    const simLinks = visibleEdges.map((e) => ({ source: e.fromEntryId, target: e.toEntryId }));

    const sim = forceSimulation(simNodes)
      .force('charge', forceManyBody().strength(-180))
      .force('link', forceLink(simLinks).id((d: SimulationNodeDatum & { id?: string }) => d.id ?? '').distance(90))
      .force('center', forceCenter(WIDTH / 2, HEIGHT / 2))
      .force('collide', forceCollide(34))
      .stop();

    for (let i = 0; i < 300; i++) sim.tick();

    const positions = new Map<string, { x: number; y: number }>();
    for (const n of simNodes) positions.set(n.id, { x: n.x ?? WIDTH / 2, y: n.y ?? HEIGHT / 2 });
    return positions;
  }, [nodes, visibleEdges]);

  function toggleRelation(r: RelationType) {
    const next = new Set(relationFilter);
    next.has(r) ? next.delete(r) : next.add(r);
    setRelationFilter(next);
  }
  function toggleSource(s: string) {
    const next = new Set(sourceFilter);
    next.has(s) ? next.delete(s) : next.add(s);
    setSourceFilter(next);
  }

  const selectedNode = nodes.find((n) => n.id === selected);

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-wrap gap-6">
        <div>
          <p className="label mb-1">Relation type</p>
          <div className="flex flex-wrap gap-2">
            {RELATION_TYPES.map((r) => (
              <button
                key={r}
                onClick={() => toggleRelation(r)}
                className={`chip border ${relationFilter.has(r) ? 'text-white' : 'text-ink/40 bg-transparent border-ink/15'}`}
                style={relationFilter.has(r) ? { backgroundColor: RELATION_COLOR[r], borderColor: RELATION_COLOR[r] } : undefined}
              >
                {RELATION_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
        {sourceTypes.length > 0 && (
          <div>
            <p className="label mb-1">Source</p>
            <div className="flex flex-wrap gap-2">
              {sourceTypes.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSource(s)}
                  className={`chip border ${sourceFilter.has(s) ? 'bg-ink text-paper border-ink' : 'text-ink/40 border-ink/15'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {nodes.length === 0 ? (
        <div className="card p-10 text-center text-ink/50">No entries yet — the graph fills in as you write.</div>
      ) : (
        <div className="card p-2 overflow-auto">
          <svg width={WIDTH} height={HEIGHT}>
            {visibleEdges.map((e) => {
              const a = layout.get(e.fromEntryId);
              const b = layout.get(e.toEntryId);
              if (!a || !b) return null;
              return (
                <line
                  key={e.id}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={RELATION_COLOR[e.relationType as RelationType]}
                  strokeWidth={1.5}
                  opacity={0.5}
                />
              );
            })}
            {nodes.filter((n) => visibleNodeIds.has(n.id)).map((n) => {
              const p = layout.get(n.id);
              if (!p) return null;
              const isPrinciple = n.type === 'principle';
              const isSelected = n.id === selected;
              return (
                <g key={n.id} transform={`translate(${p.x},${p.y})`} className="cursor-pointer" onClick={() => setSelected(n.id)}>
                  <circle
                    r={isPrinciple ? 12 : 8}
                    fill={isPrinciple ? '#5c6f57' : '#8a5a44'}
                    opacity={isSelected ? 1 : 0.75}
                    stroke={isSelected ? '#1f1b16' : 'none'}
                    strokeWidth={2}
                  />
                  <text x={12} y={4} fontSize={11} fill="#1f1b16" opacity={0.8}>
                    {n.title.length > 24 ? n.title.slice(0, 24) + '…' : n.title}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {selectedNode && (
        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-ink/40">{selectedNode.type === 'principle' ? 'Principle' : selectedNode.sourceType}</p>
            <p className="font-medium">{selectedNode.title}</p>
          </div>
          <Link href={`/entry/${selectedNode.id}`} className="btn-secondary text-sm">
            Open entry →
          </Link>
        </div>
      )}
    </div>
  );
}
