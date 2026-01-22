import type { SerializedEditorState } from '@payloadcms/richtext-lexical'
import { lexicalHTML } from '@payloadcms/richtext-lexical'

export async function lexicalStateToHtml(editorState: SerializedEditorState | unknown) {
  if (!editorState || typeof editorState !== 'object') return ''
  return lexicalHTML(editorState as SerializedEditorState)
}
