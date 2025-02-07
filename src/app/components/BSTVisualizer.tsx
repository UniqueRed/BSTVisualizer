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
import { motion, AnimatePresence } from "framer-motion";

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
  const [insertValue, setInsertValue] = useState("");
  const [deleteValue, setDeleteValue] = useState("");
  const [rotateParent, setRotateParent] = useState("");
  const [rotateChild, setRotateChild] = useState("");
  const [selectedTraversal, setSelectedTraversal] = useState("");
  const [traversalResult, setTraversalResult] = useState<number[]>([]);
  const [showTraversal, setShowTraversal] = useState(false);
  const [copying, setCopying] = useState(false);
  const [autoSaveIterations, setAutoSaveIterations] = useState(false);

  const handleInsert = () => {
    const value = Number(insertValue);
    if (!isNaN(value)) {
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
    setShowTraversal(true);
  };

  const handleCloseTraversal = () => {
    setShowTraversal(false);
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

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 bg-gray-100 h-full rounded-lg">
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
                    <br />[{traversalResult.join(", ")}]
                  </AlertDescription>
                  {/* Fix: Moved buttons to the top-right corner with padding */}
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
          <BSTVisualization root={bst.root} width={containerWidth} />
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
      </div>
    </div>
  );
}
