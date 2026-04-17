import type { OlliDataset } from 'olli-vis';

export async function getVegaView(spec: any): Promise<any> {
  const vega = await import('vega');
  const runtime = vega.parse(spec);
  const view = await new vega.View(runtime).renderer('svg').hover().runAsync();
  return view;
}

export function getVegaScene(view: any): any {
  return (view.scenegraph() as any).root.items[0];
}

export function filterUniqueObjects<T>(arr: T[]): T[] {
  return arr.filter((value, index) => {
    const _value = JSON.stringify(value);
    return (
      index ===
      arr.findIndex((obj) => {
        return JSON.stringify(obj) === _value;
      })
    );
  });
}

export function findScenegraphNodes(scenegraphNode: any, passRole: string): any[] {
  let nodes: any[] = [];
  const cancelRoles: string[] = ['cell', 'axis-grid'];
  if (scenegraphNode.items === undefined) {
    return nodes;
  }
  for (const nestedItem of scenegraphNode.items) {
    if (nestedItem.role !== undefined) {
      if (nestedItem.role === passRole && verifyNode(nestedItem, cancelRoles)) {
        nodes.push(nestedItem);
      } else {
        nodes = nodes.concat(findScenegraphNodes(nestedItem, passRole));
      }
    } else {
      nodes = nodes.concat(findScenegraphNodes(nestedItem, passRole));
    }
  }
  return nodes;
}

function verifyNode(scenegraphNode: any, cancelRoles: string[]): boolean {
  if (scenegraphNode.role !== undefined && !cancelRoles.some((role: string) => scenegraphNode.role.includes(role))) {
    if (
      scenegraphNode.items.every((item: any) => verifyNode(item, cancelRoles)) ||
      scenegraphNode.items === undefined
    ) {
      return true;
    } else {
      return false;
    }
  } else if (scenegraphNode.role === undefined && scenegraphNode.items !== undefined) {
    return scenegraphNode.items.every((item: any) => verifyNode(item, cancelRoles));
  } else if (scenegraphNode.role === undefined && scenegraphNode.items === undefined) {
    return true;
  } else {
    return false;
  }
}

export function getData(scene: any): OlliDataset[] {
  try {
    const datasets = scene.context.data;
    const data_n = Object.keys(datasets).filter((name) => {
      return name.match(/data_\d/);
    });
    if (data_n.length) {
      return data_n
        .map((name) => {
          return datasets[name].values.value as OlliDataset;
        })
        .filter((d: OlliDataset, idx: number, self: OlliDataset[]) => {
          if (!d.length) {
            return false;
          }
          if (Object.keys(d[0]!).length === 0) {
            return false;
          }
          return (
            self.findLastIndex((d2: OlliDataset) => d2.length > 0 && Object.keys(d2[0]!).every((k) => Object.keys(d[0]!).includes(k))) === idx
          );
        });
    } else {
      const source_n = Object.keys(datasets).filter((name) => {
        return name.match(/(source)|(data)_\d/);
      });
      const name = source_n[source_n.length - 1]!;
      const dataset = datasets[name].values.value as OlliDataset;
      return [dataset];
    }
  } catch (error) {
    throw new Error(`No data found in the Vega scenegraph \n ${error}`);
  }
}

export function getVegaAxisTicks(scene: any): any[] | null {
  const axisTicks = findNodeByRole(scene, 'axis-tick');

  if (axisTicks.length) {
    const ticks = axisTicks.map((axis: any) => axis.items.map((n: any) => n.datum.value));
    return ticks;
  }

  return null;
}

function findNodeByRole(node: any, role: string, found: any[] = []): any[] {
  if ('role' in node) {
    if (node.role === role) {
      found.push(node);
    }
    return node.items.reduce((acc: any[], n: any) => findNodeByRole(n, role, acc), found);
  }
  if ('items' in node) {
    return node.items.reduce((acc: any[], n: any) => findNodeByRole(n, role, acc), found);
  }
  return found;
}
