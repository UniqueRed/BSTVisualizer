"use client";

import { useReducer, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Copy,
  Check,
  Play,
  Pause,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import BSTVisualization from "./BSTVisualization";
import { BST, BSTNode } from "@/app/lib/bst";

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
}

type BSTAction =
  | { type: "INSERT"; value: number }
  | { type: "DELETE"; value: number }
  | { type: "ROTATE"; parent: number; child: number }
  | { type: "CLEAR" }
  | { type: "SAVE_ITERATION" }
  | { type: "LOAD_ITERATION"; index: number }
  | { type: "DELETE_ITERATION"; index: number }
  | { type: "CLEAR_ALL_ITERATIONS" };

interface BSTState {
  current: BST;
  iterations: BST[];
  currentIndex: number;
}

function bstReducer(state: BSTState, action: BSTAction): BSTState {
  const newBST = new BST(JSON.parse(JSON.stringify(state.current.root)));
  switch (action.type) {
    case "INSERT":
      newBST.insert(action.value);
      return { ...state, current: newBST };
    case "DELETE":
      newBST.delete(action.value);
      return { ...state, current: newBST };
    case "ROTATE":
      newBST.rotate(action.parent, action.child);
      return { ...state, current: newBST };
    case "CLEAR":
      return { ...state, current: new BST() };
    case "SAVE_ITERATION":
      return {
        ...state,
        iterations: [
          ...state.iterations,
          new BST(JSON.parse(JSON.stringify(state.current.root))),
        ],
        currentIndex: state.iterations.length,
      };
    case "LOAD_ITERATION":
      if (action.index >= 0 && action.index < state.iterations.length) {
        return {
          ...state,
          current: new BST(
            JSON.parse(JSON.stringify(state.iterations[action.index].root))
          ),
          currentIndex: action.index,
        };
      }
      return state;
    case "DELETE_ITERATION":
      if (action.index >= 0 && action.index < state.iterations.length) {
        const newIterations = [...state.iterations];
        newIterations.splice(action.index, 1);
        const newIndex = Math.min(state.currentIndex, newIterations.length - 1);
        return {
          ...state,
          iterations: newIterations,
          currentIndex: newIndex,
          current:
            newIndex >= 0
              ? new BST(
                  JSON.parse(JSON.stringify(newIterations[newIndex].root))
                )
              : new BST(),
        };
      }
      return state;
    case "CLEAR_ALL_ITERATIONS":
      return {
        ...state,
        iterations: [],
        currentIndex: -1,
        current: new BST(JSON.parse(JSON.stringify(state.current.root))),
      };
    default:
      return state;
  }
}

