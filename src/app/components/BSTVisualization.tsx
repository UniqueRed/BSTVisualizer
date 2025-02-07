import React, { useState, useMemo, useRef, useEffect } from "react";
import { BST, BSTNode } from "@/app/lib/bst";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface BSTVisualizationProps {
  root: BSTNode | null;
  width: number;
  highlightedNodes?: number[];
  currentStep?: VisualizationStep;
  tempTree?: BSTNode | null; // Add this to handle intermediate states
}

interface NodePosition {
  x: number;
  y: number;
  node: BSTNode;
}

interface VisualizationStep {
  type:
    | "comparison"
    | "rotation"
    | "insertion"
    | "deletion"
    | "traversal"
    | "complete";
  currentNode: number;
  targetValue?: number;
  description: string;
  compareResult?: "left" | "right" | "equal";
  highlightedNodes?: number[];
  path?: number[];
  tempTree?: BSTNode | null;
}

const createTempTree = (
  tree: BST,
  options: {
    detachedNode?: number;
    rotated?: boolean;
    parent?: number;
    child?: number;
  }
): BSTNode | null => {
  // Create a deep copy of the tree
  const tempTree = new BST(JSON.parse(JSON.stringify(tree.root)));

  if (options.detachedNode && options.parent && options.child) {
    const parentNode = tempTree.find(tempTree.root, options.parent);
    const childNode = tempTree.find(tempTree.root, options.child);

    if (!parentNode || !childNode) return tempTree.root;

    // Determine if it's a left or right rotation
    const isRightRotation = parentNode.right?.value === options.child;
    const detachedNode = isRightRotation ? childNode.left : childNode.right;

    if (detachedNode?.value === options.detachedNode) {
      // Detach the node by setting the appropriate pointer to null
      if (isRightRotation) {
        childNode.left = null;
      } else {
        childNode.right = null;
      }
    }
  }

  if (options.rotated && options.parent && options.child) {
    const parentNode = tempTree.find(tempTree.root, options.parent);
    const childNode = tempTree.find(tempTree.root, options.child);

    if (!parentNode || !childNode) return tempTree.root;

    // Find the parent's parent (grandparent)
    const grandparent = tempTree.findParent(tempTree.root, options.parent);
    const parentOfParent =
      grandparent?.left?.value === options.parent ? "left" : "right";

    // Determine rotation type and perform rotation
    const isRightRotation = parentNode.right?.value === options.child;

    if (isRightRotation) {
      // Right rotation
      const childLeft = childNode.left;
      childNode.left = parentNode;
      parentNode.right = childLeft;
    } else {
      // Left rotation
      const childRight = childNode.right;
      childNode.right = parentNode;
      parentNode.left = childRight;
    }

    // Update the grandparent's pointer
    if (grandparent) {
      if (parentOfParent === "left") {
        grandparent.left = childNode;
      } else {
        grandparent.right = childNode;
      }
    } else {
      // Parent was the root
      tempTree.root = childNode;
    }
  }

  return tempTree.root;
};

const generateRotateSteps = (
  parent: number,
  child: number,
  tree: BST
): VisualizationStep[] => {
  const steps: VisualizationStep[] = [];

  // Find the nodes
  const parentNode = tree.find(tree.root, parent);
  const childNode = tree.find(tree.root, child);

  if (!parentNode || !childNode) {
    steps.push({
      type: "complete",
      currentNode: parent,
      description: "Invalid rotation: nodes not found",
      highlightedNodes: [],
      path: [],
    });
    return steps;
  }

  // Determine if it's a valid rotation
  if (parentNode.left?.value !== child && parentNode.right?.value !== child) {
    steps.push({
      type: "complete",
      currentNode: parent,
      description: "Invalid rotation: nodes must be directly connected",
      highlightedNodes: [],
      path: [],
    });
    return steps;
  }

  const isRightRotation = parentNode.right?.value === child;
  const affectedGrandchild = isRightRotation ? childNode.left : childNode.right;

  // Step 1: Initial state
  steps.push({
    type: "rotation",
    currentNode: parent,
    targetValue: child,
    description: `Starting rotation between ${parent} and ${child}`,
    highlightedNodes: [parent, child],
    path: [parent, child],
    tempTree: tree.root,
  });

  // Step 2: Highlight affected subtree
  steps.push({
    type: "rotation",
    currentNode: child,
    targetValue: parent,
    description: `Identifying affected nodes in the ${
      isRightRotation ? "right" : "left"
    } rotation`,
    highlightedNodes: [
      parent,
      child,
      ...(affectedGrandchild ? [affectedGrandchild.value] : []),
    ],
    path: [parent, child],
    tempTree: tree.root,
  });

  // Step 3: Detach affected grandchild if it exists
  if (affectedGrandchild) {
    steps.push({
      type: "rotation",
      currentNode: child,
      targetValue: parent,
      description: `Detaching ${affectedGrandchild.value} from ${child} temporarily`,
      highlightedNodes: [parent, child, affectedGrandchild.value],
      path: [parent, child, affectedGrandchild.value],
      tempTree: createTempTree(tree, {
        detachedNode: affectedGrandchild.value,
        parent,
        child,
      }),
    });
  }

  // Step 4: Perform rotation
  steps.push({
    type: "rotation",
    currentNode: child,
    targetValue: parent,
    description: `Rotating ${child} to become parent of ${parent}`,
    highlightedNodes: [parent, child],
    path: [child, parent],
    tempTree: createTempTree(tree, {
      rotated: true,
      parent,
      child,
    }),
  });

  // Step 5: Reattach grandchild if it exists
  if (affectedGrandchild) {
    const finalTree = new BST(JSON.parse(JSON.stringify(tree.root)));
    finalTree.rotate(parent, child);
    steps.push({
      type: "rotation",
      currentNode: child,
      targetValue: parent,
      description: `Reattaching ${affectedGrandchild.value} to its new parent`,
      highlightedNodes: [parent, child, affectedGrandchild.value],
      path: [child, parent, affectedGrandchild.value],
      tempTree: finalTree.root,
    });
  }

  // Step 6: Final state
  const finalTree = new BST(JSON.parse(JSON.stringify(tree.root)));
  finalTree.rotate(parent, child);
  steps.push({
    type: "complete",
    currentNode: child,
    description: "Rotation complete",
    highlightedNodes: [parent, child],
    path: [child, parent],
    tempTree: finalTree.root,
  });

  return steps;
};

