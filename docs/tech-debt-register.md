# Tech Debt Register

Tracks advisory deviations accepted at story close. Review at sprint retrospective.

---

- **2026-05-30** (OpeningKnowledgeCard.vue Component — S6-02): TR-IDs use `OKC-NN` format instead of standard `TR-opening-knowledge-cards-NNN`; not registered in `tr-registry.yaml`. Run `/architecture-review` to register formally. — tracked from `production/epics/opening-knowledge-cards/story-001-component.md`

- **2026-05-30** (OpeningKnowledgeCard.vue Component — S6-02): `parseInlineMarkdown` silently drops `__double__` underscore syntax (empty italic span filtered). Not a runtime risk for hand-authored cards, but tokenizer would need a lookahead fix to handle it correctly. — tracked from `production/epics/opening-knowledge-cards/story-001-component.md`

- **2026-05-30** (OpeningKnowledgeCard.vue Component — S6-02): Conditional `@click="card ? toggle() : undefined"` pattern in Vue template registers a no-op handler when `card` is null. Consider refactoring to v-if/v-else split or guard-inside-toggle for clarity. — tracked from `production/epics/opening-knowledge-cards/story-001-component.md`
