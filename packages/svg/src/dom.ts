const NS = 'http://www.w3.org/2000/svg';

export function setupSvgRoot(svg: SVGSVGElement, defs?: (defs: SVGDefsElement) => void) {
  svg.setAttribute('xmlns', NS);

  if (!svg.querySelector("g[data-fm='viewport']")) {
    const viewportG = document.createElementNS(NS, 'g');
    viewportG.setAttribute('data-fm', 'viewport');

    const gridG = document.createElementNS(NS, 'g');
    gridG.setAttribute('data-fm', 'grid');

    const objectsG = document.createElementNS(NS, 'g');
    objectsG.setAttribute('data-fm', 'objects');

    const selectionG = document.createElementNS(NS, 'g');
    selectionG.setAttribute('data-fm', 'selection');

    const overlaysG = document.createElementNS(NS, 'g');
    overlaysG.setAttribute('data-fm', 'overlays');

    viewportG.appendChild(gridG);
    viewportG.appendChild(objectsG);
    viewportG.appendChild(selectionG);
    viewportG.appendChild(overlaysG);
    svg.appendChild(viewportG);

    if (defs && !svg.querySelector("defs[data-fm='defs']")) {
      const defsElement = document.createElementNS(NS, 'defs') as SVGDefsElement;
      defsElement.setAttribute('data-fm', 'defs');
      svg.appendChild(defsElement);
      defs(defsElement);
    }
  }
}

export function getGroups(svg: SVGSVGElement) {
  const viewportG = svg.querySelector<SVGGElement>("g[data-fm='viewport']")!;

  return {
    viewportG: viewportG,
    gridG: viewportG.querySelector<SVGGElement>("g[data-fm='grid']")!,
    objectsG: viewportG.querySelector<SVGGElement>("g[data-fm='objects']")!,
    selectionG: viewportG.querySelector<SVGGElement>("g[data-fm='selection']")!,
    overlaysG: viewportG.querySelector<SVGGElement>("g[data-fm='overlays']")!,
  };
}

export function clearChildren(node: Element) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}
