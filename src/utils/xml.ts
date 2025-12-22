export function getChildren(node: Node, tagName: string): Element[] {
    return Array.from((node as Element).getElementsByTagName(tagName));
}

export function qAll(node: Node, selectors: string[]): Element[] {
    return Array.from((node as Element).querySelectorAll(selectors.join(',')));
}

export function qOne(node: Node, selectors: string[]): Element | null {
    return (node as Element).querySelector(selectors.join(','));
}

export function getAttr(node: Element | null, attrNames: string[]): string {
    if (!node) return '';
    for (const attrName of attrNames) {
        const attr = node.getAttribute(attrName);
        if (attr !== null) {
            return attr;
        }
    }
    return '';
}

export function getAttrNum(node: Element | null, attrNames: string[]): number {
    const attr = getAttr(node, attrNames);
    return attr ? parseInt(attr, 10) : 0;
}

export function getText(node: Element): string {
    return node.textContent || '';
}
