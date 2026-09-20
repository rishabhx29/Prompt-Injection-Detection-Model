# 02 — Structure Tools (Graft & Graphify)

Both are **structure providers**: they tell you where things are and how they connect. One is
primary per project (`config/agent_config.yaml` → `structure.primary`); the fallback fires only
when the primary genuinely cannot answer (e.g., primary=graft but the task needs PDF/doc
mapping → graphify). Structure tools **never edit code** — they navigate; you edit source.

## Choosing the primary (once per project, in discovery)

| Dimension | Graft (`@nanonets/graft`) | Graphify (`graphifyy`) |
|---|---|---|
| Output | Linked **plain-English markdown nodes** + per-symbol `wiring.json` | Deterministic **graph.json** + HTML viz + report |
| Explanations | LLM-written summaries + crux excerpts inline (needs key for --deep) | AST-extracted edges tagged EXTRACTED/INFERRED (no LLM for code) |
| Freshness | Auto-refreshes vs working tree on every query (~3 ms) | Rebuild by re-running `graphify .` |
| Extras | MCP tools, Claude Code hooks/statusline, `--lsp` edges | Docs/PDF/images/video mapping, Neo4j/FalkorDB push |
| Ecosystem | Node/npm | Python/uv |
| Choose when | Fast orientation with prose explanations + MCP | Deterministic queries, token-light lookups, non-code assets |

## Route here when the task asks (and NOT elsewhere)

"Where is X implemented?" · "What calls/imports/depends on X?" · "What will changing X affect?"
· "How is this subsystem organized?" · "Trace how A connects to B."

Not for: past solutions (→ lessons), durable facts (→ Mem0), tiny targets you already know
(just read the file), or editing.

## Graft — how to use

`graft/` = gitignored local cache of linked markdown nodes (Summary / Crux / Sources /
`[[wikilinks]]` / Notes) + `.graph/wiring.json` per-symbol tree-sitter graph. Summaries are
model-written prose; "Notes" are preserved human/agent context — treat both as leads, verify
before relying. Don't run `graft build` mid-task without cause; queries auto-refresh.

```bash
graft ask "where does capture happen?"   # plain-language orientation from the graph
graft callers <symbol>                   # blast radius before you change a line
graft grep <pattern>                     # search node contents
graft map                                # top-level nodes/links view
graft skeleton <path>                    # structural outline of a file/area
graft check                              # freshness/status
```

MCP preferred when wired (`graft_find_code` / `graft_file_api` — names per your wiring).

## Graphify — how to use

`graphify-out/`: `graph.json` (full graph; edges tagged EXTRACTED = explicit in source, trust;
INFERRED = resolved lead, verify) + `GRAPH_REPORT.md` + clickable `graph.html`.

```bash
graphify explain "APIRouter"             # node + connections + source file/line refs
graphify path "FastAPI" "ModelField"     # shortest path between concepts
graphify query "how does auth middleware run?"   # scoped subgraph for a question
```

Also maps docs/PDFs/schemas/media into the same graph (needs a semantic backend — see
`01_INSTALLATION.md`). Rebuild with `graphify .` after large changes if the graph is stale.

## Shared workflow pattern

```
1. One focused query (graft ask/callers · graphify explain/path) → candidate files/edges
2. Read the actual source files → verify the claim (INFERRED edges & summaries are leads)
3. Edit source files (never graft/, never graphify-out/ — regenerate instead)
4. Optional after large tasks: rebuild the graph
```

## Query discipline (context cost)

- One oriented question beats three vague ones; prefer a specific symbol over broad queries.
- Pull only needed nodes/results; follow wikilinks lazily; drop results you won't use now.
- Cite the tool's file/line refs when jumping into source; don't hoard verbose output.
- A huge result set is a context-pressure signal — narrow the query, don't ingest it.
