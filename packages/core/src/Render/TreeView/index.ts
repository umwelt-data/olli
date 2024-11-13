import { getCustomizedDescription } from '../../Customization';
import { ElaboratedOlliNode } from '../../Structure/Types';
import './TreeStyle.css';

export function renderTree(node: ElaboratedOlliNode): HTMLElement {
  const root = document.createElement('ul');
  const labelId = `${node.id}-label`;

  root.setAttribute('role', 'tree');
  root.setAttribute('aria-labelledby', labelId);

  root.appendChild(_renderTree(node, 1, 1, 1));
  root.querySelector('span')?.setAttribute('id', labelId);

  return root;

  function _renderTree(node: ElaboratedOlliNode, level: number, posinset: number, setsize: number): HTMLElement {
    const item = document.createElement('li');
    item.setAttribute('role', 'treeitem');
    item.setAttribute('aria-level', String(level));
    item.setAttribute('aria-setsize', String(setsize));
    item.setAttribute('aria-posinset', String(posinset));
    item.setAttribute('id', node.id);

    const label = document.createElement('span');
    label.innerHTML = getCustomizedDescription(node);
    item.appendChild(label);

    if (node.children.length) {
      const childContainer = document.createElement('ul');
      childContainer.setAttribute('role', 'group');

      node.children.forEach((n, index, array) => {
        childContainer.appendChild(_renderTree(n, level + 1, index + 1, array.length));
      });
      item.appendChild(childContainer);
    }

    return item;
  }
}