const BSTVisualization: React.FC<BSTVisualizationProps> = ({
  root,
  width,
  highlightedNodes = [],
  currentStep,
  tempTree,
}) => {
  const nodeRadius = 20;
  const verticalSpacing = 60;
  const horizontalSpacing = 40;
  const viewHeight = 400;
  const containerRef = useRef<HTMLDivElement>(null);
  const [prevPositions, setPrevPositions] = useState<{
    [key: number]: { x: number; y: number };
  }>({});

  // State for panning and zooming
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });

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

  const { width: treeWidth } = useMemo(
    () => calculateTreeDimensions(root),
    [root]
  );
  const nodePositions = useMemo(() => {
    // Use tempTree if available (for intermediate rotation steps), otherwise use root
    const treeToUse = tempTree || root;
    const positions = positionNodes(
      treeToUse,
      width / 2,
      nodeRadius,
      treeWidth
    );

    // Store current positions for animation
    const newPositions: { [key: number]: { x: number; y: number } } = {};
    positions.forEach((pos) => {
      newPositions[pos.node.value] = { x: pos.x, y: pos.y };
    });

    // Handle animation from previous positions
    if (currentStep?.type === "rotation") {
      positions.forEach((pos) => {
        if (prevPositions[pos.node.value]) {
          pos.x = prevPositions[pos.node.value].x;
          pos.y = prevPositions[pos.node.value].y;
        }
      });
    }

    setPrevPositions(newPositions);
    return positions;
  }, [root, tempTree, width, treeWidth, currentStep]);

  // Calculate edges with animations
  const edges = useMemo(() => {
    const result = [];
    for (const position of nodePositions) {
      if (position.node.left) {
        const childPos = nodePositions.find(
          (p) => p.node === position.node.left
        );
        if (childPos) {
          result.push({
            id: `${position.node.value}-${childPos.node.value}`,
            parent: position,
            child: childPos,
          });
        }
      }
      if (position.node.right) {
        const childPos = nodePositions.find(
          (p) => p.node === position.node.right
        );
        if (childPos) {
          result.push({
            id: `${position.node.value}-${childPos.node.value}`,
            parent: position,
            child: childPos,
          });
        }
      }
    }
    return result;
  }, [nodePositions]);

  // Pan and zoom handlers
  const handleWheel = (e: WheelEvent) => {
    if (containerRef.current?.contains(e.target as Node)) {
      e.preventDefault();
      const zoomChange = e.deltaY * -0.001;
      setZoom((prev) => Math.min(Math.max(0.2, prev + zoomChange), 2));
    }
  };

  useEffect(() => {
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
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

  const handleRecenter = () => {
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
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
    setPan({
      x: width / 2 - centerX * newZoom,
      y: viewHeight / 2 - centerY * newZoom,
    });
    setZoom(newZoom);
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
        width={width}
        height={viewHeight}
        viewBox={`0 0 ${width} ${viewHeight}`}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Render edges with animations */}
          {edges.map(({ id, parent, child }) => (
            <motion.line
              key={id}
              initial={{
                x1: prevPositions[parent.node.value]?.x || parent.x,
                y1: prevPositions[parent.node.value]?.y || parent.y,
                x2: prevPositions[child.node.value]?.x || child.x,
                y2: prevPositions[child.node.value]?.y || child.y,
              }}
              animate={{
                x1: parent.x,
                y1: parent.y,
                x2: child.x,
                y2: child.y,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                duration: 0.5,
              }}
              stroke="black"
            />
          ))}

          {/* Render nodes */}
          {nodePositions.map((position) => (
            <motion.g
              key={position.node.value}
              initial={
                prevPositions[position.node.value]
                  ? {
                      x: prevPositions[position.node.value].x,
                      y: prevPositions[position.node.value].y,
                    }
                  : { scale: 0 }
              }
              animate={{
                x: position.x,
                y: position.y,
                scale: 1,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                duration: 0.5,
              }}
            >
              <circle
                r={nodeRadius}
                fill={
                  highlightedNodes.includes(position.node.value)
                    ? "#e3f2fd"
                    : "white"
                }
                stroke={
                  highlightedNodes.includes(position.node.value)
                    ? "#2196f3"
                    : "black"
                }
                strokeWidth={
                  highlightedNodes.includes(position.node.value) ? 2 : 1
                }
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={nodeRadius}
                className="select-none"
              >
                {position.node.value}
              </text>
            </motion.g>
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