export default function BSTVisualizer() {
  const [{ current: bst, iterations, currentIndex }, dispatch] = useReducer(
    bstReducer,
    {
      current: new BST(),
      iterations: [],
      currentIndex: -1,
    }
  );

  // Form states
  const [insertValue, setInsertValue] = useState("");
  const [deleteValue, setDeleteValue] = useState("");
  const [rotateParent, setRotateParent] = useState("");
  const [rotateChild, setRotateChild] = useState("");
  const [selectedTraversal, setSelectedTraversal] = useState("");
  const [traversalResult, setTraversalResult] = useState<number[]>([]);
  const [copying, setCopying] = useState(false);

  // Interactive mode states
  const [interactiveMode, setInteractiveMode] = useState(false);
  const [autoSaveIterations, setAutoSaveIterations] = useState(false);
  const [visualizationSteps, setVisualizationSteps] = useState<
    VisualizationStep[]
  >([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000); // milliseconds

  const generateInsertSteps = (
    value: number,
    tree: BST
  ): VisualizationStep[] => {
    const steps: VisualizationStep[] = [];
    let current = tree.root;
    const path: number[] = [];

    while (current) {
      path.push(current.value);
      steps.push({
        type: "comparison",
        currentNode: current.value,
        targetValue: value,
        description: `Comparing ${value} with ${current.value}`,
        highlightedNodes: [current.value],
        path: [...path],
      });

      if (value < current.value) {
        steps.push({
          type: "comparison",
          currentNode: current.value,
          targetValue: value,
          description: `${value} is less than ${current.value}, going left`,
          compareResult: "left",
          highlightedNodes: [current.value],
          path: [...path],
        });
        if (!current.left) break;
        current = current.left;
      } else if (value > current.value) {
        steps.push({
          type: "comparison",
          currentNode: current.value,
          targetValue: value,
          description: `${value} is greater than ${current.value}, going right`,
          compareResult: "right",
          highlightedNodes: [current.value],
          path: [...path],
        });
        if (!current.right) break;
        current = current.right;
      } else {
        steps.push({
          type: "comparison",
          currentNode: current.value,
          targetValue: value,
          description: `${value} already exists in the tree`,
          compareResult: "equal",
          highlightedNodes: [current.value],
          path: [...path],
        });
        return steps;
      }
    }

    path.push(value);
    steps.push({
      type: "insertion",
      currentNode: value,
      description: `Inserting ${value}`,
      highlightedNodes: [value],
      path: [...path],
    });

    return steps;
  };

  const generateDeleteSteps = (
    value: number,
    tree: BST
  ): VisualizationStep[] => {
    const steps: VisualizationStep[] = [];
    let current = tree.root;
    const path: number[] = [];

    // Find the node to delete
    while (current) {
      path.push(current.value);
      steps.push({
        type: "comparison",
        currentNode: current.value,
        targetValue: value,
        description: `Searching for ${value}, comparing with ${current.value}`,
        highlightedNodes: [current.value],
        path: [...path],
      });

      if (value < current.value) {
        if (!current.left) {
          steps.push({
            type: "deletion",
            currentNode: current.value,
            targetValue: value,
            description: `${value} not found in tree`,
            highlightedNodes: [],
            path: [...path],
          });
          return steps;
        }
        current = current.left;
      } else if (value > current.value) {
        if (!current.right) {
          steps.push({
            type: "deletion",
            currentNode: current.value,
            targetValue: value,
            description: `${value} not found in tree`,
            highlightedNodes: [],
            path: [...path],
          });
          return steps;
        }
        current = current.right;
      } else {
        // Node found
        steps.push({
          type: "deletion",
          currentNode: current.value,
          targetValue: value,
          description: `Found node to delete: ${value}`,
          highlightedNodes: [current.value],
          path: [...path],
        });

        // Case 1: No children
        if (!current.left && !current.right) {
          steps.push({
            type: "deletion",
            currentNode: current.value,
            description: `Removing leaf node ${value}`,
            highlightedNodes: [current.value],
            path: [...path],
          });
        }
        // Case 2: One child
        else if (!current.left || !current.right) {
          const child = current.left || current.right;
          steps.push({
            type: "deletion",
            currentNode: current.value,
            description: `Replacing ${value} with its child ${child!.value}`,
            highlightedNodes: [current.value, child!.value],
            path: [...path],
          });
        }
        // Case 3: Two children
        else {
          let successor = current.right;
          const successorPath = [...path];
          while (successor.left) {
            successorPath.push(successor.value);
            successor = successor.left;
          }
          successorPath.push(successor.value);

          steps.push({
            type: "deletion",
            currentNode: successor.value,
            description: `Found successor ${successor.value} for ${value}`,
            highlightedNodes: [current.value, successor.value],
            path: successorPath,
          });

          steps.push({
            type: "deletion",
            currentNode: successor.value,
            description: `Replacing ${value} with successor ${successor.value}`,
            highlightedNodes: [current.value, successor.value],
            path: successorPath,
          });
        }
        break;
      }
    }

    steps.push({
      type: "complete",
      currentNode: value,
      description: "Deletion complete",
      highlightedNodes: [],
      path: [],
    });

    return steps;
  };

  const generateRotateSteps = (
    parent: number,
    child: number,
    tree: BST
  ): VisualizationStep[] => {
    const steps: VisualizationStep[] = [];

    steps.push({
      type: "rotation",
      currentNode: parent,
      targetValue: child,
      description: `Starting rotation between ${parent} and ${child}`,
      highlightedNodes: [parent, child],
      path: [parent, child],
    });

    steps.push({
      type: "rotation",
      currentNode: child,
      targetValue: parent,
      description: `Rotating ${child} to become parent of ${parent}`,
      highlightedNodes: [parent, child],
      path: [child, parent],
    });

    steps.push({
      type: "complete",
      currentNode: child,
      description: "Rotation complete",
      highlightedNodes: [parent, child],
      path: [child, parent],
    });

    return steps;
  };

  const generateTraversalSteps = (
    tree: BST,
    type: string
  ): VisualizationStep[] => {
    const steps: VisualizationStep[] = [];
    const result: number[] = [];

    const traverse = (node: BSTNode | null) => {
      if (!node) return;

      if (type === "preorder") {
        steps.push({
          type: "traversal",
          currentNode: node.value,
          description: `Visiting ${node.value} (preorder)`,
          highlightedNodes: [node.value],
          path: [...result, node.value],
        });
        result.push(node.value);
        traverse(node.left);
        traverse(node.right);
      } else if (type === "inorder") {
        traverse(node.left);
        steps.push({
          type: "traversal",
          currentNode: node.value,
          description: `Visiting ${node.value} (inorder)`,
          highlightedNodes: [node.value],
          path: [...result, node.value],
        });
        result.push(node.value);
        traverse(node.right);
      } else if (type === "postorder") {
        traverse(node.left);
        traverse(node.right);
        steps.push({
          type: "traversal",
          currentNode: node.value,
          description: `Visiting ${node.value} (postorder)`,
          highlightedNodes: [node.value],
          path: [...result, node.value],
        });
        result.push(node.value);
      }
    };

    if (type === "levelOrder") {
      const queue: BSTNode[] = [];
      if (tree.root) queue.push(tree.root);

      while (queue.length > 0) {
        const node = queue.shift()!;
        steps.push({
          type: "traversal",
          currentNode: node.value,
          description: `Visiting ${node.value} (level order)`,
          highlightedNodes: [node.value],
          path: [...result, node.value],
        });
        result.push(node.value);

        if (node.left) queue.push(node.left);
        if (node.right) queue.push(node.right);
      }
    } else {
      traverse(tree.root);
    }

    steps.push({
      type: "complete",
      currentNode: result[result.length - 1],
      description: `${type} traversal complete: [${result.join(", ")}]`,
      highlightedNodes: [],
      path: result,
    });

    return steps;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentStepIndex < visualizationSteps.length - 1) {
      interval = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= visualizationSteps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStepIndex, visualizationSteps.length, playbackSpeed]);

  const handleInsert = () => {
    const value = Number(insertValue);
    if (!isNaN(value)) {
      if (interactiveMode) {
        const steps = generateInsertSteps(value, bst);
        setVisualizationSteps(steps);
        setCurrentStepIndex(0);
        setIsPlaying(false);
      }
      dispatch({ type: "INSERT", value });
      if (autoSaveIterations) {
        setTimeout(() => dispatch({ type: "SAVE_ITERATION" }), 0);
      }
      setInsertValue("");
    }
  };

  const handleDelete = () => {
    const value = Number(deleteValue);
    if (!isNaN(value)) {
      if (interactiveMode) {
        const steps = generateDeleteSteps(value, bst);
        setVisualizationSteps(steps);
        setCurrentStepIndex(0);
        setIsPlaying(false);
      }
      dispatch({ type: "DELETE", value });
      if (autoSaveIterations) {
        setTimeout(() => dispatch({ type: "SAVE_ITERATION" }), 0);
      }
      setDeleteValue("");
    }
  };

  const handleRotate = () => {
    const parent = Number(rotateParent);
    const child = Number(rotateChild);
    if (!isNaN(parent) && !isNaN(child)) {
      if (interactiveMode) {
        const steps = generateRotateSteps(parent, child, bst);
        setVisualizationSteps(steps);
        setCurrentStepIndex(0);
        setIsPlaying(false);
      }
      dispatch({ type: "ROTATE", parent, child });
      if (autoSaveIterations) {
        setTimeout(() => dispatch({ type: "SAVE_ITERATION" }), 0);
      }
      setRotateParent("");
      setRotateChild("");
    }
  };

  const handleTraverse = () => {
    if (interactiveMode) {
      const steps = generateTraversalSteps(bst, selectedTraversal);
      setVisualizationSteps(steps);
      setCurrentStepIndex(0);
      setIsPlaying(false);
    }

    let result: number[] = [];
    switch (selectedTraversal) {
      case "preorder":
        result = bst.preorder();
        break;
      case "inorder":
        result = bst.inorder();
        break;
      case "postorder":
        result = bst.postorder();
        break;
      case "levelOrder":
        result = bst.levelOrder();
        break;
    }
    setTraversalResult(result);
  };

  const handleCopyResult = async () => {
    try {
      setCopying(true);
      await navigator.clipboard.writeText(traversalResult.join(", "));
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => {
        setCopying(false);
      }, 1000);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 bg-gray-100 h-full">
      <div className="w-full md:w-1/3 bg-white p-6 rounded-lg shadow-md space-y-6">
        <h2 className="text-xl font-semibold text-gray-700">BST Controls</h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Insert Node</Label>
            <div className="flex space-x-2">
              <Input
                type="number"
                value={insertValue}
                onChange={(e) => setInsertValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInsert()}
                placeholder="Enter value"
              />
              <Button onClick={handleInsert}>Insert</Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Delete Node</Label>
            <div className="flex space-x-2">
              <Input
                type="number"
                value={deleteValue}
                onChange={(e) => setDeleteValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleDelete()}
                placeholder="Enter value"
              />
              <Button onClick={handleDelete}>Delete</Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rotate Nodes</Label>
            <div className="flex space-x-2">
              <Input
                type="number"
                value={rotateParent}
                onChange={(e) => setRotateParent(e.target.value)}
                placeholder="Parent"
              />
              <Input
                type="number"
                value={rotateChild}
                onChange={(e) => setRotateChild(e.target.value)}
                placeholder="Child"
              />
              <Button onClick={handleRotate}>Rotate</Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tree Traversal</Label>
            <div className="flex space-x-2">
              <Select
                value={selectedTraversal}
                onValueChange={setSelectedTraversal}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select traversal method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preorder">Preorder</SelectItem>
                  <SelectItem value="inorder">Inorder</SelectItem>
                  <SelectItem value="postorder">Postorder</SelectItem>
                  <SelectItem value="levelOrder">Level Order</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleTraverse}
                disabled={!selectedTraversal || !bst.root}
              >
                Traverse
              </Button>
            </div>
          </div>

          {traversalResult.length > 0 && (
            <Alert className="relative">
              <AlertDescription className="pr-12">
                Traversal Result:
                <br />[{traversalResult.join(", ")}]
              </AlertDescription>
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-4 top-1/2 -translate-y-1/2"
                onClick={handleCopyResult}
              >
                {copying ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </Alert>
          )}

          <Accordion type="single" collapsible>
            <AccordionItem value="advanced">
              <AccordionTrigger>Advanced Options</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="interactive"
                      checked={interactiveMode}
                      onCheckedChange={(checked) => {
                        setInteractiveMode(checked === true);
                        setVisualizationSteps([]);
                        setCurrentStepIndex(-1);
                        setIsPlaying(false);
                      }}
                    />
                    <Label htmlFor="interactive">Interactive Mode</Label>
                  </div>

                  {interactiveMode && (
                    <div className="space-y-2">
                      <Label>Animation Speed</Label>
                      <Select
                        value={playbackSpeed.toString()}
                        onValueChange={(value) =>
                          setPlaybackSpeed(Number(value))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select speed" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2000">Slow</SelectItem>
                          <SelectItem value="1000">Normal</SelectItem>
                          <SelectItem value="500">Fast</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="autoSave"
                      checked={autoSaveIterations}
                      onCheckedChange={(checked) =>
                        setAutoSaveIterations(checked === true)
                      }
                    />
                    <Label htmlFor="autoSave">Auto-save after operations</Label>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      <div className="flex flex-col flex-grow bg-white p-6 rounded-lg shadow-md">
        {interactiveMode && visualizationSteps.length > 0 && (
          <div className="mb-4 space-y-4">
            <Alert>
              <AlertDescription>
                {visualizationSteps[currentStepIndex]?.description}
              </AlertDescription>
            </Alert>
            <div className="flex justify-between items-center">
              <Button
                onClick={() =>
                  setCurrentStepIndex((prev) => Math.max(0, prev - 1))
                }
                disabled={currentStepIndex <= 0}
              >
                Previous
              </Button>
              <Button onClick={handlePlayPause} variant="outline">
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={() =>
                  setCurrentStepIndex((prev) =>
                    Math.min(visualizationSteps.length - 1, prev + 1)
                  )
                }
                disabled={currentStepIndex >= visualizationSteps.length - 1}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        <div ref={containerRef} className="flex-grow">
          <BSTVisualization
            root={bst.root}
            width={containerWidth}
            highlightedNodes={
              visualizationSteps[currentStepIndex]?.highlightedNodes
            }
            currentStep={visualizationSteps[currentStepIndex]}
          />
        </div>

        <div className="flex justify-center items-center mt-4 space-x-4">
          <Button
            onClick={() =>
              dispatch({ type: "LOAD_ITERATION", index: currentIndex - 1 })
            }
            disabled={currentIndex <= 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-gray-700 font-medium">
            Iteration {currentIndex + 1} of {iterations.length}
          </span>
          <Button
            onClick={() =>
              dispatch({ type: "LOAD_ITERATION", index: currentIndex + 1 })
            }
            disabled={currentIndex >= iterations.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            onClick={() =>
              dispatch({ type: "DELETE_ITERATION", index: currentIndex })
            }
            disabled={iterations.length === 0}
            variant="destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}