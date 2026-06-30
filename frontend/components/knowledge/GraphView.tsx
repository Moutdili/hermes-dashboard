'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { GraphData } from '@/lib/api';

interface GraphViewProps {
  data: GraphData;
  onNodeClick?: (id: string) => void;
}

export function GraphView({ data, onNodeClick }: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight || 600;

    // Color scale by folder
    const folders = [...new Set(data.nodes.map((n) => n.folder))];
    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(folders);

    // Simulation
    const simulation = d3
      .forceSimulation(data.nodes as any)
      .force('link', d3.forceLink(data.links as any).id((d: any) => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(18));

    // Links
    const link = svg
      .append('g')
      .selectAll('line')
      .data(data.links)
      .join('line')
      .attr('stroke', 'rgba(255,255,255,0.08)')
      .attr('stroke-width', 1);

    // Nodes
    const node = svg
      .append('g')
      .selectAll('g')
      .data(data.nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .on('click', (_e, d: any) => onNodeClick?.(d.id))
      .call(drag(simulation) as any);

    node
      .append('circle')
      .attr('r', 6)
      .attr('fill', (d: any) => color(d.folder))
      .attr('stroke', 'rgba(255,255,255,0.2)')
      .attr('stroke-width', 1);

    node
      .append('text')
      .text((d: any) => d.title.length > 20 ? d.title.slice(0, 18) + '…' : d.title)
      .attr('x', 10)
      .attr('y', 4)
      .attr('fill', '#8899b4')
      .attr('font-size', '10px')
      .attr('font-family', 'Inter, sans-serif');

    // Tooltip
    node
      .append('title')
      .text((d: any) => `${d.title}\n${d.folder}\n${d.tags?.join(', ') ?? ''}`);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);
      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [data, onNodeClick]);

  return (
    <svg
      ref={svgRef}
      className="w-full h-[600px] rounded-lg bg-bg-base border border-bd"
      style={{ minHeight: 400 }}
    />
  );
}

function drag(simulation: d3.Simulation<any, undefined>) {
  function dragstarted(event: any) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }
  function dragged(event: any) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }
  function dragended(event: any) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
  return d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended);
}