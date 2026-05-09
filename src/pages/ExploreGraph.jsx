import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { graphApi } from '../api/businessApi'
import BusinessGraph3D from '../components/graph/BusinessGraph3D'
import { CategoryBadge, ScoreBadge, TagBadge } from '../components/TagBadge'
import { Loader2, Network, X, Star } from 'lucide-react'
import { useBusiness } from '../context/BusinessContext'

const CATEGORY_COLORS = {
  Manufacturing: '#3B82F6', Logistics: '#F97316', Agriculture: '#22C55E',
  Technology: '#8B5CF6', Retail: '#EC4899', Food: '#EAB308',
  Healthcare: '#14B8A6', Finance: '#64748B',
}

function Legend({ categories }) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map(cat => {
        const color = Object.entries(CATEGORY_COLORS).find(([k]) =>
          cat.toLowerCase().includes(k.toLowerCase())
        )?.[1] || '#94A3B8'
        return (
          <div key={cat} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-border text-xs font-medium text-text-secondary">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            {cat}
          </div>
        )
      })}
    </div>
  )
}

export default function ExploreGraph() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const filter = searchParams.get('filter')
  const { current } = useBusiness()

  const [graphData, setGraphData] = useState({ nodes: [], edges: [] })
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState(null)

  useEffect(() => {
    graphApi.get()
      .then(res => {
        let { nodes, edges } = res.data
        if (filter === 'internal') edges = edges.filter(e => e.type === 'internal')
        if (filter === 'external') edges = edges.filter(e => e.type === 'external')
        setGraphData({ nodes, edges })

        // Auto-select current business node
        if (current?._id) {
          const myNode = nodes.find(n => n.id === current._id.toString())
          if (myNode) setSelectedNode(myNode)
        }
      })
      .finally(() => setLoading(false))
  }, [filter, current?._id])

  const categories = [...new Set(graphData.nodes.map(n => n.category?.split('>')[0]?.trim()).filter(Boolean))]
  const nodeEdges = selectedNode
    ? graphData.edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
    : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-muted">Building network graph...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Network size={20} className="text-accent" /> Business Network
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            {graphData.nodes.length} businesses · {graphData.edges.length} connections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Click a node to inspect · Drag to rotate</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-shrink-0">
        <Legend categories={categories} />
      </div>

      {/* Main area: graph + side panel */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* 3D Canvas */}
        <div className="flex-1 card overflow-hidden relative" style={{ background: '#0F0F18' }}>
          <BusinessGraph3D
            nodes={graphData.nodes}
            edges={graphData.edges}
            onNodeSelect={setSelectedNode}
          />

          {/* Edge type legend overlay */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-xs text-white/60">
              <span className="w-6 h-0.5 bg-green-400 rounded" /> Internal match (strong)
            </div>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <span className="w-6 h-0.5 bg-accent rounded" /> Internal match
            </div>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <span className="w-6 h-0.5 bg-white/30 rounded border-dashed border border-white/30" /> External (web)
            </div>
          </div>
        </div>

        {/* Side panel — selected node details */}
        {selectedNode ? (
          <div className="w-72 flex flex-col gap-3 overflow-y-auto no-scrollbar flex-shrink-0">
            <div className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl font-bold text-sm flex items-center justify-center ${
                    selectedNode.id === current?._id?.toString()
                      ? 'bg-accent text-white'
                      : 'bg-accent-light text-accent'
                  }`}>
                    {selectedNode.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-text-primary">{selectedNode.name}</p>
                      {selectedNode.id === current?._id?.toString() && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-white font-semibold">You</span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted">{selectedNode.address}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedNode(null)} className="text-text-muted hover:text-text-primary">
                  <X size={14} />
                </button>
              </div>
              <CategoryBadge category={selectedNode.category} />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => navigate(`/businesses/${selectedNode.id}`)}
                  className="flex-1 text-xs py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-bg transition-colors"
                >
                  View Profile
                </button>
                {selectedNode.id === current?._id?.toString() && (
                  <button
                    onClick={() => navigate('/my-dashboard')}
                    className="flex-1 text-xs py-1.5 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors flex items-center justify-center gap-1"
                  >
                    <Star size={10} /> My Dashboard
                  </button>
                )}
              </div>
            </div>

            {/* Services */}
            {selectedNode.services?.length > 0 && (
              <div className="card p-4">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">Offers</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.services.map(s => (
                    <TagBadge key={s} tag={s} variant="solution" />
                  ))}
                </div>
              </div>
            )}

            {/* Connections */}
            <div className="card p-4">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">
                Connections ({nodeEdges.length})
              </p>
              {nodeEdges.length === 0 ? (
                <p className="text-xs text-text-muted">No connections yet</p>
              ) : (
                <div className="space-y-2">
                  {nodeEdges.map(edge => {
                    const otherId = edge.source === selectedNode.id ? edge.target : edge.source
                    const other = graphData.nodes.find(n => n.id === otherId)
                    return (
                      <div
                        key={edge.id}
                        onClick={() => setSelectedNode(other)}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-bg cursor-pointer transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-accent-light text-accent font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {other?.name?.[0] || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-text-primary truncate">{other?.name}</p>
                          <p className="text-[10px] text-text-muted truncate">{edge.reason}</p>
                        </div>
                        <ScoreBadge score={edge.score} />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-72 card flex flex-col items-center justify-center gap-3 flex-shrink-0">
            <Network size={28} className="text-text-muted" />
            <p className="text-sm text-text-muted text-center px-4">
              Click any node in the graph to inspect a business and its connections
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
