"""
Converts structured text content into Payload CMS Lexical JSON format.
Payload uses @payloadcms/richtext-lexical and expects a specific node tree.

Node spec (Payload CMS v3 / Lexical 0.14+):
  - All container nodes (paragraph, heading, listitem, list) require:
      textFormat: 0   — bitmask, 0 = no formatting
      textStyle: ""   — inline style string
  - Text nodes use format as integer bitmask (0 = plain, 1 = bold, 2 = italic…)
  - Missing textFormat causes silent validation failure on the whole richText field.
"""
from typing import Any


def _text_node(text: str, bold: bool = False) -> dict:
    return {
        "detail": 0,
        "format": 1 if bold else 0,
        "mode": "normal",
        "style": "",
        "text": text,
        "type": "text",
        "version": 1,
    }


def _paragraph(text: str) -> dict:
    return {
        "children": [_text_node(text)],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "textFormat": 0,
        "textStyle": "",
        "type": "paragraph",
        "version": 1,
    }


def _heading(text: str, tag: str = "h2") -> dict:
    return {
        "children": [_text_node(text)],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "tag": tag,
        "textFormat": 0,
        "textStyle": "",
        "type": "heading",
        "version": 1,
    }


def _list_item(text: str, value: int = 1) -> dict:
    return {
        "children": [_text_node(text)],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "textFormat": 0,
        "textStyle": "",
        "type": "listitem",
        "value": value,
        "version": 1,
    }


def _unordered_list(items: list[str]) -> dict:
    return {
        "children": [_list_item(item, i + 1) for i, item in enumerate(items)],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "listType": "bullet",
        "start": 1,
        "tag": "ul",
        "textFormat": 0,
        "textStyle": "",
        "type": "list",
        "version": 1,
    }


def markdown_to_lexical(text: str) -> dict[str, Any]:
    """
    Convert simple markdown-like text to Payload CMS Lexical JSON.
    Supports: # H1, ## H2, ### H3, blank-line-separated paragraphs,
    and - / * bullet list items.
    """
    children = []
    lines = text.strip().split("\n")
    i = 0
    bullet_buffer: list[str] = []

    def flush_bullets():
        if bullet_buffer:
            children.append(_unordered_list(list(bullet_buffer)))
            bullet_buffer.clear()

    while i < len(lines):
        line = lines[i].rstrip()

        if line.startswith("### "):
            flush_bullets()
            children.append(_heading(line[4:].strip(), "h3"))
        elif line.startswith("## "):
            flush_bullets()
            children.append(_heading(line[3:].strip(), "h2"))
        elif line.startswith("# "):
            flush_bullets()
            children.append(_heading(line[2:].strip(), "h1"))
        elif line.startswith("- ") or line.startswith("* "):
            bullet_buffer.append(line[2:].strip())
        elif line.strip():
            flush_bullets()
            children.append(_paragraph(line.strip()))
        else:
            flush_bullets()

        i += 1

    flush_bullets()

    return {
        "root": {
            "children": children,
            "direction": "ltr",
            "format": "",
            "indent": 0,
            "type": "root",
            "version": 1,
        }
    }
