export class AVLNode {
  value: number;
  left: AVLNode | null;
  right: AVLNode | null;
  height: number;

  constructor(value: number) {
    this.value = value;
    this.left = null;
    this.right = null;
    this.height = 1;
  }
}

export class AVLTree {
  root: AVLNode | null;

  constructor(root: AVLNode | null = null) {
    this.root = root;
  }

  private getHeight(node: AVLNode | null): number {
    return node ? node.height : 0;
  }

  private getBalanceFactor(node: AVLNode | null): number {
    if (!node) return 0;
    return this.getHeight(node.left) - this.getHeight(node.right);
  }

  private updateHeight(node: AVLNode) {
    node.height =
      Math.max(this.getHeight(node.left), this.getHeight(node.right)) + 1;
  }

  private rotateRight(y: AVLNode): AVLNode {
    const x = y.left!;
    const T2 = x.right;

    x.right = y;
    y.left = T2;

    this.updateHeight(y);
    this.updateHeight(x);

    return x;
  }

  private rotateLeft(x: AVLNode): AVLNode {
    const y = x.right!;
    const T2 = y.left;

    y.left = x;
    x.right = T2;

    this.updateHeight(x);
    this.updateHeight(y);

    return y;
  }

  insert(value: number) {
    this.root = this._insertNode(this.root, value);
    return this;
  }

  private _insertNode(node: AVLNode | null, value: number): AVLNode {
    if (!node) {
      return new AVLNode(value);
    }

    if (value < node.value) {
      node.left = this._insertNode(node.left, value);
    } else if (value > node.value) {
      node.right = this._insertNode(node.right, value);
    } else {
      return node; // Duplicate values not allowed
    }

    this.updateHeight(node);

    const balance = this.getBalanceFactor(node);

    // Left Left Case
    if (balance > 1 && value < node.left!.value) {
      return this.rotateRight(node);
    }

    // Right Right Case
    if (balance < -1 && value > node.right!.value) {
      return this.rotateLeft(node);
    }

    // Left Right Case
    if (balance > 1 && value > node.left!.value) {
      node.left = this.rotateLeft(node.left!);
      return this.rotateRight(node);
    }

    // Right Left Case
    if (balance < -1 && value < node.right!.value) {
      node.right = this.rotateRight(node.right!);
      return this.rotateLeft(node);
    }

    return node;
  }

  delete(value: number) {
    this.root = this._deleteNode(this.root, value);
  }

  private _deleteNode(node: AVLNode | null, value: number): AVLNode | null {
    if (!node) return null;

    if (value < node.value) {
      node.left = this._deleteNode(node.left, value);
    } else if (value > node.value) {
      node.right = this._deleteNode(node.right, value);
    } else {
      if (!node.left) return node.right;
      if (!node.right) return node.left;

      const successor = this._findMin(node.right);
      node.value = successor.value;
      node.right = this._deleteNode(node.right, successor.value);
    }

    if (!node) return null;

    this.updateHeight(node);

    const balance = this.getBalanceFactor(node);

    // Left Left Case
    if (balance > 1 && this.getBalanceFactor(node.left) >= 0) {
      return this.rotateRight(node);
    }

    // Left Right Case
    if (balance > 1 && this.getBalanceFactor(node.left) < 0) {
      node.left = this.rotateLeft(node.left!);
      return this.rotateRight(node);
    }

    // Right Right Case
    if (balance < -1 && this.getBalanceFactor(node.right) <= 0) {
      return this.rotateLeft(node);
    }

    // Right Left Case
    if (balance < -1 && this.getBalanceFactor(node.right) > 0) {
      node.right = this.rotateRight(node.right!);
      return this.rotateLeft(node);
    }

    return node;
  }

  private _findMin(node: AVLNode): AVLNode {
    while (node.left) {
      node = node.left;
    }
    return node;
  }

  // Traversal methods
  inorder(): number[] {
    const result: number[] = [];
    const traverse = (node: AVLNode | null) => {
      if (!node) return;
      traverse(node.left);
      result.push(node.value);
      traverse(node.right);
    };
    traverse(this.root);
    return result;
  }

  preorder(): number[] {
    const result: number[] = [];
    const traverse = (node: AVLNode | null) => {
      if (!node) return;
      result.push(node.value);
      traverse(node.left);
      traverse(node.right);
    };
    traverse(this.root);
    return result;
  }

  postorder(): number[] {
    const result: number[] = [];
    const traverse = (node: AVLNode | null) => {
      if (!node) return;
      traverse(node.left);
      traverse(node.right);
      result.push(node.value);
    };
    traverse(this.root);
    return result;
  }

  levelOrder(): number[] {
    if (!this.root) return [];
    const result: number[] = [];
    const queue: AVLNode[] = [this.root];
    while (queue.length > 0) {
      const node = queue.shift()!;
      result.push(node.value);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    return result;
  }
}
