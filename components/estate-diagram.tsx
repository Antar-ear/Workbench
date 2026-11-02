"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type EdgeProps,
  type EdgeTypes,
  type Node,
  type NodeMouseHandler,
  type NodeProps,
  type NodeTypes,
} from "reactflow";
import { ChevronsLeftRight, MousePointerClick, X } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ESTATE_DETAILS } from "@/lib/estate-details";
import { TAG_META } from "@/lib/types";
import {
  CANVAS,
  DLX_WIDTH,
  ESTATE_EDGES,
  ESTATE_NODES,
  PANEL_FOOTNOTE,
  PANEL_SOURCE,
  type EstateEdge,
  type EstateNode,
} from "@/lib/estate";
import { cn } from "@/lib/utils";

/** Pixels per inch of the drawing canvas. */
const PX = 100;
const BLUE = "#1d4ed8";
const BLUE_DARK = "#1e3a8a";
const GREY = "#94a3b8";

type NodeData = EstateNode & {
  detail: boolean;
  onToggle: () => void;
};

const HANDLE_CLS = "!h-1 !w-1 !border-0 !bg-transparent !opacity-0";

function Handles() {
  return (
    <>
      <Handle type="target" position={Position.Left} className={HANDLE_CLS} />
      <Handle type="source" position={Position.Right} className={HANDLE_CLS} />
    </>
  );
}

function CardNode({ data, selected }: NodeProps<NodeData>) {
  const grey = data.scope === "tbc";
  const isAdc = data.id === "adc";
  return (
    <div
      style={{ width: data.w * PX, height: data.h * PX }}
      className={cn(
        "relative flex flex-col justify-center rounded-md border-2 px-1.5 text-center shadow-sm",
        grey
          ? "border-slate-400 bg-slate-200 text-slate-800"
          : "border-blue-700 bg-blue-600 text-white",
        isAdc && data.detail && "border-[4px] border-blue-900",
        selected && "ring-4 ring-blue-500/30"
      )}
    >
      <Handles />
      <p className="text-[11px] font-semibold leading-tight">{data.label}</p>
      {data.sub && (
        <p
          className={cn(
            "mt-px text-[9px] leading-[1.15]",
            grey ? "text-slate-600" : "text-blue-100"
          )}
        >
          {data.sub}
        </p>
      )}
      {data.chips && (
        <div className="mt-1 flex flex-col gap-0.5">
          {data.chips.map((c) => (
            <span
              key={c}
              className="rounded-sm border border-slate-400 bg-white px-1 text-[9px] font-medium leading-4 text-slate-700"
            >
              {c}
            </span>
          ))}
        </div>
      )}
      {isAdc && (
        <button
          type="button"
          aria-pressed={data.detail}
          aria-label={data.detail ? "Close ADC cluster internals" : "Open ADC cluster internals"}
          title={data.detail ? "Close ADC cluster internals" : "Open ADC cluster internals"}
          onClick={(e) => {
            e.stopPropagation();
            data.onToggle();
          }}
          className="nodrag absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-700 bg-white text-blue-700 shadow hover:bg-blue-50"
        >
          <ChevronsLeftRight className={cn("h-3 w-3 transition-transform", data.detail && "rotate-180")} />
        </button>
      )}
    </div>
  );
}

function GroupNode({ data }: NodeProps<NodeData>) {
  const solid = data.border === "solid";
  return (
    <div
      style={{ width: data.w * PX, height: data.h * PX }}
      className={cn(
        "relative rounded-xl border-2",
        solid ? "border-blue-700" : "border-dotted border-blue-600"
      )}
    >
      <Handles />
      <span
        className={cn(
          "absolute top-1 text-[10px] font-bold text-blue-700",
          data.labelAt === "tr" ? "right-3" : "left-3"
        )}
      >
        {data.label}
      </span>
    </div>
  );
}

function PanelNode({ data }: NodeProps<NodeData>) {
  return (
    <div
      style={{ width: data.w * PX, height: data.h * PX }}
      className="relative rounded-lg border-2 border-blue-700 bg-blue-50/70"
    >
      <Handles />
      <p className="absolute left-3 top-1.5 text-[11px] font-bold text-blue-900">{data.label}</p>
      <p className="absolute bottom-1.5 left-3 right-3 text-[9px] leading-tight text-blue-900">
        {PANEL_FOOTNOTE}
      </p>
    </div>
  );
}

