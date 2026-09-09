from django.db.models import Count, Q
from catalog.models import Book, Genre, Tag
from catalog.serializers import BookListSerializer


class RecommendationEngine:
    """
    Explainable content-based recommendation engine for PageNet Bookstore (Phase 3).
    Computes semantic similarity and personalized picks using:
    - Controlled Genre taxonomy overlap
    - Fine-grained Thematic Tag Jaccard similarity
    - Author affinity
    - Semantic tone (content_tone) and target audience (target_age_group) alignment
    """

    @staticmethod
    def get_similar_books(book_id, limit=6, request=None):
        try:
            target_book = (
                Book.objects.prefetch_related("genres", "tags", "formats", "formats__prices")
                .select_related("author")
                .get(id=book_id)
            )
        except Book.DoesNotExist:
            return None

        target_tag_ids = set(target_book.tags.values_list("id", flat=True))
        target_genre_ids = set(target_book.genres.values_list("id", flat=True))
        target_author_id = target_book.author_id
        target_tone = target_book.content_tone
        target_age = target_book.target_age_group
        target_lang = target_book.language

        # Filter candidate books with the same language, excluding the target book itself
        candidates = (
            Book.objects.filter(language=target_lang)
            .exclude(id=book_id)
            .prefetch_related("genres", "tags", "formats", "formats__prices")
            .select_related("author")
        )

        scored_candidates = []
        for candidate in candidates:
            score = 0.0
            match_reasons = []

            # 1. Thematic Tag Overlap (Jaccard similarity, weight = 0.40)
            cand_tag_ids = set(candidate.tags.values_list("id", flat=True))
            if target_tag_ids and cand_tag_ids:
                shared_tags = target_tag_ids.intersection(cand_tag_ids)
                union_tags = target_tag_ids.union(cand_tag_ids)
                jaccard_tags = len(shared_tags) / len(union_tags)
                score += 0.40 * jaccard_tags
                if shared_tags:
                    shared_tag_names = list(
                        candidate.tags.filter(id__in=shared_tags).values_list("name", flat=True)[:3]
                    )
                    match_reasons.append(f"Shared themes: {', '.join(shared_tag_names)}")

            # 2. Canonical Genre Overlap (weight = 0.30)
            cand_genre_ids = set(candidate.genres.values_list("id", flat=True))
            if target_genre_ids and cand_genre_ids:
                shared_genres = target_genre_ids.intersection(cand_genre_ids)
                union_genres = target_genre_ids.union(cand_genre_ids)
                jaccard_genres = len(shared_genres) / len(union_genres)
                score += 0.30 * jaccard_genres
                if shared_genres:
                    shared_genre_names = list(
                        candidate.genres.filter(id__in=shared_genres).values_list("name", flat=True)
                    )
                    match_reasons.append(f"Shared genre: {', '.join(shared_genre_names)}")
            elif target_book.genre and candidate.genre and target_book.genre == candidate.genre:
                score += 0.15
                match_reasons.append(f"Matching category: {candidate.get_genre_display()}")

            # 3. Same Author (weight = 0.15)
            if target_author_id and candidate.author_id == target_author_id:
                score += 0.15
                match_reasons.append(f"More by {candidate.author.name}")

            # 4. Semantic Content Tone & Age Group (weight = 0.15)
            if target_tone and candidate.content_tone == target_tone:
                score += 0.10
                match_reasons.append(f"Tone: {candidate.get_content_tone_display()}")
            if target_age and candidate.target_age_group == target_age:
                score += 0.05

            if score > 0.04:
                scored_candidates.append({
                    "book": candidate,
                    "similarity_score": round(score, 2),
                    "match_reasons": match_reasons if match_reasons else [f"Related in {candidate.get_genre_display()}"],
                })

        # Sort descending by similarity score
        scored_candidates.sort(key=lambda x: x["similarity_score"], reverse=True)

        # Fallback fill to ensure carousel has sufficient content
        if len(scored_candidates) < limit:
            existing_ids = {c["book"].id for c in scored_candidates}
            existing_ids.add(book_id)
            fallback_qs = (
                Book.objects.filter(language=target_lang)
                .exclude(id__in=existing_ids)
                .prefetch_related("genres", "tags", "formats", "formats__prices")
                .select_related("author")
                .order_by("-created_at")[: (limit - len(scored_candidates))]
            )
            for fb in fallback_qs:
                scored_candidates.append({
                    "book": fb,
                    "similarity_score": 0.25,
                    "match_reasons": [f"Popular in {fb.get_genre_display()}"],
                })

        top_results = scored_candidates[:limit]
        context = {"request": request} if request else {}

        return {
            "target_book": {
                "id": target_book.id,
                "title": target_book.title,
                "genre": target_book.genre,
                "language": target_book.language,
                "author": target_book.author.name if target_book.author else "",
            },
            "recommendations": [
                {
                    **BookListSerializer(item["book"], context=context).data,
                    "similarity_score": item["similarity_score"],
                    "match_reasons": item["match_reasons"],
                }
                for item in top_results
            ],
        }

    @staticmethod
    def get_for_you_recommendations(user=None, limit=8, language=None, request=None):
        context = {"request": request} if request else {}
        personalized = False
        preferred_genre_ids = set()
        preferred_tag_ids = set()
        user_library_titles = []

        if user and user.is_authenticated:
            # 1. Inspect user's owned books (digital licenses)
            try:
                from content.models import DigitalLicense
                licenses = (
                    DigitalLicense.objects.filter(user=user, is_active=True)
                    .select_related("book")
                    .prefetch_related("book__genres", "book__tags")[:6]
                )
                for lic in licenses:
                    if lic.book:
                        user_library_titles.append(lic.book.title)
                        preferred_genre_ids.update(lic.book.genres.values_list("id", flat=True))
                        preferred_tag_ids.update(lic.book.tags.values_list("id", flat=True))
            except Exception:
                pass

            # 2. Inspect user profile fields (job_or_major and hobbies_or_likings)
            user_bio = f"{user.job_or_major or ''} {user.hobbies_or_likings or ''}".lower()
            if user_bio.strip():
                # Direct keyword matching against available genres and tags
                for g in Genre.objects.all():
                    if g.name.lower() in user_bio or g.slug.lower() in user_bio:
                        preferred_genre_ids.add(g.id)

                for t in Tag.objects.all():
                    if t.name.lower() in user_bio or t.normalized_name.lower() in user_bio:
                        preferred_tag_ids.add(t.id)

                if any(term in user_bio for term in ["tech", "software", "code", "engineer", "computer", "architecture"]):
                    preferred_genre_ids.update(Genre.objects.filter(slug__in=["technology", "tech"]).values_list("id", flat=True))
                if any(term in user_bio for term in ["philosophy", "psychology", "ethics", "existential"]):
                    preferred_genre_ids.update(Genre.objects.filter(slug__in=["philosophy", "psychology"]).values_list("id", flat=True))
                if any(term in user_bio for term in ["business", "startup", "finance", "economics"]):
                    preferred_genre_ids.update(Genre.objects.filter(slug__in=["business"]).values_list("id", flat=True))
                if any(term in user_bio for term in ["persian", "iran", "poetry", "ادبیات", "شعر"]):
                    preferred_genre_ids.update(Genre.objects.filter(slug__in=["persian-literature"]).values_list("id", flat=True))

            if preferred_genre_ids or preferred_tag_ids or user_library_titles:
                personalized = True

        base_qs = Book.objects.all().prefetch_related("genres", "tags", "formats", "formats__prices").select_related("author")
        if language:
            base_qs = base_qs.filter(language=language.lower())

        scored_books = []

        if personalized:
            for book in base_qs:
                score = 0.0
                reasons = []
                b_genre_ids = set(book.genres.values_list("id", flat=True))
                b_tag_ids = set(book.tags.values_list("id", flat=True))

                shared_g = preferred_genre_ids.intersection(b_genre_ids)
                if shared_g:
                    score += 0.5 * len(shared_g)
                    g_names = list(book.genres.filter(id__in=shared_g).values_list("name", flat=True)[:2])
                    reasons.append(f"Matches your interest in {', '.join(g_names)}")

                shared_t = preferred_tag_ids.intersection(b_tag_ids)
                if shared_t:
                    score += 0.3 * len(shared_t)
                    t_names = list(book.tags.filter(id__in=shared_t).values_list("name", flat=True)[:2])
                    reasons.append(f"Thematic match: {', '.join(t_names)}")

                if user_library_titles and score > 0:
                    reasons.append(f"Recommended because you read {user_library_titles[0]}")

                if score > 0:
                    scored_books.append({
                        "book": book,
                        "score": score,
                        "reasons": reasons,
                    })

            scored_books.sort(key=lambda x: x["score"], reverse=True)

        # Fallback / Showcase picks for anonymous or non-personalized state
        if len(scored_books) < limit:
            existing_ids = {item["book"].id for item in scored_books}
            curated_qs = (
                base_qs.exclude(id__in=existing_ids)
                .order_by("-created_at")[: (limit - len(scored_books))]
            )
            for b in curated_qs:
                curated_reasons = []
                if b.genre in ["SCI_FI", "FICTION"]:
                    curated_reasons.append("Staff Pick: World Literature & Speculative Fiction")
                elif b.genre in ["TECH", "TECHNOLOGY"]:
                    curated_reasons.append("Essential Reading for Software Architects")
                elif b.genre in ["PHILOSOPHY", "PSYCHOLOGY"]:
                    curated_reasons.append("Highly Acclaimed in Philosophy & Thought")
                elif b.language == "fa":
                    curated_reasons.append("Authentic Masterpiece in Persian Literature")
                else:
                    curated_reasons.append(f"Curated Selection in {b.get_genre_display()}")

                scored_books.append({
                    "book": b,
                    "score": 1.0,
                    "reasons": curated_reasons,
                })

        top_items = scored_books[:limit]

        return {
            "personalized": personalized,
            "count": len(top_items),
            "recommendations": [
                {
                    **BookListSerializer(item["book"], context=context).data,
                    "match_reasons": item["reasons"],
                }
                for item in top_items
            ],
        }
