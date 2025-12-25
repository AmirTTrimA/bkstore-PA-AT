# Catalog Domain — Canonical Model Design (Doc-Level)

## Design Goals

Keep these in mind while reading:

- Stable foundation for semantic reasoning  
- Explicit separation of meaning vs operation  
- Monolingual recommendation readiness (English)  
- Multilingual future compatibility  
- No premature intelligence or derived data  

---

## 1️⃣ Author Model — Semantic Identity Holder

### Purpose

Represents a real-world author identity — not popularity, not behavior, not analytics.

### Required Fields

#### Identity

- **name**  
  - Human-readable display name  
  - Not guaranteed unique  
  - Used in UI, search, and explanation layers  

- **normalized_name**  
  - Lowercased, stripped, normalized version of `name`  
  - Used for deduplication and matching  
  - Must be unique or at least indexed  

#### Language Context

- **primary_language**  
  - ISO language code (e.g. `en`, `fa`)  
  - Represents the dominant writing language  
  - Used to align with book language decisions  

### Optional Semantic Fields

- **biography**  
  - Long-form descriptive text  
  - Optional  
  - Language-dependent  
  - Weak semantic signal (never primary)  

- **active_years** *(future)*  
  - Not required now  
  - Explicitly documented as future enrichment  

### Operational Fields (Keep)

- **created_at**  
- **updated_at**  

### Explicit Rules

- An Author must exist before a Book can reference it  
- Author fields do **not** contain popularity, ranking, or recommendation data  
- Author biography enriches meaning but does **not** define similarity  

---

## 2️⃣ Book Model — Core Semantic Entity

### Purpose

Represents a semantic document that can later participate in similarity, clustering, and recommendation.

### Required Identity Fields

- **title**  
  - Human-readable  
  - Unique per author (not globally)  

- **slug**  
  - URL-safe identifier  
  - Globally unique  

- **isbn**  
  - Unique  
  - Treated as a technical identifier, not semantic  

- **author**  
  - Foreign key to Author  
  - Treated as primary author  
  - Documented limitation: single author for now  

### Required Semantic Fields

- **description**  
  - Long-form textual description  
  - Required  
  - Primary semantic signal  
  - Must be written in the book’s language  

- **language**  
  - ISO language code  
  - Mandatory  
  - Recommendation pipeline only processes `en`  

- **genres**  
  - Many-to-many relation to Genre  
  - At least one required for semantic completeness  

- **tags**  
  - Many-to-many relation to Tag  
  - Optional but strongly encouraged  
  - Used for overlap reinforcement and explanation  

### Optional Semantic Fields

- **publication_year**  
  - Integer  
  - Weak semantic signal  
  - Useful for contextual similarity  

- **edition**  
  - Text or small integer  
  - Not semantic, but contextual  

### Operational / Commerce Fields  
*(Keep, Non-Semantic)*

- **cover_image_url**  
- **is_digital**  
- **is_audio**  
- **digital_file_path**  
- **audio_file_path**  

These fields:

- Stay in the Book model  
- Are explicitly excluded from semantic logic  

### Lifecycle & Completeness Concept

A Book is considered **semantically eligible** when:

- `description` exists  
- `language` is supported  
- At least one `genre` exists  
- `author` exists  

This may later become:

- A boolean field  
- A computed property  
- A validation rule  

For now, it is a **documented invariant**.

---

## 3️⃣ Genre Model — Controlled Semantic Axis

### Purpose

Represents high-level categorical meaning, not marketing labels.

### Required Fields

- **name**  
  - Human-readable genre name (e.g. *Science Fiction*)  

- **slug**  
  - URL-safe identifier  
  - Unique  

- **normalized_name**  
  - Used for matching and comparison  
  - Unique or indexed  

### Optional Fields

- **description**  
  - Short explanation of genre scope  
  - Helps curators and future explainability  

- **parent_genre** *(future)*  
  - Self-referential relation  
  - Allows hierarchy (e.g. Fiction → Sci-Fi)  
  - Explicitly postponed  

### Explicit Rules

- Genres are curated, not user-generated  
- Genre set is intentionally small and stable  
- A Book can belong to multiple genres  
- Genres carry moderate semantic weight  

---

## 4️⃣ Tag Model — Fine-Grained Semantic Signals

### Purpose

Represents specific concepts, themes, motifs, or topics.

### Required Fields

- **name**  
  - Human-readable tag (e.g. *time travel*, *machine learning*)  

- **normalized_name**  
  - Used for deduplication and matching  
  - Must be unique  

### Optional Fields

- **description**  
  - Clarifies intended meaning  
  - Helps avoid semantic drift  

- **language**  
  - Language of the tag term  
  - Required if multilingual tagging is added later  

### Explicit Rules

- Tags are more numerous than genres  
- Tags are reusable across books  
- Tags provide strong overlap signals  
- Tags are controlled vocabulary (not free text)  

---

## 5️⃣ Relationship Summary (Mental Map)

- **Author → Book**  
  - One-to-many  
  - Future multi-author possibility  

- **Book ↔ Genre**  
  - Many-to-many  
  - Mandatory at least one  

- **Book ↔ Tag**  
  - Many-to-many  
  - Optional, but recommended  

---

## 6️⃣ What Is Explicitly Out of Scope (For This Layer)

Do **not** include:

- Similarity scores  
- Vector embeddings  
- Popularity counters  
- User ratings  
- Recommendation flags  
- Analytics fields  

This schema represents **truth and meaning only**.

---

## 7️⃣ When This Design Is “Correctly Applied”

You’ll know this step is done when:

- Every field has a semantic or operational justification  
- No intelligence depends on commerce data  
- Language boundaries are explicit  
- Genre and tag meaning is controlled  
- The schema feels boring but solid  
