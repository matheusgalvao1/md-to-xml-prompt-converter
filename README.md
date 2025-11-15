# Markdown → XML Converter

Simple browser-based tool for converting Markdown to XML. Headers become lowercase XML tags (using the header text as the tag name), and smaller headers are nested inside larger ones. Perfect for converting markdown prompts to XML format for LLMs.

## Features

- Two side-by-side editors with syntax highlighting (CodeMirror)
- Headers become XML tags with automatic nesting based on heading levels
- Supports italic/bold headings (`*Section*`, `__SECTION__`) as top-level headers
- Simple and modular design - easy to extend with new conversion strategies
- Real-time conversion as you type
- Clipboard copy and reset functionality

## How It Works

- **Headers → Tags**: Markdown headers (`# Title`) become lowercase XML tags (`<title>`). Spaces and special characters are replaced with underscores.
- **Italic/Bold Headings**: Lines with italic (`*Section*` or `_Section_`) or bold (`__SECTION__`) formatting at the root level are also treated as headers (level 1).
- **Nesting**: Smaller headers (e.g., `##`) are nested inside larger ones (e.g., `#`)
- **Content**: Text, lists, and code blocks are placed inside the appropriate header tags
- **Lists**: 
  - Bullet lists (`- item`) become `<item>...</item>` tags
  - Numbered lists (`1. item`) become `<item number="1">...</item>` tags with number attributes

### Example

```markdown
# Main Title
Some content here

## Subtitle
More content

### Sub-subtitle
Even more

- Bullet item
- Another bullet

1. First numbered item
2. Second numbered item
```

Becomes:

```xml
<main_title>
  Some content here
  <subtitle>
    More content
    <sub-subtitle>
      Even more
    </sub-subtitle>
  </subtitle>
  <item>Bullet item</item>
  <item>Another bullet</item>
  <item number="1">First numbered item</item>
  <item number="2">Second numbered item</item>
</main_title>
```

## Project Structure

- `index.html` – Main HTML shell with CodeMirror editors
- `src/styles.css` – Layout and styling
- `src/main.js` – UI wiring and event handlers
- `src/modules/ConversionManager.js` – Manages conversion strategies
- `src/converters/` – Converter implementations (each converter is a directory)
  - `matheusV1/` – Matheus v1 converter (default)
    - `index.js` – Converter implementation
    - `guide.js` – Conversion rules documentation
  - `index.js` – Exports all available converters
- `src/utils/text.js` – XML escaping and normalization helpers

## Local Usage

Because the project uses native ES modules, you need to serve it over HTTP:

```bash
npx serve .
# or
python3 -m http.server 4173
```

Then open the printed URL in your browser.

## Extending Conversion Logic

Add new converters by creating a directory in `src/converters/` with:
- `index.js` – Exports a converter object with `{ id, label, description, guidePath, convert(input) }`
- `guide.html` – HTML file containing the conversion rules documentation

Then export the converter from `src/converters/index.js`. The app currently ships with **Matheus v1**, which performs the heading→nested tag conversion shown above.

