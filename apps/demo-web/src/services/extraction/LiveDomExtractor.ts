import type { 
  PageRepresentation, 
  AccessibilityTextEntry 
} from '../../types/agentguard-contract';
import type { 
  IExtractionService, 
  ExtractionResult 
} from './IExtractionService';

export class LiveDomExtractor implements IExtractionService {
  readonly mode = 'live-dom' as const;

  async extractFromContainer(
    container: HTMLElement | null,
    fallbackPage: PageRepresentation
  ): Promise<ExtractionResult> {
    const startTime = performance.now();

    if (!container) {
      return {
        page: fallbackPage,
        metadata: {
          mode: 'live-dom',
          extractedAt: new Date().toISOString(),
          durationMs: Math.round(performance.now() - startTime),
          nodeCount: 0,
          ariaElementCount: 0
        }
      };
    }

    const visibleText: string[] = [];
    const domText: string[] = [];
    const hiddenText: string[] = [];
    const accessibilityText: AccessibilityTextEntry[] = [];

    let totalNodes = 0;

    // Helper to test if element is visually hidden
    const isElementHidden = (el: HTMLElement): boolean => {
      if (el.hidden) return true;
      const style = window.getComputedStyle ? window.getComputedStyle(el) : null;
      if (!style) return false;
      return (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        style.opacity === '0' ||
        (style.width === '0px' && style.height === '0px')
      );
    };

    // Helper to generate a friendly CSS selector
    const getSelector = (el: Element): string => {
      if (el.id) return `#${el.id}`;
      const tag = el.tagName.toLowerCase();
      const className = el.getAttribute('class');
      if (className) {
        const firstClass = className.trim().split(/\s+/)[0];
        if (firstClass) return `${tag}.${firstClass}`;
      }
      return tag;
    };

    // Recursive DOM walker
    const walkNode = (node: Node) => {
      totalNodes++;

      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text && text.length > 0) {
          const parent = node.parentElement;
          if (parent && isElementHidden(parent)) {
            hiddenText.push(text);
          } else {
            visibleText.push(text);
          }
        }
        return;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const selector = getSelector(el);

        // Record outer HTML tag snippet for DOM view
        const tagName = el.tagName.toLowerCase();
        if (!['script', 'style', 'svg', 'path'].includes(tagName)) {
          // Truncate long DOM tags for clean contract representation
          const snippet = el.outerHTML.split('>')[0] + '>';
          domText.push(snippet);
        }

        // Check for accessibility attributes
        const ariaLabel = el.getAttribute('aria-label');
        if (ariaLabel && ariaLabel.trim().length > 0) {
          accessibilityText.push({
            text: ariaLabel.trim(),
            kind: 'aria-label',
            selector: selector
          });
        }

        const ariaDescription = el.getAttribute('aria-description');
        if (ariaDescription && ariaDescription.trim().length > 0) {
          accessibilityText.push({
            text: ariaDescription.trim(),
            kind: 'aria-label',
            selector: selector
          });
        }

        const alt = el.getAttribute('alt');
        if (alt && alt.trim().length > 0) {
          accessibilityText.push({
            text: alt.trim(),
            kind: 'alt',
            selector: selector
          });
        }

        const roleDesc = el.getAttribute('aria-roledescription');
        if (roleDesc && roleDesc.trim().length > 0) {
          accessibilityText.push({
            text: roleDesc.trim(),
            kind: 'role_description',
            selector: selector
          });
        }

        // Recurse children
        for (let i = 0; i < el.childNodes.length; i++) {
          walkNode(el.childNodes[i]);
        }
      }
    };

    // Execute traversal
    walkNode(container);

    const durationMs = Math.max(1, Math.round(performance.now() - startTime));

    const extractedPage: PageRepresentation = {
      url: fallbackPage.url,
      title: fallbackPage.title,
      visibleText: visibleText.length > 0 ? visibleText : fallbackPage.visibleText,
      domText: domText.length > 0 ? domText : fallbackPage.domText,
      hiddenText: hiddenText,
      accessibilityText: accessibilityText.length > 0 ? accessibilityText : fallbackPage.accessibilityText,
      imageText: fallbackPage.imageText || []
    };

    return {
      page: extractedPage,
      metadata: {
        mode: 'live-dom',
        extractedAt: new Date().toISOString(),
        durationMs,
        nodeCount: totalNodes,
        ariaElementCount: accessibilityText.length
      }
    };
  }
}
