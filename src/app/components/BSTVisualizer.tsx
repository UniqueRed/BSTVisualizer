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
  XIcon,
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
import { BST } from "@/app/lib/bst";
import { RedBlackTree, Color } from "@/app/lib/rbt";
import { motion, AnimatePresence } from "framer-motion";
import { AVLTree } from "@/app/lib/avl";

type TreeType = "bst" | "rbt" | "avl";

type TreeAction =
  | { type: "INSERT"; value: number }
  | {
      type: "DELETE";
      value: number;
      replacementType?: "predecessor" | "successor";
    }
  | { type: "ROTATE"; parent: number; child: number }
  | { type: "CLEAR" }
  | { type: "SAVE_ITERATION" }
  | { type: "LOAD_ITERATION"; index: number }
  | { type: "DELETE_ITERATION"; index: number }
  | { type: "CLEAR_ALL_ITERATIONS" }
  | { type: "SET_TREE_TYPE"; treeType: TreeType }
  | { type: "FLIP_NODE_COLOR"; value: number };

interface TreeState {
  current: BST | RedBlackTree | AVLTree;
  iterations: (BST | RedBlackTree | AVLTree)[];
  currentIndex: number;
  treeType: TreeType;
}

function treeReducer(state: TreeState, action: TreeAction): TreeState {
  const newTree =
    state.treeType === "bst"
      ? new BST(JSON.parse(JSON.stringify(state.current.root)))
      : state.treeType === "rbt"
      ? RedBlackTree.fromJSON((state.current as RedBlackTree).toJSON())
      : new AVLTree(JSON.parse(JSON.stringify(state.current.root)));

  switch (action.type) {
    case "INSERT":
      newTree.insert(action.value);
      return { ...state, current: newTree };
    case "DELETE":
      newTree.delete(action.value);
      return { ...state, current: newTree };
    case "ROTATE":
      if (state.treeType === "bst") {
        (newTree as BST).rotate(action.parent, action.child);
      }
      return { ...state, current: newTree };
    case "CLEAR":
      return {
        ...state,
        current:
          state.treeType === "bst"
            ? new BST()
            : state.treeType === "rbt"
            ? new RedBlackTree()
            : new AVLTree(),
      };
    case "SAVE_ITERATION":
      return {
        ...state,
        iterations: [
          ...state.iterations,
          state.treeType === "bst"
            ? new BST(JSON.parse(JSON.stringify(state.current.root)))
            : state.treeType === "rbt"
            ? RedBlackTree.fromJSON((state.current as RedBlackTree).toJSON())
            : new AVLTree(JSON.parse(JSON.stringify(state.current.root))),
        ],
        currentIndex: state.iterations.length,
      };
    case "LOAD_ITERATION":
      if (action.index >= 0 && action.index < state.iterations.length) {
        return {
          ...state,
          current:
            state.treeType === "bst"
              ? new BST(
                  JSON.parse(
                    JSON.stringify(state.iterations[action.index].root)
                  )
                )
              : state.treeType === "rbt"
              ? RedBlackTree.fromJSON(
                  (state.iterations[action.index] as RedBlackTree).toJSON()
                )
              : new AVLTree(
                  JSON.parse(
                    JSON.stringify(state.iterations[action.index].root)
                  )
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
              ? state.treeType === "bst"
                ? new BST(
                    JSON.parse(JSON.stringify(newIterations[newIndex].root))
                  )
                : state.treeType === "rbt"
                ? RedBlackTree.fromJSON(
                    (newIterations[newIndex] as RedBlackTree).toJSON()
                  )
                : new AVLTree(
                    JSON.parse(JSON.stringify(newIterations[newIndex].root))
                  )
              : state.treeType === "bst"
              ? new BST()
              : state.treeType === "rbt"
              ? new RedBlackTree()
              : new AVLTree(),
        };
      }
      return state;
    case "CLEAR_ALL_ITERATIONS":
      return {
        ...state,
        iterations: [],
        currentIndex: -1,
        current:
          state.treeType === "bst"
            ? new BST(JSON.parse(JSON.stringify(state.current.root)))
            : state.treeType === "rbt"
            ? RedBlackTree.fromJSON((state.current as RedBlackTree).toJSON())
            : new AVLTree(JSON.parse(JSON.stringify(state.current.root))),
      };
    case "SET_TREE_TYPE":
      return {
        ...state,
        treeType: action.treeType,
        current:
          action.treeType === "bst"
            ? new BST()
            : action.treeType === "rbt"
            ? new RedBlackTree()
            : new AVLTree(),
        iterations: [],
        currentIndex: -1,
      };
    case "FLIP_NODE_COLOR":
      if (state.treeType === "rbt") {
        (newTree as RedBlackTree).flipNodeColor(action.value);
      }
      return { ...state, current: newTree };
    default:
      return state;
  }
}

export default function BSTVisualizer() {
  const [{ current: tree, iterations, currentIndex, treeType }, dispatch] =
    useReducer(treeReducer, {
      current: new BST(),
      iterations: [],
      currentIndex: -1,
      treeType: "bst",
    });
  const [insertValue, setInsertValue] = useState("");
  const [deleteValue, setDeleteValue] = useState("");
  const [rotateParent, setRotateParent] = useState("");
  const [rotateChild, setRotateChild] = useState("");
  const [selectedTraversal, setSelectedTraversal] = useState("");
  const [traversalResult, setTraversalResult] = useState<number[]>([]);
  const [showTraversal, setShowTraversal] = useState(false);
  const [copying, setCopying] = useState(false);
  const [autoSaveIterations, setAutoSaveIterations] = useState(false);
  const [nodeColors, setNodeColors] = useState<Color[]>([]);
  const [manualMode, setManualMode] = useState(false);
  const [interactiveMode, setInteractiveMode] = useState(false);
  const [steps, setSteps] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [treeSnapshot, setTreeSnapshot] = useState<
    BST | RedBlackTree | AVLTree | null
  >(null);
  const [insertValueSnapshot, setInsertValueSnapshot] = useState<number | null>(
    null
  );
  const [replacementType, setReplacementType] = useState<
    "predecessor" | "successor"
  >("successor");
  const [balanceFactors, setBalanceFactors] = useState<number[]>([]);

  const handleInsert = () => {
    const value = Number(insertValue);
    if (!isNaN(value)) {
      if (interactiveMode && treeType === "bst") {
        const steps = BST.insertSteps(tree.root, value);
        setSteps(steps);
        setCurrentStep(0);
        setIsPlaying(false);
        setTreeSnapshot(
          treeType === "bst"
            ? new BST(JSON.parse(JSON.stringify(tree.root)))
            : treeType === "rbt"
            ? RedBlackTree.fromJSON((tree as RedBlackTree).toJSON())
            : new AVLTree(JSON.parse(JSON.stringify(tree.root)))
        );
        setInsertValueSnapshot(value);
      } else {
        dispatch({ type: "INSERT", value });
        if (autoSaveIterations) {
          setTimeout(() => dispatch({ type: "SAVE_ITERATION" }), 0);
        }
        setInsertValue("");
      }
    }
  };

  const handleDelete = () => {
    const value = Number(deleteValue);
    if (!isNaN(value)) {
      if (treeType === "bst") {
        dispatch({ type: "DELETE", value, replacementType });
      } else {
        dispatch({ type: "DELETE", value });
      }
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
      dispatch({ type: "ROTATE", parent, child });
      if (autoSaveIterations) {
        setTimeout(() => dispatch({ type: "SAVE_ITERATION" }), 0);
      }
      setRotateParent("");
      setRotateChild("");
    }
  };

  const handleTraverse = () => {
    let result: number[] = [];
    let nodeColors: Color[] = [];
    let balanceFactors: number[] = [];

    if (treeType === "rbt") {
      const traverseWithColors = (node: any) => {
        if (!node) return;
        switch (selectedTraversal) {
          case "preorder":
            result.push(node.value);
            nodeColors.push(node.color);
            traverseWithColors(node.left);
            traverseWithColors(node.right);
            break;
          case "inorder":
            traverseWithColors(node.left);
            result.push(node.value);
            nodeColors.push(node.color);
            traverseWithColors(node.right);
            break;
          case "postorder":
            traverseWithColors(node.left);
            traverseWithColors(node.right);
            result.push(node.value);
            nodeColors.push(node.color);
            break;
          case "levelOrder":
            const queue: any[] = [node];
            while (queue.length > 0) {
              const current = queue.shift()!;
              result.push(current.value);
              nodeColors.push(current.color);
              if (current.left) queue.push(current.left);
              if (current.right) queue.push(current.right);
            }
            break;
        }
      };
      traverseWithColors(tree.root);
    } else if (treeType === "avl") {
      const traverseWithBalance = (node: any) => {
        if (!node) return;
        const getBalance = (n: any) => {
          return (n.right ? n.right.height : 0) - (n.left ? n.left.height : 0);
        };
        switch (selectedTraversal) {
          case "preorder":
            result.push(node.value);
            balanceFactors.push(getBalance(node));
            traverseWithBalance(node.left);
            traverseWithBalance(node.right);
            break;
          case "inorder":
            traverseWithBalance(node.left);
            result.push(node.value);
            balanceFactors.push(getBalance(node));
            traverseWithBalance(node.right);
            break;
          case "postorder":
            traverseWithBalance(node.left);
            traverseWithBalance(node.right);
            result.push(node.value);
            balanceFactors.push(getBalance(node));
            break;
          case "levelOrder":
            const queue: any[] = [node];
            while (queue.length > 0) {
              const current = queue.shift()!;
              result.push(current.value);
              balanceFactors.push(getBalance(current));
              if (current.left) queue.push(current.left);
              if (current.right) queue.push(current.right);
            }
            break;
        }
      };
      traverseWithBalance(tree.root);
    } else {
      switch (selectedTraversal) {
        case "preorder":
          result = tree.preorder();
          break;
        case "inorder":
          result = tree.inorder();
          break;
        case "postorder":
          result = tree.postorder();
          break;
        case "levelOrder":
          result = tree.levelOrder();
          break;
      }
    }

    setTraversalResult(result);
    setNodeColors(nodeColors);
    setBalanceFactors(balanceFactors);
    setShowTraversal(true);
  };

  const handleCloseTraversal = () => {
    setShowTraversal(false);
  };

  const handleCopyResult = async () => {
    try {
      setCopying(true);
      let text = "";
      if (treeType === "rbt") {
        text = traversalResult
          .map(
            (value, idx) =>
              `${value}(${nodeColors[idx] === Color.RED ? "R" : "B"})`
          )
          .join(", ");
      } else if (treeType === "avl") {
        text = traversalResult
          .map((value, idx) => `${value}(${balanceFactors[idx]})`)
          .join(", ");
      } else {
        text = traversalResult.join(", ");
      }
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => {
        setCopying(false);
      }, 1000);
    }
  };

  const handleClear = () => {
    dispatch({ type: "CLEAR" });
    setTraversalResult([]);
  };

  const handleSaveIteration = () => dispatch({ type: "SAVE_ITERATION" });
  const handlePrevIteration = () =>
    dispatch({ type: "LOAD_ITERATION", index: currentIndex - 1 });
  const handleNextIteration = () =>
    dispatch({ type: "LOAD_ITERATION", index: currentIndex + 1 });
  const handleDeleteIteration = () =>
    dispatch({ type: "DELETE_ITERATION", index: currentIndex });
  const handleClearAllIterations = () =>
    dispatch({ type: "CLEAR_ALL_ITERATIONS" });

  const handleTreeTypeChange = (newType: TreeType) => {
    dispatch({ type: "SET_TREE_TYPE", treeType: newType });
  };

  const handleNodeClick = (value: number) => {
    if (treeType === "rbt" && manualMode) {
      dispatch({ type: "FLIP_NODE_COLOR", value });
    }
  };

  const handleReplacementTypeChange = (value: "predecessor" | "successor") => {
    setReplacementType(value);
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && currentIndex > 0) {
        handlePrevIteration();
      } else if (
        e.key === "ArrowRight" &&
        currentIndex < iterations.length - 1
      ) {
        handleNextIteration();
      } else if (e.key === "Enter") {
        if (insertValue) handleInsert();
        else if (deleteValue) handleDelete();
        else if (rotateParent && rotateChild) handleRotate();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    insertValue,
    deleteValue,
    rotateParent,
    rotateChild,
    currentIndex,
    iterations,
  ]);

  // Interactive mode controls
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (interactiveMode && isPlaying && steps.length > 0) {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < steps.length - 1) return prev + 1;
          setIsPlaying(false);
          return prev;
        });
      }, 1200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [interactiveMode, isPlaying, steps]);

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      if (currentStep === 1 && treeSnapshot && insertValueSnapshot !== null) {
        dispatch({ type: "SET_TREE_TYPE", treeType });
        dispatch({ type: "CLEAR" });
        if (treeType === "bst") {
          dispatch({ type: "INSERT", value: insertValueSnapshot });
        } else if (treeType === "rbt") {
          dispatch({ type: "INSERT", value: insertValueSnapshot });
        } else {
          dispatch({ type: "INSERT", value: insertValueSnapshot });
        }
      }
    }
  };
  const handlePlayPause = () => setIsPlaying((p) => !p);
  const handleRestart = () => {
    setCurrentStep(0);
    if (treeSnapshot && insertValueSnapshot !== null) {
      dispatch({ type: "SET_TREE_TYPE", treeType });
      dispatch({ type: "CLEAR" });
      if (treeType === "bst") {
        dispatch({ type: "INSERT", value: insertValueSnapshot });
      } else if (treeType === "rbt") {
        dispatch({ type: "INSERT", value: insertValueSnapshot });
      } else {
        dispatch({ type: "INSERT", value: insertValueSnapshot });
      }
    }
  };

  // When interactive mode steps are completed, perform the insert
  useEffect(() => {
    if (
      interactiveMode &&
      steps.length > 0 &&
      currentStep === steps.length - 1 &&
      steps[currentStep].action === "insert"
    ) {
      const value = Number(insertValue);
      dispatch({ type: "INSERT", value });
      if (autoSaveIterations) {
        setTimeout(() => dispatch({ type: "SAVE_ITERATION" }), 0);
      }
      setInsertValue("");
    }
  }, [interactiveMode, steps, currentStep]);

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 bg-gray-100 h-full rounded-lg">
      <div className="w-full md:w-1/3 bg-white p-6 rounded-lg shadow-md space-y-6">
        <h2 className="text-xl font-semibold text-gray-700">Tree Controls</h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tree Type</Label>
            <Select value={treeType} onValueChange={handleTreeTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select tree type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bst">Binary Search Tree</SelectItem>
                <SelectItem value="rbt">Red-Black Tree</SelectItem>
                <SelectItem value="avl">AVL Tree</SelectItem>
              </SelectContent>
            </Select>
          </div>

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

          {treeType === "bst" && (
            <div className="space-y-2">
              <Label>Rotate Nodes</Label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  value={rotateParent}
                  onChange={(e) => setRotateParent(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRotate()}
                  placeholder="Parent"
                />
                <Input
                  type="number"
                  value={rotateChild}
                  onChange={(e) => setRotateChild(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRotate()}
                  placeholder="Child"
                />
                <Button onClick={handleRotate}>Rotate</Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Replacement Type</Label>
            <Select
              value={replacementType}
              onValueChange={handleReplacementTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select replacement type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="predecessor">Predecessor</SelectItem>
                <SelectItem value="successor">Successor</SelectItem>
              </SelectContent>
            </Select>
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
                disabled={!selectedTraversal || !tree.root}
              >
                Traverse
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {showTraversal && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <Alert className="relative">
                  <AlertDescription className="pr-16">
                    Traversal Result:
                    <br />[
                    {traversalResult.map((value, index) => (
                      <span key={index}>
                        {value}
                        {treeType === "rbt" && (
                          <span className="text-sm">
                            ({nodeColors[index] === Color.RED ? "R" : "B"})
                          </span>
                        )}
                        {treeType === "avl" && (
                          <span className="text-sm">
                            ({balanceFactors[index]})
                          </span>
                        )}
                        {index < traversalResult.length - 1 ? ", " : ""}
                      </span>
                    ))}
                    ]
                  </AlertDescription>
                  <div className="absolute top-2 right-2 flex justify-end items-center space-x-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleCopyResult}
                    >
                      {copying ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleCloseTraversal}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <Accordion type="single" collapsible>
            <AccordionItem value="advanced">
              <AccordionTrigger style={{ textDecoration: "none" }}>
                Advanced Options
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="autoSave"
                      checked={autoSaveIterations}
                      onCheckedChange={(checked) =>
                        setAutoSaveIterations(checked === true)
                      }
                    />
                    <Label htmlFor="autoSave">Autosave Iterations</Label>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex justify-between gap-1">
            <Button
              onClick={handleClear}
              variant="destructive"
              className="outline-none"
            >
              Clear
            </Button>
            <Button
              onClick={handleClearAllIterations}
              variant="destructive"
              className="outline-none"
            >
              Clear Iterations
            </Button>
            <Button onClick={handleSaveIteration}>Save Iteration</Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-grow bg-white p-6 rounded-lg shadow-md">
        <div ref={containerRef} className="flex-grow">
          <BSTVisualization
            root={tree.root}
            width={containerWidth}
            treeType={treeType}
            onNodeClick={handleNodeClick}
          />
        </div>

        <div className="flex justify-center items-center mt-4 space-x-4">
          <Button onClick={handlePrevIteration} disabled={currentIndex <= 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-gray-700 font-medium">
            Iteration {currentIndex + 1} of {iterations.length}
          </span>
          <Button
            onClick={handleNextIteration}
            disabled={currentIndex >= iterations.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleDeleteIteration}
            disabled={iterations.length === 0}
            variant="destructive"
            className="outline-none"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {interactiveMode && steps.length > 0 && (
          <div className="flex flex-col items-center mt-4">
            <div className="mb-2 text-center text-blue-700 font-medium">
              {steps[currentStep]?.explanation}
            </div>
            <div className="flex space-x-2">
              <Button onClick={handlePrevStep} disabled={currentStep === 0}>
                Prev
              </Button>
              <Button onClick={handlePlayPause}>
                {isPlaying ? "Pause" : "Play"}
              </Button>
              <Button
                onClick={handleNextStep}
                disabled={currentStep === steps.length - 1}
              >
                Next
              </Button>
              <Button onClick={handleRestart}>Restart</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
