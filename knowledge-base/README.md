# Singapore FAQ Knowledge Base

This folder is the chatbot knowledge base for Question Singapore.

## Goals
- Keep English as the master source of truth.
- Maintain synchronized Korean and Chinese localized FAQs.
- Answer from FAQ first, and use LLM fallback only when no match exists.
- Auto-append new non-duplicate fallback answers into FAQ files.

## Folder Layout
- `sources/official-sources.md`: researched official source index.
- `faq/en/*.json`: English master FAQ by domain.
- `faq/ko/*.json`: Korean localized FAQ by domain.
- `faq/zh/*.json`: Chinese localized FAQ by domain.

## Domains
- `recruitment` (mapped to `employment` domain files)
- `property` (living, compliance, and daily operation; excludes investment/buy/sell/rent advisory)

## JSON Shape
Each domain file follows:

```json
{
  "meta": {
    "language": "en",
    "domain": "employment",
    "version": "2026-07-10",
    "sourceOfTruth": "English master",
    "entryCount": 10
  },
  "items": [
    {
      "id": "EMP-0001",
      "category": "employment",
      "internalCategory": "Employment Pass",
      "question": "Can foreigners change jobs while holding an Employment Pass?",
      "shortAnswer": "Yes, but a new pass approval is required before the new role starts.",
      "detailedAnswer": "...",
      "thingsToNote": "...",
      "relatedTopics": ["Employment Pass", "MOM"],
      "keywords": ["employment pass", "change employer"],
      "language": "en",
      "updatedAt": "2026-07-10",
      "sourceType": "manual",
      "riskLevel": "medium",
      "sourceRefs": ["MOM"]
    }
  ]
}
```

## Auto-Update Flow (LLM fallback)
1. Chatbot fails to match FAQ with threshold.
2. LLM generates an answer in EN/KO/ZH payload.
3. Run `tools/faq-add-from-llm.js` with the payload file.
4. Script performs duplicate checks against EN master question.
5. If non-duplicate, it appends synchronized entries to EN/KO/ZH domain files.
6. If duplicate, it skips and returns matched id.

## Website Chatbot Integration
- Frontend section is in `index.html` and handled by `script.js`.
- API endpoint is `api/chatbot.js`.
- API behavior:
  - FAQ-first search across `knowledge-base/faq/{lang}`
  - If no strong FAQ match, LLM fallback when `OPENAI_API_KEY` is available
  - If no LLM key, returns a safe offline fallback message

## AI Q&A Document Flow (PDF/TXT/MD)
To operate in an AI Q&A style without manually converting every new file into FAQ entries:

1. Put new files into `knowledge-base/raw-docs/`.
2. Copy `knowledge-base/raw-docs/manifest.sample.json` to `knowledge-base/raw-docs/manifest.json` and fill metadata:
  - `file`, `title`, `language`, `category`, `source`, `url`, `keywords`
3. Build index:
  - `node tools/build-doc-index.js`
4. Confirm generated file:
  - `knowledge-base/doc-index.json`
5. Deploy.

Supported formats:
- `.pdf` (requires `pdftotext` from poppler)
- `.txt`, `.text`, `.md`, `.json`
- `.docx`, `.doc`, `.rtf` (via macOS `textutil`)
- `.html`, `.htm`, `.csv`, `.tsv`, `.xml`, `.yaml`, `.yml`, `.log`

## Auto-Add to FAQ (Deduplicated)
If you want extracted document knowledge to be automatically appended into existing FAQ DB (EN master) with duplicate checks:

1. Build latest document index:
  - `node tools/build-doc-index.js`
2. Sync to FAQ with duplicate filtering:
  - `node tools/sync-doc-index-to-faq.js`
3. Optional dry-run only:
  - `node tools/sync-doc-index-to-faq.js --dry-run`
4. Optional stricter duplicate threshold:
  - `node tools/sync-doc-index-to-faq.js --threshold 0.8`
5. Optional file-scoped apply (approval scenario):
  - `node tools/sync-doc-index-to-faq.js --files fileA.pdf,fileB.docx`
6. Optional EN-only apply (skip KO/ZH sync):
  - `node tools/sync-doc-index-to-faq.js --no-locale-sync`

Notes:
- Sync script inserts EN and auto-syncs KO/ZH by default.
- Duplicate detection uses Jaccard similarity from `tools/faq-kb-lib.js`.
- Use lower threshold to skip more near-duplicates, higher threshold to allow more new entries.
- If `OPENAI_API_KEY` is configured, KO/ZH sync tries machine translation; otherwise it falls back to EN text copy.

## OCR for Scanned PDFs
- Primary extraction: `pdftotext` (poppler)
- OCR fallback for scanned PDFs: `pdftoppm` + `tesseract`
- If OCR dependencies are missing, script prints warning and skips unreadable PDFs.

## Admin Approval Workflow
- Admin page now exposes document suggestion review (`/admin.html`):
  - fetches proposal list from `GET /api/doc-suggestions`
  - marks duplicates vs existing FAQ
  - generates copy-ready command for selected files
- Final apply is executed by local command (safe, auditable):
  - `node tools/sync-doc-index-to-faq.js --files ...`

Chatbot now uses retrieved context from:
- FAQ files (`knowledge-base/faq/**`)
- Document index (`knowledge-base/doc-index.json`)

And returns:
- AI-style contextual answer
- Reference links when URLs are available in source metadata

### Optional Environment Variables
- `OPENAI_API_KEY`: enables LLM fallback.
- `OPENAI_MODEL`: optional model override (default `gpt-4o-mini`).

## Scale Plan to 700-1,200 FAQ
- Batch generation and review per domain:
  - Wave 1: 150/domain
  - Wave 2: 100/domain
  - Wave 3: 100/domain
- Gate each wave with quality checks:
  - duplicate rate
  - source reference coverage
  - unsafe claim filter
- Keep English as canonical and regenerate translation deltas only.
