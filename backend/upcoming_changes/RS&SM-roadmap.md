# Pre-Start Roadmap — Recommendation & Intelligence Foundation

## 0. Project Framing (Scope Lock)
The recommendation system is designed as a foundational intelligence layer rather than a production-scale system.  
The objective is to implement a robust backbone while clearly defining extensibility paths for future development.

Constraints:
- Offline processing only
- No external AI APIs
- No large models
- Proof-of-concept quality with production-aware design

---

## 1. Catalog Schema Redesign (Foundational)
The existing e-commerce catalog models are insufficient for semantic reasoning and must be redesigned.

Objectives:
- Represent books and authors as semantic entities, not just products
- Support similarity, grouping, and future graph relations
- Remain stable across future system evolution

Key principles:
- Explicit support for rich text content
- Clear separation between semantic, structural, and future-use fields
- Schema decisions are final and treated as long-term contracts

Deliverables:
- Finalized catalog schema (books, authors, related entities)
- Field classification by purpose (semantic / structural / social-ready)

---

## 2. Language Scope Definition
Although the platform is bilingual, semantic processing is intentionally monolingual at this stage.

Decisions:
- English is the sole language used for content-based intelligence
- Other languages remain supported at the data level but are excluded from recommendation computation

Rationale:
- NLP tooling maturity
- Reduced system complexity
- Clear academic justification

Deliverable:
- Explicit language constraint documented and enforced at design level

---

## 3. Dataset Design & Preparation
A small but semantically complete and representative dataset is required before implementing recommendation logic.

Dataset characteristics:
- Multiple authors with multiple works
- Overlapping themes across books
- Intentional diversity in description length and richness
- Inclusion of edge cases and ambiguous content

Principle:
- Semantic density and overlap matter more than dataset size

Deliverable:
- Curated demonstration dataset with known semantic relationships

---

## 4. Semantic Policy Definition
A fixed semantic policy must define how meaning is constructed from catalog data.

Policy elements:
- Ordered importance of textual fields
- Explicit inclusion and exclusion rules for semantic processing
- Clear distinction between primary meaning and supporting signals

Principles:
- The policy is immutable once Step 1 begins
- It serves as both a design rule and an implementation constraint

Deliverables:
- Documented semantic contract
- Planned alignment between design and implementation

---

## 5. Content Lifecycle & Recalculation Strategy
Content-based intelligence assumes relative content stability with append-heavy growth.

Decisions:
- New book additions are the primary trigger for recomputation
- Editing existing content is rare and handled asynchronously
- Recommendation data is eventually consistent rather than real-time

Processing model:
- Offline batch computation
- Recalculation triggered by thresholds or schedules
- Background execution using existing task infrastructure

Deliverables:
- Defined recomputation rules and triggers
- Clear separation between online request handling and offline processing

---

## 6. Infrastructure & Tooling Alignment
All system design decisions must align with existing project infrastructure.

Confirmed tools:
- Django and Django REST Framework
- PostgreSQL
- Python offline processing environment
- Celery for background task orchestration
- Existing message broker (Redis or equivalent)

Principles:
- No new infrastructure unless strictly necessary
- Preference for portability and operational simplicity

---

## 7. Step 1 Readiness Gate
Step 1 (Content Intelligence Backbone) begins only after all prerequisites are finalized.

Readiness criteria:
- Catalog schema is frozen
- Demonstration dataset is complete
- Language scope is enforced
- Semantic policy is agreed upon
- Content lifecycle rules are documented

Outcome:
- Step 1 implementation becomes mechanical, predictable, and defensible

---

## Closing Note
This roadmap prioritizes clarity over speed.  
By locking foundational decisions early, future implementation remains focused, coherent, and extensible.

The next planned steps are:
- Extracting a concrete catalog schema
- Defining a Step 1 action checklist
