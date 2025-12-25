# Step 3 — Dataset Blueprint (Execution-Ready, Doc-Level)

## Objective

Create a small, controlled, English-only dataset that:  

- Supports semantic similarity  
- Contains intentional overlap and contrast  
- Enables explanation of recommendation results  
- Demonstrates correct exclusion of non-English content  

---

## 1️⃣ Global Dataset Constraints

These rules apply to everything in the dataset.

**All books used for semantic processing:**  
- Must be in English  
- Must have a non-empty description  
- Must have at least one genre  

**Non-English books:**  
- May exist in the database  
- Must be excluded from semantic computation  
- Should be explicitly labeled as such  

**Dataset size target:**  
- Authors: 6–10  
- Books: 25–40  
- Genres: 5–8  
- Tags: 30–60  

---

## 2️⃣ Genre Set Definition (First Step)

Create a fixed genre list before adding books.

**Guidelines:**  
- Genres must be broad  
- Genres must not overlap excessively  
- Each genre must plausibly contain multiple books  

**Example structure (pattern, do not hardcode names):**  
- Fiction  
- Science Fiction  
- History  
- Technology  
- Philosophy  
- Psychology  

**Rules:**  
- No genre creation after books are added  
- Each book must belong to 1–2 genres  
- Genre meaning must be documented in one sentence  

---

## 3️⃣ Author Creation Rules

Create authors before books.

**Author guidelines:**  
- 6–10 authors total  
- At least:  
  - 2 authors with multiple books  
  - 2 authors whose themes overlap with others  

**Author biographies:**  
- Optional  
- Written in English  
- Descriptive but not essential  

**Edge cases to include:**  
- Two authors writing about similar themes  
- One author writing across genres  

---

## 4️⃣ Book Distribution Plan

Books should be added in controlled groups, not randomly.

**Required Book Types**

- **Strongly Related Pairs**  
  - Same genre  
  - Similar tags  
  - Similar description vocabulary  

- **Weakly Related Pairs**  
  - Different genres  
  - Shared themes via tags or wording  

- **Same Author, Different Topics**  
  - Same author  
  - Different genres  
  - Minimal semantic overlap  

- **Different Authors, Same Theme**  
  - Different authors  
  - Same tags  
  - Different writing styles  

- **Clean Negative Examples**  
  - No shared genres  
  - No shared tags  
  - Distant descriptions  

- **Edge / Ambiguous Books**  
  - Broad or vague descriptions  
  - Overlapping tags across multiple domains  

---

## 5️⃣ Book Description Writing Rules (Critical)

Descriptions are the primary semantic signal.

**Rules:**  
- Minimum length: ~80–120 words  
- Maximum length: flexible, but not excessive  
- Must be:  
  - Thematic  
  - Natural language  
  - Not keyword lists  

**Variation is mandatory:**  
- Some descriptions: Rich and specific  
- Some descriptions: Broad and abstract  
- Some descriptions: Technical  
- Some descriptions: Narrative  

**Avoid:**  
- Copy-pasting summaries verbatim  
- Repeating tag names excessively  
- Formulaic language  

---

## 6️⃣ Tag Design Rules

Tags act as explicit semantic anchors.

**Guidelines:**  
- 30–60 total tags  
- Tags represent:  
  - Themes (e.g., identity, power)  
  - Topics (e.g., artificial intelligence)  
  - Concepts (e.g., ethics, memory)  

**Tags must be:**  
- Reusable across books  
- Consistent in naming  
- Lowercase normalized  

**Per book:**  
- 3–6 tags recommended  
- At least:  
  - One tag shared with another book  
  - One tag that differentiates it  

**Avoid:**  
- One-off tags  
- Overly generic tags (e.g., "book", "story")  

---

## 7️⃣ Language Boundary Test Cases

Include at least 2 non-English books.

**Rules:**  
- Language field must reflect non-English language  
- Descriptions written in that language  
- Genres and authors may overlap with English books  

**These books must be:**  
- Present in the catalog  
- Absent from semantic computation  

**Purpose:**  
- Demonstrate correct exclusion  
- Validate pipeline discipline  

---

## 8️⃣ Expected Dataset Validation Checklist

Before moving to Step 4, verify:

- Every English book:  
  - Has a description  
  - Has ≥1 genre  
  - Has ≥3 tags  

- Overlap exists across:  
  - Genres  
  - Tags  
  - Authors  

- Negative examples are present  
- Non-English books are excluded from semantic selection  
- A human can explain:  
  - Why Book A is similar to Book B  
  - Why Book C is not  

*If explanation fails, the dataset is not ready.*

---

## 9️⃣ Deliverables

By the end of Step 3, the dataset owner produces:

- A populated catalog database  
- A written description of:  
  - Genre definitions  
  - Tag meanings  
  - Intended overlaps  

- A short note explaining:  
  - Why the dataset is structured this way  
  - What behaviors it is meant to test  

---

## Closing Note

This dataset is not content — it is an instrument.

- If it’s boring, controlled, and explainable, it’s correct.  
- If it feels “alive” but unpredictable, it’s premature.