function BracketNode({ data }: NodeProps<NodeData>) {
  return (
    <div
      style={{ width: data.w * PX, height: data.h * PX }}
      className="pointer-events-none flex flex-col items-center"
    >
      <div className="h-1.5 w-full rounded-b-sm border-x-2 border-b-2 border-blue-700" />
      <span className="text-[10px] font-bold leading-tight text-blue-800">{data.label}</span>
    </div>
  );
}

/** Invisible marker so the fitted view includes edge routes that run outside the boxes. */
function SpacerNode() {
  return <div className="pointer-events-none h-px w-px" />;
}

const nodeTypes: NodeTypes = {
  spacer: SpacerNode,
  card: CardNode,
  box: GroupNode,
  panel: PanelNode,
  bracket: BracketNode,
};

/** Canvas corners, padded so the left-margin and bottom edge routes stay in view. */
const BOUNDS = [
  { id: "bound-tl", x: -0.05, y: 0.95 },
  { id: "bound-br", x: CANVAS.w, y: CANVAS.h },
];

type EdgeData = { points: [number, number][]; label?: string; labelAt?: [number, number] };

/** Draws the route stored in the data file instead of letting ReactFlow pick one. */
function RouteEdge({ id, data, style, markerStart, markerEnd }: EdgeProps<EdgeData>) {
  if (!data) return null;
  const d = data.points.map(([x, y], i) => `${i ? "L" : "M"}${x * PX} ${y * PX}`).join(" ");
  return (
    <g>
      <path id={id} d={d} fill="none" style={style} markerStart={markerStart} markerEnd={markerEnd} />
      {data.label && data.labelAt && (
        <text
          x={data.labelAt[0] * PX}
          y={data.labelAt[1] * PX}
          textAnchor="middle"
          className="fill-blue-800 text-[9px] font-semibold"
        >
          {data.label}
        </text>
      )}
    </g>
  );
}

const edgeTypes: EdgeTypes = { route: RouteEdge };

function toNode(n: EstateNode, detail: boolean, onToggle: () => void): Node<NodeData> {
  const w = n.id === "g-dlx" ? (detail ? DLX_WIDTH.detail : DLX_WIDTH.overview) : n.w;
  return {
    id: n.id,
    // "group" is a built-in ReactFlow type with its own styling, so draw boundaries as "box".
    type: n.kind === "group" ? "box" : n.kind,
    position: { x: n.x * PX, y: n.y * PX },
    data: { ...n, w, detail, onToggle },
    draggable: false,
    selectable: n.kind === "card" || n.kind === "panel" || n.id === "g-dlx",
    zIndex: n.kind === "group" || n.kind === "panel" ? 0 : 10,
    style: { width: w * PX, height: n.h * PX },
  };
}

function toEdge(e: EstateEdge, hot: boolean): Edge<EdgeData> {
  const colour = hot ? BLUE_DARK : e.grey ? GREY : BLUE;
  const marker = { type: MarkerType.ArrowClosed, color: colour, width: 14, height: 14 };
  return {
    id: e.id,
    type: "route",
    source: e.source,
    target: e.target,
    data: { points: e.points, label: e.label, labelAt: e.labelAt },
    markerStart: e.bi ? marker : undefined,
    markerEnd: e.bi || e.oneWay ? marker : undefined,
    zIndex: 5,
    style: {
      stroke: colour,
      strokeWidth: hot ? 2.5 : 1.75,
      strokeDasharray: e.dashed ? "6 4" : undefined,
    },
  };
}

const DRAWER_W = 440;

