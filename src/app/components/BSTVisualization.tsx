"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import type { BSTNode } from "@/app/lib/bst";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface BSTVisualizationProps {
  root: BSTNode | null;
  width: number;
}

interface NodePosition {
  x: number;
  y: number;
  node: BSTNode;
}

const BSTVisualization: React.FC<BSTVisualizationProps> = ({ root, width }) => {
  const nodeRadius = 20;
  const verticalSpacing = 60;
  const horizontalSpacing = 40;
  const viewHeight = 450;
  const containerRef = useRef<HTMLDivElement>(null);

  // State for panning and zooming
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });

  const handleWheel = (e: WheelEvent) => {
    if (containerRef.current?.contains(e.target as Node)) {
      e.preventDefault();
      const zoomChange = e.deltaY * -0.001;
      setZoom((prev) => {
        const newZoom = prev + zoomChange;
        if (newZoom <= 0.2) return 0.2;
        return newZoom > 2 ? 2 : newZoom;
      });
    }
  };

  useEffect(() => {
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMousePosition.current.x;
    const dy = e.clientY - lastMousePosition.current.y;
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    lastMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => setIsDragging(false);

  const calculateTreeDimensions = (
    node: BSTNode | null
  ): {
    width: number;
    height: number;
    leftWidth: number;
    rightWidth: number;
  } => {
    if (!node) return { width: 0, height: 0, leftWidth: 0, rightWidth: 0 };
    const left = calculateTreeDimensions(node.left);
    const right = calculateTreeDimensions(node.right);
    const leftWidth = Math.max(left.width, horizontalSpacing);
    const rightWidth = Math.max(right.width, horizontalSpacing);
    return {
      width: leftWidth + rightWidth,
      height: Math.max(left.height, right.height) + verticalSpacing,
      leftWidth,
      rightWidth,
    };
  };

  const positionNodes = (
    node: BSTNode | null,
    x: number,
    y: number,
    availableWidth: number
  ): NodePosition[] => {
    if (!node) return [];
    const { leftWidth, rightWidth } = calculateTreeDimensions(node);
    const leftX = x - availableWidth / 2 + leftWidth / 2;
    const rightX = x + availableWidth / 2 - rightWidth / 2;
    return [
      { x, y, node },
      ...positionNodes(node.left, leftX, y + verticalSpacing, leftWidth),
      ...positionNodes(node.right, rightX, y + verticalSpacing, rightWidth),
    ];
  };

  const { width: treeWidth, height } = useMemo(
    () => calculateTreeDimensions(root),
    [root]
  );
  const nodePositions = useMemo(
    () => positionNodes(root, width / 2, nodeRadius, treeWidth),
    [root, width, treeWidth]
  );

  useEffect(() => {
    if (nodePositions.length > 0) {
      handleRecenter();
    }
  }, [nodePositions]);

  const handleRecenter = () => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    nodePositions.forEach((pos) => {
      minX = Math.min(minX, pos.x - nodeRadius);
      maxX = Math.max(maxX, pos.x + nodeRadius);
      minY = Math.min(minY, pos.y - nodeRadius);
      maxY = Math.max(maxY, pos.y + nodeRadius);
    });

    const padding = 40;
    const treeBoundsWidth = maxX - minX + 2 * padding;
    const treeBoundsHeight = maxY - minY + 2 * padding;

    const horizontalZoom = width / treeBoundsWidth;
    const verticalZoom = viewHeight / treeBoundsHeight;
    const newZoom = Math.min(horizontalZoom, verticalZoom, 1);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const newPanX = width / 2 - centerX * newZoom;
    const newPanY = viewHeight / 2 - centerY * newZoom;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const svgWidth = width;
  const svgHeight = viewHeight;

  const renderEdge = (start: NodePosition, end: NodePosition | undefined) => {
    if (!end) return null;
    return (
      <motion.line
        key={`${start.node.value}-${end.node.value}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke="black"
      />
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden bg-gray-100 rounded-md shadow-md h-full"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      <svg
        width={svgWidth}
        height="100%"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        <g
          transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
          {nodePositions.map((position) => (
            <React.Fragment key={position.node.value}>
              {renderEdge(
                position,
                nodePositions.find((pos) => pos.node === position.node.left)
              )}
              {renderEdge(
                position,
                nodePositions.find((pos) => pos.node === position.node.right)
              )}
              <motion.circle
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                cx={position.x}
                cy={position.y}
                r={nodeRadius}
                fill="white"
                stroke="black"
              />
              <motion.text
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                x={position.x}
                y={position.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={nodeRadius}
                className="select-none"
              >
                {position.node.value}
              </motion.text>
            </React.Fragment>
          ))}
        </g>
      </svg>
      <Button
        className="absolute top-5 right-5"
        onClick={handleRecenter}
        variant="default"
      >
        Recenter
      </Button>
    </div>
  );
};

export default BSTVisualization;
