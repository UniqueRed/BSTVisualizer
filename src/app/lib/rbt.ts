export enum Color {
  RED,
  BLACK,
}

export class RBTNode {
  value: number;
  left: RBTNode | null;
  right: RBTNode | null;
  parent: RBTNode | null;
  color: Color;

  constructor(value: number) {
    this.value = value;
    this.left = null;
    this.right = null;
    this.parent = null;
    this.color = Color.RED; // New nodes are always red
  }

  // Helper method to create a node from a plain object
  static fromObject(obj: any): RBTNode {
    const node = new RBTNode(obj.value);
    node.color = obj.color;
    return node;
  }
}

export class RedBlackTree {
  root: RBTNode | null;

  constructor(root: RBTNode | null = null) {
    this.root = root;
  }

  // Serialize the tree to a plain object structure
  toJSON() {
    const serializeNode = (node: RBTNode | null): any => {
      if (!node) return null;
      return {
        value: node.value,
        color: node.color,
        left: serializeNode(node.left),
        right: serializeNode(node.right),
      };
    };
    return serializeNode(this.root);
  }

  // Create a tree from a serialized structure
  static fromJSON(data: any): RedBlackTree {
    const deserializeNode = (obj: any): RBTNode | null => {
      if (!obj) return null;
      const node = RBTNode.fromObject(obj);
      node.left = deserializeNode(obj.left);
      node.right = deserializeNode(obj.right);
      if (node.left) node.left.parent = node;
      if (node.right) node.right.parent = node;
      return node;
    };
    return new RedBlackTree(deserializeNode(data));
  }

  insert(value: number) {
    const newNode = new RBTNode(value);
    if (!this.root) {
      this.root = newNode;
      newNode.color = Color.BLACK; // Root is always black
      return this;
    }
    this._insertNode(this.root, newNode);
    this._fixInsertion(newNode);
    return this;
  }

  private _insertNode(node: RBTNode, newNode: RBTNode) {
    if (newNode.value === node.value) {
      return; // Ignore duplicate values
    } else if (newNode.value < node.value) {
      if (node.left === null) {
        node.left = newNode;
        newNode.parent = node;
      } else {
        this._insertNode(node.left, newNode);
      }
    } else {
      if (node.right === null) {
        node.right = newNode;
        newNode.parent = node;
      } else {
        this._insertNode(node.right, newNode);
      }
    }
  }

  private _fixInsertion(node: RBTNode) {
    while (node.parent && node.parent.color === Color.RED) {
      if (node.parent.parent) {
        if (node.parent === node.parent.parent.left) {
          const uncle = node.parent.parent.right;
          if (uncle && uncle.color === Color.RED) {
            node.parent.color = Color.BLACK;
            uncle.color = Color.BLACK;
            node.parent.parent.color = Color.RED;
            node = node.parent.parent;
          } else {
            if (node === node.parent.right) {
              node = node.parent;
              this._rotateLeft(node);
            }
            if (node.parent) {
              node.parent.color = Color.BLACK;
              if (node.parent.parent) {
                node.parent.parent.color = Color.RED;
                this._rotateRight(node.parent.parent);
              }
            }
          }
        } else {
          const uncle = node.parent.parent.left;
          if (uncle && uncle.color === Color.RED) {
            node.parent.color = Color.BLACK;
            uncle.color = Color.BLACK;
            node.parent.parent.color = Color.RED;
            node = node.parent.parent;
          } else {
            if (node === node.parent.left) {
              node = node.parent;
              this._rotateRight(node);
            }
            if (node.parent) {
              node.parent.color = Color.BLACK;
              if (node.parent.parent) {
                node.parent.parent.color = Color.RED;
                this._rotateLeft(node.parent.parent);
              }
            }
          }
        }
      }
    }
    if (this.root) {
      this.root.color = Color.BLACK;
    }
  }

  delete(value: number) {
    const node = this._findNode(this.root, value);
    if (!node) return;
    this._deleteNode(node);
  }

  private _deleteNode(node: RBTNode) {
    let child: RBTNode | null = null;
    let originalColor = node.color;

    if (!node.left) {
      child = node.right;
      this._transplant(node, node.right);
    } else if (!node.right) {
      child = node.left;
      this._transplant(node, node.left);
    } else {
      const successor = this._findMin(node.right);
      originalColor = successor.color;
      child = successor.right;

      if (successor.parent === node) {
        if (child) child.parent = successor;
      } else {
        this._transplant(successor, successor.right);
        successor.right = node.right;
        successor.right.parent = successor;
      }

      this._transplant(node, successor);
      successor.left = node.left;
      successor.left.parent = successor;
      successor.color = node.color;
    }

    if (originalColor === Color.BLACK && child) {
      this._fixDeletion(child);
    }
  }

