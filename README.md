# Markdown → XML Converter

Simple browser-based tool for converting Markdown to XML. Headers become lowercase XML tags (using the header text as the tag name), and smaller headers are nested inside larger ones. Perfect for converting markdown prompts to XML format for LLMs.

## Features

- Two side-by-side editors with syntax highlighting (CodeMirror)
- Headers become XML tags with automatic nesting based on heading levels
- Supports italic/bold headings (`_SECTION_`, `__SECTION__`) as top-level headers
- Simple and modular design - easy to extend with new conversion strategies
- Real-time conversion as you type
- Clipboard copy and reset functionality

## How It Works

- **Headers → Tags**: Markdown headers (`# Title`) become lowercase XML tags (`<title>`). Spaces and special characters are replaced with underscores.
- **Italic/Bold Headings**: Lines with italic (`_SECTION_`) or bold (`__SECTION__`) formatting at the root level are also treated as headers (level 1).
- **Nesting**: Smaller headers (e.g., `##`) are nested inside larger ones (e.g., `#`). Headers are only indented when nested inside other headers, not based on their markdown level.
- **Content**: Text, lists, and code blocks are placed inside the appropriate header tags
- **Lists**: 
  - Bullet lists (`- item`) become `<item>...</item>` tags
  - Numbered lists (`1. item`) become `<item number="1">...</item>` tags with number attributes
  - Nested lists are properly indented inside parent list items

### Example

````markdown
## ROLE

You are a helpful assistant

__CONTRAINTS__
- Do not do x
- When y do:
  1. First step
  2. Second step

# PERSONALITY
## Tone
Be polite

# EXAMPLE
```python
print("Hey")
```
````

Becomes:

```xml
<role>
  You are a helpful assistant
</role>
<contraints>
  <item>Do not do x</item>
  <item>When y do:
    <item number="1">First step</item>
    <item number="2">Second step</item>
  </item>
</contraints>
<personality>
  <tone>
    Be polite
  </tone>
</personality>
<example>
  <code lang="python"><![CDATA[
print("Hey")
]]></code>
</example>
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
python3 -m http.server 3000
```

Then open the printed URL in your browser.

## Extending Conversion Logic

Add new converters by creating a directory in `src/converters/` with:
- `index.js` – Exports a converter object with `{ id, label, description, guidePath, convert(input) }`
- `guide.html` – HTML file containing the conversion rules documentation

Then export the converter from `src/converters/index.js`. The app currently ships with **Matheus v1**, which performs the heading→nested tag conversion shown above.