function ListItems({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 pb-1">
      {items.map((t, idx) => (
        <li key={idx} className="flex gap-2 text-sm leading-snug text-slate-700">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function DetailPanel({
  node,
  nodes,
  edges,
  onClose,
}: {
  node: EstateNode;
  nodes: EstateNode[];
  edges: EstateEdge[];
  onClose: () => void;
}) {
  const detail = ESTATE_DETAILS[node.id];
  const name = (id: string) => {
    if (id === "jb-top") return "Jump Box (top)";
    if (id === "jb-bot") return "Jump Box (bottom)";
    return nodes.find((x) => x.id === id)?.label ?? id;
  };
  const links = edges
    .filter((e) => e.source === node.id || e.target === node.id)
    .map((e) => {
      const out = e.source === node.id;
      const other = name(out ? e.target : e.source);
      const dir = e.bi ? "two-way" : out ? "sends to" : "receives from";
      return { id: e.id, other, dir, dashed: e.dashed, note: e.note, label: e.label };
    });
  const grey = node.scope === "tbc";
  return (
    <aside
      aria-live="polite"
      style={{ maxWidth: DRAWER_W }}
      className="absolute inset-y-0 right-0 z-20 w-full overflow-y-auto border-l bg-muted/95 p-5 shadow-xl backdrop-blur animate-in slide-in-from-right-8 duration-200"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 rounded-sm p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Close details"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="space-y-4">
        <div className="space-y-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
              grey
                ? "border-slate-300 bg-slate-100 text-slate-700"
                : "border-blue-200 bg-blue-50 text-blue-800"
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", grey ? "bg-slate-400" : "bg-blue-600")} />
            {grey ? "To be clarified if in scope" : "In scope"}
          </span>
          <h2 className="pr-8 text-xl font-bold leading-tight tracking-tight">{node.label}</h2>
          {node.sub && <p className="text-sm text-muted-foreground">{node.sub}</p>}
          <p className="text-sm leading-relaxed text-slate-600">
            {detail ? detail.summary : "No overview written for this part yet. Its links are listed below."}
          </p>
          {node.chips && <p className="text-sm text-slate-600">Contains: {node.chips.join(", ")}</p>}
        </div>

        <Accordion
          type="multiple"
          defaultValue={["facts", "open"]}
          key={node.id}
          className="rounded-lg border bg-white px-4"
        >
          {detail && (
            <AccordionItem value="facts">
              <AccordionTrigger>
                Key facts
                <span className="ml-auto mr-2 text-xs font-normal text-muted-foreground">
                  {detail.facts.length}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <dl className="space-y-2.5 pb-1">
                  {detail.facts.map((f, idx) => (
                    <div key={idx} className="text-sm leading-snug">
                      <dt className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{f.k}</span>
                        <span
                          className={cn(
                            "rounded border px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide",
                            TAG_META[f.tag].cls
                          )}
                        >
                          {TAG_META[f.tag].label}
                        </span>
                      </dt>
                      <dd className="mt-0.5 break-words text-slate-600">{f.v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 border-t pt-2 text-[11px] leading-snug text-muted-foreground">
                  Doc: recorded in an Alcon workbook. Call: stated in a session. Confirm: unresolved
                  or conflicting.
                </p>
              </AccordionContent>
            </AccordionItem>
          )}

          {detail && detail.open.length > 0 && (
            <AccordionItem value="open">
              <AccordionTrigger>
                Open items and gaps
                <span className="ml-auto mr-2 text-xs font-normal text-muted-foreground">
                  {detail.open.length}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ListItems items={detail.open} />
              </AccordionContent>
            </AccordionItem>
          )}

          {links.length > 0 && (
            <AccordionItem value="links" className={detail ? undefined : "border-b-0"}>
              <AccordionTrigger>
                Links
                <span className="ml-auto mr-2 text-xs font-normal text-muted-foreground">
                  {links.length}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 pb-1">
                  {links.map((l) => (
                    <li key={l.id} className="text-sm leading-snug text-slate-700">
                      <span className="font-medium text-slate-900">{l.other}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        · {l.dir}
                        {l.dashed ? " · dashed (standby, optional or special)" : ""}
                        {l.label ? ` · ${l.label}` : ""}
                      </span>
                      {l.note && <span className="block text-xs text-muted-foreground">{l.note}</span>}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}

          {detail && (
            <AccordionItem value="sources" className="border-b-0">
              <AccordionTrigger>Sources</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-1.5 pb-1 text-sm text-slate-700">
                  {detail.sources.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>
    </aside>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
      <span className="flex items-center gap-1.5 text-xs text-slate-700">
        <span className="h-3 w-5 rounded-sm border-2 border-blue-700 bg-blue-600" />
        In scope
      </span>
      <span className="flex items-center gap-1.5 text-xs text-slate-700">
        <span className="h-3 w-5 rounded-sm border-2 border-slate-400 bg-slate-200" />
        To be clarified if in scope
      </span>
    </div>
  );
}

export function EstateDiagram() {
  return (
    <ReactFlowProvider>
      <Inner />
    </ReactFlowProvider>
  );
}

function Inner() {
  const [detail, setDetail] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rf = useReactFlow();

  const toggle = () => setDetail((d) => !d);

  // Deep links: #detail opens the ADC cluster internals, select=<id> opens a part, e.g. #detail&select=cls.
  useEffect(() => {
    const parts = window.location.hash.replace(/^#/, "").split("&");
    if (parts.includes("detail")) setDetail(true);
    const pick = parts.find((p) => p.startsWith("select="));
    if (pick) setSelectedId(pick.slice("select=".length));
  }, []);

  const estateNodes = useMemo(
    () => ESTATE_NODES.filter((n) => detail || !n.detailOnly),
    [detail]
  );
  const estateEdges = useMemo(
    () => ESTATE_EDGES.filter((e) => detail || !e.detailOnly),
    [detail]
  );

  // Close the drawer on a node that is no longer drawn.
  useEffect(() => {
    if (selectedId && !estateNodes.some((n) => n.id === selectedId)) setSelectedId(null);
  }, [estateNodes, selectedId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelectedId(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const nodes = useMemo(
    () => [
      ...BOUNDS.map((b) => ({
        id: b.id,
        type: "spacer",
        position: { x: b.x * PX, y: b.y * PX },
        data: {},
        draggable: false,
        selectable: false,
        focusable: false,
      })),
      ...estateNodes.map((n) => ({
        ...toNode(n, detail, toggle),
        selected: n.id === selectedId,
      })),
    ],
    [estateNodes, detail, selectedId]
  );
  const edges = useMemo(
    () =>
      estateEdges.map((e) =>
        toEdge(e, selectedId !== null && (e.source === selectedId || e.target === selectedId))
      ),
    [estateEdges, selectedId]
  );

  /** Select a part and, on wide screens, pan it clear of the open drawer. */
  const onNodeClick: NodeMouseHandler = (_e, node) => {
    setSelectedId(node.id);
    const el = wrapRef.current;
    if (!el || el.clientWidth < 900) return;
    const vp = rf.getViewport();
    const right = (node.position.x + (node.width ?? 0)) * vp.zoom + vp.x;
    const visibleRight = el.clientWidth - DRAWER_W - 24;
    if (right > visibleRight) {
      rf.setViewport({ x: vp.x - (right - visibleRight), y: vp.y, zoom: vp.zoom }, { duration: 300 });
    }
  };
  const closeDetail = () => {
    setSelectedId(null);
    rf.fitView({ padding: 0.02, duration: 300 });
  };
  const selected = estateNodes.find((n) => n.id === selectedId) ?? null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="space-y-1">
          <h2 className="text-lg font-bold tracking-tight">Alcon SCM/WMS estate: architecture view</h2>
          <Legend />
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MousePointerClick className="h-3.5 w-3.5" />
            Click any part for its links
          </p>
        </div>
        <Button
          type="button"
          variant={detail ? "default" : "outline"}
          size="sm"
          aria-pressed={detail}
          onClick={toggle}
        >
          <ChevronsLeftRight className="mr-1.5 h-4 w-4" />
          {detail ? "Hide ADC cluster internals" : "Show ADC cluster internals"}
        </Button>
      </div>

      <div
        ref={wrapRef}
        className="relative h-[640px] w-full overflow-hidden rounded-lg border bg-slate-50"
        aria-label="Alcon SCM/WMS estate architecture diagram"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={onNodeClick}
          onPaneClick={closeDetail}
          fitView
          fitViewOptions={{ padding: 0.02 }}
          minZoom={0.3}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          zoomOnScroll={false}
          panOnScroll
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>

        {selected && (
          <DetailPanel
            key={selected.id}
            node={selected}
            nodes={estateNodes}
            edges={estateEdges}
            onClose={closeDetail}
          />
        )}
      </div>
    </div>
  );
}
