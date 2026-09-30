const NS = 'http://www.w3.org/2000/svg';

export function setupSvgRoot(svg: SVGSVGElement, defs?: (defs: SVGDefsElement) => void) {
  svg.setAttribute('xmlns', NS);

  if (!svg.querySelector("g[data-spatial='viewport']")) {
    const viewportG = document.createElementNS(NS, 'g');
    viewportG.setAttribute('data-spatial', 'viewport');

    const gridG = document.createElementNS(NS, 'g');
    gridG.setAttribute('data-spatial', 'grid');

    const objectsG = document.createElementNS(NS, 'g');
    objectsG.setAttribute('data-spatial', 'objects');

    const selectionG = document.createElementNS(NS, 'g');
    selectionG.setAttribute('data-spatial', 'selection');

    const overlaysG = document.createElementNS(NS, 'g');
    overlaysG.setAttribute('data-spatial', 'overlays');

    viewportG.appendChild(gridG);
    viewportG.appendChild(objectsG);
    viewportG.appendChild(selectionG);
    viewportG.appendChild(overlaysG);
    svg.appendChild(viewportG);
  }

  if (defs && !svg.querySelector("defs[data-spatial='defs']")) {
    const defsElement = document.createElementNS(NS, 'defs') as SVGDefsElement;
    defsElement.setAttribute('data-spatial', 'defs');
    svg.appendChild(defsElement);
    defs(defsElement);
  }
}

export function getGroups(svg: SVGSVGElement) {
  const viewportG = svg.querySelector<SVGGElement>("g[data-spatial='viewport']")!;

  return {
    viewportG: viewportG,
    gridG: viewportG.querySelector<SVGGElement>("g[data-spatial='grid']")!,
    objectsG: viewportG.querySelector<SVGGElement>("g[data-spatial='objects']")!,
    selectionG: viewportG.querySelector<SVGGElement>("g[data-spatial='selection']")!,
    overlaysG: viewportG.querySelector<SVGGElement>("g[data-spatial='overlays']")!,
  };
}

export function clearChildren(node: Element) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}