  private _fixDeletion(node: RBTNode) {
    while (node !== this.root && node.color === Color.BLACK) {
      if (node.parent) {
        if (node === node.parent.left) {
          let sibling = node.parent.right;
          if (sibling && sibling.color === Color.RED) {
            sibling.color = Color.BLACK;
            node.parent.color = Color.RED;
            this._rotateLeft(node.parent);
            sibling = node.parent.right;
          }
          if (
            sibling &&
            (!sibling.left || sibling.left.color === Color.BLACK) &&
            (!sibling.right || sibling.right.color === Color.BLACK)
          ) {
            sibling.color = Color.RED;
            node = node.parent;
          } else if (sibling) {
            if (!sibling.right || sibling.right.color === Color.BLACK) {
              if (sibling.left) sibling.left.color = Color.BLACK;
              sibling.color = Color.RED;
              this._rotateRight(sibling);
              sibling = node.parent.right;
            }
            if (sibling) {
              sibling.color = node.parent.color;
              node.parent.color = Color.BLACK;
              if (sibling.right) sibling.right.color = Color.BLACK;
              this._rotateLeft(node.parent);
              node = this.root!;
            }
          }
        } else {
          let sibling = node.parent.left;
          if (sibling && sibling.color === Color.RED) {
            sibling.color = Color.BLACK;
            node.parent.color = Color.RED;
            this._rotateRight(node.parent);
            sibling = node.parent.left;
          }
          if (
            sibling &&
            (!sibling.right || sibling.right.color === Color.BLACK) &&
            (!sibling.left || sibling.left.color === Color.BLACK)
          ) {
            sibling.color = Color.RED;
            node = node.parent;
          } else if (sibling) {
            if (!sibling.left || sibling.left.color === Color.BLACK) {
              if (sibling.right) sibling.right.color = Color.BLACK;
              sibling.color = Color.RED;
              this._rotateLeft(sibling);
              sibling = node.parent.left;
            }
            if (sibling) {
              sibling.color = node.parent.color;
              node.parent.color = Color.BLACK;
              if (sibling.left) sibling.left.color = Color.BLACK;
              this._rotateRight(node.parent);
              node = this.root!;
            }
          }
        }
      }
    }
    node.color = Color.BLACK;
  }

  private _transplant(u: RBTNode, v: RBTNode | null) {
    if (!u.parent) {
      this.root = v;
    } else if (u === u.parent.left) {
      u.parent.left = v;
    } else {
      u.parent.right = v;
    }
    if (v) {
      v.parent = u.parent;
    }
  }

  private _findNode(node: RBTNode | null, value: number): RBTNode | null {
    if (node === null || node.value === value) return node;
    if (value < node.value) return this._findNode(node.left, value);
    return this._findNode(node.right, value);
  }

  private _findMin(node: RBTNode): RBTNode {
    while (node.left !== null) {
      node = node.left;
    }
    return node;
  }

  private _rotateLeft(node: RBTNode) {
    if (!node.right) return;
    const newRoot = node.right;
    node.right = newRoot.left;
    if (newRoot.left) {
      newRoot.left.parent = node;
    }
    newRoot.parent = node.parent;
    if (!node.parent) {
      this.root = newRoot;
    } else if (node === node.parent.left) {
      node.parent.left = newRoot;
    } else {
      node.parent.right = newRoot;
    }
    newRoot.left = node;
    node.parent = newRoot;
  }

  private _rotateRight(node: RBTNode) {
    if (!node.left) return;
    const newRoot = node.left;
    node.left = newRoot.right;
    if (newRoot.right) {
      newRoot.right.parent = node;
    }
    newRoot.parent = node.parent;
    if (!node.parent) {
      this.root = newRoot;
    } else if (node === node.parent.right) {
      node.parent.right = newRoot;
    } else {
      node.parent.left = newRoot;
    }
    newRoot.right = node;
    node.parent = newRoot;
  }

  // Traversal methods
  preorder(): number[] {
    const result: number[] = [];
    const traverse = (node: RBTNode | null) => {
      if (!node) return;
      result.push(node.value);
      traverse(node.left);
      traverse(node.right);
    };
    traverse(this.root);
    return result;
  }

  inorder(): number[] {
    const result: number[] = [];
    const traverse = (node: RBTNode | null) => {
      if (!node) return;
      traverse(node.left);
      result.push(node.value);
      traverse(node.right);
    };
    traverse(this.root);
    return result;
  }

  postorder(): number[] {
    const result: number[] = [];
    const traverse = (node: RBTNode | null) => {
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
    const queue: RBTNode[] = [this.root];
    while (queue.length > 0) {
      const node = queue.shift()!;
      result.push(node.value);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    return result;
  }

  flipNodeColor(value: number) {
    const node = this._findNode(this.root, value);
    if (node) {
      node.color = node.color === Color.RED ? Color.BLACK : Color.RED;
    }
  }
}
