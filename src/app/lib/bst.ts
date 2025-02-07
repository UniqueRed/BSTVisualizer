export class BSTNode {
  value: number;
  left: BSTNode | null;
  right: BSTNode | null;

  constructor(value: number) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

export class BST {
  root: BSTNode | null;

  constructor(root: BSTNode | null = null) {
    this.root = root;
  }

  insert(value: number) {
    const newNode = new BSTNode(value);
    if (!this.root) {
      this.root = newNode;
      return this;
    }
    this._insertNode(this.root, newNode);
    return this;
  }

  private _insertNode(node: BSTNode, newNode: BSTNode) {
    if (newNode.value === node.value) {
      return; // Ignore duplicate values
    } else if (newNode.value < node.value) {
      if (node.left === null) {
        node.left = newNode;
      } else {
        this._insertNode(node.left, newNode);
      }
    } else {
      if (node.right === null) {
        node.right = newNode;
      } else {
        this._insertNode(node.right, newNode);
      }
    }
  }

  delete(value: number) {
    this.root = this._deleteNode(this.root, value);
  }

  private _deleteNode(node: BSTNode | null, value: number): BSTNode | null {
    if (node === null) return null;

    if (value < node.value) {
      node.left = this._deleteNode(node.left, value);
    } else if (value > node.value) {
      node.right = this._deleteNode(node.right, value);
    } else {
      if (node.left === null) return node.right;
      if (node.right === null) return node.left;

      const minRight = this._findMin(node.right);
      node.value = minRight.value;
      node.right = this._deleteNode(node.right, minRight.value);
    }
    return node;
  }

  private _findMin(node: BSTNode): BSTNode {
    while (node.left !== null) {
      node = node.left;
    }
    return node;
  }

  rotate(parentValue: number, childValue: number) {
    const parent = this._findNode(this.root, parentValue);
    if (!parent) return;

    if (childValue < parentValue && parent.left) {
      this._rotateRight(parent);
    } else if (childValue > parentValue && parent.right) {
      this._rotateLeft(parent);
    }
  }

  private _findNode(node: BSTNode | null, value: number): BSTNode | null {
    if (node === null || node.value === value) return node;
    if (value < node.value) return this._findNode(node.left, value);
    return this._findNode(node.right, value);
  }

  private _rotateLeft(node: BSTNode) {
    if (!node.right) return;
    const newRoot = node.right;
    node.right = newRoot.left;
    newRoot.left = node;
    if (node === this.root) {
      this.root = newRoot;
    } else {
      const parent = this._findParent(this.root, node.value);
      if (parent) {
        if (parent.left === node) {
          parent.left = newRoot;
        } else {
          parent.right = newRoot;
        }
      }
    }
  }

  private _rotateRight(node: BSTNode) {
    if (!node.left) return;
    const newRoot = node.left;
    node.left = newRoot.right;
    newRoot.right = node;
    if (node === this.root) {
      this.root = newRoot;
    } else {
      const parent = this._findParent(this.root, node.value);
      if (parent) {
        if (parent.left === node) {
          parent.left = newRoot;
        } else {
          parent.right = newRoot;
        }
      }
    }
  }

  private _findParent(node: BSTNode | null, value: number): BSTNode | null {
    if (node === null || node.value === value) return null;
    if (
      (node.left && node.left.value === value) ||
      (node.right && node.right.value === value)
    )
      return node;
    if (value < node.value) return this._findParent(node.left, value);
    return this._findParent(node.right, value);
  }

  // New traversal methods
  preorder(): number[] {
    const result: number[] = [];

    const traverse = (node: BSTNode | null) => {
      if (!node) return;
      result.push(node.value); // Visit root
      traverse(node.left); // Traverse left subtree
      traverse(node.right); // Traverse right subtree
    };

    traverse(this.root);
    return result;
  }

  inorder(): number[] {
    const result: number[] = [];

    const traverse = (node: BSTNode | null) => {
      if (!node) return;
      traverse(node.left); // Traverse left subtree
      result.push(node.value); // Visit root
      traverse(node.right); // Traverse right subtree
    };

    traverse(this.root);
    return result;
  }

  postorder(): number[] {
    const result: number[] = [];

    const traverse = (node: BSTNode | null) => {
      if (!node) return;
      traverse(node.left); // Traverse left subtree
      traverse(node.right); // Traverse right subtree
      result.push(node.value); // Visit root
    };

    traverse(this.root);
    return result;
  }

  levelOrder(): number[] {
    if (!this.root) return [];

    const result: number[] = [];
    const queue: BSTNode[] = [this.root];

    while (queue.length > 0) {
      const node = queue.shift()!;
      result.push(node.value);

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    return result;
  }
}
